const {google} = require("googleapis")

const {
  convertGoogleDocumentToJson,
  convertJsonToMarkdown,
} = require("./converters")
const {googleAuth} = require("./google-auth")
const {fetchGoogleDriveFiles} = require("./google-drive")

async function fetchGoogleDocsContent({id}) {
  const auth = googleAuth.getAuth()

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

        resolve(convertGoogleDocumentToJson(res.data))
      }
    )
  })
}

async function fetchGoogleDocsDocuments(pluginOptions) {
  const googleDriveFiles = await fetchGoogleDriveFiles(pluginOptions)

  return Promise.all(
    googleDriveFiles.map(async file => {
      const content = await fetchGoogleDocsContent({
        id: file.id,
      })

      const markdown = convertJsonToMarkdown({file, content})

      const document = {
        ...file,
        content,
        markdown,
      }

      return document
    })
  )
}

module.exports = {
  fetchGoogleDocsDocuments,
}
