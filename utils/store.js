const {mkdir, readdir, readFile, rename, rm, writeFile} = require("fs/promises")
const {basename, dirname, extname, join} = require("path")

// Documents and images are kept next to `gatsby-config.js` rather than in the
// Gatsby cache. Gatsby empties its own cache whenever a plugin version,
// `package.json`, `gatsby-config.js` or `gatsby-node.js` changes, and a
// continuous integration job never has one: a site would fetch every document
// and download every image again after adding a dependency. This directory is
// only emptied by hand, or by the plugin when what it holds cannot be reused.
const VERSION = 1

const DOCUMENTS_DIRECTORY = "documents"
const IMAGES_DIRECTORY = "images"
const STATE_FILE = "state.json"

/** Ids come from Google: keep them from naming a file outside the store. */
const toFileName = (id) =>
  String(id)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^\.+/, "")

const readJson = async (file) => {
  let content

  try {
    content = await readFile(file, "utf8")
  } catch (e) {
    if (e.code === "ENOENT") return null

    throw e
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error(`${file} is not valid JSON, delete it to fetch it again`)
  }
}

// Written next to the target then renamed, so that an interrupted build leaves
// the previous version behind rather than a truncated file
const writeJson = async (file, content) => {
  const temporaryFile = `${file}.tmp`

  await mkdir(dirname(file), {recursive: true})
  await writeFile(temporaryFile, JSON.stringify(content))
  await rename(temporaryFile, file)
}

const list = async (directory) => {
  try {
    return await readdir(directory)
  } catch (e) {
    if (e.code === "ENOENT") return []

    throw e
  }
}

/**
 * The `.google-docs` directory: one file per document, and the images they
 * reference, so that a build only fetches what changed on Google Drive.
 */
const createStore = ({dir}) => {
  const documentsDirectory = join(dir, DOCUMENTS_DIRECTORY)
  const imagesDirectory = join(dir, IMAGES_DIRECTORY)
  const stateFile = join(dir, STATE_FILE)
  const documentFile = (id) =>
    join(documentsDirectory, `${toFileName(id)}.json`)
  const documentImagesDirectory = (id) => join(imagesDirectory, toFileName(id))

  return {
    dir,

    /**
     * Drop what a previous run left behind and cannot be reused: a store
     * written by another version of the plugin, and images downloaded with
     * other `imagesOptions` — the size is part of the URL, so the files on
     * disk are not the ones the site asks for anymore.
     */
    async init({imagesParams} = {}) {
      const state = (await readJson(stateFile)) || {}

      if (state.version !== VERSION) {
        await rm(dir, {recursive: true, force: true})
      } else if (state.imagesParams !== imagesParams) {
        await rm(imagesDirectory, {recursive: true, force: true})
      }

      await writeJson(stateFile, {version: VERSION, imagesParams})
    },

    /** @returns {Promise<{modifiedTime: string, document: object} | null>} */
    async readDocument(id) {
      return readJson(documentFile(id))
    },

    async writeDocument({id, modifiedTime, document}) {
      await writeJson(documentFile(id), {modifiedTime, document})
    },

    imagesDirectory: documentImagesDirectory,

    /**
     * The images already downloaded for a document, by the id of the object
     * that holds them. One `readdir` rather than one `stat` per image: the
     * extension is only known once the image has been downloaded, since Google
     * serves it without one.
     *
     * @returns {Promise<Map<string, string>>} object id -> file name
     */
    async readImages(id) {
      const files = await list(documentImagesDirectory(id))

      return new Map(files.map((file) => [basename(file, extname(file)), file]))
    },

    /** Forget the documents that are not in the Google Drive folder anymore. */
    async prune(ids) {
      const kept = new Set(ids.map(toFileName))

      for (const file of await list(documentsDirectory)) {
        if (!kept.has(basename(file, extname(file)))) {
          await rm(join(documentsDirectory, file), {
            recursive: true,
            force: true,
          })
        }
      }

      for (const directory of await list(imagesDirectory)) {
        if (!kept.has(directory)) {
          await rm(join(imagesDirectory, directory), {
            recursive: true,
            force: true,
          })
        }
      }
    },
  }
}

module.exports = {createStore}
