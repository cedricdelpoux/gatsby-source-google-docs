const {getTransformer, TRANSFORMERS} = require("./get-transformer")

/**
 * Describe the frontmatter this plugin writes.
 *
 * Everything a document carries now travels in its frontmatter, so the types
 * have to be declared explicitly: Gatsby would otherwise infer `breadcrumb`
 * and `cover` from whichever document happens to be read first, and would
 * leave `cover.image` as a plain string instead of a `File`.
 *
 * The fields are added to the transformer's own frontmatter type, which is
 * shared with any other markdown the site sources. They are all nullable on
 * purpose: for those other files they are simply absent.
 */
exports.createSchema = ({actions, store, reporter}) => {
  const {createTypes} = actions
  const transformer = getTransformer({store})

  if (!transformer) {
    reporter.warn(
      `source-google-docs: neither "gatsby-transformer-remark" nor "gatsby-plugin-mdx" is installed, the documents will not be transformed`
    )
    return
  }

  const {frontmatterType} = TRANSFORMERS[transformer]

  createTypes(`
    type GoogleDocsBreadcrumbItem {
      name: String!
      slug: String!
    }

    type GoogleDocsCover {
      title: String
      alt: String
      image: File @fileByRelativePath
    }

    type ${frontmatterType} {
      name: String
      slug: String
      path: String
      template: String
      date: Date @dateformat
      page: Boolean
      exclude: Boolean
      index: Boolean
      breadcrumb: [GoogleDocsBreadcrumbItem!]
      cover: GoogleDocsCover
      related: [String!]
    }
  `)
}
