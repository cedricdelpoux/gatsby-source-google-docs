const _get = require("lodash/get")

exports.onCreateNodeMarkdownRemark = async ({node, cache, pluginOptions}) => {
  if (_get(node, "parent.internal.type") !== "GoogleDocs") return
  if (_get(pluginOptions, "skipImages") === true) return

  if (node.frontmatter.cover) {
    const fileNodeId = await cache.get(node.frontmatter.cover.image)

    if (fileNodeId) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = fileNodeId
    }
  }
}
