const {fetchFiles} = require("../utils/google-drive")

jest.mock("../utils/get-auth", () => ({getAuth: jest.fn()}))

const mockList = jest.fn()
const mockGet = jest.fn()

jest.mock("@googleapis/drive", () => ({
  drive: () => ({files: {list: mockList, get: mockGet}}),
}))

const ROOT = "root-folder-id"

const document = ({name, parents = [ROOT], ...rest}) => ({
  id: `doc-${name}`,
  mimeType: "application/vnd.google-apps.document",
  name,
  createdTime: "2026-09-01T10:00:00.000Z",
  modifiedTime: "2026-09-07T10:00:00.000Z",
  parents,
  ...rest,
})

const folder = ({id, name, parents = [ROOT], ...rest}) => ({
  id,
  mimeType: "application/vnd.google-apps.folder",
  name,
  parents,
  ...rest,
})

/** Answer each listing with the children of the folder it asks about. */
const drive = (childrenByParent, {rootDescription} = {}) => {
  mockGet.mockResolvedValue({data: {description: rootDescription}})
  mockList.mockImplementation(async ({q}) => {
    const parent = Object.keys(childrenByParent).find((id) =>
      q.includes(`'${id}' in parents`)
    )

    return {data: {files: childrenByParent[parent] || []}}
  })
}

const bySlug = (files) =>
  Object.fromEntries(files.map((file) => [file.slug, file]))

beforeEach(() => {
  jest.clearAllMocks()
})

test("names, slugs and paths a document of the root folder", async () => {
  drive({[ROOT]: [document({name: "My Home Page"})]})

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.name).toBe("My Home Page")
  expect(file.slug).toBe("/my-home-page")
  expect(file.path).toBe("/my-home-page")
  expect(file.breadcrumb).toEqual([
    {name: "My Home Page", slug: "/my-home-page"},
  ])
})

test("walks into folders and builds the breadcrumb", async () => {
  drive({
    [ROOT]: [folder({id: "f1", name: "Blog"})],
    f1: [document({name: "My Post", parents: ["f1"]})],
  })

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.slug).toBe("/blog/my-post")
  expect(file.path).toBe("/blog/my-post")
  expect(file.breadcrumb).toEqual([
    {name: "Blog", slug: "/blog"},
    {name: "My Post", slug: "/blog/my-post"},
  ])
})

test("gives a folder's index document the folder's name and slug", async () => {
  drive({
    [ROOT]: [folder({id: "f1", name: "Blog"})],
    f1: [document({name: "index", parents: ["f1"]})],
  })

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.name).toBe("Blog")
  expect(file.slug).toBe("/blog")
  expect(file.breadcrumb).toEqual([{name: "Blog", slug: "/blog"}])
})

test("serves the root index document at /", async () => {
  drive({[ROOT]: [document({name: "index"})]})

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.slug).toBe("/")
})

test("reads metadata from a YAML document description", async () => {
  drive({
    [ROOT]: [
      document({name: "Home", description: "slug: /welcome\ntemplate: hero"}),
    ],
  })

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.slug).toBe("/welcome")
  expect(file.template).toBe("hero")
  // The path stays the one of the document on Drive: it is where the file is
  // written, not where the page is served
  expect(file.path).toBe("/home")
})

test("ignores a description that is not YAML", async () => {
  drive({[ROOT]: [document({name: "Home", description: "Just a note"})]})

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.slug).toBe("/home")
})

test("passes folder metadata down to the documents it holds", async () => {
  drive({
    [ROOT]: [
      folder({id: "f1", name: "Blog", description: "template: article"}),
    ],
    f1: [document({name: "My Post", parents: ["f1"]})],
  })

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.template).toBe("article")
})

test("lets a document override the metadata of its folder", async () => {
  drive({
    [ROOT]: [
      folder({id: "f1", name: "Blog", description: "template: article"}),
    ],
    f1: [
      document({
        name: "My Post",
        parents: ["f1"],
        description: "template: full-width",
      }),
    ],
  })

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.template).toBe("full-width")
})

test("passes the root folder metadata down as well", async () => {
  drive({[ROOT]: [document({name: "Home"})]}, {rootDescription: "locale: fr"})

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.locale).toBe("fr")
})

test("keeps a `skip` folder out of the slug but not out of the path", async () => {
  // Organising documents on Drive should not force that hierarchy on the URLs
  drive({
    [ROOT]: [folder({id: "f1", name: "Drafts", description: "skip: true"})],
    f1: [document({name: "My Post", parents: ["f1"]})],
  })

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.slug).toBe("/my-post")
  expect(file.path).toBe("/drafts/my-post")
  expect(file.breadcrumb).toEqual([{name: "My Post", slug: "/my-post"}])
  // `skip` describes the folder, and must not leak into its documents
  expect(file.skip).toBeUndefined()
})

test("drops a document excluded from its description", async () => {
  drive({
    [ROOT]: [
      document({name: "Home"}),
      document({name: "Draft", description: "exclude: true"}),
    ],
  })

  const files = await fetchFiles({folder: ROOT})

  expect(Object.keys(bySlug(files))).toEqual(["/home"])
})

test("defaults every document to a page dated from its creation", async () => {
  drive({[ROOT]: [document({name: "Home"})]})

  const [file] = await fetchFiles({folder: ROOT})

  expect(file.page).toBe(true)
  expect(file.date).toBe("2026-09-01T10:00:00.000Z")
})

test("follows the pages of a long listing", async () => {
  mockGet.mockResolvedValue({data: {}})
  mockList
    .mockResolvedValueOnce({
      data: {files: [document({name: "First"})], nextPageToken: "page-2"},
    })
    .mockResolvedValueOnce({data: {files: [document({name: "Second"})]}})

  const files = await fetchFiles({folder: ROOT})

  expect(mockList).toHaveBeenCalledTimes(2)
  expect(mockList.mock.calls[1][0].pageToken).toBe("page-2")
  expect(Object.keys(bySlug(files)).sort()).toEqual(["/first", "/second"])
})
