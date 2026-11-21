import {docs as googleDocs} from "@googleapis/docs"

import {getAuth} from "./auth.js"

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
