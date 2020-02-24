const {fetchGoogleDocsDocuments} = require("./utils/google-docs")
const {fetchAndReplaceGoogleImages} = require("./utils/images")

exports.sourceNodes = async (
  {
    actions: {createNode},
    createNodeId,
    createContentDigest,
    store,
    cache,
    reporter,
  },
  pluginOptions
) => {
  try {
    const googleDocsDocuments = await fetchGoogleDocsDocuments(pluginOptions)

    for (const document of googleDocsDocuments) {
      const documentNodeId = createNodeId(`google-docs-${document.id}`)

      if (pluginOptions.replaceGoogleImages !== false) {
        document.markdown = await fetchAndReplaceGoogleImages({
          documentNodeId,
          document,
          store,
          cache,
          createNode,
          createNodeId,
        })
      }

      createNode({
        document,
        id: documentNodeId,
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
          content: document.markdown,
          contentDigest: createContentDigest(document.markdown),
        },
        dir: process.cwd(),
      })
    }
  } catch (e) {
    if (pluginOptions.debug) {
      reporter.panic(`source-google-docs: `, e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
