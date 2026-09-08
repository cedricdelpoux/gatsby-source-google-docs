const {mkdir, writeFile} = require("fs/promises")
const {dirname, join, relative, sep} = require("path")

const _kebabCase = require("lodash/kebabCase")

const {downloadImage} = require("./download-image")
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
 * Download every image of a document and rewrite the URLs it contains into
 * paths relative to the document file.
 *
 * `gatsby-remark-images` joins the image path with the directory of the file
 * the markdown came from, and `@fileByRelativePath` resolves the cover the same
 * way, so both only need the markdown to hold a correct relative path.
 */
async function writeImages({
  googleDocument,
  markdown,
  outputDir,
  documentPath,
  options,
  reporter,
}) {
  const urls = getImageUrls(googleDocument, markdown)

  if (urls.size === 0) {
    return {markdown, imageFiles: []}
  }

  const slug = googleDocument.properties.slug
  const imagesDirectory = getImagesDirectory(slug)
  const documentDirectory = dirname(join(outputDir, documentPath))
  const imageFiles = []
  let updatedMarkdown = markdown

  let index = 0
  for (const [url, title] of urls) {
    index++

    const name = title
      ? _kebabCase(title)
      : `${_kebabCase(googleDocument.properties.name) || "image"}-${index}`

    try {
      const fileName = await downloadImage({
        url: getImageUrl(url, options),
        directory: join(outputDir, imagesDirectory),
        name,
      })
      const imagePath = join(outputDir, imagesDirectory, fileName)
      const relativePath = toPosix(relative(documentDirectory, imagePath))

      // `split`/`join` rather than `replace`: the URL is a literal, and the
      // same image can be referenced by both the cover and the body.
      updatedMarkdown = updatedMarkdown.split(url).join(relativePath)
      imageFiles.push(imagePath)
    } catch (e) {
      reporter.warn(`source-google-docs: ${e.message}`)
    }
  }

  return {markdown: updatedMarkdown, imageFiles}
}

/**
 * Write every fetched document to `outputDir` and return the files written.
 *
 * The plugin used to keep the markdown in memory on a `GoogleDocs` node. It has
 * to reach the filesystem now: since v4, `gatsby-plugin-mdx` only creates nodes
 * from `File` nodes and compiles them through webpack from their absolute path,
 * so a document that never becomes a file can never become MDX.
 */
async function writeDocuments({googleDocuments, options, reporter}) {
  const outputDir = options.outputDir
  const extension = options.extension
  const writtenFiles = []
  const documents = []
  let imagesCount = 0

  for (const googleDocument of googleDocuments) {
    const documentPath = getDocumentPath(
      googleDocument.properties.slug,
      extension
    )

    let markdown = googleDocument.toMarkdown()

    if (!options.skipImages) {
      const result = await writeImages({
        googleDocument,
        markdown,
        outputDir,
        documentPath,
        options,
        reporter,
      })

      markdown = result.markdown
      imagesCount += result.imageFiles.length
      // Images count as written files too, otherwise the stale-file sweep in
      // `sourceNodes` would delete every one of them right after writing.
      writtenFiles.push(...result.imageFiles)
    }

    const filePath = join(outputDir, documentPath)

    await mkdir(dirname(filePath), {recursive: true})
    await writeFile(filePath, markdown)

    writtenFiles.push(filePath)
    documents.push({filePath, markdown})
  }

  return {writtenFiles, documents, imagesCount}
}

module.exports = {
  writeDocuments,
  getDocumentPath,
  getImagesDirectory,
}
