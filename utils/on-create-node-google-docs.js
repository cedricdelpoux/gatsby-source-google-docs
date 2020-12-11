const _get = require("lodash/get")
const {createRemoteFileNode} = require("gatsby-source-filesystem")

const {getImageUrlParameters} = require("./get-image-url-parameters")

const GOOGLE_IMAGE_REGEX = /https:\/\/[a-z0-9]*.googleusercontent\.com\/[a-zA-Z0-9_-]*/

exports.onCreateNodeGoogleDocs = async ({
  node,
  actions: {createNode},
  store,
  cache,
  createNodeId,
  createContentDigest,
  reporter,
  pluginOptions,
}) => {
  if (_get(pluginOptions, "skipImages") === true) return

  const imageUrlParams = getImageUrlParameters(pluginOptions)

  if (node.cover && GOOGLE_IMAGE_REGEX.test(node.cover.image)) {
    let fileNode
    try {
      const url = node.cover.image + imageUrlParams

      fileNode = await createRemoteFileNode({
        url,
        parentNodeId: node.id,
        createNode,
        createNodeId,
        cache,
        store,
        name: "google-docs-image-" + createNodeId(url),
        reporter,
      })
    } catch (e) {
      reporter.warn(`source-google-docs: ${e}`)
    }

    if (fileNode) {
      delete node.cover.image
      node.cover.image___NODE = fileNode.id

      // fileNode.id is useful to link MarkdownRemark cover nodes
      await cache.set(fileNode.relativePath, fileNode.id)
    }
  }

  const googleUrls = node.markdown.match(
    new RegExp(GOOGLE_IMAGE_REGEX.source, "g")
  )

  if (Array.isArray(googleUrls)) {
    const filesNodes = await Promise.all(
      googleUrls.map(async (url) => {
        let fileNode
        try {
          fileNode = await createRemoteFileNode({
            url: url + imageUrlParams,
            parentNodeId: node.id,
            createNode,
            createNodeId,
            cache,
            store,
            name: "google-docs-image-" + createNodeId(url),
            reporter,
          })
        } catch (e) {
          reporter.warn(`source-google-docs: ${e}`)
        }

        return fileNode
      })
    )

    filesNodes
      .filter((fileNode) => fileNode)
      .forEach((fileNode) => {
        const imageUrl = fileNode.url.replace(imageUrlParams, "")
        node.markdown = node.markdown.replace(
          new RegExp(imageUrl, "g"),
          fileNode.relativePath
        )
      })

    node.images___NODE = filesNodes
      .filter((fileNode) => fileNode)
      .map((fileNode) => fileNode.id)
  }

  node.internal.content = node.markdown
  node.internal.contentDigest = createContentDigest(node.markdown)
}
