const {google} = require("googleapis")
const GoogleOAuth2 = require("google-oauth2-env-vars")

const {ENV_TOKEN_VAR} = require("./constants")
const {GoogleDocument} = require("./google-document")
const {writeDocumentToTests} = require("./write-document-to-tests")
const {fetchDocumentsMetadata} = require("./google-drive")

async function fetchDocument(id) {
  const googleOAuth2 = new GoogleOAuth2({
    token: ENV_TOKEN_VAR,
  })
  const auth = await googleOAuth2.getAuth()

  return new Promise((resolve, reject) => {
    google.docs({version: "v1", auth}).documents.get(
      {
        documentId: id,
      },
      (err, res) => {
        if (err) {
          return reject(err)
        }

        if (!res.data) {
          return reject("Empty data")
        }

        resolve(res.data)
      }
    )
  })
}

async function fetchDocuments(pluginOptions) {
  const documentsMetadata = await fetchDocumentsMetadata(pluginOptions)
  const crosslinksPaths = documentsMetadata.reduce(
    (acc, metadata) => ({...acc, [metadata.id]: metadata.path}),
    {}
  )

  const googleDocuments = await Promise.all(
    documentsMetadata.map(async (metadata) => {
      const document = await fetchDocument(metadata.id)
      const googleDocument = new GoogleDocument(document, metadata, {
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
