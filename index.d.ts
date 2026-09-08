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
  /** h1 -> h2, h2 -> h3, ... */
  demoteHeadings?: boolean
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
