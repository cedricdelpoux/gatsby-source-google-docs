import {GoogleDocument} from "google-docs-to-markdown"

import {fetchDocument} from "./fetch-document.js"
import {fetchFiles} from "./google-drive.js"

/**
 * Fetch every document of the folder, reusing the ones the store already holds.
 *
 * Google Drive gives a `modifiedTime` for every document while listing the
 * folder, which costs nothing on top of the listing that is done anyway:
 * a document whose `modifiedTime` has not moved since it was stored is the
 * document that was stored, so it never has to be fetched again. Its metadata
 * still comes from the listing, so renaming a document or editing its
 * description is picked up whether it was fetched or not.
 */
async function fetchDocuments({options, logger, store, auth}) {
  if (options.debug) {
    logger.info("fetching documents")
  }

  const documentsProperties = await fetchFiles(options, {auth, logger})
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
        document = await fetchDocument(properties.id, {auth})
        fetchedCount++

        await store.writeDocument({
          id: properties.id,
          modifiedTime: properties.modifiedTime,
          document,
        })
      }

      const googleDocument = new GoogleDocument(document, {
        ...options,
        mdx: options.extension === "mdx",
        frontmatter: properties,
        links,
      })

      return {googleDocument, fromStore}
    })
  )

  if (options.debug) {
    logger.info(
      `${documents.length} documents, ${fetchedCount} fetched from Google Docs`
    )
  }

  return {documents, fetchedCount}
}

export {fetchDocuments}
