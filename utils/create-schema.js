exports.createSchema = ({actions}) => {
  const {createTypes} = actions
  const typeDefs = `
    type Cover {
      title: String
      alt: String
      image: File
    }

    type BreadcrumbItem {
      name: String!
      slug: String!
    }

    type GoogleDocs implements Node {
      slug: String!
      path: String!
      breadcrumb: [BreadcrumbItem!]!
      template: String
      cover: Cover
    }
  `
  createTypes(typeDefs)
}
