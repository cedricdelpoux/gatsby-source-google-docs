import {drive_v3} from "googleapis"

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
  markdown: string
  breadcrumb: object[]
}
