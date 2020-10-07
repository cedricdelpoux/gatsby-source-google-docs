import { drive_v3 } from 'googleapis';

export interface Options {
  //---
  // All the following options are OPTIONAL
  //---
  /**
   * To fetch only documents to specific folders
   * folders Ids can be found in Google Drive URLs
   * https://drive.google.com/drive/folders/FOLDER_ID
   */
  folders?: string[]

  /** h1 -> h2, h2 -> h3, ... */
  demoteHeadings?: boolean,
  /**
   * You could need to fetch additional documents fields to your nodes
   * All available options: https://developers.google.com/drive/api/v3/reference/files#resource
   */
  fields?: string[],
  /**
   * To rename fields
   * Be careful, some documentation instructions could be different
   */
  fieldsMapper?: Record<string, string>,
  /**
   * To add default fields values
   */
  fieldsDefault?: Record<string, unknown>,
  /**
   * To ignore some folder in the tree
   * It can be folder names or IDs
   */
  ignoredFolders?: string[]
  /**
   * Compute extra data for each document
   */
  updateMetadata?: (metadata: any) => any
  /**
   * For a better stack trace and more information
   * Usefull when you open a issue to report a bug
   */
  debug?: boolean,
}

export interface DocumentFile extends drive_v3.Schema$File {
  mimeType: "application/vnd.google-apps.document";
}

export interface RawFolder extends drive_v3.Schema$File {
  mimeType: "application/vnd.google-apps.folder";
}

export interface Metadata extends DocumentFile {
  id?: DocumentFile['id'];
  /** The filename, like path.basename(filepath) */
  name: string;
  path: string;
  description?: string | object;
  content: any[];
  cover: {
      image: any;
      title: any;
      alt: any;
  };
  markdown: string;
  breadcrumb: string[];
}
