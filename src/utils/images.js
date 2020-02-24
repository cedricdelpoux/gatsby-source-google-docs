const {createRemoteFileNode} = require("gatsby-source-filesystem")

async function getImagesNodes({
  parentNodeId,
  document,
  store,
  cache,
  createNode,
  createNodeId,
  reporter,
}) {
  const imagesNodes = []

  for (const element of document.content) {
    if (element.img) {
      const id = Date.now().toString(36)
      const name = `google-docs-image-${id}`
      const url = element.img.source
      const imageNode = await createRemoteFileNode({
        parentNodeId,
        name,
        url,
        store,
        cache,
        createNode,
        createNodeId,
        reporter,
      })

      if (imageNode) {
        imagesNodes.push(imageNode)
      } else {
        throw new Error("Fail to fetch " + url)
      }
    }
  }

  return imagesNodes
}

async function fetchAndReplaceGoogleImages({
  documentNodeId,
  document,
  store,
  cache,
  createNode,
  createNodeId,
  reporter,
}) {
  let markdown = document.markdown

  const imagesNodes = await getImagesNodes({
    parentNodeId: documentNodeId,
    document,
    store,
    cache,
    createNode,
    createNodeId,
    reporter,
  })

  for (const imageNode of imagesNodes) {
    markdown = markdown.replace(
      new RegExp(imageNode.url, "g"),
      imageNode.relativePath
    )
  }

  return markdown
}

module.exports = {
  fetchAndReplaceGoogleImages,
}
