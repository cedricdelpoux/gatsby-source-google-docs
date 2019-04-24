const {google} = require("googleapis")
const _kebabCase = require("lodash/kebabCase")

async function fetchFilesInFolder({auth, folderId, fields, fieldsMapper}) {
  return new Promise((resolve, reject) => {
    try {
      const drive = google.drive({version: "v3", auth})
      drive.files.list(
        {
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed = false`,
          fields: `files(id, mimeType, name, description${
            fields ? `, ${fields.join(", ")}` : ""
          })`,
        },
        (err, res) => {
          if (err) {
            return reject(err)
          }

          const files = res.data.files.map(file => {
            // Fields transformation
            if (fieldsMapper) {
              Object.keys(fieldsMapper).forEach(oldKey => {
                const newKey = fieldsMapper[oldKey]
                Object.assign(file, {
                  [newKey]: file[oldKey],
                })
                delete file[oldKey]
              })
            }

            // Transform description into metadata if description is JSON object
            if (file.description) {
              try {
                file = {
                  ...file,
                  ...JSON.parse(file.description),
                }
                delete file.description
              } catch (e) {
                // Description field is not a JSON
                // Do not throw an error if JSON.parse fail
              }
            }

            return file
          })

          resolve(files)
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

async function fetchTree({auth, folderId, fields, fieldsMapper}) {
  return new Promise((resolve, reject) => {
    try {
      const drive = google.drive({version: "v3", auth})
      drive.files.list(
        {
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
          fields: `files(id, mimeType, name, description${
            fields ? `, ${fields.join(", ")}` : ""
          })`,
        },
        async (err, res) => {
          if (err) {
            return reject(err)
          }

          const files = await fetchFilesInFolder({
            auth,
            folderId,
            fields,
            fieldsMapper,
          })

          const folders = await Promise.all(
            res.data.files.map(async folder => {
              const files = await fetchFilesInFolder({
                auth,
                folderId: folder.id,
                fields,
                fieldsMapper,
              })

              const subfolders = await fetchTree({
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
                folders: subfolders,
              }
            })
          )

          resolve([...files, ...folders])
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
            fieldsMapper,
          })

          const flattenGoogleDriveFiles = flattenTree("", googleDriveTree)

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

function flattenTree(path, googleDriveFiles) {
  const files = googleDriveFiles
    .filter(file => file.mimeType === "application/vnd.google-apps.document")
    .map(file => ({...file, path: `${path}/${_kebabCase(file.name)}`}))

  const filesInFolders = googleDriveFiles
    .filter(file => file.mimeType === "application/vnd.google-apps.folder")
    .reduce((acc, folder) => {
      const folderFiles = flattenTree(
        `${path}/${_kebabCase(folder.name)}`,
        folder.folders
      )

      acc.push(...folderFiles)

      return acc
    }, [])

  return [...files, ...filesInFolders]
}

module.exports = {
  fetchGoogleDriveFiles,
}
