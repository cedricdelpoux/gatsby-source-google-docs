# Changelog

## 2.0.0

### Major Changes

- cc60ae0: Turn the package into a pure converter. The `google-docs-to-markdown/google` entry (`getAuth`, `generateToken`, `fetchDocument`, `fetchMarkdown`) and the `google-docs-to-markdown-token` command move to the new `google-docs-sync` package, and the dependencies on `@googleapis/docs`, `google-auth-library` and `google-oauth2-env-vars` go with them. Fetch the document with `fetchDocument` from `google-docs-sync`, then give it to `toMarkdown`.

## 1.0.1

- An image that Google gives no URL for, such as a broken image, is no longer written as `![](undefined "")` or listed in `images`

## 1.0.0

The conversion of [gatsby-source-google-docs](https://github.com/cedricdelpoux/gatsby-source-google-docs) v3, as a library of its own.

- `toMarkdown(document, options)` and `GoogleDocument` convert a document of the Google Docs API
- `google-docs-to-markdown/google` fetches a document by id: `fetchDocument`, `fetchMarkdown` and `getAuth`
- `npx google-docs-to-markdown-token` generates the `.env` variables
- The `mdx` option replaces the `extension: "mdx"` option of the plugin
- `demoteHeadings` is `false` by default
- An ES module, with its TypeScript types, which `require()` loads too on Node 22.12 or later
