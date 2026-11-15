import {constants} from "node:fs"
import {copyFile, mkdir, readFile, rm, stat, writeFile} from "node:fs/promises"
import {dirname, extname, join, relative, sep} from "node:path"

import {GoogleDocument} from "google-docs-to-markdown"
import _kebabCase from "lodash/kebabCase.js"
import _sumBy from "lodash/sumBy.js"

import {createLimit} from "./create-limit.js"
import {downloadImage} from "./download-image.js"
import {getImageUrl} from "./get-image-url.js"

const IMAGES_DIR = "images"
const MAX_PARALLEL_DOWNLOADS = 8

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
const downloadResizedImage = async ({
  url,
  options,
  reporter,
  directory,
  name,
}) => {
  const resizedUrl = getImageUrl(url, options)

  if (resizedUrl === url) {
    return downloadImage({url, directory, name})
  }

  try {
    return await downloadImage({url: resizedUrl, directory, name})
  } catch (e) {
    if (e.status !== 400) throw e

    reporter.warn(
      `source-google-docs: ${e.message}, downloading it at its original size`
    )

    return downloadImage({url, directory, name})
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
  limit,
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
  const usedImageIds = new Set(images.map(({id}) => id))
  let updatedMarkdown = markdown
  let downloadedCount = 0
  let freshUrlsById

  /**
   * Google expires the image URLs a few minutes after a document is fetched,
   * and fetching it again gives fresh URLs under the same image ids.
   */
  const getFreshUrl = async ({id, url}) => {
    freshUrlsById ??= refetchDocument(documentId).then(
      (document) =>
        new Map(
          new GoogleDocument(document).images.map((image) => [
            image.id,
            image.url,
          ])
        )
    )

    return (await freshUrlsById).get(id) || url
  }

  const download = (image, url) =>
    downloadResizedImage({
      url,
      options,
      reporter,
      directory: storeDirectory,
      name: image.id,
    })

  const downloadToStore = async (image) => {
    if (fromStore) return download(image, await getFreshUrl(image))

    try {
      return await download(image, image.url)
    } catch (e) {
      const isExpired = e.status === 403

      if (!isExpired) throw e

      return download(image, await getFreshUrl(image))
    }
  }

  const fileNames = await Promise.all(
    images.map(async (image) => {
      const storedFileName = storedImages.get(image.id)

      if (storedFileName) return storedFileName

      try {
        const fileName = await limit(() => downloadToStore(image))

        downloadedCount++

        return fileName
      } catch (e) {
        reporter.warn(`source-google-docs: ${e.message}`)

        return null
      }
    })
  )

  for (const [index, image] of images.entries()) {
    const fileName = fileNames[index]

    if (!fileName) continue

    const {url, title} = image
    const name = title
      ? _kebabCase(title)
      : `${_kebabCase(googleDocument.frontmatter.name) || "image"}-${index + 1}`

    try {
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
  const limit = createLimit(MAX_PARALLEL_DOWNLOADS)

  const results = await Promise.all(
    googleDocuments.map(async ({googleDocument, fromStore}) => {
      const documentPath = getDocumentPath(
        googleDocument.frontmatter.slug,
        extension
      )
      const filePath = join(outputDir, documentPath)
      let markdown = googleDocument.toMarkdown()
      let writtenImages = {imageFiles: [], downloadedCount: 0}

      if (!options.skipImages) {
        writtenImages = await writeImages({
          googleDocument,
          fromStore,
          markdown,
          outputDir,
          documentPath,
          options,
          reporter,
          store,
          refetchDocument,
          limit,
        })
        markdown = writtenImages.markdown
      }

      await writeIfChanged(filePath, markdown)

      return {filePath, markdown, ...writtenImages}
    })
  )

  return {
    // Images count as written files too, otherwise the stale-file sweep in
    // `sourceNodes` would delete every one of them right after writing.
    writtenFiles: results.flatMap(({filePath, imageFiles}) => [
      ...imageFiles,
      filePath,
    ]),
    documents: results.map(({filePath, markdown}) => ({filePath, markdown})),
    imagesCount: _sumBy(results, ({imageFiles}) => imageFiles.length),
    downloadedImagesCount: _sumBy(results, "downloadedCount"),
  }
}

export {writeDocuments, getDocumentPath, getImagesDirectory}
