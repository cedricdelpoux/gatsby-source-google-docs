exports.createSchemaCustomization = ({actions}) => {
  const {createTypes} = actions
  const typeDefs = `
    type Cover {
      image: File!
      title: String
      alt: String
    }

    type GoogleDocs implements Node {
      cover: Cover
      breadcrumb: [String!]!
    }
  `
  createTypes(typeDefs)
}
