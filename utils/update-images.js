const _get = require("lodash/get")
const _kebabCase = require("lodash/kebabCase")
const {createRemoteFileNode} = require("gatsby-source-filesystem")

const {getImageUrlParameters} = require("./get-image-url-parameters")

const IMAGE_URL_REGEX =
  /https:\/\/[a-z0-9]*.googleusercontent\.com\/[a-zA-Z0-9_=-]*/
const MD_URL_TITLE_REGEX = new RegExp(
  `(${IMAGE_URL_REGEX.source}) "([^)]*)"`,
  "g"
)

exports.updateImages = async ({
  node,
  createNode,
  store,
  cache,
  createNodeId,
  reporter,
  pluginOptions,
}) => {
  if (_get(pluginOptions, "skipImages") === true) return

  const imageUrlParams = getImageUrlParameters(pluginOptions)

  if (node.cover && IMAGE_URL_REGEX.test(node.cover.image)) {
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
      node.cover.image = fileNode.id
    }
  }

  const googleImagesIterator = node.markdown.matchAll(MD_URL_TITLE_REGEX)
  const googleImages = [...googleImagesIterator]

  if (Array.isArray(googleImages)) {
    const filesNodes = await Promise.all(
      googleImages.map(async (image) => {
        const [, url, title] = image
        let fileNode
        try {
          fileNode = await createRemoteFileNode({
            url: url + imageUrlParams,
            parentNodeId: node.id,
            createNode,
            createNodeId,
            cache,
            store,
            name: title
              ? _kebabCase(title)
              : "google-docs-image-" + createNodeId(url),
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

    const imagesIds = filesNodes
      .filter((fileNode) => fileNode)
      .map((fileNode) => fileNode.id)

    node.images = imagesIds
  }

  return
}
