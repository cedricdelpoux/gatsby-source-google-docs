const {fetchDocuments} = require("./google-docs")
const {DEFAULT_OPTIONS} = require("./constants")

exports.sourceNodes = async (
  {actions: {createNode}, createContentDigest, reporter},
  pluginOptions
) => {
  const options = {...DEFAULT_OPTIONS, ...pluginOptions}

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

  try {
    let nodesCount = 0
    const googleDocuments = await fetchDocuments(options)

    const timerNodes = reporter.activityTimer(
      `source-google-docs: Creating GoogleDocs nodes`
    )

    if (options.debug) {
      timerNodes.start()
    }

    for (let googleDocument of googleDocuments) {
      const {document, properties, cover} = googleDocument
      const markdown = googleDocument.toMarkdown()

      createNode({
        ...properties,
        document,
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

      if (options.debug) {
        timerNodes.setStatus(nodesCount)
      }
    }

    if (options.debug) {
      timerNodes.end()
    }

    return
  } catch (e) {
    if (options.debug) {
      reporter.panic(`source-google-docs: `, e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
