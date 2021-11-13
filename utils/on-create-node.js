const _get = require("lodash/get")

exports.onCreateNode = async ({node, getNode}, pluginOptions) => {
  if (_get(pluginOptions, "skipImages") === true) return
  if (_get(node, "frontmatter.cover") === null) return

  const googleDocsNode = getNode(node.parent)

  if (googleDocsNode) {
    const coverImageId = _get(googleDocsNode, "cover.image")

    if (coverImageId) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = coverImageId
    }
  }

  return
}
