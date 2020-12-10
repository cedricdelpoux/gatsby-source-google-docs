exports.onCreateNodeMarkdownRemark = async ({node, cache, pluginOptions}) => {
  if (pluginOptions.skipImages) return

  if (node.frontmatter.cover) {
    const fileNodeId = await cache.get(node.frontmatter.cover.image)

    if (fileNodeId) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = fileNodeId
    }
  }
}
