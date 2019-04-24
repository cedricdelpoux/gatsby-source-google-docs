const {google} = require("googleapis")

const convertGoogleDocumentToJson = require("./convert-google-document-to-json")
const convertJsonToMarkdown = require("./convert-json-to-markdown")

async function fetchGoogleDocsContent({apiKey, id, auth}) {
  return new Promise((resolve, reject) => {
    try {
      google.options({auth})
      google
        .discoverAPI(
          "https://docs.googleapis.com/$discovery/rest?version=v1&key=" + apiKey
        )
        .then(function(docs) {
          docs.documents.get(
            {
              documentId: id,
            },
            (err, res) => {
              if (err) {
                return reject(err)
              }

              if (!res.data) {
                return reject("empty data")
              }

              const content = convertGoogleDocumentToJson(res.data)

              resolve(content)
            }
          )
        })
    } catch (e) {
      reject(e)
    }
  })
}

async function fetchGoogleDocsDocuments({auth, apiKey, googleDriveFiles}) {
  const requests = await googleDriveFiles.map(
    async file =>
      new Promise(async (resolve, reject) => {
        try {
          const content = await fetchGoogleDocsContent({
            apiKey,
            auth,
            id: file.id,
          })

          const markdown = convertJsonToMarkdown({file, content})

          const document = {
            ...file,
            content,
            markdown,
          }

          resolve(document)
        } catch (e) {
          reject(e)
        }
      })
  )

  return await Promise.all(requests)
}

module.exports = {
  fetchGoogleDocsDocuments,
}
