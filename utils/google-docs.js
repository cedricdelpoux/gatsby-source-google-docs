const {google} = require("googleapis")
const GoogleOAuth2 = require("google-oauth2-env-vars")

const {ENV_TOKEN_VAR} = require("./constants")
const {GoogleDocument} = require("./google-document")
const {writeDocumentToTests} = require("./write-document-to-tests")
const {fetchFiles} = require("./google-drive")

async function fetchDocument(id) {
  const googleOAuth2 = new GoogleOAuth2({
    token: ENV_TOKEN_VAR,
  })
  const auth = await googleOAuth2.getAuth()

  const res = await google.docs({version: "v1", auth}).documents.get({
    documentId: id,
  })

  if (!res.data) {
    throw new Error("Empty Data")
  }

  return res.data
}

/** @param {import('..').Options} pluginOptions */
async function fetchDocuments(pluginOptions) {
  const documentsFiles = await fetchFiles(pluginOptions)
  const crosslinksPaths = documentsFiles.reduce(
    (acc, file) => ({...acc, [file.id]: file.path}),
    {}
  )

  const googleDocuments = await Promise.all(
    documentsFiles.map(async (file) => {
      const document = await fetchDocument(file.id)
      const googleDocument = new GoogleDocument(document, file, {
        ...pluginOptions,
        crosslinksPaths,
      })

      if (process.env.NODE_ENV === "DOCUMENT_TO_TESTS") {
        writeDocumentToTests(googleDocument)
      }

      return googleDocument
    })
  )

  if (process.env.NODE_ENV === "DOCUMENT_TO_TESTS") {
    process.exit()
  }

  return googleDocuments
}

module.exports = {
  fetchDocuments,
}
