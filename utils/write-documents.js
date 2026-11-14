const {constants} = require("fs")
const {copyFile, mkdir, readFile, rm, stat, writeFile} = require("fs/promises")
const {dirname, extname, join, relative, sep} = require("path")

const {GoogleDocument} = require("google-docs-to-markdown")
const _kebabCase = require("lodash/kebabCase")

const {downloadImage} = require("./download-image")
const {getImageUrl} = require("./get-image-url")

const IMAGES_DIR = "images"

/**
 * Turn a document slug into the path of the file that holds it.
 *
 * The root document ("/") becomes "index.md" so that the tree on disk mirrors
 * the tree of URLs, which is what makes the relative image paths below
 * predictable.
 */
const getDocumentPath = (slug, extension) => {
  const trimmed = String(slug || "").replace(/^\/+|\/+$/g, "")

  return trimmed === "" ? `index.${extension}` : `${trimmed}.${extension}`
}

/**
 * A directory of its own per document, so that two documents using the same
 * image title do not overwrite each other's images.
 *
 * The slug is kept as a path rather than flattened: slugs are unique, so
 * mirroring them guarantees unique directories, where kebab-casing would map
 * both "/foo/bar" and "/foo-bar" onto "foo-bar".
 */
const getImagesDirectory = (slug) => {
  const trimmed = String(slug || "").replace(/^\/+|\/+$/g, "")

  return join(IMAGES_DIR, trimmed === "" ? "index" : trimmed)
}

/** Markdown needs forward slashes, `path.relative` gives back platform ones. */
const toPosix = (path) => path.split(sep).join("/")

/**
 * Download an image at the size of `imagesOptions`, or at its original size
 * when Google does not understand the size parameters added to its URL: their
 * syntax is tied to the shape of the URL, which Google changes from time to
 * time.
 */
const downloadResizedImage = async ({url, options, reporter, ...params}) => {
  const resizedUrl = getImageUrl(url, options)

  if (resizedUrl === url) {
    return downloadImage({url, ...params})
  }

  try {
    return await downloadImage({url: resizedUrl, ...params})
  } catch (e) {
    if (e.status !== 400) throw e

    reporter.warn(
      `source-google-docs: ${e.message}, downloading it at its original size`
    )

    return downloadImage({url, ...params})
  }
}

/**
 * Copy a stored image next to the document referencing it, unless the copy is
 * already there and up to date.
 *
 * `outputDir` holds a copy rather than a link because it is the directory the
 * transformers and `gatsby-plugin-sharp` read, and it is swept clean of what a
 * build did not write. On a site with hundreds of images, copying them all on
 * every build costs more than looking at them first.
 */
const copyImage = async (source, destination) => {
  const [sourceStats, destinationStats] = await Promise.all([
    stat(source),
    stat(destination).catch((e) => {
      if (e.code === "ENOENT") return null

      throw e
    }),
  ])

  if (
    destinationStats &&
    destinationStats.size === sourceStats.size &&
    destinationStats.mtimeMs >= sourceStats.mtimeMs
  ) {
    return
  }

  await mkdir(dirname(destination), {recursive: true})
  // Copy on write where the filesystem does it, a plain copy everywhere else
  await copyFile(source, destination, constants.COPYFILE_FICLONE)
}

/**
 * Write a document, unless the same one is already there.
 *
 * `gatsby-source-filesystem` hashes a file again as soon as its modification
 * time moves, and Gatsby reprocesses everything downstream of the `File` node
 * when the hash it ends up with is a new one. A document that did not change
 * has no reason to go through any of it.
 */
const writeIfChanged = async (filePath, content) => {
  try {
    if ((await readFile(filePath, "utf8")) === content) return
  } catch (e) {
    if (e.code !== "ENOENT") throw e
  }

  await mkdir(dirname(filePath), {recursive: true})
  await writeFile(filePath, content)
}

/**
 * Download every image of a document, then rewrite the URLs it contains into
 * paths relative to the document file.
 *
 * `gatsby-remark-images` joins the image path with the directory of the file
 * the markdown came from, and `@fileByRelativePath` resolves the cover the same
 * way, so both only need the markdown to hold a correct relative path.
 *
 * Images are downloaded to the store, under the id of the object holding them,
 * and copied from there: it is what makes a second build on a document full of
 * images cost nothing.
 */
async function writeImages({
  googleDocument,
  fromStore,
  markdown,
  outputDir,
  documentPath,
  options,
  reporter,
  store,
  refetchDocument,
}) {
  const {images} = googleDocument

  if (images.length === 0) {
    return {markdown, imageFiles: [], downloadedCount: 0}
  }

  const documentId = googleDocument.frontmatter.id
  const imagesDirectory = getImagesDirectory(googleDocument.frontmatter.slug)
  const documentDirectory = dirname(join(outputDir, documentPath))
  const storeDirectory = store.imagesDirectory(documentId)
  const storedImages = await store.readImages(documentId)
  const imageFiles = []
  const usedImageIds = new Set()
  let updatedMarkdown = markdown
  let downloadedCount = 0
  let freshUrlsById

  /**
   * A document served from the store carries the URLs of the fetch that
   * produced it, and Google expires them within hours: an image missing from
   * the store cannot be downloaded from them, the document has to be fetched
   * again to get URLs that still work. The ids of the images do not change, so
   * they map the stored images to their fresh URLs.
   */
  const getDownloadUrl = async ({id, url}) => {
    if (!fromStore) return url

    if (!freshUrlsById) {
      freshUrlsById = refetchDocument(documentId).then(
        (document) =>
          new Map(
            new GoogleDocument(document).images.map((image) => [
              image.id,
              image.url,
            ])
          )
      )
    }

    return (await freshUrlsById).get(id) || url
  }

  for (const [index, image] of images.entries()) {
    const {id: imageId, url, title} = image
    const name = title
      ? _kebabCase(title)
      : `${_kebabCase(googleDocument.frontmatter.name) || "image"}-${index + 1}`

    usedImageIds.add(imageId)

    try {
      let fileName = storedImages.get(imageId)

      if (!fileName) {
        fileName = await downloadResizedImage({
          url: await getDownloadUrl(image),
          options,
          reporter,
          directory: storeDirectory,
          name: imageId,
        })
        storedImages.set(imageId, fileName)
        downloadedCount++
      }

      const imagePath = join(
        outputDir,
        imagesDirectory,
        `${name}${extname(fileName)}`
      )

      await copyImage(join(storeDirectory, fileName), imagePath)

      const relativePath = toPosix(relative(documentDirectory, imagePath))

      // `split`/`join` rather than `replace`: the URL is a literal, and the
      // same image can be referenced by both the cover and the body.
      updatedMarkdown = updatedMarkdown.split(url).join(relativePath)
      imageFiles.push(imagePath)
    } catch (e) {
      reporter.warn(`source-google-docs: ${e.message}`)
    }
  }

  // An image replaced in a document leaves the one it replaced behind, and the
  // store would grow forever. Only once every image of the document made it,
  // so that a download that failed never costs one that was already there.
  if (imageFiles.length === images.length) {
    for (const [imageId, fileName] of storedImages) {
      if (!usedImageIds.has(imageId)) {
        await rm(join(storeDirectory, fileName), {force: true})
      }
    }
  }

  return {markdown: updatedMarkdown, imageFiles, downloadedCount}
}

/**
 * Write every fetched document to `outputDir` and return the files written.
 *
 * The plugin used to keep the markdown in memory on a `GoogleDocs` node. It has
 * to reach the filesystem now: since v4, `gatsby-plugin-mdx` only creates nodes
 * from `File` nodes and compiles them through webpack from their absolute path,
 * so a document that never becomes a file can never become MDX.
 */
async function writeDocuments({
  documents: googleDocuments,
  options,
  reporter,
  store,
  refetchDocument,
}) {
  const outputDir = options.outputDir
  const extension = options.extension
  const writtenFiles = []
  const documents = []
  let imagesCount = 0
  let downloadedImagesCount = 0

  for (const {googleDocument, fromStore} of googleDocuments) {
    const documentPath = getDocumentPath(
      googleDocument.frontmatter.slug,
      extension
    )

    let markdown = googleDocument.toMarkdown()

    if (!options.skipImages) {
      const result = await writeImages({
        googleDocument,
        fromStore,
        markdown,
        outputDir,
        documentPath,
        options,
        reporter,
        store,
        refetchDocument,
      })

      markdown = result.markdown
      imagesCount += result.imageFiles.length
      downloadedImagesCount += result.downloadedCount
      // Images count as written files too, otherwise the stale-file sweep in
      // `sourceNodes` would delete every one of them right after writing.
      writtenFiles.push(...result.imageFiles)
    }

    const filePath = join(outputDir, documentPath)

    await writeIfChanged(filePath, markdown)

    writtenFiles.push(filePath)
    documents.push({filePath, markdown})
  }

  return {writtenFiles, documents, imagesCount, downloadedImagesCount}
}

module.exports = {
  writeDocuments,
  getDocumentPath,
  getImagesDirectory,
}
