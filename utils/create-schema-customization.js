exports.createSchemaCustomization = ({actions}) => {
  const {createTypes} = actions
  const typeDefs = `
    type Cover {
      title: String
      alt: String
      image: File
    }

    type BreadcrumbItem {
      name: String!
      path: String!
    }

    type GoogleDocs implements Node {
      cover: Cover
      breadcrumb: [BreadcrumbItem!]!
    }
  `
  createTypes(typeDefs)
}
