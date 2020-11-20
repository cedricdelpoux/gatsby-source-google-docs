const {google} = require("googleapis")
const _kebabCase = require("lodash/kebabCase")
const _chunk = require("lodash/chunk")
const _flatten = require("lodash/flatten")
const GoogleOAuth2 = require("google-oauth2-env-vars")
const yamljs = require("yamljs")
const wyt = require("@forivall/wyt")

const {ENV_TOKEN_VAR} = require("./constants")

const MIME_TYPE_DOCUMENT = "application/vnd.google-apps.document"
const MIME_TYPE_FOLDER = "application/vnd.google-apps.folder"

/**
 * @template T
 * @param {T[]} arr
 * @param {number} count
 * @returns {T[][]}
 */
function evenlyChunk(arr, count) {
  const chunks = Math.ceil(arr.length / count)
  if (chunks <= 1) {
    return [arr]
  }
  return _chunk(arr, Math.ceil(arr.length / chunks))
}

const getMetadataFromDescription = (description) => {
  const metadata = {}

  if (description) {
    try {
      // Try to convert description from YAML
      const descriptionObject = yamljs.parse(description)
      if (typeof descriptionObject !== "string") {
        Object.assign(metadata, descriptionObject)
      }
    } catch (e) {
      // Description field is not valid YAML
      // Do not throw an error
    }
  }

  return metadata
}

/**
 * @param {object} options
 * @param {Partial<import('..').Metadata>} options.metadata
 * @param {Record<string, unknown>=} options.fieldsDefault
 * @param {Record<string, string>=} options.fieldsMapper
 */
const updateFile = ({file, path, options}) => {
  const breadcrumb = path
    .split("/")
    // Remove empty strings
    .filter((element) => element)

  if (file.name === "index" && breadcrumb.length > 0) {
    // Remove "index"
    breadcrumb.pop()
    // Remove folder name and use it as name
    file.name = breadcrumb.pop()
    // Path need to be updated
    path =
      breadcrumb.length > 0
        ? `/${breadcrumb.join("/")}/${file.name}`
        : `/${file.name}`

    Object.assign(file, {
      index: true,
    })
  }

  Object.assign(file, {
    date: file.createdTime,
    draft: false,
    path,
    breadcrumb,
  })

  // Default values
  Object.keys(options.fieldsDefault).forEach((key) => {
    Object.assign(file, {
      [key]: options.fieldsDefault[key],
    })
  })

  // Fields transformation
  Object.keys(options.fieldsMapper).forEach((oldKey) => {
    const newKey = options.fieldsMapper[oldKey]

    Object.assign(file, {
      [newKey]: file[oldKey],
    })

    delete file[oldKey]
  })

  // Transform description into metadata if description is YAML
  const metadata = getMetadataFromDescription(file.description)
  Object.assign(file, metadata)

  if (options.updateMetadata && typeof options.updateMetadata === "function") {
    file = options.updateMetadata(file)
  }

  return file
}

async function getGoogleDrive() {
  const googleOAuth2 = new GoogleOAuth2({
    token: ENV_TOKEN_VAR,
  })
  const auth = await googleOAuth2.getAuth()

  return google.drive({version: "v3", auth})
}

/**
 * @typedef DocumentFetchParent
 * @property {string | null} id
 * @property {string[]} breadcrumb
 * @property {string} path
 */

/**
 * @typedef FetchDocumentsOptions
 * @property {import('googleapis').drive_v3.Drive} drive
 * @property {DocumentFetchParent[]} parents
 */

// 10 per 1.5 seconds.
const rateLimit = wyt(10, 1500)
const BATCH_SIZE = 100
/**
 * @param {import('..').Options & FetchDocumentsOptions} options
 * @returns {Promise<(import('..').DocumentFile & { path: string })[]>}
 */
async function fetchDocumentsFiles({drive, parents, options}) {
  if (parents.length > BATCH_SIZE) {
    return _flatten(
      await Promise.all(
        evenlyChunk(parents, BATCH_SIZE).map((parents) =>
          fetchDocumentsFiles({
            drive,
            parents,
            options,
          })
        )
      )
    )
  }

  const waited = await rateLimit()
  if (options.debug) {
    const waitedText =
      waited > 1000 ? ` (waited ${(waited / 1000).toFixed(1)}s)` : ""
    // eslint-disable-next-line no-console
    console.info(
      `source-google-docs: Fetching documents from depth ${parents[0].breadcrumb.length}` +
        waitedText
    )
  }

  const parentQuery =
    parents.length === 1 && parents[0].id === null
      ? false
      : parents.map((p) => `'${p.id}' in parents`).join(" or ")

  const query = {
    q: `${
      parentQuery ? `(${parentQuery}) and ` : ""
    }(mimeType='${MIME_TYPE_FOLDER}' or mimeType='${MIME_TYPE_DOCUMENT}') and trashed = false`,
    fields: `nextPageToken,files(id, mimeType, name, description, createdTime, modifiedTime, starred, parents${
      options.fields.length > 0 ? `, ${options.fields.join(", ")}` : ""
    })`,
  }

  const res = await drive.files.list(query)

  /** @param {typeof res.data.files} files */
  const collectDocuments = (files) =>
    files
      .filter(
        /** @returns {file is import("..").DocumentFile} */
        (file) => file.mimeType === MIME_TYPE_DOCUMENT
      )
      .map((file) => {
        const parentIds = file.parents && new Set(file.parents)
        const parent = parentIds && parents.find((p) => parentIds.has(p.id))
        const parentPath = (parent && parent.path) || ""

        Object.assign(file, parent.metadata)

        return updateFile({
          file,
          path: `${parentPath}/${_kebabCase(file.name)}`,
          options,
        })
      })
      .filter((file) => file.draft === false)
  let documents = collectDocuments(res.data.files)

  /** @param {typeof res.data.files} files */
  const collectParents = (files) => {
    const folders = files.filter((file) => {
      const isFolder = file.mimeType === MIME_TYPE_FOLDER
      const isIgnored =
        file.name.toLowerCase() === "drafts" ||
        options.ignoredFolders.includes(file.name) ||
        options.ignoredFolders.includes(file.id)

      return isFolder && !isIgnored
    })

    return folders.map((folder) => {
      const parentIds = folder.parents && new Set(folder.parents)
      const parent = parentIds && parents.find((p) => parentIds.has(p.id))
      const parentPath = (parent && parent.path) || ""
      return {
        id: folder.id,
        breadcrumb: [...((parent && parent.breadcrumb) || []), folder.name],
        path: `${parentPath}/${_kebabCase(folder.name)}`,
        metadata: {
          ...parent.metadata,
          ...getMetadataFromDescription(folder.description),
        },
      }
    })
  }
  let nextParents = collectParents(res.data.files)

  if (!res.data.nextPageToken) {
    if (nextParents.length === 0) {
      return documents
    }
    const documentsInFolders = await fetchDocumentsFiles({
      drive,
      parents: nextParents,
      options,
    })
    return [...documents, ...documentsInFolders]
  }

  /** @type {typeof documents} */
  let documentsInFolders = []

  const fetchOneParentsBatch = async () => {
    // process one batch of children while continuing on with pages
    const parentBatch = nextParents.slice(0, BATCH_SIZE)
    nextParents = nextParents.slice(BATCH_SIZE)
    const results = await fetchDocumentsFiles({
      drive,
      parents: parentBatch,
      options,
    })
    documentsInFolders = [...documentsInFolders, ...results]
  }

  /** @param {string} nextPageToken */
  const fetchNextPage = async (nextPageToken) => {
    await rateLimit()
    const nextRes = await drive.files.list({
      ...query,
      pageToken: nextPageToken,
    })
    documents = [...documents, ...collectDocuments(nextRes.data.files)]
    nextParents = [...nextParents, ...collectParents(nextRes.data.files)]

    if (!nextRes.data.nextPageToken) {
      if (nextParents.length === 0) {
        return documents
      }
      const finalDocumentsInFolders = await fetchDocumentsFiles({
        drive,
        parents: nextParents,
        options,
      })
      return [...documents, ...documentsInFolders, ...finalDocumentsInFolders]
    }

    const nextPagePromise = fetchNextPage(nextRes.data.nextPageToken)
    if (nextParents.length < BATCH_SIZE) {
      return nextPagePromise
    }
    return (await Promise.all([nextPagePromise, fetchOneParentsBatch()]))[0]
  }
  return fetchNextPage(res.data.nextPageToken)
}

/** @param {import('..').Options} pluginOptions */
async function fetchFiles({folder, ...options}) {
  const drive = await getGoogleDrive()

  const res = await drive.files.get({
    fileId: folder,
    fields: "description",
  })

  const documentsFiles = await fetchDocumentsFiles({
    drive,
    parents: [
      {
        id: folder,
        breadcrumb: [],
        path: "",
        metadata: getMetadataFromDescription(res.data.description),
      },
    ],
    options,
  })

  return documentsFiles
}

module.exports = {
  fetchFiles,
}
