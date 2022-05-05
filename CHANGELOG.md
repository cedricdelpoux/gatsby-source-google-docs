# Changelog

## 2.2.0

-   Added

    -   Gatsby v4 support

-   Updated

    -   `createRemoteFileNode` is now called from `sourceNodes` instead of `onCreatedNode`
    -   images are named using the convention "[DOCUMENT_NAME]-[IMAGE_INDEX]" if no title found

-   Removed
    -   depracated MarkdownNodes cover support

## 2.1.0

-   Added
    -   Use images titles for files names
    -   Handle soft lines breaks

## 2.0.0

-   Added

    -   Features:

        -   Gatsby v3 support
        -   Gatsby Cloud support
        -   MDX support
        -   Script `gatsby-source-google-docs-token` for token generation
        -   Crosslinks between documents
        -   Related content
        -   Metadata from YAML Google Drive descriptions

    -   Formats

        -   Underline support
        -   Blockquote support
        -   Superscript support
        -   Subscript support
        -   Code Blocks support
        -   Inline Code support
        -   Footnotes support
        -   Font size support
        -   Foreground color support
        -   Background color support
        -   Horizontal tabulations
        -   Vertical tabulations

    -   Options:

        -   `createPages`
        -   `pageContext`
        -   `demoteHeadings`
        -   `folder`
        -   `keepDefaultStyle`
        -   `imagesOptions`
        -   `skipCodes`
        -   `skipFootnotes`
        -   `skipHeadings`
        -   `skipImages`
        -   `skipLists`
        -   `skipQuotes`
        -   `skipTables`

-   Updated

    -   Breadcrumb is now an array of `{name, path}`

-   Deleted
    -   Options:
        -   `config`
        -   `fieldsMapper`
        -   `fieldsDefault`
        -   `folders`
        -   `updateMetadata`

## 1.14.0

-   Added: tables styling by @justinsunho

## 1.13.0

-   Added: `token` option

## 1.12.0

-   Added: `timeBetweenCalls` option
-   Added: `debug` option

## 1.11.0

-   Added: Transform subtitles to blockquotes
-   Fixed: Remove unwanted spaces before punctuation

## 1.10.0

-   Added: Allow for google doc token env variable by @justinsunho

## 1.9.0

-   Added: `convertImgToNode` config option by @victsant

## 1.8.0

-   Added: Enable team drives by @victsant

## 1.7.0

-   Added: `fieldsDefault` option
-   Updated: Improve Google drive API calls number
-   Updated: Dependencies

## 1.6.1

-   Removed: Automatic `slug` field generation

## 1.6.0

-   Added: Support for Google Drive trees
-   Added: `path` frontmatter with Google Drive tree
-   Added: `slug` field from custom slug or Google Drive path
-   Updated: files structure

## 1.5.0

-   Added: Support for images titles by @dmouse
-   Fixed: Table headers by @dmouse
-   Updated: Jest Snapshot

## 1.4.0

-   Added: Add support for font styles bold, italic, strikethrough by @KyleAMathews

## 1.3.0

-   Added: Snapshot test by @KyleAMathews

## 1.2.0

-   Added: Support for documents extra data using `Google Drive` description field

## 1.1.0

-   Added: Support for nested lists by @horaklukas
-   Added: Support for ordered lists by @horaklukas
-   Added: Support for inlined hypertext links by @horaklukas
-   Fixed: Putting list items into the list they belong to by @horaklukas
-   Fixed: Splitting one line headings or texts into more lines by @horaklukas

## 1.0.1

-   Fixed: Ensure `fields` config is optional by @davidhartsough

## 1.0.0

-   Added: `foldersIds` option
-   Added: `fields` option
-   Added: `fieldsMapper` option
-   Removed: `documents` option
-   Updated: Default permissions to read document from Google Drive folders

## 0.1.0

-   Added: Headings support
-   Added: Texts support
-   Added: Images support
-   Added: Lists support
