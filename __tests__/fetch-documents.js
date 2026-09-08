const {fetchFiles} = require("../utils/google-drive")
const {fetchDocuments} = require("../utils/google-docs")

jest.mock("../utils/google-drive", () => ({fetchFiles: jest.fn()}))
jest.mock("../utils/get-auth", () => ({getAuth: jest.fn()}))

const mockGet = jest.fn()

jest.mock("@googleapis/docs", () => ({
  docs: () => ({documents: {get: mockGet}}),
}))

const document = {
  title: "Home",
  body: {content: []},
  documentStyle: {},
  inlineObjects: {},
}

const reporter = {
  activityTimer: () => ({
    start: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
  }),
  warn: jest.fn(),
}

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
  jest.clearAllMocks()
  mockGet.mockResolvedValue({data: document})
  fetchFiles.mockResolvedValue([properties])
})

test("fetches a document the store does not hold", async () => {
  const store = createFakeStore()

  const {documents, fetchedCount} = await fetchDocuments({
    options: {},
    reporter,
    store,
  })

  expect(mockGet).toHaveBeenCalledTimes(1)
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
    reporter,
    store,
  })

  expect(mockGet).not.toHaveBeenCalled()
  expect(fetchedCount).toBe(0)
  expect(documents[0].fromStore).toBe(true)
  expect(documents[0].googleDocument.document).toBe(document)
})

test("fetches a document again once it has been modified", async () => {
  const store = createFakeStore({
    "1Tn1dCbIc": {modifiedTime: "2026-09-01T10:00:00.000Z", document},
  })

  const {fetchedCount} = await fetchDocuments({options: {}, reporter, store})

  expect(mockGet).toHaveBeenCalledTimes(1)
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

  const {documents} = await fetchDocuments({options: {}, reporter, store})

  expect(documents[0].googleDocument.properties.slug).toBe("/new")
})
