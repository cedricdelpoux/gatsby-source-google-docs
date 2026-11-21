# google-docs-to-markdown

[![Npm][badge-npm]][npm]
[![Build Status][badge-build]][actions]
[![MIT license][badge-licence]](./LICENCE.md)

`google-docs-to-markdown` converts [Google Docs](https://docs.google.com/) to Markdown or MDX.

It reads the document returned by the [Google Docs API](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents) and gives back a Markdown string with a frontmatter. It does not call Google: [google-docs-sync](https://github.com/cedricdelpoux/google-docs-sync/tree/master/packages/google-docs-sync) fetches the documents and writes the files, and it powers [gatsby-source-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/master/packages/gatsby-source-google-docs). The converter works with any static site generator or script.

Google Drive can export a document as Markdown itself, but that export turns code blocks into one-cell tables without line breaks, escapes MDX components, embeds every image as base64 and drops the colors, underlines and inline code. This library keeps all of them.

## Features

- Headings, bold, italic, underline, strikethrough, superscript, subscript, colors and font sizes
- Bullet and numbered lists, nested ones included
- Tables, images, footnotes and horizontal rules
- Code blocks with a language, inline code and quotes
- A cover, taken from the image of the first page header
- Links between documents rewritten to your own paths
- MDX output, to use `<ReactComponents />` in your documents

## Installation

```shell
npm install google-docs-to-markdown
```

Node 22.12 or later is required. The package is an ES module, which `require()` loads too, and it comes with its TypeScript types.

## Usage

### From a document you fetched yourself

```js
import {toMarkdown} from "google-docs-to-markdown"

const markdown = toMarkdown(document, {
  frontmatter: {title: "Home"},
})
```

`document` is the response of [`documents.get`](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/get).

### From a document id

This package does not fetch anything. [`google-docs-sync`](https://github.com/cedricdelpoux/google-docs-sync/tree/master/packages/google-docs-sync) fetches the document, authenticates with Google and generates the token (`npx google-docs-sync-token`):

```js
import {fetchDocument} from "google-docs-sync"
import {toMarkdown} from "google-docs-to-markdown"

const document = await fetchDocument(
  "1ebPyAlYlGDpGhf37WbbjA6APqpCLDxKorMBv_mFojV0"
)
const markdown = toMarkdown(document, {mdx: true})
```

To sync a whole Google Drive folder to Markdown files, use `syncGoogleDocs` from the same package.

### Links between documents

A link to another Google Doc can point to your own page instead:

```js
const markdown = toMarkdown(document, {
  links: {
    "1CgKSrtU6e_a3fSzJNQvwbrIdD7tayUcfVzPZAScwEfo": "/installation",
  },
})
```

The ids of the linked documents are listed in the `related` field of the frontmatter.

### Cover, images and related documents

`GoogleDocument` takes the same options as `toMarkdown` and gives access to what the conversion found:

```js
import {GoogleDocument} from "google-docs-to-markdown"

const googleDocument = new GoogleDocument(document, {links, mdx: true})

googleDocument.cover // {image, title, alt} or null
googleDocument.images // [{id, url, title, alt}], the cover included, in the order of the markdown
googleDocument.related // ["1CgKSrtU6e_a3fSzJNQvwbrIdD7tayUcfVzPZAScwEfo"]
googleDocument.toMarkdown()
```

Google gives the images new URLs every time a document is fetched, and they expire within hours. The `id` of an image does not change, so it can name a downloaded file.

## Options

| Option             | Default | Description                                                                                                          |
| ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `frontmatter`      | `{}`    | Fields written in the frontmatter, next to `cover` and `related`                                                     |
| `links`            | `{}`    | Paths to rewrite the links to other Google Docs with, by document id                                                 |
| `mdx`              | `false` | Write MDX: colors and font sizes become JSX styles, and the text is escaped for MDX                                  |
| `escapeMdxSyntax`  | `true`  | Escape the `<` and `{` of the text, on which MDX fails. Set it to `false` to write live components as text in a doc. |
| `demoteHeadings`   | `false` | Turn h1 into h2, h2 into h3, ...                                                                                     |
| `keepDefaultStyle` | `false` | Keep the bold, italic, underline, ... of the Google Docs default style                                               |
| `skipCodes`        | `false` | Leave out the code blocks                                                                                            |
| `skipFootnotes`    | `false` | Leave out the footnotes                                                                                              |
| `skipHeadings`     | `false` | Leave out the headings                                                                                               |
| `skipImages`       | `false` | Leave out the images                                                                                                 |
| `skipLists`        | `false` | Leave out the lists                                                                                                  |
| `skipQuotes`       | `false` | Leave out the quotes                                                                                                 |
| `skipTables`       | `false` | Leave out the tables                                                                                                 |

## Writing in Google Docs

- **Inline code**: use the `Consolas` font.
- **Code blocks**: write the code in a table with a single cell, in the `Consolas` font. The [Code Blocks](https://workspace.google.com/marketplace/app/code_blocks/100740430168) add-on does it for you. Add `lang:javascript` on the first line to set the language.
- **Quotes**: write the quote in a table with a single cell, between smart quotes: `“quote”`.
- **Cover**: add an image in the header of the first page, with **Different first page** checked.

## Contributing

- ⇄ Pull requests and ★ Stars are always welcome.
- For bugs and feature requests, please [create an issue][github-issue].

The tests convert the documents of [`test/documents`](./test/documents). To add one, write it in Google Docs and save its JSON with the `fixture` script of `google-docs-sync`:

```shell
npm run fixture -w google-docs-sync -- <document id>
```

The code is plain JavaScript. The types of the public API are written as [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) comments: `npm run lint` checks them with TypeScript, and `npm pack` turns them into the `.d.ts` files of the package.

To release a version, describe the change with `npm run changeset` and commit the generated file with your pull request. Once it is merged, the `Release` workflow opens a "Version packages" pull request, and merging it publishes the packages to npm with their provenance. See the [monorepo README](https://github.com/cedricdelpoux/google-docs-sync#releases).

[badge-npm]: https://img.shields.io/npm/v/google-docs-to-markdown.svg?style=flat-square
[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/google-docs-sync/ci.yml?branch=master&style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[npm]: https://www.npmjs.org/package/google-docs-to-markdown
[actions]: https://github.com/cedricdelpoux/google-docs-sync/actions/workflows/ci.yml
[github-issue]: https://github.com/cedricdelpoux/google-docs-sync/issues/new
