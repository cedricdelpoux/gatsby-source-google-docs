import {drive as googleDrive} from "@googleapis/drive"
import _kebabCase from "lodash/kebabCase.js"
import _chunk from "lodash/chunk.js"
import yamljs from "yamljs"

import {wait} from "./wait.js"

/**
 * @typedef {import("@googleapis/drive").drive_v3.Schema$File & {mimeType: "application/vnd.google-apps.document"}} DocumentFile
 * @typedef {import("@googleapis/drive").drive_v3.Schema$File & {mimeType: "application/vnd.google-apps.folder"}} RawFolder
 */

/**
 * @typedef {object} Metadata The frontmatter of a document
 * @property {string} name
 * @property {string} slug
 * @property {string} path
 * @property {string | object} [description]
 * @property {{image: string, title: string, alt: string}} [cover]
 * @property {object[]} breadcrumb
 */

const MIME_TYPE_DOCUMENT = "application/vnd.google-apps.document"
const MIME_TYPE_FOLDER = "application/vnd.google-apps.folder"

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
    } catch {
      // Description field is not valid YAML
      // Do not throw an error
    }
  }

  return metadata
}

const getTreeMetadata = (tree, file) => {
  let name = file.name
  let breadcrumb = []
  let slug = ""
  let path = ""

  tree.forEach((item) => {
    const nameSlugified = _kebabCase(item.name)

    path += `/${nameSlugified}`

    if (item.skip !== true) {
      slug += `/${nameSlugified}`
      breadcrumb.push({
        name: item.name,
        slug,
      })
    }
  })

  // /folder/index -> /folder
  if (file.index) {
    const folder = breadcrumb.pop()
    if (folder && file.name === "index") {
      name = folder.name
    }
  } else {
    const nameSlugified = _kebabCase(name)

    path += `/${nameSlugified}`
    slug += `/${nameSlugified}`
  }

  // Metadata slug from "description"
  if (file.slug) {
    slug = file.slug
  }

  // Root
  if (slug === "") {
    slug = "/"
  }

  breadcrumb.push({
    name,
    slug,
  })

  return {
    name,
    breadcrumb,
    path,
    slug,
  }
}

const updateFile = ({file, folder}) => {
  Object.assign(file, {
    exclude: false,
    page: true,
    index: file.name === "index",
    date: file.createdTime,
    ...folder.metadata,
  })

  Object.assign(file, getMetadataFromDescription(file.description))

  // Breadcrumb, slug, path
  Object.assign(file, getTreeMetadata(folder.tree, file))

  return file
}

// 10 per 1.5 seconds.
const rateLimit = wait(10, 1500)
const BATCH_SIZE = 100
async function fetchDocumentsFiles({drive, parents, options}) {
  if (parents.length > BATCH_SIZE) {
    const batches = await Promise.all(
      evenlyChunk(parents, BATCH_SIZE).map((parents) =>
        fetchDocumentsFiles({drive, parents, options})
      )
    )

    return batches.flat()
  }

  const waited = await rateLimit()
  if (options.debug && waited > 1000) {
    const waitingTime = (waited / 1000).toFixed(1)
    console.info(
      `source-google-docs: rate limit reach. waiting ${waitingTime}s`
    )
  }

  const parentQuery =
    parents.length === 1 && parents[0].id === null
      ? false
      : parents.map((p) => `'${p.id}' in parents`).join(" or ")

  const query = {
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    q: `${
      parentQuery ? `(${parentQuery}) and ` : ""
    }(mimeType='${MIME_TYPE_FOLDER}' or mimeType='${MIME_TYPE_DOCUMENT}') and trashed = false`,
    fields: `nextPageToken,files(id, mimeType, name, description, createdTime, modifiedTime, starred, parents)`,
  }

  const res = await drive.files.list(query)

  const collectDocuments = (files) =>
    files
      .filter((file) => file.mimeType === MIME_TYPE_DOCUMENT)
      .map((file) => {
        const parentIds = file.parents && new Set(file.parents)
        const folder = parentIds && parents.find((p) => parentIds.has(p.id))
        return updateFile({folder, file})
      })
      .filter((file) => !file.exclude)
  let documents = collectDocuments(res.data.files)

  const collectParents = (files) => {
    return files
      .filter((file) => file.mimeType === MIME_TYPE_FOLDER)
      .map((folder) => {
        const parentIds = folder.parents && new Set(folder.parents)
        const parent = parentIds && parents.find((p) => parentIds.has(p.id))
        const metadata = getMetadataFromDescription(folder.description)
        const tree = [
          ...parent.tree,
          {
            name: folder.name,
            skip: metadata.skip || false,
          },
        ]

        // we don't want to spread "skip" folder metadata to documents
        if (metadata.skip) {
          delete metadata.skip
        }

        return {
          id: folder.id,
          tree,
          metadata: {
            ...parent.metadata,
            ...metadata,
          },
        }
      })
      .filter((folder) => !folder.exclude)
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

/** @param {import('./constants.js').Options} pluginOptions */
async function fetchFiles({folder, ...options}, auth) {
  const drive = googleDrive({version: "v3", auth})

  const res = await drive.files.get({
    fileId: folder,
    fields: "description",
    supportsAllDrives: true,
  })

  const documentsFiles = await fetchDocumentsFiles({
    drive,
    parents: [
      {
        id: folder,
        tree: [],
        metadata: getMetadataFromDescription(res.data.description),
      },
    ],
    options,
  })

  return documentsFiles
}

export {fetchFiles}
