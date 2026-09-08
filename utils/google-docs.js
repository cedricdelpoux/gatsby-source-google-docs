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

/**
 * Fetch every document of the folder, reusing the ones the store already holds.
 *
 * Google Drive gives a `modifiedTime` for every document while listing the
 * folder, which costs nothing on top of the listing the plugin already does:
 * a document whose `modifiedTime` has not moved since it was stored is the
 * document that was stored, so it never has to be fetched again. Its metadata
 * still comes from the listing, so renaming a document or editing its
 * description is picked up whether it was fetched or not.
 *
 * @param {object} params
 * @param {import('..').Options} params.options
 * @param {ReturnType<import('./store').createStore>} params.store
 */
async function fetchDocuments({options, reporter, store}) {
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

  let fetchedCount = 0

  const documents = await Promise.all(
    documentsProperties.map(async (properties) => {
      const stored = await store.readDocument(properties.id)
      const fromStore = Boolean(
        stored &&
        stored.document &&
        properties.modifiedTime &&
        stored.modifiedTime === properties.modifiedTime
      )
      let document

      if (fromStore) {
        document = stored.document
      } else {
        document = await fetchDocument(properties.id)
        fetchedCount++

        await store.writeDocument({
          id: properties.id,
          modifiedTime: properties.modifiedTime,
          document,
        })
      }

      const googleDocument = new GoogleDocument({
        document,
        properties,
        options,
        links,
      })

      if (process.env.NODE_ENV === "DOCS_TO_TESTS") {
        writeDocumentToTests(googleDocument)
      }

      return {googleDocument, fromStore}
    })
  )

  if (process.env.NODE_ENV === "DOCS_TO_TESTS") {
    process.exit()
  }

  if (options.debug) {
    timer.setStatus(
      `${documents.length} documents, ${fetchedCount} fetched from Google Docs`
    )
    timer.end()
  }

  return {documents, fetchedCount}
}

module.exports = {
  fetchDocument,
  fetchDocuments,
}
