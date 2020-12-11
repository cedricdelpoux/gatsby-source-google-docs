# FAQ

## How can I add a cover?

Add an image in your [Google Doc first page header](https://support.google.com/docs/answer/86629).

Then you can query your header cover like any Sharp node.

See [example post template](../example/src/templates/page.js)

## How can I add metadata to my documents?

Fill the document (or folder) `description` field in Google Drive with a `YAML` object

```yaml
locale: fr
template: post
category: Category Name
tags: [tag1, tag2]
slug: /custom-slug
date: 2019-01-01
```

## How can I manage drafts?

1.  Create a folder, wherever you want in the tree, and put your documents in there
2.  Add `exclude: true` metadata to this folder (See [metadata](#how-can-i-add-metadata-to-my-documents))

> You also can add `exclude: true` metadata to specific documents directly.

## How can I get a breadcrumb?

Organize your documents in Google Drive with folders:

```
/
  ↳ Folder 1
    ↳ Folder 2
      ↳ Folder 3
        ↳ Document 1
```

Then you can query the breadcrumb:

```graphql
{
    allGoogleDocs {
        nodes {
            breadcrumb {
                name
                slug
            }
        }
    }
}
```

## How can I set a custom slug for one of my document?

[Add it using metadata](#how-can-i-add-metadata-to-my-documents)

## How can I set a fixed date for one of my document?

[Add it using metadata](#how-can-i-add-metadata-to-my-documents)

## How can I add code blocks?

Use [Code Blocks](https://gsuite.google.com/marketplace/app/code_blocks/100740430168) Google Docs extension to format your code blocks.

To specify the lang, you need to add a fist line in your code block following the format `lang:javascript`.

To get Syntax highlighting, I recommend using
`prismjs` but it's not mandatory.

```
yarn add prismjs gatsby-remark-prismjs
```

Add the `gatsby-remark-prismjs` plugin to your `gatsby-config.js`

```js
{
  resolve: "gatsby-transformer-remark",
  options: {
    plugins: ["gatsby-remark-prismjs"],
  },
},
```

> If you use inline code, you should set the `noInlineHighlight` option of `gatsby-remark-prismjs` to `true` to avoid warnings during the build about missing lang

Import a `prismjs` theme in your `gatsby-browser.js`

```js
require("prismjs/themes/prism.css")
```
