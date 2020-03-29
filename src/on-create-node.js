const {createRemoteFileNode} = require("gatsby-source-filesystem")

const GOOGLE_IMAGE_REGEX = /https:\/\/[a-z0-9]*.googleusercontent\.com\/[a-zA-Z0-9_-]*/g

const onCreateNodeMarkdownRemark = async ({
  node,
  createNode,
  store,
  cache,
  createNodeId,
}) => {
  if (
    node.frontmatter.cover &&
    GOOGLE_IMAGE_REGEX.test(node.frontmatter.cover.image)
  ) {
    const url = node.frontmatter.cover.image
    const fileNode = await createRemoteFileNode({
      url,
      parentNodeId: node.id,
      createNode,
      createNodeId,
      cache,
      store,
      name: "google-docs-image-" + createNodeId(url),
    })

    if (fileNode) {
      delete node.frontmatter.cover.image
      node.frontmatter.cover.image___NODE = fileNode.id
    }
  }

  const googleUrls = node.internal.content.match(GOOGLE_IMAGE_REGEX)

  if (Array.isArray(googleUrls)) {
    const filesNodes = await Promise.all(
      googleUrls.map(async url => {
        const fileNode = await createRemoteFileNode({
          url,
          parentNodeId: node.id,
          createNode,
          createNodeId,
          cache,
          store,
          name: "google-docs-image-" + createNodeId(url),
        })

        return fileNode
      })
    )

    filesNodes.forEach(fileNode => {
      node.internal.content = node.internal.content.replace(
        new RegExp(fileNode.url, "g"),
        fileNode.relativePath
      )
      node.rawMarkdownBody = node.rawMarkdownBody.replace(
        new RegExp(fileNode.url, "g"),
        fileNode.relativePath
      )
    })
  }
}

exports.onCreateNode = async ({
  node,
  actions: {createNode},
  store,
  cache,
  createNodeId,
}) => {
  if (node.internal.type === "MarkdownRemark") {
    await onCreateNodeMarkdownRemark({
      node,
      createNode,
      store,
      cache,
      createNodeId,
    })
  }
}
