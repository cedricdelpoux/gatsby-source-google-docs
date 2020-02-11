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
      const url = element.img.source
      const name = `GoogleDocsImage-${url}`
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
    // const imagesDirName = "images"
    // const rootPath = path.join(process.cwd())
    // const publicPath = path.join(process.cwd(), "public")
    // const imagesPath = path.join(publicPath, imagesDirName)
    // const fromPath = path.join(rootPath, imageNode.relativePath)
    // const toPath = path.join(imagesPath, document.path)
    // const publicImagePath = path.join(
    //   "/",
    //   imagesDirName,
    //   document.path,
    //   imageNode.base
    // )
    // if (!fs.existsSync(imagesPath)) {
    //   fs.mkdirSync(imagesPath)
    // }
    // if (!fs.existsSync(toPath)) {
    //   fs.mkdirSync(toPath)
    // }
    // fs.copyFileSync(fromPath, path.join(toPath, imageNode.base))
    // document.markdown = document.markdown.replace(url, publicImagePath)
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
