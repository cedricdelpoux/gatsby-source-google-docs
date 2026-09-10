const {createSchema} = require("../utils/create-schema")

const createApi = (...pluginNames) => ({
  actions: {createTypes: jest.fn()},
  store: {
    getState: () => ({flattenedPlugins: pluginNames.map((name) => ({name}))}),
  },
  reporter: {warn: jest.fn()},
})

test("declares the frontmatter fields on MarkdownRemarkFrontmatter", () => {
  const api = createApi("gatsby-transformer-remark")

  createSchema(api)

  const typeDefs = api.actions.createTypes.mock.calls[0][0]

  expect(typeDefs).toContain("type MarkdownRemarkFrontmatter {")
  expect(typeDefs).toContain("breadcrumb: [GoogleDocsBreadcrumbItem!]")
  expect(typeDefs).toContain("cover: GoogleDocsCover")
})

test("declares them on MdxFrontmatter when gatsby-plugin-mdx is installed", () => {
  const api = createApi("gatsby-plugin-mdx")

  createSchema(api)

  expect(api.actions.createTypes.mock.calls[0][0]).toContain(
    "type MdxFrontmatter {"
  )
})

test("resolves cover.image as a File, for gatsby-plugin-sharp", () => {
  const api = createApi("gatsby-transformer-remark")

  createSchema(api)

  expect(api.actions.createTypes.mock.calls[0][0]).toContain(
    "image: File @fileByRelativePath"
  )
})

test("warns and does nothing when no transformer is installed", () => {
  const api = createApi("gatsby-plugin-sharp")

  createSchema(api)

  expect(api.actions.createTypes).not.toHaveBeenCalled()
  expect(api.reporter.warn.mock.calls[0][0]).toContain(
    `neither "gatsby-transformer-remark" nor "gatsby-plugin-mdx"`
  )
})
