# FAQ

## How can I add a cover?

Add an image in your [Google Doc first page header](https://support.google.com/docs/answer/86629).

Then you can query your header cover like any Sharp node.

See [example post template](../example/src/templates/page.js)

## How can I add metadata to my documents?

Fill the description field of your document in Google Drive with a YAML object

```yaml
template: post
category: Category
tags: [tag1, tag2]
draft: true
slug: custom-slug
date: 2019-01-01
```

## How can I manage drafts?

There are two ways:

-   Create `Drafts` or `drafts` folders, wherever you want in the tree, and put your documents in there
-   Add metadata `draft: true` to your documents (See [metadata](#how-can-i-add-metadata-to-my-documents))

You can also use a different folder to manage your drafts using the `ignoredFolders` option:

```
{
  resolve: "gatsby-source-google-docs",
  options: {
    ignoredFolders: [
      "my-custom-drafts-folder",
    ],
  }
}
```

> You will not be able to query `breadcrumb` if all your documents are in the same folder

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

## How to use `gatsby-source-google-docs` without `remark` ecosystem?

You can query `elements` to generate the html and do your custom processing:

```graphql
query {
    allGoogleDocs {
        nodes {
            elements {
                type
                value
            }
        }
    }
}
```

You can also query raw `document`.
