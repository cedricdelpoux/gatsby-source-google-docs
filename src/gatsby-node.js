const fs = require("fs")
const {google} = require("googleapis")
const json2md = require("json2md")
const readline = require("readline-sync")
const _get = require("lodash/get")
const _last = require("lodash/last")
const _repeat = require("lodash/repeat")

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

function cleanText(text) {
  return text.replace(/\n/g, "").trim()
}

function getParagraphTag(p) {
  const tags = {
    NORMAL_TEXT: "p",
    HEADING_1: "h1",
    HEADING_2: "h2",
    HEADING_3: "h3",
    HEADING_4: "h4",
    HEADING_5: "h5",
  }

  return tags[p.paragraphStyle.namedStyleType]
}

function getListTag(list) {
  const glyphType = _get(list, [
    "listProperties",
    "nestingLevels",
    0,
    "glyphType",
  ])
  return glyphType !== undefined ? "ol" : "ul"
}

function getNestedListIndent(level, listTag) {
  const indentType = listTag === "ol" ? "1." : "-"
  return `${_repeat("  ", level)}${indentType} `
}

function getTextFromParagraph(p) {
  return p.elements
    ? p.elements
        .filter(el => el.textRun && el.textRun.content !== "\n")
        .map(el => (el.textRun ? el.textRun.content : ""))
        .join("")
    : ""
}

function getTableCellContent(content) {
  if (!content.length === 0) return ""
  return content
    .map(({paragraph}) => cleanText(getTextFromParagraph(paragraph)))
    .join("")
}

function documentContentToMarkdown({content, ...metadata}) {
  return `---
${Object.keys(metadata).map(key => `${key}: ${metadata[key]}`).join(`
`)}
---
${json2md(content)}`
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

              const {body, inlineObjects, lists} = res.data
              const content = []

              body.content.forEach(({paragraph, table}, i) => {
                // Paragraphs
                if (paragraph) {
                  const tag = getParagraphTag(paragraph)

                  // Lists
                  if (paragraph.bullet) {
                    const listId = paragraph.bullet.listId
                    const listTag = getListTag(lists[listId])
                    const bulletContent = paragraph.elements
                      .map(el => cleanText(el.textRun.content))
                      .join(" ")

                    const prev = body.content[i - 1]
                    const prevListId = _get(prev, "paragraph.bullet.listId")

                    if (prevListId === listId) {
                      const list = _last(content)[listTag]
                      const {nestingLevel} = paragraph.bullet

                      if (nestingLevel !== undefined) {
                        // mimic nested lists
                        const lastIndex = list.length - 1
                        const indent = getNestedListIndent(
                          nestingLevel,
                          listTag
                        )

                        list[lastIndex] += `\n${indent} ${bulletContent}`
                      } else {
                        list.push(bulletContent)
                      }
                    } else {
                      content.push({[listTag]: [bulletContent]})
                    }
                  }

                  // Headings, Images, Texts
                  else if (tag) {
                    let tagContent = []

                    paragraph.elements.forEach(el => {
                      // EmbeddedObject
                      if (el.inlineObjectElement) {
                        const embeddedObject =
                          inlineObjects[el.inlineObjectElement.inlineObjectId]
                            .inlineObjectProperties.embeddedObject

                        // Images
                        if (embeddedObject.imageProperties) {
                          tagContent.push({
                            img: embeddedObject.imageProperties.contentUri,
                          })
                        }
                      }

                      // Headings, Texts
                      else if (el.textRun && el.textRun.content !== "\n") {
                        tagContent.push({
                          [tag]: cleanText(el.textRun.content),
                        })
                      }
                    })

                    if (tagContent.every(el => el[tag] !== undefined)) {
                      content.push({
                        [tag]: tagContent.map(el => el[tag]).join(" "),
                      })
                    } else {
                      content.push(...tagContent)
                    }
                  }
                }

                // Table
                else if (table && table.tableRows.length > 0) {
                  const [thead, ...tbody] = table.tableRows
                  content.push({
                    table: {
                      metadata: thead.tableCells.map(({content}) =>
                        getTableCellContent(content)
                      ),
                      rows: tbody.map(row =>
                        row.tableCells.map(({content}) =>
                          getTableCellContent(content)
                        )
                      ),
                    },
                  })
                }
              })

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
          fields: `files(id, name, ${fields.join(", ")})`,
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

          const markdown = documentContentToMarkdown({...metadata, content})

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
