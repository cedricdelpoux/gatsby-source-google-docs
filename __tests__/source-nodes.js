const {mkdir, mkdtemp, readdir, rm, writeFile} = require("fs/promises")
const {tmpdir} = require("os")
const {join} = require("path")

const {fetchDocuments} = require("../utils/google-docs")
const {sourceNodes} = require("../utils/source-nodes")
const {createStore} = require("../utils/store")
const {writeDocuments} = require("../utils/write-documents")

jest.mock("../utils/google-docs", () => ({
  fetchDocument: jest.fn(),
  fetchDocuments: jest.fn(),
}))
jest.mock("../utils/write-documents", () => ({writeDocuments: jest.fn()}))
jest.mock("../utils/store", () => ({createStore: jest.fn()}))

const DOCUMENT_ID = "1Tn1dCbIc"
const MARKDOWN = "---\nslug: /home\n---\n\n# Home\n"

let directory
let outputDir
let store

const createApi = () => ({
  actions: {createNode: jest.fn()},
  createNodeId: (input) => `id-${input}`,
  cache: {get: jest.fn(), set: jest.fn()},
  store: {getState: () => ({program: {directory}})},
  reporter: {
    activityTimer: () => ({
      start: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn(),
    }),
    warn: jest.fn(),
    panic: jest.fn(),
  },
})

/** Write `name` under the output directory, as the plugin would have. */
const writeOutputFile = async (name, content = MARKDOWN) => {
  const filePath = join(outputDir, name)

  await mkdir(join(filePath, ".."), {recursive: true})
  await writeFile(filePath, content)

  return filePath
}

const nodesByName = (createNode) =>
  Object.fromEntries(
    createNode.mock.calls.map(([node, owner]) => [node.base, {node, owner}])
  )

beforeEach(async () => {
  jest.clearAllMocks()

  directory = await mkdtemp(join(tmpdir(), "gsgd-source-"))
  outputDir = join(directory, "content/google-docs")
  store = {
    init: jest.fn(),
    prune: jest.fn(),
  }

  createStore.mockReturnValue(store)
  fetchDocuments.mockResolvedValue({
    documents: [{googleDocument: {properties: {id: DOCUMENT_ID}}}],
    fetchedCount: 1,
  })
  writeDocuments.mockResolvedValue({
    writtenFiles: [],
    documents: [],
    imagesCount: 0,
    downloadedImagesCount: 0,
  })
})

afterEach(async () => {
  await rm(directory, {recursive: true, force: true})
})

test("creates a File node for every written document", async () => {
  const filePath = await writeOutputFile("home.md")

  writeDocuments.mockResolvedValue({
    writtenFiles: [filePath],
    documents: [{filePath, markdown: MARKDOWN}],
    imagesCount: 0,
    downloadedImagesCount: 0,
  })

  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  const {"home.md": home} = nodesByName(api.actions.createNode)

  expect(home.node.absolutePath).toBe(filePath)
  expect(home.node.extension).toBe("md")
  // `loadNodeContent` hands the transformers this string directly, so they
  // work without the site configuring `gatsby-source-filesystem`
  expect(home.node.internal.content).toBe(MARKDOWN)
})

test("declares the File nodes as owned by gatsby-source-filesystem", async () => {
  // Gatsby 5 rejects a node whose type another plugin has already claimed, and
  // a site running its own `gatsby-source-filesystem` instance has claimed it
  const filePath = await writeOutputFile("home.md")

  writeDocuments.mockResolvedValue({
    writtenFiles: [filePath],
    documents: [{filePath, markdown: MARKDOWN}],
    imagesCount: 0,
    downloadedImagesCount: 0,
  })

  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  expect(api.actions.createNode.mock.calls[0][1]).toEqual({
    name: "gatsby-source-filesystem",
  })
})

test("creates File nodes for the images too", async () => {
  const filePath = await writeOutputFile("home.md")
  const imagePath = await writeOutputFile("home/cover.png", "png-bytes")

  writeDocuments.mockResolvedValue({
    writtenFiles: [filePath, imagePath],
    documents: [{filePath, markdown: MARKDOWN}],
    imagesCount: 1,
    downloadedImagesCount: 1,
  })

  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  const {"cover.png": cover} = nodesByName(api.actions.createNode)

  expect(cover.node.absolutePath).toBe(imagePath)
  // Only the documents carry their content: an image is read from disk by
  // whoever needs its bytes
  expect(cover.node.internal.content).toBeUndefined()
})

test("sweeps the files left by a previous run", async () => {
  const filePath = await writeOutputFile("home.md")
  await writeOutputFile("renamed.md")
  await mkdir(join(outputDir, "empty-folder"), {recursive: true})

  writeDocuments.mockResolvedValue({
    writtenFiles: [filePath],
    documents: [{filePath, markdown: MARKDOWN}],
    imagesCount: 0,
    downloadedImagesCount: 0,
  })

  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  expect(await readdir(outputDir)).toEqual(["home.md"])
  expect(Object.keys(nodesByName(api.actions.createNode))).toEqual(["home.md"])
})

test("keeps the store when Google Drive lists nothing", async () => {
  // An empty listing is far more often a folder that could not be read than a
  // folder that was emptied, and pruning on one throws everything away
  fetchDocuments.mockResolvedValue({documents: [], fetchedCount: 0})

  await sourceNodes(createApi(), {folder: "folder-id", outputDir})

  expect(store.prune).not.toHaveBeenCalled()
})

test("prunes the store of the documents that are gone", async () => {
  await sourceNodes(createApi(), {folder: "folder-id", outputDir})

  expect(store.prune).toHaveBeenCalledWith([DOCUMENT_ID])
})

test("does nothing without a folder", async () => {
  const api = createApi()

  await sourceNodes(api, {})

  expect(fetchDocuments).not.toHaveBeenCalled()
  expect(api.reporter.warn.mock.calls[0][0]).toContain(`Missing "folder"`)
})

test("falls back to the deprecated `folders` option", async () => {
  const api = createApi()

  await sourceNodes(api, {folders: ["folder-id"], outputDir})

  expect(api.reporter.warn.mock.calls[0][0]).toContain("will be deprecated")
  expect(fetchDocuments.mock.calls[0][0].options.folder).toBe("folder-id")
})

test("reports what went wrong instead of throwing", async () => {
  fetchDocuments.mockRejectedValue(new Error("Method doesn't allow callers"))

  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  expect(api.reporter.panic).toHaveBeenCalledWith(
    "source-google-docs: Method doesn't allow callers"
  )
})
