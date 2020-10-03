const {google} = require("googleapis")
const _kebabCase = require("lodash/kebabCase")
const GoogleOAuth2 = require("google-oauth2-env-vars")

const {ENV_TOKEN_VAR} = require("./constants")
const {convertYamlToObject} = require("./converters")

const MIME_TYPE_DOCUMENT = "application/vnd.google-apps.document"
const MIME_TYPE_FOLDER = "application/vnd.google-apps.folder"

/**
 * @param {object} options
 * @param {Partial<import('..').Metadata>} options.metadata
 * @param {Record<string, unknown>=} options.fieldsDefault
 * @param {Record<string, string>=} options.fieldsMapper
 */
const updateMetadata = ({metadata, fieldsDefault = {}, fieldsMapper = {}}) => {
  const breadcrumb = metadata.path
    .split("/")
    // Remove empty strings
    .filter((element) => element)

  if (metadata.name === "index" && breadcrumb.length > 0) {
    // Remove "index"
    breadcrumb.pop()
    // Remove folder name and use it as name
    metadata.name = breadcrumb.pop()
    // Path need to be updated
    metadata.path =
      breadcrumb.length > 0
        ? `/${breadcrumb.join("/")}/${metadata.name}`
        : `/${metadata.name}`
  }

  // Default values
  Object.keys(fieldsDefault).forEach((key) => {
    Object.assign(metadata, {
      [key]: fieldsDefault[key],
    })
  })

  // Fields transformation
  Object.keys(fieldsMapper).forEach((oldKey) => {
    const newKey = fieldsMapper[oldKey]

    Object.assign(metadata, {
      [newKey]: metadata[oldKey],
    })

    delete metadata[oldKey]
  })

  // Transform description into metadata if description is YAML
  if (metadata.description) {
    try {
      // Try to convert description from YAML
      const descriptionObject = convertYamlToObject(metadata.description)
      metadata = {...metadata, ...descriptionObject}
    } catch (e) {
      // Description field is not valid YAML
      // Do not throw an error
    }
  }

  return {...metadata, breadcrumb}
}

/**
 * @typedef FetchTreeOptions
 * @property {string[]} breadcrumb
 * @property {string} folderId
 */

/**
 * @param {import('..').Options & FetchTreeOptions} options
 * @returns {Promise<import('..').FileOrFolder[]>}
 */
async function fetchTree({
  debug,
  breadcrumb,
  folderId,
  fields,
  ignoredFolders = [],
}) {
  const googleOAuth2 = new GoogleOAuth2({
    token: ENV_TOKEN_VAR,
  })
  const auth = await googleOAuth2.getAuth()

  const res = await google.drive({version: "v3", auth}).files.list({
    includeTeamDriveItems: true,
    supportsAllDrives: true,
    q: `${
      folderId ? `'${folderId}' in parents and ` : ""
    }(mimeType='${MIME_TYPE_FOLDER}' or mimeType='${MIME_TYPE_DOCUMENT}') and trashed = false`,
    fields: `files(id, mimeType, name, description, createdTime, modifiedTime, starred${
      fields ? `, ${fields.join(", ")}` : ""
    })`,
  })

  const documents = res.data.files.filter(
    (file) => file.mimeType === MIME_TYPE_DOCUMENT
  )
  const rawFolders = res.data.files.filter(
    (file) => file.mimeType === MIME_TYPE_FOLDER
  )

  let folders = []
  for (const folder of rawFolders) {
    if (
      folder.name.toLowerCase() === "drafts" ||
      ignoredFolders.includes(folder.name) ||
      ignoredFolders.includes(folder.id)
    ) {
      continue
    }

    if (debug) {
      const breadCrumbString =
        breadcrumb.length > 0 ? breadcrumb.join("/") + "/" : ""
      // eslint-disable-next-line no-console
      console.info(
        `source-google-docs: Fetching ${breadCrumbString}${folder.name}`
      )
    }

    const files = await fetchTree({
      debug,
      breadcrumb: [...breadcrumb, folder.name],
      folderId: folder.id,
      fields,
      ignoredFolders,
    })

    folders.push({
      id: folder.id,
      name: folder.name,
      mimeType: folder.mimeType,
      files,
    })
  }

  return [...documents, ...folders]
}

/** @param {import('..').Options} pluginOptions */
async function fetchGoogleDriveDocuments({folders = [null], ...options}) {
  let googleDriveDocuments = []

  await Promise.all(
    folders.map(async (folderId) => {
      const googleDriveTree = await fetchTree({
        breadcrumb: [],
        folderId,
        ...options,
      })

      const flattenGoogleDriveDocuments = flattenTree({
        path: "",
        files: googleDriveTree,
      })

      googleDriveDocuments.push(...flattenGoogleDriveDocuments)
    })
  )

  googleDriveDocuments = googleDriveDocuments.map((metadata) => {
    let updatedMetadata = updateMetadata({metadata, ...options})

    if (
      options.updateMetadata &&
      typeof options.updateMetadata === "function"
    ) {
      updatedMetadata = options.updateMetadata(updatedMetadata)
    }

    return updatedMetadata
  })

  return googleDriveDocuments
}

/**
 * @param {object} options
 * @param {string} options.path
 * @param {import('..').FileOrFolder[]} options.files
 * @returns {import('googleapis').drive_v3.Schema$File[]} Array of files
 */
function flattenTree({path, files}) {
  const documents = files
    .filter((file) => file.mimeType === MIME_TYPE_DOCUMENT)
    .map((file) => ({...file, path: `${path}/${_kebabCase(file.name)}`}))

  const documentsInFolders = files
    .filter(
      /** @returns {file is import('..').Folder} */
      (file) => file.mimeType === MIME_TYPE_FOLDER
    )
    .reduce((acc, folder) => {
      const folderFiles = flattenTree({
        path: `${path}/${_kebabCase(folder.name)}`,
        files: folder.files,
      })

      acc.push(...folderFiles)

      return acc
    }, [])

  return [...documents, ...documentsInFolders]
}

module.exports = {
  fetchGoogleDriveDocuments,
}
