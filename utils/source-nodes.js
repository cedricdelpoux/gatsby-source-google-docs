const {fetchGoogleDocsDocuments} = require("./google-docs")

exports.sourceNodes = async (
  {actions: {createNode}, createNodeId, createContentDigest, reporter},
  pluginOptions
) => {
  try {
    const googleDocsDocuments = await fetchGoogleDocsDocuments(pluginOptions)

    for (let googleDoc of googleDocsDocuments) {
      createNode({
        document: googleDoc,
        id: createNodeId(`google-docs-${googleDoc.id}`),
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
          content: googleDoc.markdown,
          contentDigest: createContentDigest(googleDoc.markdown),
        },
        dir: process.cwd(),
      })
    }

    reporter.success(
      `source-google-docs: ${googleDocsDocuments.length} documents fetched`
    )

    return
  } catch (e) {
    if (pluginOptions.debug) {
      reporter.panic(`source-google-docs: `, e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
