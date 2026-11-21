import {createWriteStream} from "node:fs"
import {mkdir, rm} from "node:fs/promises"
import {dirname, join} from "node:path"
import {Readable} from "node:stream"
import {pipeline} from "node:stream/promises"
import {setTimeout as delay} from "node:timers/promises"

// Google serves document images without a file extension, so the extension has
// to come from the response. Sharp needs it to be right: `gatsby-plugin-sharp`
// dispatches on the File node's `extension` field, not on the file's content.
const EXTENSIONS_BY_MIME_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
}

const RETRIES = 3
const RETRY_DELAY = 1000

/**
 * Download `url` into `directory` and return the written file name.
 *
 * The response is streamed straight to disk so a large image never has to be
 * held in memory in full.
 */
async function downloadImage({url, directory, name}) {
  let lastError

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw Object.assign(
          new Error(`${response.status} ${response.statusText}`),
          {status: response.status}
        )
      }

      const mimeType = (response.headers.get("content-type") || "")
        .split(";")[0]
        .trim()
        .toLowerCase()
      const extension = EXTENSIONS_BY_MIME_TYPE[mimeType]

      if (!extension) {
        throw new Error(`unsupported image type "${mimeType || "unknown"}"`)
      }

      const fileName = `${name}.${extension}`
      const filePath = join(directory, fileName)

      await mkdir(dirname(filePath), {recursive: true})

      try {
        await pipeline(
          Readable.fromWeb(response.body),
          createWriteStream(filePath)
        )
      } catch (e) {
        // A half-written file would still produce a File node, and sharp would
        // fail on it much later with a far less obvious message.
        await rm(filePath, {force: true})
        throw e
      }

      return fileName
    } catch (e) {
      lastError = e

      // Asking again gives the same answer, except when it is rate limited
      const isClientError =
        e.status >= 400 && e.status < 500 && e.status !== 429

      if (isClientError) break

      if (attempt < RETRIES) {
        await delay(RETRY_DELAY * attempt)
      }
    }
  }

  throw Object.assign(
    new Error(`Unable to download "${url}": ${lastError.message}`),
    {status: lastError.status}
  )
}

export {downloadImage}
