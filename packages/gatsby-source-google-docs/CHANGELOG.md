# Changelog

## 3.1.1

### Patch Changes

- cc60ae0: Source the documents with the new `google-docs-sync` package. The options, the output and the `gatsby-source-google-docs-token` command do not change.
- Updated dependencies [cc60ae0]
- Updated dependencies [cc60ae0]
  - google-docs-sync@0.1.0
  - google-docs-to-markdown@2.0.0

## 3.1.0

- Fixed

  - Images are downloaded again: Google now serves them from `docs.google.com/docs-images-rt` URLs, which the plugin did not recognize
  - An image Google cannot resize to `imagesOptions` is downloaded at its original size instead of not at all
  - The descriptions are read with [yaml](https://eemeli.org/yaml/) instead of yamljs, which could not read some valid YAML and dropped their metadata. A description that is not valid YAML is now reported instead of ignored silently.
  - An image whose URL expired before it was downloaded is downloaded again from a fresh URL. Google expires them a few minutes after a document is fetched, so most of the images of a large site failed with "403 Forbidden".
  - A folder with `exclude: true` is no longer walked through, which saves a listing of every folder it holds
  - A description written as a YAML list is ignored instead of becoming metadata named "0", "1", ...

- Updated

  - The conversion to Markdown and the Google authentication live in [google-docs-to-markdown](https://github.com/cedricdelpoux/google-docs-to-markdown), so they can be used without Gatsby. The output and the `.env` variables are the same.
  - Node 22.12 or later and Gatsby 5.3 or later are required: the plugin is an ES module, which Gatsby loads from `gatsby-node.mjs`
  - One Google client is used for the whole build, so the access token is refreshed once instead of once per document
  - Images are downloaded 8 at a time instead of one after the other
  - The types of the options are generated from the code
  - A date written in a description, like `date: 2023-12-31`, stays as written instead of becoming midnight UTC. Gatsby still reads it as a date.

## 3.0.0

Documents are no longer kept in memory as `GoogleDocs` nodes: they are written
to the filesystem and picked up by `gatsby-transformer-remark` or
`gatsby-plugin-mdx`. See [Migrating from v2](./README.md#migrating-from-v2) to
update your queries.

- Added

  - Gatsby 5 support
  - MDX works again, with `gatsby-plugin-mdx` v5 (`remark-gfm` is required)
  - Documents are written under `outputDir`, with their images next to them, and the `File` nodes are created by the plugin itself
  - Only what changed on Google Drive is fetched: documents and images are kept in `cacheDir` between builds
  - Options:

    - `outputDir`
    - `cacheDir`
    - `extension`
    - `escapeMdxSyntax`

- Updated

  - Node 22 or 24 is required (Node 25 is not supported), and `gatsby@^5` is a peer dependency
  - Document data now travels as `frontmatter` on the `MarkdownRemark`/`Mdx` node
  - `allGoogleDocs` becomes `allMarkdownRemark` (or `allMdx`), shared with any other markdown the site sources
  - `related` is a list of document ids instead of linked nodes, and a document linked several times is no longer repeated in it

- Removed
  - The `GoogleDocs` node type

## 2.4.10

- Fixed: Build freezing indefinitely on texts containing exotic whitespaces (U+00A0, U+2028, ...)
- Fixed: Images inside table cells being pushed outside the table
- Fixed: Unclear error when `GOOGLE_DOCS_TOKEN` is not valid JSON

## 2.2.0

- Added

  - Gatsby v4 support

- Updated

  - `createRemoteFileNode` is now called from `sourceNodes` instead of `onCreatedNode`
  - images are named using the convention "[DOCUMENT_NAME]-[IMAGE_INDEX]" if no title found

- Removed
  - depracated MarkdownNodes cover support

## 2.1.0

- Added
  - Use images titles for files names
  - Handle soft lines breaks

## 2.0.0

- Added

  - Features:

    - Gatsby v3 support
    - Gatsby Cloud support
    - MDX support
    - Script `gatsby-source-google-docs-token` for token generation
    - Crosslinks between documents
    - Related content
    - Metadata from YAML Google Drive descriptions

  - Formats

    - Underline support
    - Blockquote support
    - Superscript support
    - Subscript support
    - Code Blocks support
    - Inline Code support
    - Footnotes support
    - Font size support
    - Foreground color support
    - Background color support
    - Horizontal tabulations
    - Vertical tabulations

  - Options:

    - `createPages`
    - `pageContext`
    - `demoteHeadings`
    - `folder`
    - `keepDefaultStyle`
    - `imagesOptions`
    - `skipCodes`
    - `skipFootnotes`
    - `skipHeadings`
    - `skipImages`
    - `skipLists`
    - `skipQuotes`
    - `skipTables`

- Updated

  - Breadcrumb is now an array of `{name, path}`

- Deleted
  - Options:
    - `config`
    - `fieldsMapper`
    - `fieldsDefault`
    - `folders`
    - `updateMetadata`

## 1.14.0

- Added: tables styling by @justinsunho

## 1.13.0

- Added: `token` option

## 1.12.0

- Added: `timeBetweenCalls` option
- Added: `debug` option

## 1.11.0

- Added: Transform subtitles to blockquotes
- Fixed: Remove unwanted spaces before punctuation

## 1.10.0

- Added: Allow for google doc token env variable by @justinsunho

## 1.9.0

- Added: `convertImgToNode` config option by @victsant

## 1.8.0

- Added: Enable team drives by @victsant

## 1.7.0

- Added: `fieldsDefault` option
- Updated: Improve Google drive API calls number
- Updated: Dependencies

## 1.6.1

- Removed: Automatic `slug` field generation

## 1.6.0

- Added: Support for Google Drive trees
- Added: `path` frontmatter with Google Drive tree
- Added: `slug` field from custom slug or Google Drive path
- Updated: files structure

## 1.5.0

- Added: Support for images titles by @dmouse
- Fixed: Table headers by @dmouse
- Updated: Jest Snapshot

## 1.4.0

- Added: Add support for font styles bold, italic, strikethrough by @KyleAMathews

## 1.3.0

- Added: Snapshot test by @KyleAMathews

## 1.2.0

- Added: Support for documents extra data using `Google Drive` description field

## 1.1.0

- Added: Support for nested lists by @horaklukas
- Added: Support for ordered lists by @horaklukas
- Added: Support for inlined hypertext links by @horaklukas
- Fixed: Putting list items into the list they belong to by @horaklukas
- Fixed: Splitting one line headings or texts into more lines by @horaklukas

## 1.0.1

- Fixed: Ensure `fields` config is optional by @davidhartsough

## 1.0.0

- Added: `foldersIds` option
- Added: `fields` option
- Added: `fieldsMapper` option
- Removed: `documents` option
- Updated: Default permissions to read document from Google Drive folders

## 0.1.0

- Added: Headings support
- Added: Texts support
- Added: Images support
- Added: Lists support
