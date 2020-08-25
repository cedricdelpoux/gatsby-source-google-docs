exports.createSchemaCustomization = ({actions}) => {
  const {createTypes} = actions
  const typeDefs = `
    type Document {
      breadcrumb: [String!]!
    }

    type GoogleDocs implements Node {
      document: Document
    }
  `
  createTypes(typeDefs)
}
