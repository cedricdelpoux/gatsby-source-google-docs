const {mkdir, mkdtemp, rm, writeFile} = require("fs/promises")
const {tmpdir} = require("os")
const {join} = require("path")

const {createPages} = require("../utils/create-pages")

const OUTPUT_DIR = "content/google-docs"

let cwd
let directory

beforeEach(async () => {
  // `createPages` resolves both the templates and `outputDir` from the working
  // directory, the way Gatsby runs it from the root of a site
  cwd = process.cwd()
  process.chdir(await mkdtemp(join(tmpdir(), "gsgd-pages-")))
  // On macOS the temporary directory is reached through a symlink, and the
  // plugin compares resolved paths
  directory = process.cwd()

  await mkdir("src/templates", {recursive: true})
  await writeFile("src/templates/page.js", "")
  await writeFile("src/templates/article.js", "")
})

afterEach(async () => {
  process.chdir(cwd)
  await rm(directory, {recursive: true, force: true})
})

const documentPath = (name) => join(directory, OUTPUT_DIR, name)

const createApi = ({nodes, transformer = "remark"}) => {
  const isMdx = transformer === "mdx"
  const allField = isMdx ? "allMdx" : "allMarkdownRemark"
  const plugin = isMdx ? "gatsby-plugin-mdx" : "gatsby-transformer-remark"

  return {
    graphql: jest.fn().mockResolvedValue({data: {[allField]: {nodes}}}),
    actions: {createPage: jest.fn()},
    store: {getState: () => ({flattenedPlugins: [{name: plugin}]})},
    reporter: {panic: jest.fn()},
  }
}

const createNode = ({file = "home.md", ...frontmatter}) => ({
  fileAbsolutePath: documentPath(file),
  frontmatter: {slug: "/home", template: null, page: true, ...frontmatter},
})

const createMdxNode = ({file = "home.mdx", ...frontmatter}) => ({
  internal: {contentFilePath: documentPath(file)},
  frontmatter: {slug: "/home", template: null, page: true, ...frontmatter},
})

test("creates a page per document, on the default template", async () => {
  const api = createApi({nodes: [createNode({})]})

  await createPages(api, {createPages: true})

  expect(api.actions.createPage).toHaveBeenCalledTimes(1)
  expect(api.actions.createPage).toHaveBeenCalledWith({
    path: "/home",
    component: join(directory, "src/templates/page.js"),
    context: {slug: "/home"},
  })
})

test("uses the template named in the document metadata", async () => {
  const api = createApi({nodes: [createNode({template: "article"})]})

  await createPages(api, {createPages: true})

  expect(api.actions.createPage.mock.calls[0][0].component).toBe(
    join(directory, "src/templates/article.js")
  )
})

test("hands the file to compile to gatsby-plugin-mdx", async () => {
  // Since v4 the document body only reaches the template as `children` when the
  // component path carries the file
  const api = createApi({nodes: [createMdxNode({})], transformer: "mdx"})

  await createPages(api, {createPages: true})

  expect(api.actions.createPage.mock.calls[0][0].component).toBe(
    `${join(directory, "src/templates/page.js")}?__contentFilePath=${documentPath("home.mdx")}`
  )
})

test("skips a document with `page: false`", async () => {
  const api = createApi({nodes: [createNode({page: false})]})

  await createPages(api, {createPages: true})

  expect(api.actions.createPage).not.toHaveBeenCalled()
})

test("skips markdown the site sources from somewhere else", async () => {
  // `allMarkdownRemark` holds every markdown file of the site, not only ours
  const api = createApi({
    nodes: [
      {
        fileAbsolutePath: join(directory, "content/blog/post.md"),
        frontmatter: {slug: "/post", template: null, page: true},
      },
    ],
  })

  await createPages(api, {createPages: true})

  expect(api.actions.createPage).not.toHaveBeenCalled()
})

test("forwards the fields listed in `pageContext`", async () => {
  const api = createApi({nodes: [createNode({locale: "fr"})]})

  await createPages(api, {createPages: true, pageContext: ["locale"]})

  expect(api.graphql.mock.calls[0][0]).toContain("locale")
  expect(api.actions.createPage.mock.calls[0][0].context).toEqual({
    slug: "/home",
    locale: "fr",
  })
})

test("panics when a document asks for a template that does not exist", async () => {
  const api = createApi({nodes: [createNode({template: "missing"})]})

  await rm("src/templates/page.js")
  await createPages(api, {createPages: true})

  expect(api.actions.createPage).not.toHaveBeenCalled()
  expect(api.reporter.panic.mock.calls[0][0]).toContain(`"missing" not found`)
})

test("does nothing without the `createPages` option", async () => {
  const api = createApi({nodes: [createNode({})]})

  await createPages(api, {})

  expect(api.graphql).not.toHaveBeenCalled()
})

test("does nothing when no transformer is installed", async () => {
  const api = createApi({nodes: [createNode({})]})
  api.store = {getState: () => ({flattenedPlugins: []})}

  await createPages(api, {createPages: true})

  expect(api.graphql).not.toHaveBeenCalled()
})
