const {google} = require("googleapis")
const _kebabCase = require("lodash/kebabCase")
const _cloneDeep = require("lodash/cloneDeep")

const MIME_TYPE_DOCUMENT = "application/vnd.google-apps.document"
const MIME_TYPE_FOLDER = "application/vnd.google-apps.folder"

const enhanceDocument = ({document, fieldsDefault, fieldsMapper}) => {
  const enhancedDocument = _cloneDeep(document)

  // Default values
  if (fieldsDefault) {
    Object.keys(fieldsDefault).forEach(key => {
      Object.assign(enhancedDocument, {
        [key]: fieldsDefault[key],
      })
    })
  }

  // Fields transformation
  if (fieldsMapper) {
    Object.keys(fieldsMapper).forEach(oldKey => {
      const newKey = fieldsMapper[oldKey]

      Object.assign(enhancedDocument, {
        [newKey]: document[oldKey],
      })

      delete enhancedDocument[oldKey]
    })
  }

  // Transform description into metadata if description is JSON object
  if (document.description) {
    try {
      const description = JSON.parse(document.description)

      Object.assign(document, description)

      delete document.description
    } catch (e) {
      // Description field is not a JSON
      // Do not throw an error if JSON.parse fail
    }
  }

  return enhancedDocument
}

async function fetchTree({
  auth,
  folderId,
  fields,
  fieldsDefault,
  fieldsMapper,
}) {
  return new Promise((resolve, reject) => {
    try {
      const drive = google.drive({version: "v3", auth})
      drive.files.list(
        {
          q: `'${folderId}' in parents and (mimeType='${MIME_TYPE_FOLDER}' or mimeType='${MIME_TYPE_DOCUMENT}') and trashed = false`,
          fields: `files(id, mimeType, name, description${
            fields ? `, ${fields.join(", ")}` : ""
          })`,
        },
        async (err, res) => {
          if (err) {
            return reject(err)
          }

          const documents = res.data.files
            .filter(file => file.mimeType === MIME_TYPE_DOCUMENT)
            .map(document =>
              enhanceDocument({document, fieldsDefault, fieldsMapper})
            )

          const folders = await Promise.all(
            res.data.files
              .filter(file => file.mimeType === MIME_TYPE_FOLDER)
              .map(async folder => {
                const files = await fetchTree({
                  auth,
                  folderId: folder.id,
                  fields,
                  fieldsMapper,
                })

                return {
                  id: folder.id,
                  name: folder.name,
                  mimeType: folder.mimeType,
                  files,
                }
              })
          )

          resolve([...documents, ...folders])
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

async function fetchGoogleDriveFiles({
  auth,
  rootFolderIds,
  fields,
  fieldsDefault,
  fieldsMapper,
}) {
  const googleDriveFiles = []

  const requests = await rootFolderIds.map(
    async folderId =>
      new Promise(async (resolve, reject) => {
        try {
          const googleDriveTree = await fetchTree({
            auth,
            folderId,
            fields,
            fieldsDefault,
            fieldsMapper,
          })

          const flattenGoogleDriveFiles = flattenTree({
            path: "",
            files: googleDriveTree,
            fieldsMapper,
          })

          googleDriveFiles.push(...flattenGoogleDriveFiles)

          resolve()
        } catch (e) {
          reject(e)
        }
      })
  )

  await Promise.all(requests)

  return googleDriveFiles
}

function flattenTree({path, files, fieldsMapper}) {
  const documents = files
    .filter(file => file.mimeType === MIME_TYPE_DOCUMENT)
    .map(file => {
      const fileName = fieldsMapper["name"]
        ? file[fieldsMapper["name"]]
        : file.name

      return {...file, path: `${path}/${_kebabCase(fileName)}`}
    })

  const documentsInFolders = files
    .filter(file => file.mimeType === MIME_TYPE_FOLDER)
    .reduce((acc, folder) => {
      const folderFiles = flattenTree({
        path: `${path}/${_kebabCase(folder.name)}`,
        files: folder.files,
        fieldsMapper,
      })

      acc.push(...folderFiles)

      return acc
    }, [])

  return [...documents, ...documentsInFolders]
}

module.exports = {
  fetchGoogleDriveFiles,
}
