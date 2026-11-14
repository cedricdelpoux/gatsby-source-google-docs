import {docs as googleDocs} from "@googleapis/docs"

import {getAuth} from "./lib/auth.js"
import {toMarkdown} from "./lib/google-document.js"

export {generateToken, getAuth} from "./lib/auth.js"

/**
 * @typedef {object} FetchOptions
 * @property {import("google-auth-library").OAuth2Client} [auth] Defaults to `getAuth()`
 */

/**
 * @param {string} id
 * @param {FetchOptions} [options]
 */
export async function fetchDocument(id, {auth} = {}) {
  const res = await googleDocs({
    version: "v1",
    auth: auth || (await getAuth()),
  }).documents.get({documentId: id})

  if (!res.data) {
    throw new Error("Empty Data")
  }

  return res.data
}

/**
 * @param {string} id
 * @param {FetchOptions & import("./lib/google-document.js").Options} [options]
 */
export async function fetchMarkdown(id, {auth, ...options} = {}) {
  const document = await fetchDocument(id, {auth})

  return toMarkdown(document, options)
}
