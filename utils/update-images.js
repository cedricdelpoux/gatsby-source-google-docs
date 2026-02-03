const _get = require("lodash/get")
const _kebabCase = require("lodash/kebabCase")
const {createRemoteFileNode} = require("gatsby-source-filesystem")

const {getImageUrl, getImageUrlParameters} = require("./get-image-url")

const IMAGE_URL_REGEX =
  /https:\/\/[a-z0-9-]*.googleusercontent\.com\/(?:docsz?\/)?[a-zA-Z0-9_=-]*[?]key=[a-zA-Z0-9-]*/
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
  options,
}) => {
  if (_get(options, "skipImages") === true) return

  const hasCover = node.cover && IMAGE_URL_REGEX.test(node.cover.image)
  const imageUrlParams = getImageUrlParameters(options)
  const googleImagesIterator = node.markdown.matchAll(MD_URL_TITLE_REGEX)
  const googleImages = [...googleImagesIterator]
  const googleImagesCount = hasCover
    ? googleImages.length + 1
    : googleImages.length

  if (googleImagesCount === 0) {
    return 0
  }

  const timer = reporter.activityTimer(
    `source-google-docs: "${node.name}" document`
  )

  if (options.debug) {
    timer.start()
  }

  let imagesFetchedCount = 0

  if (options.debug) {
    timer.setStatus(`${imagesFetchedCount}/${googleImagesCount} images fetched`)
  }

  if (hasCover) {
    let fileNode
    try {
      const {image, title} = node.cover

      fileNode = await createRemoteFileNode({
        url: getImageUrl(image, options),
        parentNodeId: node.id,
        createNode,
        createNodeId,
        cache,
        store,
        name: title ? _kebabCase(title) : _kebabCase(node.name) + "-" + 0,
        reporter,
      })

      node.markdown = node.markdown.replace(image, fileNode.relativePath)

      imagesFetchedCount++

      if (options.debug) {
        timer.setStatus(
          `${imagesFetchedCount}/${googleImagesCount} images fetched`
        )
      }
    } catch (e) {
      reporter.warn(`source-google-docs: ${e}`)
    }

    if (fileNode) {
      node.cover.image = fileNode.id
    }
  }

  if (Array.isArray(googleImages)) {
    const filesNodes = await Promise.all(
      googleImages.map(async (image, i) => {
        const [, url, title] = image
        let fileNode
        try {
          fileNode = await createRemoteFileNode({
            url: getImageUrl(url, options),
            parentNodeId: node.id,
            createNode,
            createNodeId,
            cache,
            store,
            name: title
              ? _kebabCase(title)
              : _kebabCase(node.name) + "-" + (i + 1),
            reporter,
          })

          imagesFetchedCount++

          if (options.debug) {
            timer.setStatus(
              `${imagesFetchedCount}/${googleImagesCount} images fetched`
            )
          }
        } catch (e) {
          reporter.warn(`source-google-docs: ${e}`)
        }

        return fileNode
      })
    )

    filesNodes
      .filter((fileNode) => fileNode)
      .forEach((fileNode) => {
        node.markdown = node.markdown.replace(
          fileNode.url.replace(imageUrlParams, ""),
          fileNode.relativePath
        )
      })

    const imagesIds = filesNodes
      .filter((fileNode) => fileNode)
      .map((fileNode) => fileNode.id)

    node.images = imagesIds

    if (options.debug) {
      timer.end()
    }
  }

  return imagesFetchedCount
}
