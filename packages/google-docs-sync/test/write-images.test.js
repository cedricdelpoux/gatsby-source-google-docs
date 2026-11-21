import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {setTimeout as delay} from "node:timers/promises"

import {GoogleDocument} from "google-docs-to-markdown"

import {downloadImage} from "../lib/download-image.js"
import {createStore} from "../lib/store.js"
import {writeDocuments} from "../lib/write-documents.js"

vi.mock("../lib/download-image.js", () => ({downloadImage: vi.fn()}))

const IMAGE_ID = "kix.abc123"
const IMAGE_URL =
  "https://docs.google.com/docs-images-rt/AIpPl2Dabc123=s2048?key=Ab12Cd"

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
  new GoogleDocument(document, {
    frontmatter: {id: "1Tn1dCbIc", name: "Home", slug: "/home"},
  })

const logger = {warn: vi.fn()}

let dir
let outputDir
let store

const write = async ({
  googleDocument = createGoogleDocument(),
  fromStore,
  options,
}) =>
  writeDocuments({
    documents: [{googleDocument, fromStore}],
    options: {outputDir, extension: "md", ...options},
    logger,
    store,
    refetchDocument: vi.fn(),
  })

beforeEach(async () => {
  vi.clearAllMocks()

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

test("downloads an image whatever the format of its URL", async () => {
  const url =
    "https://lh7-rt.googleusercontent.com/docsz/AD_4nXabc123?key=Ab12Cd"

  const {documents} = await write({
    googleDocument: createGoogleDocument(createDocument(url)),
    fromStore: false,
  })

  expect(downloadImage.mock.calls[0][0].url).toBe(url)
  expect(documents[0].markdown).toContain("images/home/alt-text.png")
})

test("numbers the untitled images in the order of the document", async () => {
  const document = createDocument()
  const image = (id) => ({
    inlineObjectProperties: {
      embeddedObject: {
        imageProperties: {
          contentUri: `https://docs.google.com/docs-images-rt/${id}?key=Ab12Cd`,
        },
      },
    },
  })

  document.inlineObjects = {
    "kix.second": image("second"),
    "kix.first": image("first"),
  }
  document.body.content[0].paragraph.elements = [
    {inlineObjectElement: {inlineObjectId: "kix.first"}},
    {inlineObjectElement: {inlineObjectId: "kix.second"}},
  ]

  const {documents} = await write({
    googleDocument: createGoogleDocument(document),
    fromStore: false,
  })

  expect(documents[0].markdown.indexOf("images/home/home-1.png")).toBeLessThan(
    documents[0].markdown.indexOf("images/home/home-2.png")
  )
  expect(downloadImage.mock.calls.map(([{name}]) => name)).toEqual([
    "kix.first",
    "kix.second",
  ])
})

test("downloads an image at the size of the options", async () => {
  await write({fromStore: false, options: {imagesOptions: {width: 800}}})

  expect(downloadImage).toHaveBeenCalledTimes(1)
  expect(downloadImage.mock.calls[0][0].url).toBe(
    "https://docs.google.com/docs-images-rt/AIpPl2Dabc123=w800?key=Ab12Cd"
  )
})

test("downloads an image at its original size when it cannot be resized", async () => {
  downloadImage.mockRejectedValueOnce(
    Object.assign(new Error("400 Bad Request"), {status: 400})
  )

  const {documents} = await write({
    fromStore: false,
    options: {imagesOptions: {width: 800}},
  })

  expect(downloadImage.mock.calls.map(([{url}]) => url)).toEqual([
    "https://docs.google.com/docs-images-rt/AIpPl2Dabc123=w800?key=Ab12Cd",
    IMAGE_URL,
  ])
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("original size")
  )
  expect(documents[0].markdown).toContain("images/home/alt-text.png")
})

test("does not fall back to the original size on another error", async () => {
  downloadImage.mockRejectedValueOnce(
    Object.assign(new Error("404 Not Found"), {status: 404})
  )

  await write({fromStore: false, options: {imagesOptions: {width: 800}}})

  expect(downloadImage).toHaveBeenCalledTimes(1)
  expect(logger.warn).toHaveBeenCalledWith(
    expect.not.stringContaining("original size")
  )
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
    "https://docs.google.com/docs-images-rt/AIpPl2Dfresh456=s2048?key=Ef34Gh"
  const refetchDocument = vi.fn().mockResolvedValue(createDocument(freshUrl))

  await writeDocuments({
    documents: [{googleDocument: createGoogleDocument(), fromStore: true}],
    options: {outputDir, extension: "md"},
    logger,
    store,
    refetchDocument,
  })

  expect(refetchDocument).toHaveBeenCalledWith("1Tn1dCbIc")
  expect(downloadImage.mock.calls[0][0].url).toBe(freshUrl)
})

test("fetches a document again when its image URLs expired", async () => {
  const freshUrl =
    "https://docs.google.com/docs-images-rt/AIpPl2Dfresh456=s2048?key=Ef34Gh"
  const refetchDocument = vi.fn().mockResolvedValue(createDocument(freshUrl))

  downloadImage.mockRejectedValueOnce(
    Object.assign(new Error("403 Forbidden"), {status: 403})
  )

  const {documents} = await writeDocuments({
    documents: [{googleDocument: createGoogleDocument(), fromStore: false}],
    options: {outputDir, extension: "md"},
    logger,
    store,
    refetchDocument,
  })

  expect(refetchDocument).toHaveBeenCalledWith("1Tn1dCbIc")
  expect(downloadImage.mock.calls.map(([{url}]) => url)).toEqual([
    IMAGE_URL,
    freshUrl,
  ])
  expect(documents[0].markdown).toContain("images/home/alt-text.png")
})

test("downloads the images of several documents at once", async () => {
  let runningCount = 0
  let maxRunningCount = 0

  downloadImage.mockImplementation(async ({directory, name}) => {
    runningCount++
    maxRunningCount = Math.max(maxRunningCount, runningCount)
    await delay(5)
    runningCount--
    await mkdir(directory, {recursive: true})
    await writeFile(join(directory, `${name}.png`), "image")

    return `${name}.png`
  })

  const googleDocuments = ["a", "b", "c"].map((id) => ({
    googleDocument: new GoogleDocument(createDocument(), {
      frontmatter: {id, name: id, slug: `/${id}`},
    }),
    fromStore: false,
  }))

  const {documents, imagesCount} = await writeDocuments({
    documents: googleDocuments,
    options: {outputDir, extension: "md"},
    logger,
    store,
    refetchDocument: vi.fn(),
  })

  expect(maxRunningCount).toBe(3)
  expect(imagesCount).toBe(3)
  expect(documents.map(({filePath}) => filePath)).toEqual(
    ["a.md", "b.md", "c.md"].map((file) => join(outputDir, file))
  )
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
    "https://docs.google.com/docs-images-rt/AIpPl2Dother=s2048?key=Ij56Kl"
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
  expect(logger.warn).toHaveBeenCalled()
  expect(documents[0].markdown).toContain(IMAGE_URL)
})
