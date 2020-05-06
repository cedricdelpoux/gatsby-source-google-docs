const {createRemoteFileNode} = require("gatsby-source-filesystem")

const GOOGLE_IMAGE_REGEX = /https:\/\/[a-z0-9]*.googleusercontent\.com\/[a-zA-Z0-9_-]*/

exports.onCreateNode = async ({
  node,
  actions: {createNode},
  store,
  cache,
  createNodeId,
  reporter,
}) => {
  if (node.internal.type !== "MarkdownRemark") {
    return
  }

  if (
    node.frontmatter.cover &&
    GOOGLE_IMAGE_REGEX.test(node.frontmatter.cover.image)
  ) {
    let fileNode
    try {
      const url = node.frontmatter.cover.image

      fileNode = await createRemoteFileNode({
        url,
        parentNodeId: node.id,
        createNode,
        createNodeId,
        cache,
        store,
        name: "google-docs-image-" + createNodeId(url),
        ext: ".png",
        reporter,
      })
    } catch (e) {
      reporter.warn(`source-google-docs: ${e}`)
    }

    if (fileNode) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = fileNode.id
    }
  }

  const googleUrls = node.internal.content.match(GOOGLE_IMAGE_REGEX)

  if (Array.isArray(googleUrls)) {
    const filesNodes = await Promise.all(
      googleUrls.map(async url => {
        let fileNode

        try {
          fileNode = await createRemoteFileNode({
            url,
            parentNodeId: node.id,
            createNode,
            createNodeId,
            cache,
            store,
            name: "google-docs-image-" + createNodeId(url),
            ext: ".png",
            reporter,
          })
        } catch (e) {
          reporter.warn(`source-google-docs: ${e}`)
        }

        return fileNode
      })
    )

    filesNodes.forEach(fileNode => {
      if (fileNode) {
        node.internal.content = node.internal.content.replace(
          new RegExp(fileNode.url, "g"),
          fileNode.relativePath
        )
        node.rawMarkdownBody = node.rawMarkdownBody.replace(
          new RegExp(fileNode.url, "g"),
          fileNode.relativePath
        )
      }
    })
  }
}
