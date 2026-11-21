import {parseArgs} from "node:util"

import {syncGoogleDocs} from "./sync.js"

const USAGE = `Usage: google-docs-sync [options]

Sync a Google Drive folder to a directory of Markdown files.

Options:
  --folder <id>        Google Drive folder id (or GOOGLE_DOCS_FOLDER)
  --output-dir <dir>   Where the documents are written (default: content/google-docs)
  --cache-dir <dir>    Where the fetched documents are kept (default: .google-docs)
  --extension <ext>    md or mdx (default: md)
  --skip-images        Leave the images out
  --debug              Log the progress of every step
  --help               Show this help
`

/**
 * @param {string[]} args
 * @param {{env?: Record<string, string | undefined>, logger?: import("./options.js").Logger}} [context]
 */
export async function runCli(args, {env = process.env, logger = console} = {}) {
  const {values} = parseArgs({
    args,
    options: {
      folder: {type: "string"},
      "output-dir": {type: "string"},
      "cache-dir": {type: "string"},
      extension: {type: "string"},
      "skip-images": {type: "boolean"},
      debug: {type: "boolean"},
      help: {type: "boolean"},
    },
  })

  if (values.help) {
    logger.info(USAGE)
    return
  }

  const {documents, fetchedCount, imagesCount, downloadedImagesCount} =
    await syncGoogleDocs({
      logger,
      folder: values.folder ?? env.GOOGLE_DOCS_FOLDER,
      outputDir: values["output-dir"],
      cacheDir: values["cache-dir"],
      extension: /** @type {"md" | "mdx" | undefined} */ (values.extension),
      skipImages: values["skip-images"],
      debug: values.debug,
    })

  logger.info(
    `${documents.length} documents (${fetchedCount} fetched) ` +
      `and ${imagesCount} images (${downloadedImagesCount} downloaded)`
  )
}
