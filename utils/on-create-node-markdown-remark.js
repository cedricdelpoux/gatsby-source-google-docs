exports.onCreateNodeMarkdownRemark = async ({node, cache}) => {
  if (node.frontmatter.cover) {
    const fileNodeId = await cache.get(node.frontmatter.cover.image)

    if (fileNodeId) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = fileNodeId
    }
  }
}
