const _merge = require("lodash/merge")

const {fetchDocuments} = require("./google-docs")
const {DEFAULT_OPTIONS} = require("./constants")
const {updateImages} = require("./update-images")

exports.sourceNodes = async (
  {
    actions: {createNode},
    createContentDigest,
    reporter,
    store,
    cache,
    createNodeId,
  },
  pluginOptions
) => {
  const options = _merge({}, DEFAULT_OPTIONS, pluginOptions)

  if (!options.folder) {
    if (options.folders && options.folders.length > 0) {
      reporter.warn(
        `source-google-docs: "folders" option will be deprecated in the next version, please use "folder" option instead`
      )
      Object.assign(options, {
        folder: options.folders[0],
      })
    } else {
      reporter.warn(`source-google-docs: Missing "folder" option`)
      return
    }
  }

  const timer = reporter.activityTimer(`source-google-docs`)

  timer.start()

  try {
    timer.setStatus("fetching Google Docs documents")

    const googleDocuments = await fetchDocuments(options)

    timer.setStatus("downloading Google Docs images locally")

    for (let googleDocument of googleDocuments) {
      const {document, properties, cover, related} = googleDocument
      const markdown = googleDocument.toMarkdown()

      const node = {
        ...properties,
        document,
        cover,
        markdown,
        related,
      }

      await updateImages({
        node,
        createNode,
        store,
        cache,
        createNodeId,
        reporter,
        pluginOptions,
      })

      createNode({
        ...node,
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
          content: node.markdown,
          contentDigest: createContentDigest(node.markdown),
        },
        dir: process.cwd(), // To make gatsby-remark-images works
      })
    }

    timer.setStatus(googleDocuments.length + " nodes created")

    timer.end()

    return
  } catch (e) {
    if (options.debug) {
      reporter.panic("source-google-docs: ", e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
