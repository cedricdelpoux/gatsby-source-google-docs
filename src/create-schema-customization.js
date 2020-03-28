exports.createSchemaCustomization = ({actions}) => {
  const {createTypes} = actions
  const typeDefs = `
    type Document {
      breadcrumb: [String!]!
    }

    type GoogleDocs implements Node {
      document: Document
    }

    type MarkdownRemark implements Node {
      frontmatter: Document
    }
  `
  createTypes(typeDefs)
}
