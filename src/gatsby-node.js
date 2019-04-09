const fs = require("fs")
const {google} = require("googleapis")
const readline = require("readline-sync")

const convertGoogleDocumentToJson = require("./convert-google-document-to-json")
const convertJsonToMarkdown = require("./convert-json-to-markdown")

const DEFAULT_CONFIG = {
  access_type: "offline",
  redirect_uris: ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
  scope: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
  token_path: "google-docs-token.json",
}

async function getToken({access_type, client, scope, token_path}) {
  if (fs.existsSync(token_path)) {
    const token = JSON.parse(fs.readFileSync(token_path, "utf-8"))
    return token
  } else {
    const token = await getNewToken({access_type, client, scope})
    fs.writeFileSync(token_path, JSON.stringify(token))
    return token
  }
}

async function getAuth({
  access_type,
  client_id,
  client_secret,
  redirect_uris,
  scope,
  token_path,
}) {
  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  const token = await getToken({access_type, client, scope, token_path})
  client.setCredentials(token)
  return client
}

async function getNewToken({access_type, client, scope}) {
  const authUrl = client.generateAuthUrl({
    access_type,
    scope,
  })

  /* eslint-disable-next-line */
  console.info("Authorize this app by visiting this url:", authUrl)
  const code = readline.question("Enter the code from that page here: ")
  const {tokens} = await client.getToken(code)
  return tokens
}

async function getGoogleDocContent({apiKey, id, auth}) {
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

async function getDocumentsMetadata({auth, foldersIds, fields, fieldsMapper}) {
  return new Promise((resolve, reject) => {
    try {
      const drive = google.drive({version: "v3", auth})
      drive.files.list(
        {
          q: `${foldersIds
            .map(id => `'${id}' in parents`)
            .join(" or ")} and mimeType='application/vnd.google-apps.document'`,
          fields: `files(id, name, description${
            fields ? `, ${fields.join(", ")}` : ""
          })`,
        },
        (err, res) => {
          if (err) {
            return reject(err)
          }

          const documentsMetadata = res.data.files.map(documentMetadata => {
            // Fields transformation
            if (fieldsMapper) {
              Object.keys(fieldsMapper).forEach(oldKey => {
                const newKey = fieldsMapper[oldKey]
                Object.assign(documentMetadata, {
                  [newKey]: documentMetadata[oldKey],
                })
                delete documentMetadata[oldKey]
              })
            }

            // Transform description into metadata if description is JSON object
            if (documentMetadata.description) {
              try {
                documentMetadata = {
                  ...documentMetadata,
                  ...JSON.parse(documentMetadata.description),
                }
                delete documentMetadata.description
              } catch (e) {
                // Description field is not a JSON
                // Do not throw an error if JSON.parse fail
              }
            }

            return documentMetadata
          })

          resolve(documentsMetadata)
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

async function getDocuments({auth, apiKey, metadata}) {
  const requests = await metadata.map(
    async metadata =>
      new Promise(async (resolve, reject) => {
        try {
          const content = await getGoogleDocContent({
            apiKey,
            auth,
            id: metadata.id,
          })

          const markdown = convertJsonToMarkdown({metadata, content})

          const document = {
            ...metadata,
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

exports.sourceNodes = async (
  {actions: {createNode}, createNodeId, createContentDigest},
  {config, ...options},
  done
) => {
  if (!config.api_key) {
    throw new Error("source-google-docs: Missing API key")
  }

  if (!config.client_id) {
    throw new Error("source-google-docs: Missing client_id")
  }

  if (!config.client_secret) {
    throw new Error("source-google-docs: Missing client_secret")
  }

  if (!options.foldersIds) {
    throw new Error("source-google-docs: Missing foldersIds")
  }

  try {
    const auth = await getAuth({...DEFAULT_CONFIG, ...config})

    const documentsMetadata = await getDocumentsMetadata({
      auth,
      foldersIds: options.foldersIds,
      fields: options.fields,
      fieldsMapper: options.fieldsMapper,
    })

    const documents = await getDocuments({
      auth,
      apiKey: config.api_key,
      metadata: documentsMetadata,
    })

    documents.forEach(document => {
      createNode({
        document,
        id: createNodeId(`GoogleDocs-${document.id}`),
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
          content: document.markdown,
          contentDigest: createContentDigest(document.markdown),
        },
      })
    })
    done()
  } catch (e) {
    done(new Error(`source-google-docs: ${e.message}`))
  }
}
