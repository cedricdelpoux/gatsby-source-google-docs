/**
 * @typedef {object} Logger
 * @property {(message: string) => void} info
 * @property {(message: string) => void} warn
 * @property {(message: string) => void} error
 */

/**
 * @typedef {object} SyncOptions
 * @property {string} folder The id of the Google Drive folder, found in its URL: https://drive.google.com/drive/folders/FOLDER_ID
 * @property {string} [outputDir] Directory the documents and their images are written to, "content/google-docs" by default. It is managed by the sync: any other file it contains is deleted.
 * @property {string} [cacheDir] Directory the documents and images fetched from Google are kept in between syncs, ".google-docs" by default. Delete it to fetch everything again.
 * @property {"md" | "mdx"} [extension] Extension of the written files, "md" by default. Use "mdx" to author documents as MDX.
 * @property {{width?: number, height?: number, crop?: boolean}} [imagesOptions] Size the images are downloaded at, between 1 and 16383. Changing it downloads them again.
 * @property {boolean} [debug] Log the progress of every step
 * @property {import("google-auth-library").OAuth2Client} [auth] Google client, built from the environment variables by default
 * @property {Logger} [logger] Receives the messages of the sync, `console` by default
 */

/**
 * @typedef {SyncOptions & Omit<import("google-docs-to-markdown").Options, "mdx" | "frontmatter" | "links">} Options
 */

export const DEFAULT_OPTIONS = {
  outputDir: "content/google-docs",
  cacheDir: ".google-docs",
  extension: "md",
  debug: false,
  demoteHeadings: true,
}
