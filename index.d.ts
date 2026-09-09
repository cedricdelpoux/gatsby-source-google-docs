import {drive_v3} from "@googleapis/drive"

export interface Options {
  /**
   * folder ID can be found in Google Drive URLs
   * https://drive.google.com/drive/folders/FOLDER_ID
   */
  folder: string
  //
  //---
  // All the following options are OPTIONAL
  //---
  //
  /**
   * To add default fields values
   */
  createPages?: boolean
  /**
   * Directory the documents and their images are written to.
   * It is managed by the plugin: any other file it contains is deleted.
   * @default "content/google-docs"
   */
  outputDir?: string
  /**
   * Directory the documents fetched from Google and the images they reference
   * are kept in, so that a build only fetches what changed since the previous
   * one. Delete it to fetch everything again.
   * @default ".google-docs"
   */
  cacheDir?: string
  /**
   * Extension of the written files. Use "mdx" to author documents as MDX.
   * @default "md"
   */
  extension?: "md" | "mdx"
  /**
   * MDX v2 fails the whole build on a stray, unmatched "<" or "{" in any
   * document's text (a "<placeholder>" convention, a generic "<T>", ...).
   * Set to `false` only if every document on the site deliberately embeds
   * live JSX/components as literal text and is free of such characters
   * otherwise. Ignored when `extension` is not "mdx".
   * @default true
   */
  escapeMdxSyntax?: boolean
  /**
   * Metadata fields to forward to the context of the created pages,
   * on top of the ones the plugin always provides.
   * Ignored when `createPages` is not `true`.
   * @default []
   */
  pageContext?: string[]
  /** h1 -> h2, h2 -> h3, ... */
  demoteHeadings?: boolean
  /**
   * Size the images are downloaded at. Changing it downloads them again,
   * since the size is part of the URL they are fetched from.
   */
  imagesOptions?: {
    /** Between 1 and 16383 */
    width?: number
    /** Between 1 and 16383 */
    height?: number
    /** Crop the image to the given `width` and `height` instead of fitting it */
    crop?: boolean
  }
  /** Keep the bold, italic, underline, ... of the Google Docs default style */
  keepDefaultStyle?: boolean
  skipCodes?: boolean
  skipFootnotes?: boolean
  skipHeadings?: boolean
  skipImages?: boolean
  skipLists?: boolean
  skipQuotes?: boolean
  skipTables?: boolean
  /**
   * To exclude some folder in the tree
   * It can be folder names or IDs
   */
  exclude?: string[]
  /**
   * For a better stack trace and more information
   * Usefull when you open a issue to report a bug
   */
  debug?: boolean
}

export interface DocumentFile extends drive_v3.Schema$File {
  mimeType: "application/vnd.google-apps.document"
}

export interface RawFolder extends drive_v3.Schema$File {
  mimeType: "application/vnd.google-apps.folder"
}

export interface Metadata extends DocumentFile {
  id?: DocumentFile["id"]
  name: string
  slug: string
  path: string
  description?: string | object
  cover: {
    image: any
    title: any
    alt: any
  }
  breadcrumb: object[]
}
