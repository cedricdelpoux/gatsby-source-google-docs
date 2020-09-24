exports.createSchemaCustomization = ({actions}) => {
  const {createTypes} = actions
  const typeDefs = `
    type GoogleDocs implements Node {
      breadcrumb: [String!]!
    }
  `
  createTypes(typeDefs)
}
