const {fetchGoogleDocsDocuments} = require("./utils/google-docs")

exports.sourceNodes = async (
  {actions: {createNode}, createNodeId, createContentDigest, reporter},
  pluginOptions
) => {
  try {
    const googleDocsDocuments = await fetchGoogleDocsDocuments(pluginOptions)

    for (let document of googleDocsDocuments) {
      createNode({
        document,
        id: createNodeId(`google-docs-${document.id}`),
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
