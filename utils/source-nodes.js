const {fetchDocuments} = require("./google-docs")

exports.sourceNodes = async (
  {actions: {createNode}, createContentDigest, reporter},
  pluginOptions
) => {
  try {
    let nodesCount = 0
    const googleDocuments = await fetchDocuments(pluginOptions)

    const timerNodes = reporter.activityTimer(
      `source-google-docs: Creating GoogleDocs nodes`
    )

    if (pluginOptions.debug) {
      timerNodes.start()
    }

    for (let googleDocument of googleDocuments) {
      const markdown = googleDocument.toMarkdown()
      const {document, elements, properties, cover} = googleDocument.toObject()

      createNode({
        ...properties,
        document,
        elements,
        cover,
        markdown,
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
          content: markdown,
          contentDigest: createContentDigest(markdown),
        },
        dir: process.cwd(), // To make gatsby-remark-images works
      })

      nodesCount += 1

      if (pluginOptions.debug) {
        timerNodes.setStatus(nodesCount)
      }
    }

    if (pluginOptions.debug) {
      timerNodes.end()
    }

    return
  } catch (e) {
    if (pluginOptions.debug) {
      reporter.panic(`source-google-docs: `, e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
