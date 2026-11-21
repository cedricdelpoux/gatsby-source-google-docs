import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {mkdir, mkdtemp, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {syncGoogleDocs} from "google-docs-sync"

import {sourceNodes} from "../utils/source-nodes.js"

vi.mock("google-docs-sync", () => ({syncGoogleDocs: vi.fn()}))

const MARKDOWN = "---\nslug: /home\n---\n\n# Home\n"

let directory
let outputDir

const createApi = () => ({
  actions: {createNode: vi.fn()},
  createNodeId: (input) => `id-${input}`,
  cache: {get: vi.fn(), set: vi.fn()},
  store: {getState: () => ({program: {directory}})},
  reporter: {
    activityTimer: () => ({
      start: vi.fn(),
      setStatus: vi.fn(),
      end: vi.fn(),
    }),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    panic: vi.fn(),
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
  vi.clearAllMocks()

  directory = await mkdtemp(join(tmpdir(), "gsgd-source-"))
  outputDir = join(directory, "content/google-docs")
  syncGoogleDocs.mockResolvedValue({
    documents: [],
    files: [],
    fetchedCount: 0,
    imagesCount: 0,
    downloadedImagesCount: 0,
  })
})

afterEach(async () => {
  await rm(directory, {recursive: true, force: true})
})

test("creates a File node for every written document", async () => {
  const filePath = await writeOutputFile("home.md")

  syncGoogleDocs.mockResolvedValue({
    files: [filePath],
    documents: [{filePath, markdown: MARKDOWN}],
    fetchedCount: 1,
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

  syncGoogleDocs.mockResolvedValue({
    files: [filePath],
    documents: [{filePath, markdown: MARKDOWN}],
    fetchedCount: 1,
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

  syncGoogleDocs.mockResolvedValue({
    files: [filePath, imagePath],
    documents: [{filePath, markdown: MARKDOWN}],
    fetchedCount: 1,
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

test("does nothing without a folder", async () => {
  const api = createApi()

  await sourceNodes(api, {})

  expect(syncGoogleDocs).not.toHaveBeenCalled()
  expect(api.reporter.warn.mock.calls[0][0]).toContain(`Missing "folder"`)
})

test("falls back to the deprecated `folders` option", async () => {
  const api = createApi()

  await sourceNodes(api, {folders: ["folder-id"], outputDir})

  expect(api.reporter.warn.mock.calls[0][0]).toContain("will be deprecated")
  expect(syncGoogleDocs.mock.calls[0][0].folder).toBe("folder-id")
})

test("reports what went wrong instead of throwing", async () => {
  syncGoogleDocs.mockRejectedValue(new Error("Method doesn't allow callers"))

  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  expect(api.reporter.panic).toHaveBeenCalledWith(
    "source-google-docs: Method doesn't allow callers"
  )
})

test("keeps the cache directory next to the site, outside the Gatsby cache", async () => {
  await sourceNodes(createApi(), {folder: "folder-id", outputDir})

  expect(syncGoogleDocs.mock.calls[0][0].cacheDir).toBe(
    join(directory, ".google-docs")
  )
})

test("reports the messages of the sync through the Gatsby reporter", async () => {
  const api = createApi()
  await sourceNodes(api, {folder: "folder-id", outputDir})

  const {logger} = syncGoogleDocs.mock.calls[0][0]

  logger.info("one")
  logger.warn("two")
  logger.error("three")

  expect(api.reporter.info).toHaveBeenCalledWith("source-google-docs: one")
  expect(api.reporter.warn).toHaveBeenCalledWith("source-google-docs: two")
  expect(api.reporter.error).toHaveBeenCalledWith("source-google-docs: three")
})
