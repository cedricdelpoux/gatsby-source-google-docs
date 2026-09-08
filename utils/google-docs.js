const {docs: googleDocs} = require("@googleapis/docs")

const {getAuth} = require("./get-auth")
const {GoogleDocument} = require("./google-document")
const {writeDocumentToTests} = require("./write-document-to-tests")
const {fetchFiles} = require("./google-drive")

async function fetchDocument(id) {
  const auth = await getAuth()

  const res = await googleDocs({version: "v1", auth}).documents.get({
    documentId: id,
  })

  if (!res.data) {
    throw new Error("Empty Data")
  }

  return res.data
}

/** @param {import('..').Options} options */
async function fetchDocuments({options, reporter}) {
  const timer = reporter.activityTimer(`source-google-docs: documents`)

  if (options.debug) {
    timer.start()
    timer.setStatus("fetching documents")
  }

  const documentsProperties = await fetchFiles(options)
  const links = documentsProperties.reduce(
    (acc, properties) => ({...acc, [properties.id]: properties.slug}),
    {}
  )

  const googleDocuments = await Promise.all(
    documentsProperties.map(async (properties) => {
      const document = await fetchDocument(properties.id)
      const googleDocument = new GoogleDocument({
        document,
        properties,
        options,
        links,
      })

      if (process.env.NODE_ENV === "DOCS_TO_TESTS") {
        writeDocumentToTests(googleDocument)
      }

      return googleDocument
    })
  )

  if (process.env.NODE_ENV === "DOCS_TO_TESTS") {
    process.exit()
  }

  if (options.debug) {
    timer.setStatus(googleDocuments.length + " documents fetched")
    timer.end()
  }

  return googleDocuments
}

module.exports = {
  fetchDocuments,
}
