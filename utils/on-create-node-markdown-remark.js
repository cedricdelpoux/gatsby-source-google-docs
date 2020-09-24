exports.onCreateNodeMarkdownRemark = async ({
  node,
  cache,
  actions: {createNodeField},
}) => {
  createNodeField({
    node,
    name: `slug`,
    value: node.path,
  })

  if (node.frontmatter.cover) {
    const fileNodeId = await cache.get(node.frontmatter.cover.image)

    if (fileNodeId) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = fileNodeId
    }
  }
}
