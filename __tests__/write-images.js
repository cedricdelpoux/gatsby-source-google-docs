const {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} = require("fs/promises")
const {tmpdir} = require("os")
const {join} = require("path")

const {downloadImage} = require("../utils/download-image")
const {GoogleDocument} = require("../utils/google-document")
const {createStore} = require("../utils/store")
const {writeDocuments} = require("../utils/write-documents")

jest.mock("../utils/download-image", () => ({downloadImage: jest.fn()}))

const IMAGE_ID = "kix.abc123"
const IMAGE_URL =
  "https://lh7-rt.googleusercontent.com/docsz/AD_4nXabc123?key=Ab12Cd"

const createDocument = (url = IMAGE_URL) => ({
  title: "Home",
  documentStyle: {},
  inlineObjects: {
    [IMAGE_ID]: {
      objectId: IMAGE_ID,
      inlineObjectProperties: {
        embeddedObject: {
          title: "Alt text",
          imageProperties: {contentUri: url},
        },
      },
    },
  },
  body: {
    content: [
      {
        paragraph: {
          elements: [{inlineObjectElement: {inlineObjectId: IMAGE_ID}}],
          paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
        },
      },
    ],
  },
})

const createGoogleDocument = (document = createDocument()) =>
  new GoogleDocument({
    document,
    properties: {id: "1Tn1dCbIc", name: "Home", slug: "/home"},
  })

const reporter = {warn: jest.fn()}

let dir
let outputDir
let store

const write = async ({googleDocument = createGoogleDocument(), fromStore}) =>
  writeDocuments({
    documents: [{googleDocument, fromStore}],
    options: {outputDir, extension: "md"},
    reporter,
    store,
    refetchDocument: jest.fn(),
  })

beforeEach(async () => {
  jest.clearAllMocks()

  dir = await mkdtemp(join(tmpdir(), "google-docs-"))
  outputDir = join(dir, "content")
  store = createStore({dir: join(dir, ".google-docs")})

  // The real one streams the response to disk and gives the file name back
  downloadImage.mockImplementation(async ({directory, name}) => {
    await mkdir(directory, {recursive: true})
    await writeFile(join(directory, `${name}.png`), "image")

    return `${name}.png`
  })
})

afterEach(async () => {
  await rm(dir, {recursive: true, force: true})
})

test("downloads an image to the store and copies it next to the document", async () => {
  const {documents, imagesCount, downloadedImagesCount} = await write({
    fromStore: false,
  })

  expect(downloadImage).toHaveBeenCalledTimes(1)
  expect(downloadImage.mock.calls[0][0].url).toBe(IMAGE_URL)
  expect(downloadedImagesCount).toBe(1)
  expect(imagesCount).toBe(1)

  expect(await readdir(store.imagesDirectory("1Tn1dCbIc"))).toEqual([
    `${IMAGE_ID}.png`,
  ])
  expect(await readdir(join(outputDir, "images", "home"))).toEqual([
    "alt-text.png",
  ])

  // The URL is gone from the markdown, the image is a file next to it now
  expect(documents[0].markdown).toContain("images/home/alt-text.png")
  expect(documents[0].markdown).not.toContain(IMAGE_URL)
})

test("does not download an image the store already holds", async () => {
  await write({fromStore: false})
  downloadImage.mockClear()

  const {imagesCount, downloadedImagesCount} = await write({fromStore: true})

  expect(downloadImage).not.toHaveBeenCalled()
  expect(downloadedImagesCount).toBe(0)
  expect(imagesCount).toBe(1)
  expect(
    await readFile(join(outputDir, "images", "home", "alt-text.png"), "utf8")
  ).toBe("image")
})

test("puts back an image deleted from the output directory", async () => {
  await write({fromStore: false})
  await rm(join(outputDir, "images"), {recursive: true})
  downloadImage.mockClear()

  await write({fromStore: true})

  expect(downloadImage).not.toHaveBeenCalled()
  expect(await readdir(join(outputDir, "images", "home"))).toEqual([
    "alt-text.png",
  ])
})

test("fetches a stored document again for an image the store lost", async () => {
  // The URLs of a stored document expire: an image that has to be downloaded
  // can only be downloaded from a URL the document is fetched again for
  const freshUrl =
    "https://lh7-rt.googleusercontent.com/docsz/AD_4nXfresh456?key=Ef34Gh"
  const refetchDocument = jest.fn().mockResolvedValue(createDocument(freshUrl))

  await writeDocuments({
    documents: [{googleDocument: createGoogleDocument(), fromStore: true}],
    options: {outputDir, extension: "md"},
    reporter,
    store,
    refetchDocument,
  })

  expect(refetchDocument).toHaveBeenCalledWith("1Tn1dCbIc")
  expect(downloadImage.mock.calls[0][0].url).toBe(freshUrl)
})

test("forgets an image the document does not reference anymore", async () => {
  await write({fromStore: false})

  // A replaced image is a new object in the document, under a new id
  const replaced = createDocument()
  replaced.inlineObjects["kix.def456"] = replaced.inlineObjects[IMAGE_ID]
  delete replaced.inlineObjects[IMAGE_ID]
  replaced.body.content[0].paragraph.elements[0].inlineObjectElement.inlineObjectId =
    "kix.def456"

  await write({
    googleDocument: createGoogleDocument(replaced),
    fromStore: false,
  })

  expect(await readdir(store.imagesDirectory("1Tn1dCbIc"))).toEqual([
    "kix.def456.png",
  ])
})

test("keeps an image the document could not download this time", async () => {
  await write({fromStore: false})
  downloadImage.mockRejectedValue(new Error("Unable to download"))

  const other = createDocument(
    "https://lh7-rt.googleusercontent.com/docsz/AD_4nXother?key=Ij56Kl"
  )
  other.inlineObjects["kix.def456"] = other.inlineObjects[IMAGE_ID]
  delete other.inlineObjects[IMAGE_ID]
  other.body.content[0].paragraph.elements[0].inlineObjectElement.inlineObjectId =
    "kix.def456"

  await write({googleDocument: createGoogleDocument(other), fromStore: false})

  expect(await readdir(store.imagesDirectory("1Tn1dCbIc"))).toEqual([
    `${IMAGE_ID}.png`,
  ])
})

test("keeps the markdown usable when an image cannot be downloaded", async () => {
  downloadImage.mockRejectedValue(new Error("Unable to download"))

  const {documents, imagesCount} = await write({fromStore: false})

  expect(imagesCount).toBe(0)
  expect(reporter.warn).toHaveBeenCalled()
  expect(documents[0].markdown).toContain(IMAGE_URL)
})
