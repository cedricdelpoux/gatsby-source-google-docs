import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {mkdir, mkdtemp, readdir, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {getAuth} from "../lib/auth.js"
import {fetchDocument} from "../lib/fetch-document.js"
import {fetchDocuments} from "../lib/google-docs.js"
import {createStore} from "../lib/store.js"
import {syncGoogleDocs} from "../lib/sync.js"
import {writeDocuments} from "../lib/write-documents.js"

vi.mock("../lib/auth.js", () => ({getAuth: vi.fn()}))
vi.mock("../lib/fetch-document.js", () => ({fetchDocument: vi.fn()}))
vi.mock("../lib/google-docs.js", () => ({fetchDocuments: vi.fn()}))
vi.mock("../lib/write-documents.js", () => ({writeDocuments: vi.fn()}))
vi.mock("../lib/store.js", () => ({createStore: vi.fn()}))

const DOCUMENT_ID = "1Tn1dCbIc"
const MARKDOWN = "---\nslug: /home\n---\n\n# Home\n"

let directory
let outputDir
let store

const writeOutputFile = async (name, content = MARKDOWN) => {
  const filePath = join(outputDir, name)

  await mkdir(join(filePath, ".."), {recursive: true})
  await writeFile(filePath, content)

  return filePath
}

const sync = (options) =>
  syncGoogleDocs({
    folder: "folder-id",
    outputDir,
    cacheDir: join(directory, "cache"),
    ...options,
  })

beforeEach(async () => {
  vi.clearAllMocks()

  directory = await mkdtemp(join(tmpdir(), "gdsync-"))
  outputDir = join(directory, "content/google-docs")
  store = {init: vi.fn(), prune: vi.fn()}

  createStore.mockReturnValue(store)
  getAuth.mockResolvedValue("client")
  fetchDocuments.mockResolvedValue({
    documents: [{googleDocument: {frontmatter: {id: DOCUMENT_ID}}}],
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

test("returns the documents and every file of the output directory", async () => {
  const filePath = await writeOutputFile("home.md")
  const imagePath = await writeOutputFile("images/home/cover.png", "png-bytes")
  const home = {filePath, markdown: MARKDOWN, metadata: {id: DOCUMENT_ID}}

  writeDocuments.mockResolvedValue({
    writtenFiles: [filePath, imagePath],
    documents: [home],
    imagesCount: 1,
    downloadedImagesCount: 1,
  })

  const result = await sync()

  expect(result.documents).toEqual([home])
  expect(result.files.sort()).toEqual([imagePath, filePath].sort())
  expect(result).toMatchObject({
    fetchedCount: 1,
    imagesCount: 1,
    downloadedImagesCount: 1,
  })
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

  const {files} = await sync()

  expect(await readdir(outputDir)).toEqual(["home.md"])
  expect(files).toEqual([filePath])
})

test("returns no file when the output directory does not exist", async () => {
  const {files} = await sync()

  expect(files).toEqual([])
})

test("keeps the store when Google Drive lists nothing", async () => {
  // An empty listing is far more often a folder that could not be read than a
  // folder that was emptied, and pruning on one throws everything away
  fetchDocuments.mockResolvedValue({documents: [], fetchedCount: 0})

  await sync()

  expect(store.prune).not.toHaveBeenCalled()
})

test("prunes the store of the documents that are gone", async () => {
  await sync()

  expect(store.prune).toHaveBeenCalledWith([DOCUMENT_ID])
})

test("initializes the store with the size of the images", async () => {
  await sync({imagesOptions: {width: 512}})

  expect(store.init).toHaveBeenCalledWith({imagesParams: "=w512"})
})

test("throws without a folder", async () => {
  await expect(sync({folder: undefined})).rejects.toThrow(
    `Missing "folder" option`
  )
})

test("uses one Google client for the whole sync", async () => {
  await sync()
  await writeDocuments.mock.calls[0][0].refetchDocument(DOCUMENT_ID)

  expect(getAuth).toHaveBeenCalledTimes(1)
  expect(fetchDocuments.mock.calls[0][0].auth).toBe("client")
  expect(fetchDocument).toHaveBeenCalledWith(DOCUMENT_ID, {auth: "client"})
})

test("uses the given Google client", async () => {
  await sync({auth: "given-client"})

  expect(getAuth).not.toHaveBeenCalled()
  expect(fetchDocuments.mock.calls[0][0].auth).toBe("given-client")
})

test("defaults the options and the logger", async () => {
  await syncGoogleDocs({folder: "folder-id"})

  const {options, logger} = fetchDocuments.mock.calls[0][0]

  expect(options).toMatchObject({
    outputDir: "content/google-docs",
    cacheDir: ".google-docs",
    extension: "md",
    demoteHeadings: true,
  })
  expect(logger).toBe(console)
})

test("hands the logger to the steps", async () => {
  const logger = {info: vi.fn(), warn: vi.fn(), error: vi.fn()}

  await sync({logger})

  expect(fetchDocuments.mock.calls[0][0].logger).toBe(logger)
  expect(writeDocuments.mock.calls[0][0].logger).toBe(logger)
})
