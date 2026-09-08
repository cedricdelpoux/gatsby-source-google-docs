const {constants} = require("fs")
const {copyFile, mkdir, readFile, rm, stat, writeFile} = require("fs/promises")
const {dirname, extname, join, relative, sep} = require("path")

const _kebabCase = require("lodash/kebabCase")

const {downloadImage} = require("./download-image")
const {getImageIdsByUrl} = require("./document-images")
const {getImageUrl} = require("./get-image-url")

const IMAGE_URL_REGEX =
  /https:\/\/[a-z0-9-]*\.googleusercontent\.com\/(?:docsz?\/)?[a-zA-Z0-9-_=]*[?]key=[a-zA-Z0-9-_]*/g
const MD_IMAGE_REGEX = new RegExp(`(${IMAGE_URL_REGEX.source}) "([^)]*)"`, "g")

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
 * Collect every Google image URL referenced by a document: the cover, which
 * lives in the frontmatter, and the inline images of the body.
 */
const getImageUrls = (googleDocument, markdown) => {
  const urls = new Map()

  if (googleDocument.cover && googleDocument.cover.image) {
    urls.set(googleDocument.cover.image, googleDocument.cover.title || "")
  }

  for (const [, url, title] of markdown.matchAll(MD_IMAGE_REGEX)) {
    if (!urls.has(url)) {
      urls.set(url, title || "")
    }
  }

  return urls
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
  const urls = getImageUrls(googleDocument, markdown)

  if (urls.size === 0) {
    return {markdown, imageFiles: [], downloadedCount: 0}
  }

  const documentId = googleDocument.properties.id
  const slug = googleDocument.properties.slug
  const imagesDirectory = getImagesDirectory(slug)
  const documentDirectory = dirname(join(outputDir, documentPath))
  const storeDirectory = store.imagesDirectory(documentId)
  const imageIdsByUrl = getImageIdsByUrl(googleDocument.document)
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
   * again to get URLs that still work. Only the URLs change, the markdown is
   * the same, so it does not have to be converted again.
   */
  const getDownloadUrl = async (url, imageId) => {
    if (!fromStore) return url

    if (!freshUrlsById) {
      freshUrlsById = refetchDocument(documentId).then((document) => {
        const idsByUrl = getImageIdsByUrl(document)

        return new Map(Array.from(idsByUrl, ([freshUrl, id]) => [id, freshUrl]))
      })
    }

    return (await freshUrlsById).get(imageId) || url
  }

  let index = 0
  for (const [url, title] of urls) {
    index++

    const name = title
      ? _kebabCase(title)
      : `${_kebabCase(googleDocument.properties.name) || "image"}-${index}`
    // An image Google does not list among the inline objects of the document
    // has no id to be stored under: the name it takes in `outputDir` does
    const imageId = imageIdsByUrl.get(url) || name

    usedImageIds.add(imageId)

    try {
      let fileName = storedImages.get(imageId)

      if (!fileName) {
        fileName = await downloadImage({
          url: getImageUrl(await getDownloadUrl(url, imageId), options),
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
  if (imageFiles.length === urls.size) {
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
      googleDocument.properties.slug,
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
