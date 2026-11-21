/**
 * @typedef {import("./lib/options.js").Options} Options
 * @typedef {import("./lib/options.js").Logger} Logger
 * @typedef {import("./lib/sync.js").SyncedDocument} SyncedDocument
 * @typedef {import("./lib/google-drive.js").Metadata} Metadata
 * @typedef {import("./lib/google-drive.js").DocumentFile} DocumentFile
 * @typedef {import("./lib/google-drive.js").RawFolder} RawFolder
 */

export {generateToken, getAuth} from "./lib/auth.js"
export {fetchDocument} from "./lib/fetch-document.js"
export {syncGoogleDocs} from "./lib/sync.js"
