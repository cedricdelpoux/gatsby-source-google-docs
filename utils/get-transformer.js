const MDX_PLUGIN = "gatsby-plugin-mdx"
const REMARK_PLUGIN = "gatsby-transformer-remark"

/**
 * Find out which transformer will pick up the files written by this plugin.
 *
 * The two of them expose the documents under different GraphQL types
 * (`Mdx` vs `MarkdownRemark`) and, since `gatsby-plugin-mdx` v4, MDX pages
 * additionally need the `?__contentFilePath=` query string on their component
 * path. Both `createPages` and `createSchemaCustomization` need to know which
 * one is installed before they can do anything useful.
 */
const getTransformer = ({store}) => {
  const plugins = store.getState().flattenedPlugins || []
  const names = plugins.map((plugin) => plugin.name)

  if (names.includes(MDX_PLUGIN)) return "mdx"
  if (names.includes(REMARK_PLUGIN)) return "remark"

  return null
}

const TRANSFORMERS = {
  mdx: {
    type: "Mdx",
    allField: "allMdx",
    frontmatterType: "MdxFrontmatter",
    extension: "mdx",
  },
  remark: {
    type: "MarkdownRemark",
    allField: "allMarkdownRemark",
    frontmatterType: "MarkdownRemarkFrontmatter",
    extension: "md",
  },
}

module.exports = {
  getTransformer,
  TRANSFORMERS,
  MDX_PLUGIN,
  REMARK_PLUGIN,
}
