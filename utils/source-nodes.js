const {readdir, rm} = require("fs/promises")
const {join, resolve} = require("path")

const _merge = require("lodash/merge")
const {createFileNode} = require("gatsby-source-filesystem/create-file-node")

const {fetchDocuments} = require("./google-docs")
const {DEFAULT_OPTIONS} = require("./constants")
const {writeDocuments} = require("./write-documents")

const SOURCE_INSTANCE_NAME = "google-docs"

/** Every file under `outputDir` that this run did not write is stale. */
async function removeStaleFiles({outputDir, writtenFiles}) {
  const kept = new Set(writtenFiles.map((file) => resolve(file)))

  const walk = async (directory) => {
    let entries

    try {
      entries = await readdir(directory, {withFileTypes: true})
    } catch (e) {
      if (e.code === "ENOENT") return true
      throw e
    }

    let empty = true

    for (const entry of entries) {
      const entryPath = join(directory, entry.name)

      if (entry.isDirectory()) {
        const childEmpty = await walk(entryPath)

        if (childEmpty) {
          await rm(entryPath, {recursive: true, force: true})
        } else {
          empty = false
        }
      } else if (kept.has(resolve(entryPath))) {
        empty = false
      } else {
        await rm(entryPath, {force: true})
      }
    }

    return empty
  }

  await walk(outputDir)
}

/** List every file currently living under `outputDir`. */
async function listFiles(directory) {
  let entries

  try {
    entries = await readdir(directory, {withFileTypes: true})
  } catch (e) {
    if (e.code === "ENOENT") return []
    throw e
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name)

      return entry.isDirectory() ? listFiles(entryPath) : [entryPath]
    })
  )

  return files.flat()
}

exports.sourceNodes = async (
  {actions: {createNode}, reporter, cache, createNodeId},
  pluginOptions
) => {
  const options = _merge({}, DEFAULT_OPTIONS, pluginOptions)

  if (!options.folder) {
    if (options.folders && options.folders.length > 0) {
      reporter.warn(
        `source-google-docs: "folders" option will be deprecated in the next version, please use "folder" option instead`
      )
      Object.assign(options, {
        folder: options.folders[0],
      })
    } else {
      reporter.warn(`source-google-docs: Missing "folder" option`)
      return
    }
  }

  try {
    const timer = reporter.activityTimer(`source-google-docs`)
    timer.start()
    timer.setStatus("fetching Google Docs documents")

    const googleDocuments = await fetchDocuments({options, reporter})

    timer.setStatus(`writing documents to "${options.outputDir}"`)

    const {writtenFiles, documents, imagesCount} = await writeDocuments({
      googleDocuments,
      options,
      reporter,
    })

    await removeStaleFiles({outputDir: options.outputDir, writtenFiles})

    // The documents and their images are plain files now, so they are sourced
    // like any other local file. Creating the `File` nodes here rather than
    // asking the user to add a `gatsby-source-filesystem` instance keeps the
    // configuration to a single plugin, and guarantees the nodes exist by the
    // time the transformers run.
    const files = await listFiles(options.outputDir)
    const contents = new Map(
      documents.map(({filePath, markdown}) => [resolve(filePath), markdown])
    )

    for (const file of files) {
      const absolutePath = resolve(file)
      const fileNode = await createFileNode(
        absolutePath,
        createNodeId,
        {name: SOURCE_INSTANCE_NAME, path: resolve(options.outputDir)},
        cache
      )
      const content = contents.get(absolutePath)

      // Gatsby's `loadNodeContent` returns `internal.content` right away when
      // it is a string, and only otherwise asks the plugin that owns the node
      // to read the file. Filling it in here keeps the transformers working
      // without the site having to configure `gatsby-source-filesystem`.
      if (content !== undefined) {
        fileNode.internal.content = content
      }

      createNode(fileNode)
    }

    timer.setStatus(
      `${googleDocuments.length} documents and ${imagesCount} images fetched`
    )

    timer.end()

    return
  } catch (e) {
    if (options.debug) {
      reporter.panic("source-google-docs: ", e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
