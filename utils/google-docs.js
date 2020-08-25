const {google} = require("googleapis")
const GoogleOAuth2 = require("google-oauth2-env-vars")

const {ENV_TOKEN_VAR} = require("./constants")

const {
  convertGoogleDocumentToJson,
  convertJsonToMarkdown,
} = require("./converters")

const {fetchGoogleDriveDocuments} = require("./google-drive")

async function fetchGoogleDocs({id}) {
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

        resolve(convertGoogleDocumentToJson(res.data))
      }
    )
  })
}

async function fetchGoogleDocsDocuments(pluginOptions) {
  const googleDriveDocument = await fetchGoogleDriveDocuments(pluginOptions)
  const relativePaths = {}

  const googleDocsDocuments = await Promise.all(
    googleDriveDocument.map(async metadata => {
      const {cover, content} = await fetchGoogleDocs({
        id: metadata.id,
      })

      relativePaths[metadata.id] = metadata.path

      return {metadata, cover, content}
    })
  )

  return googleDocsDocuments.map(({metadata, cover, content}) => {
    let markdown = convertJsonToMarkdown({
      metadata: {...metadata, cover},
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

    return {
      ...metadata,
      cover,
      content,
      markdown,
    }
  })
}

module.exports = {
  fetchGoogleDocsDocuments,
}
