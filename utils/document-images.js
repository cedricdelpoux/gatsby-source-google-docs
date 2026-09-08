const _get = require("lodash/get")

/**
 * Map every image URL of a raw document to the id of the object holding it.
 *
 * Google serves document images from URLs it expires within hours, and gives
 * out new ones every time the document is fetched, so a URL cannot name a file
 * on disk. The id of the inline object carrying the image does not change
 * between two fetches, which is what lets a build find an image it downloaded
 * days ago — and what lets it ask for a URL that still works when it does not.
 *
 * @returns {Map<string, string>} image URL -> object id
 */
const getImageIdsByUrl = (document) => {
  const inlineObjects = _get(document, ["inlineObjects"]) || {}
  const ids = new Map()

  for (const [id, inlineObject] of Object.entries(inlineObjects)) {
    const url = _get(inlineObject, [
      "inlineObjectProperties",
      "embeddedObject",
      "imageProperties",
      "contentUri",
    ])

    if (url) {
      ids.set(url, id)
    }
  }

  return ids
}

module.exports = {getImageIdsByUrl}
