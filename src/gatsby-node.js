const {getAuth} = require("./utils/auth")
const {fetchGoogleDriveFiles} = require("./utils/google-drive")
const {fetchGoogleDocsDocuments} = require("./utils/google-docs")
const { createRemoteFileNode } = require("gatsby-source-filesystem");

const DEFAULT_CONFIG = {
  access_type: "offline",
  redirect_uris: ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
  scope: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
  token_path: "google-docs-token.json",
}

async function getGoogleImages(document) {
    const imageNodeArr = [];
    for (const element of document.content) {
        const imgTag = element.img;
        if (imgTag) {
            imageNodeArr.push(imgTag);
        }
    }
    return imageNodeArr;
}

exports.sourceNodes = async (
  {actions: {createNode}, createNodeId, createContentDigest, store, cache},
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
    const convertImgToNode = options.convertImgToNode;
    let image = [];
    for(document of googleDocsDocuments) {
        const id = createNodeId(`GoogleDocs-${document.id}`);
        let markdownNode = {
          document,
          id,
          internal: {
            type: "GoogleDocs",
            mediaType: "text/markdown",
        }
        };
        if (convertImgToNode) {
            images = await getGoogleImages(document, convertImgToNode, id);
            for ( imgObj of images) {
                const imageToken = Math.random().toString(36).substr(2, 9);
                try {
                    const url = imgObj.source;
                    const imageNode = await createRemoteFileNode({
                      url,
                      parentNodeId: id,
                      store,
                      cache,
                      createNode,
                      createNodeId,
                      name: `google-doc-image-${imageToken}`,
                    })

                    if (imageNode) {
                       document.markdown = document.markdown.replace(url, imageNode.id);
                    }else {
                        return;
                    }
                 } catch (e) {
                    console.log(e);
                 }
            }
        }
        markdownNode.internal.content = document.markdown;
        markdownNode.internal.contentDigest = createContentDigest(markdownNode);
        createNode(markdownNode);
    }
    done()
  } catch (e) {
    done(new Error(`source-google-docs: ${e.message}`))
  }
}
