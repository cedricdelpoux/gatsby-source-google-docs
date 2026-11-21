import {beforeEach, expect, test, vi} from "vitest"

import {fetchDocument} from "../lib/fetch-document.js"

import {fetchFiles} from "../lib/google-drive.js"
import {fetchDocuments} from "../lib/google-docs.js"

vi.mock("../lib/fetch-document.js", () => ({fetchDocument: vi.fn()}))
vi.mock("../lib/google-drive.js", () => ({fetchFiles: vi.fn()}))

const document = {
  title: "Home",
  body: {content: []},
  documentStyle: {},
  inlineObjects: {},
}

const logger = {info: vi.fn(), warn: vi.fn(), error: vi.fn()}

/** The store, in memory: what it does with the filesystem is its own test. */
const createFakeStore = (documents = {}) => ({
  documents,
  async readDocument(id) {
    return documents[id] || null
  },
  async writeDocument({id, modifiedTime, document}) {
    documents[id] = {modifiedTime, document}
  },
})

const properties = {
  id: "1Tn1dCbIc",
  name: "Home",
  slug: "/",
  modifiedTime: "2026-09-07T10:00:00.000Z",
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchDocument.mockResolvedValue(document)
  fetchFiles.mockResolvedValue([properties])
})

test("fetches a document the store does not hold", async () => {
  const store = createFakeStore()

  const {documents, fetchedCount} = await fetchDocuments({
    options: {},
    logger,
    store,
  })

  expect(fetchDocument).toHaveBeenCalledTimes(1)
  expect(fetchedCount).toBe(1)
  expect(documents[0].fromStore).toBe(false)
  expect(store.documents["1Tn1dCbIc"].modifiedTime).toBe(
    properties.modifiedTime
  )
})

test("does not fetch a document that has not been modified since", async () => {
  const store = createFakeStore({
    "1Tn1dCbIc": {modifiedTime: properties.modifiedTime, document},
  })

  const {documents, fetchedCount} = await fetchDocuments({
    options: {},
    logger,
    store,
  })

  expect(fetchDocument).not.toHaveBeenCalled()
  expect(fetchedCount).toBe(0)
  expect(documents[0].fromStore).toBe(true)
  expect(documents[0].googleDocument.document).toBe(document)
})

test("fetches a document again once it has been modified", async () => {
  const store = createFakeStore({
    "1Tn1dCbIc": {modifiedTime: "2026-09-01T10:00:00.000Z", document},
  })

  const {fetchedCount} = await fetchDocuments({options: {}, logger, store})

  expect(fetchDocument).toHaveBeenCalledTimes(1)
  expect(fetchedCount).toBe(1)
  expect(store.documents["1Tn1dCbIc"].modifiedTime).toBe(
    properties.modifiedTime
  )
})

test("reads the metadata of a stored document from Google Drive", async () => {
  // The listing is free, so a document renamed or moved on Drive follows,
  // whether it had to be fetched again or not
  const store = createFakeStore({
    "1Tn1dCbIc": {modifiedTime: properties.modifiedTime, document},
  })

  fetchFiles.mockResolvedValue([{...properties, name: "Renamed", slug: "/new"}])

  const {documents} = await fetchDocuments({options: {}, logger, store})

  expect(documents[0].googleDocument.frontmatter.slug).toBe("/new")
})

test("logs the progress in debug mode only", async () => {
  await fetchDocuments({options: {}, logger, store: createFakeStore()})

  expect(logger.info).not.toHaveBeenCalled()

  await fetchDocuments({
    options: {debug: true},
    logger,
    store: createFakeStore(),
  })

  expect(logger.info).toHaveBeenCalledWith("fetching documents")
  expect(logger.info).toHaveBeenCalledWith(
    "1 documents, 1 fetched from Google Docs"
  )
})
