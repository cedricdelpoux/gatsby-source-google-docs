/**
 * @typedef {object} PluginOptions
 * @property {string} folder The id of the Google Drive folder, found in its URL: https://drive.google.com/drive/folders/FOLDER_ID
 * @property {boolean} [createPages] Create a page for every document
 * @property {string} [outputDir] Directory the documents and their images are written to, "content/google-docs" by default. The plugin manages it: any other file it contains is deleted.
 * @property {string} [cacheDir] Directory the documents and images fetched from Google are kept in between builds, ".google-docs" by default. Delete it to fetch everything again.
 * @property {"md" | "mdx"} [extension] Extension of the written files, "md" by default. Use "mdx" to author documents as MDX.
 * @property {boolean} [escapeMdxSyntax] Escape the "<" and "{" of the text, on which MDX fails, `true` by default. Set it to `false` only if the documents deliberately write live components as text. Ignored when `extension` is not "mdx".
 * @property {boolean} [demoteHeadings] h1 -> h2, h2 -> h3, ..., `true` by default
 * @property {string[]} [pageContext] Metadata fields to forward to the context of the created pages, on top of the ones the plugin always provides
 * @property {{width?: number, height?: number, crop?: boolean}} [imagesOptions] Size the images are downloaded at, between 1 and 16383. Changing it downloads them again.
 * @property {boolean} [debug] Report the progress of every step
 */

/**
 * @typedef {PluginOptions & Omit<import("google-docs-to-markdown").Options, "mdx" | "frontmatter" | "links" | "escapeMdxSyntax" | "demoteHeadings">} Options
 */

export const DEFAULT_OPTIONS = {
  createPages: false,
  // Documents are written as real files: `gatsby-plugin-mdx` v4+ only reads
  // MDX from the filesystem, and `gatsby-remark-images` resolves image paths
  // relative to the directory of the file the markdown came from.
  outputDir: "content/google-docs",
  // The documents and images fetched from Google, kept between builds so
  // that only what changed is fetched again
  cacheDir: ".google-docs",
  extension: "md",
  debug: false,
  demoteHeadings: true,
  folder: undefined,
  imagesOptions: undefined,
  pageContext: [],
}

export const DEFAULT_TEMPLATE = "page"
