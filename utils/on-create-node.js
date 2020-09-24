const {onCreateNodeGoogleDocs} = require("./on-create-node-google-docs")
const {onCreateNodeMarkdownRemark} = require("./on-create-node-markdown-remark")

exports.onCreateNode = async ({
  node,
  actions,
  store,
  cache,
  createNodeId,
  createContentDigest,
  reporter,
}) => {
  if (node.internal.type === "GoogleDocs") {
    await onCreateNodeGoogleDocs({
      node,
      actions,
      store,
      cache,
      createNodeId,
      createContentDigest,
      reporter,
    })
  }

  if (node.internal.type === "MarkdownRemark") {
    await onCreateNodeMarkdownRemark({
      node,
      actions,
      cache,
    })
  }
}
