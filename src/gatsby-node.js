const crypto = require("crypto")
const fs = require("fs")
const {google} = require("googleapis")
const json2md = require("json2md")
const readline = require("readline-sync")

const DEFAULT_CONFIG = {
  access_type: "offline",
  redirect_uris: ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
  scope: ["https://www.googleapis.com/auth/documents.readonly"],
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

function documentJsonToMarkdown(title, sections) {
  return `---
title: ${title}
---
${json2md(sections)}`
}

async function getGoogleDoc({apiKey, documentId, auth}) {
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
              documentId,
            },
            (err, res) => {
              if (err) {
                reject(err)
              }

              if (!res.data) {
                reject("empty data")
              }

              const {body, inlineObjects, title} = res.data
              const sections = []

              body.content.forEach(({paragraph, table}) => {
                // Paragraphs
                if (paragraph) {
                  const tag = getParagraphTag(paragraph)

                  // Lists
                  if (paragraph.bullet) {
                    sections.push({
                      ul: paragraph.elements.map(el =>
                        cleanText(el.textRun.content)
                      ),
                    })
                  }

                  // Headings, Images, Texts
                  else if (tag) {
                    paragraph.elements.forEach(el => {
                      // EmbeddedObject
                      if (el.inlineObjectElement) {
                        const embeddedObject =
                          inlineObjects[el.inlineObjectElement.inlineObjectId]
                            .inlineObjectProperties.embeddedObject

                        // Images
                        if (embeddedObject.imageProperties) {
                          sections.push({
                            img: embeddedObject.imageProperties.contentUri,
                          })
                        }
                      }

                      // Headings, Texts
                      else if (el.textRun && el.textRun.content !== "\n") {
                        sections.push({
                          [tag]: cleanText(el.textRun.content),
                        })
                      }
                    })
                  }
                }

                // Table
                else if (table && table.tableRows.length > 0) {
                  const [thead, ...tbody] = table.tableRows
                  sections.push({
                    table: {
                      headers: thead.tableCells.map(({content}) =>
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

              resolve({title, sections})
            }
          )
        })
    } catch (e) {
      reject(e)
    }
  })
}

exports.sourceNodes = async (
  {actions: {createNode}, createNodeId},
  {config, documents = []}
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

  try {
    const auth = await getAuth({...DEFAULT_CONFIG, ...config})

    documents.forEach(async documentId => {
      const {title, sections} = await getGoogleDoc({
        apiKey: config.api_key,
        auth,
        documentId,
      })
      const markdown = documentJsonToMarkdown(title, sections)
      const document = {
        title,
        sections,
        markdown,
      }

      createNode({
        document,
        id: createNodeId(`GoogleDocs-${documentId}`),
        parent: "__SOURCE__",
        children: [],
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
          content: markdown,
          contentDigest: crypto
            .createHash("md5")
            .update(JSON.stringify(markdown))
            .digest("hex"),
        },
      })
    })
  } catch (e) {
    throw new Error(`source-google-docs: ${e.message}`)
  }
}
