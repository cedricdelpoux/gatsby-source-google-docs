const {google} = require("googleapis")

const {
  convertGoogleDocumentToJson,
  convertJsonToMarkdown,
} = require("./converters")
const {googleAuth} = require("./google-auth")
const {fetchGoogleDriveFiles} = require("./google-drive")

async function fetchGoogleDocs({id}) {
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
  const relativePaths = {}

  const googleDocsDocuments = await Promise.all(
    googleDriveFiles.map(async file => {
      const {cover, content} = await fetchGoogleDocs({
        id: file.id,
      })

      relativePaths[file.id] = file.path

      return {file, cover, content}
    })
  )

  return googleDocsDocuments.map(({file, cover, content}) => {
    let markdown = convertJsonToMarkdown({
      metadata: {...file, cover},
      content,
    })

    // Replace Google Docs urls by relative paths
    const googleDocsUrlsMatches = markdown.matchAll(
      /https:\/\/docs.google.com\/document\/d\/([a-zA-Z0-9_-]+)/g
    )

    for (const [url, id] of googleDocsUrlsMatches) {
      if (relativePaths[id]) {
        markdown = markdown.replace(new RegExp(url, "g"), relativePaths[id])
      }
    }

    const document = {
      ...file,
      cover,
      content,
      markdown,
    }

    return document
  })
}

module.exports = {
  fetchGoogleDocsDocuments,
}
