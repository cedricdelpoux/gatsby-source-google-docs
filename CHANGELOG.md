# Changelog

## 2.0.0 (2021-01-01)

-   Added

    -   Features:

        -   Script `gatsby-source-google-docs-token` for token generation
        -   Gatsby Cloud compatibility
        -   Crosslinks between documents
        -   Related content
        -   Metadata from YAML Google Drive descriptions
        -   Shared drives support

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

## 1.14.0 (2019-09-16)

-   Added: tables styling by @justinsunho

## 1.13.0 (2019-07-26)

-   Added: `token` option

## 1.12.0 (2019-07-25)

-   Added: `timeBetweenCalls` option
-   Added: `debug` option

## 1.11.0 (2019-07-01)

-   Added: Transform subtitles to blockquotes
-   Fixed: Remove unwanted spaces before punctuation

## 1.10.0 (2019-07-01)

-   Added: Allow for google doc token env variable by @justinsunho

## 1.9.0 (2019-06-10)

-   Added: `convertImgToNode` config option by @victsant

## 1.8.0 (2019-05-27)

-   Added: Enable team drives by @victsant

## 1.7.0 (2019-04-26)

-   Added: `fieldsDefault` option
-   Updated: Improve Google drive API calls number
-   Updated: Dependencies

## 1.6.1 (2019-04-25)

-   Removed: Automatic `slug` field generation

## 1.6.0 (2019-04-24)

-   Added: Support for Google Drive trees
-   Added: `path` frontmatter with Google Drive tree
-   Added: `slug` field from custom slug or Google Drive path
-   Updated: files structure

## 1.5.0 (2019-04-16)

-   Added: Support for images titles by @dmouse
-   Fixed: Table headers by @dmouse
-   Updated: Jest Snapshot

## 1.4.0 (2019-04-12)

-   Added: Add support for font styles bold, italic, strikethrough by @KyleAMathews

## 1.3.0 (2019-04-09)

-   Added: Snapshot test by @KyleAMathews

## 1.2.0 (2019-03-20)

-   Added: Support for documents extra data using `Google Drive` description field

## 1.1.0 (2019-03-15)

-   Added: Support for nested lists by @horaklukas
-   Added: Support for ordered lists by @horaklukas
-   Added: Support for inlined hypertext links by @horaklukas
-   Fixed: Putting list items into the list they belong to by @horaklukas
-   Fixed: Splitting one line headings or texts into more lines by @horaklukas

## 1.0.1 (2019-03-14)

-   Fixed: Ensure `fields` config is optional by @davidhartsough

## 1.0.0 (2019-02-24)

-   Added: `foldersIds` option
-   Added: `fields` option
-   Added: `fieldsMapper` option
-   Removed: `documents` option
-   Updated: Default permissions to read document from Google Drive folders

## 0.1.0 (2019-02-07)

-   Added: Headings support
-   Added: Texts support
-   Added: Images support
-   Added: Lists support
