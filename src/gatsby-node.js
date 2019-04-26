const {getAuth} = require("./utils/auth")
const {fetchGoogleDriveFiles} = require("./utils/google-drive")
const {fetchGoogleDocsDocuments} = require("./utils/google-docs")

const DEFAULT_CONFIG = {
  access_type: "offline",
  redirect_uris: ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
  scope: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
  token_path: "google-docs-token.json",
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

    const googleDriveFiles = await fetchGoogleDriveFiles({
      auth,
      rootFolderIds: options.foldersIds,
      fields: options.fields,
      fieldsMapper: options.fieldsMapper,
      fieldsDefault: options.fieldsDefault,
    })

    const googleDocsDocuments = await fetchGoogleDocsDocuments({
      auth,
      apiKey: config.api_key,
      googleDriveFiles,
    })

    googleDocsDocuments.forEach(document => {
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
