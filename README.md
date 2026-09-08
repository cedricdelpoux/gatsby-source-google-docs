<div align="center">
  <h1>gatsby-source-google-docs</h1>
  <br/>
  <p>
    <img src="./logo.png" alt="gatsby-source-google-docs" height="100px">
  </p>
  <br/>

[![Npm][badge-npm]][npm]
[![Build Status][badge-build]][actions]
[![Coverage][badge-coverage]][codecov]
[![Downloads][badge-downloads]][npm]
[![PRs welcome][badge-prs]](#contributing)
[![MIT license][badge-licence]](./LICENCE.md)
[![Paypal][badge-paypal]](https://paypal.me/cedricdelpoux)

</div>

---

`gatsby-source-google-docs` is a [Gatsby](https://www.gatsbyjs.org/) plugin to use [Google Docs](https://docs.google.com/) as a data source.

<p><details><summary>Why use Google Docs to write your content ?</summary>

- 🖋 Best online WYSIWYG editor
- 🖥 Desktop web app
- 📱 Mobile app
- 🛩 Offline redaction
- 🔥 No need for external CMS
- ✅ No more content in your source code

</details></p>

## Features

- **Google Docs** formatting options (headings, bullets, tables, images...)
- `MDX` support to use `<ReactComponents />` in your documents
- Incremental builds: only the documents and images that changed are fetched
- **Gatsby** v5 support
- `gatsby-plugin-image` and `gatsby-image` support
- Code blocs support
- **Gatsby Cloud** support
- Slug generation from **Google Drive** tree
- Crosslinks between pages
- Related content
- Custom metadata to enhance documents

## Documentation

To preview what you can do, please checkout [the documentation website](https://cedricdelpoux.github.io/gatsby-source-google-docs/).

- 👨🏻‍💻 [Source code](/examples/website)
- 🗂 [Google Docs content](https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag)

Two runnable examples live in this repository, both sourcing the folder above:

- [`examples/basic`](/examples/basic) — `gatsby-transformer-remark`
- [`examples/mdx`](/examples/mdx) — `gatsby-plugin-mdx`

> 💯 100% content of the website is from Google Docs. Please suggest edits to improve it.

## Installation

Requires **Node 22 or 24**. Node 25 is not supported: it removed `SlowBuffer`, which a transitive dependency of `google-auth-library` still relies on.

Download `gatsby-source-google-docs` and `gatsby-transformer-remark` (or `gatsby-plugin-mdx` for [advanced usage](/examples/website))

```shell
yarn add gatsby-source-google-docs gatsby-transformer-remark
```

- `gatsby-source-google-docs` transform **Google Docs** to **Markdown**
- `gatsby-transformer-remark` transform **Markdown** to **HTML**
- `gatsby-plugin-mdx` transform **Markdown** to **MDX**

## Token generation

The package needs 3 `.env` variables.

<p><details><summary>Preview variables</summary>

```dotenv
GOOGLE_OAUTH_CLIENT_ID=2...m.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=Q...axL
GOOGLE_DOCS_TOKEN={"access_token":"ya...J0","refresh_token":"1..mE","scope":"https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/documents.readonly","token_type":"Bearer","expiry_date":1598284554759}
```

</details></p>

`gatsby-source-google-docs` expose a script to generate it.

- Open a terminal at the root of your project
- Type the following command

```shell
npx gatsby-source-google-docs-token
```

## Usage

### Organize your documents

Go to your [Google Drive](https://drive.google.com/drive/), create a folder and put some documents inside it.

```js
↳ 🗂 Root folder `template: page`
    ↳ 🗂 en `locale: en` `skip: true`
        ↳ 📝 Home `template: home`
        ↳ 📝 About
        ↳ 🗂 Posts `template: post`
            ↳ 🗂 Drafts `exclude: true`
                ↳ 📝 Draft 1
            ↳ 📝 My year 2020 `date: 2021-01-01`
            ↳ 📝 Post 2 `slug: /custom/slug` `template: special-post`
    ↳ 🗂 fr `locale: fr`
        ↳ 📝 Accueil `template: home`
```

<p><details><summary>🤡 How to enhance documents with metadata?</summary>

- Fill the document (or folder) `description` field in Google Drive with a `YAML` object

```yaml
locale: fr
template: post
category: Category Name
tags: [tag1, tag2]
slug: /custom-slug
date: 2019-01-01
```

> There are special metadata
>
> - For folders:
>     - `exclude: true`: Exclude the folder and its documents
>     - `skip: true`: Remove the folder from slug but keep its documents
> - For documents:
>     - `index:true`: Use document as the folder index
>     - `page: false`: Prevent page creation when `createPages` option is set to `true`

- Spread metadata into the tree using folders metadata.

> ⬆️ For the tree example above:
>
> - Every node will have `template: page` defined as default excepts if you redefine it later.
> - You need to create 3 different templates: `page` (default), `home`, `post`. [Checkout the example template](./example/src/templates/page.js)
> - "en" folder will be removed from slug because of `skip: true`

- Exclude folders and documents using `exclude: true`. Perfect to keep drafts documents. One you want to publish a page, juste move the document one level up.

> ⬆️ For the tree example above:
>
> - Documents under `Drafts` will be exclude because of `exclude: true`.

- Every metadata will be available in `GoogleDocs` nodes and you can use everywhere in you `Gatsby` site

</details></p>

<p><details><summary>🌄 How to add cover?</summary>

Add an image in your [Google Document first page header](https://support.google.com/docs/answer/86629)

</details></p>

<p><details><summary>🍞 How to add slug and breadcrumb?</summary>

`slug` and `breadcrumb` fields add automatically generated using the folders tree structure and transformed using `kebab-case`.

> ⬆️ For the tree example above:
> The `GoogleDocs` node for document `My year 2020`
>
> ```js
> {
>     path: "/en/posts/my-year-2020" // Original Google Drive path
>     slug: "/posts/my-year-2020" // `en` is out because of `skip: true`
>     breadcrumb: [
>         {name: "Posts", slug: "/posts"},
>         {name: "My year 2020", slug: "/posts/my-year-2020"},
>     ],
>     template: "post" ,// src/templates/post.js
>     locale: "fr",
>     date: "2021-01-01" // Fixed date !
> }
> ```
>
> The `GoogleDocs` node for document `Post 2` will have a custom slug
>
> ```js
> {
>     path: "/en/posts/post-2"
>     slug: "/custom/slug"
>     breadcrumb: [
>         {name: "Posts", slug: "/posts"},
>         {name: "Post 2", slug: "/custom/slug"},
>     ],
>     template: "special-post",  // src/templates/special-post.js
>     locale: "en",
>     date: "2020-09-12" // Google Drive document creation date
> }
> ```

You also can add metadata (`locale`, `date`, `template`, ...) to your documents.

</details></p>

### Add the plugin to your `gatsby-config.js` file

| Option           | Required | Type    | Default                 | Example         |
| ---------------- | -------- | ------- | ----------------------- | --------------- |
| folder           | `true`   | String  | `null`                  | `"1Tn1dCbIc"`   |
| createPages      | `false`  | Boolean | `false`                 | `true`          |
| outputDir        | `false`  | String  | `"content/google-docs"` | `"content"`     |
| cacheDir         | `false`  | String  | `".google-docs"`        | `".cache-docs"` |
| extension        | `false`  | String  | `"md"`                  | `"mdx"`         |
| escapeMdxSyntax  | `false`  | Boolean | `true`                  | `false`         |
| pageContext      | `false`  | Array   | `[]`                    | `["locale"]`    |
| demoteHeadings   | `false`  | Boolean | `true`                  | `false`         |
| imagesOptions    | `false`  | Object  | `null`                  | `{width: 512}`  |
| keepDefaultStyle | `false`  | Boolean | `false`                 | `true`          |
| skipCodes        | `false`  | Boolean | `false`                 | `true`          |
| skipFootnotes    | `false`  | Boolean | `false`                 | `true`          |
| skipHeadings     | `false`  | Boolean | `false`                 | `true`          |
| skipImages       | `false`  | Boolean | `false`                 | `true`          |
| skipLists        | `false`  | Boolean | `false`                 | `true`          |
| skipQuotes       | `false`  | Boolean | `false`                 | `true`          |
| skipTables       | `false`  | Boolean | `false`                 | `true`          |
| debug            | `false`  | Boolean | `false`                 | `true`          |

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {
                // https://drive.google.com/drive/folders/FOLDER_ID
                folder: "FOLDER_ID",
                createPages: true,
            },
        },
        "gatsby-transformer-remark",
        //
        // OR "gatsby-plugin-mdx" for advanced usage using MDX
        //
        // You need some transformations?
        // Checkout https://www.gatsbyjs.com/plugins/?=gatsby-remark
        // And pick-up some plugins
    ],
}
```

<p><details><summary>📷 How to use images ?</summary>

`gatsby-plugin-sharp`, `gatsby-transformer-sharp` and `gatsby-remark-images` are required if you want to take advantage of [gatsby-image blur-up technique](https://using-gatsby-image.gatsbyjs.org/blur-up/).

```shell
yarn add gatsby-plugin-sharp gatsby-transformer-sharp gatsby-remark-images
```

```js
module.exports = {
    plugins: [
        "gatsby-source-google-docs",
        "gatsby-plugin-sharp",
        "gatsby-transformer-sharp",
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: ["gatsby-remark-images"],
            },
        },
    ],
}
```

</details></p>

<p><details><summary>⚛️ How to use codes blocks ?</summary>

Use [Code Blocks](https://gsuite.google.com/marketplace/app/code_blocks/100740430168) Google Docs extension to format your code blocks.

To specify the lang, you need to add a fist line in your code block following the format `lang:javascript`.

To get Syntax highlighting, I recommend using `prismjs` but it's not mandatory.

```shell
yarn add gatsby-remark-prismjs prismjs
```

Add the `gatsby-remark-prismjs` plugin to your `gatsby-config.js`

```js
module.exports = {
    plugins: [
        "gatsby-source-google-docs",
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: ["gatsby-remark-prismjs"],
            },
        },
    ],
}
```

Import a `prismjs` theme in your `gatsby-browser.js`

```js
require("prismjs/themes/prism.css")
```

</details></p>

### How documents reach Gatsby

The plugin writes every document to disk as a real markdown file, under
`outputDir` (`content/google-docs` by default):

```
content/google-docs
├── index.md                    # the document whose slug is "/"
├── installation.md
├── images.md
└── images
    └── images                  # one directory per document
        ├── alt-text.png
        └── images-2.png
```

Each file holds the document metadata as `YAML` frontmatter and its content as
markdown, and the images it references are downloaded next to it. `File` nodes
are created for all of them, so `gatsby-transformer-remark` and
`gatsby-plugin-mdx` pick them up like any other local file.

> `outputDir` is managed by the plugin: files it did not write are deleted on
> every build, so point it at a directory of its own and add it to your
> `.gitignore`.

This is why `MDX` works again. Since v4, `gatsby-plugin-mdx` compiles MDX
through webpack from a file path and
[only supports files sourced from the filesystem](https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-plugin-mdx/README.md),
so documents kept in memory could never become MDX. Set `extension: "mdx"` to
author your documents as MDX.

> ⚠️ MDX only supports [CommonMark](https://commonmark.org/), and this plugin
> generates GitHub Flavored Markdown: **without `remark-gfm`, tables and
> `~~strikethrough~~` are rendered as raw text.** `remark-gfm` is ESM only, so
> the config has to be a `gatsby-config.mjs` file — see
> [`examples/mdx`](/examples/mdx/gatsby-config.mjs).

> ⚠️ By default, a document's text is escaped before being written: a stray,
> unmatched `<` or `{` (a `<placeholder>` convention, a generic `<T>`, ...)
> makes MDX v2 fail the **whole build**, not just that document. A
> well-formed tag compiles fine either way — `<GatsbyLogo />` works whether
> escaped or not — so this only matters for text that isn't a deliberate
> component. If every document on your site deliberately embeds live
> JSX/components as literal text, and you've made sure none of them contain
> a stray `<`/`{` otherwise, set `escapeMdxSyntax: false` to compile them as
> intended.

```js
// gatsby-config.mjs
import remarkGfm from "remark-gfm"

const config = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {folder: "FOLDER_ID", extension: "mdx", createPages: true},
        },
        {
            resolve: "gatsby-plugin-mdx",
            options: {
                mdxOptions: {remarkPlugins: [remarkGfm]},
                gatsbyRemarkPlugins: ["gatsby-remark-images"],
            },
        },
    ],
}

export default config
```

### Only what changed is fetched

Fetching a document is one request, and every image it holds is a download of
its own: a folder of long documents full of images takes minutes to fetch. The
plugin keeps them in a `.google-docs` directory next to your
`gatsby-config.js`, and a build only fetches what changed since the previous
one.

```
.google-docs
├── documents
│   └── 1Tn1dCbIc.json       # one file per document, as Google gave it
├── images
│   └── 1Tn1dCbIc            # the images it references, downloaded once
│       └── kix.4dmdp8b4.png
└── state.json
```

Google Drive gives the time a document was last modified while listing the
folder, which the plugin already does: a document that has not been touched
since it was stored is never fetched again, and neither are its images. Editing
a document on Google Docs, renaming it, changing its description or moving it
to another folder is picked up on the next build — its metadata always comes
from the listing, fetched or not.

The documents are stored as Google gave them, not as markdown: changing
`demoteHeadings`, `extension` or any other option takes effect on the next
build without fetching anything again. Changing `imagesOptions` downloads the
images again, since their size is part of the URL they are downloaded from.

> Add `.google-docs` to your `.gitignore`, or commit it to give your continuous
> integration a folder it does not have to fetch. Delete it to fetch everything
> again.

This directory is **not** the Gatsby cache, on purpose: Gatsby empties its own
whenever a plugin version, `package.json`, `gatsby-config.js` or
`gatsby-node.js` changes, and a continuous integration job never has one, so
adding a dependency to your site would cost a complete refetch.

### Create templates and pages

Using `createPages: true` option, pages will be created automatically.
You need to create templates and define wich template to use using `YAML` metadata.

> You can set `page: false` metadata for a document to prevent a page creation

Every field of your document metadata is available under `frontmatter`:

```js
export const pageQuery = graphql`
    query Page($slug: String!) {
        page: markdownRemark(frontmatter: {slug: {eq: $slug}}) {
            html
            frontmatter {
                name
                breadcrumb {
                    name
                    slug
                }
                cover {
                    image {
                        childImageSharp {
                            gatsbyImageData
                        }
                    }
                }
            }
        }
    }
`
```

Checkout the [example template](./examples/basic/src/templates/page.js) and adapt it to your needs.

> You can use `pageContext` option if you need extra data into the context of your pages.

<p><details><summary>How to create pages manualy?</summary>

If you prefer to create pages manualy, checkout the [createPages API](./src/utils/create-pages.js) et adapt it to your needs.

</details></p>

### Trigger production builds

- Go to [Google Drive example folder](https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag)
- Make a copy of **Trigger Gatsby Build** file using `Right Click -> Make a copy`
- Open your copy and update the **Build Webhook URL** in `A2`
- Click the **Deploy** button to trigger a new build

> This method works with any hosting services: Gatsby Cloud, Netlify...

## Migrating from v2

`v3` writes documents to the filesystem instead of keeping them in memory. That
is what makes `MDX` and the current `gatsby-plugin-mdx` usable again, but it
changes how documents are queried.

**The `GoogleDocs` node type is gone.** Documents are now `MarkdownRemark` (or
`Mdx`) nodes, and everything that used to sit on the node is in `frontmatter`:

```diff
- page: googleDocs(slug: {eq: $slug}) {
-   name
-   cover {
-     image {
-       childImageSharp {
-         gatsbyImageData
-       }
-     }
-   }
-   childMarkdownRemark {
-     html
-   }
- }
+ page: markdownRemark(frontmatter: {slug: {eq: $slug}}) {
+   html
+   frontmatter {
+     name
+     cover {
+       image {
+         childImageSharp {
+           gatsbyImageData
+         }
+       }
+     }
+   }
+ }
```

Other things to know:

- `allGoogleDocs` becomes `allMarkdownRemark` (or `allMdx`). These types are
  shared with any other markdown your site sources, so filter on
  `frontmatter: {slug: {ne: null}}` if you need only Google Docs documents.
- `related` is now a list of document ids instead of linked nodes.
- Add `outputDir` (`content/google-docs` by default) and `cacheDir`
  (`.google-docs` by default) to your `.gitignore`.
- **Node 22 or 24 is required**, and `gatsby@^5` is now a peer dependency.

## Showcase

You are using `gatsby-source-google-docs` for your website? Thank you!
Please add the link bellow:

- [documentation](https://cedricdelpoux.github.io/gatsby-source-google-docs/)
- [cedricdelpoux](https://cedricdelpoux.fr/en)

## Contributing

- ⇄ Pull/Merge requests and ★ Stars are always welcome.
- For bugs and feature requests, please [create an issue][github-issue].

[badge-paypal]: https://img.shields.io/badge/sponsor-PayPal-3b7bbf.svg?style=flat-square
[badge-npm]: https://img.shields.io/npm/v/gatsby-source-google-docs.svg?style=flat-square
[badge-downloads]: https://img.shields.io/npm/dt/gatsby-source-google-docs.svg?style=flat-square
[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/gatsby-source-google-docs/ci.yml?branch=master&style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/gatsby-source-google-docs/master.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[npm]: https://www.npmjs.org/package/gatsby-source-google-docs
[actions]: https://github.com/cedricdelpoux/gatsby-source-google-docs/actions/workflows/ci.yml
[codecov]: https://codecov.io/gh/cedricdelpoux/gatsby-source-google-docs
[github-issue]: https://github.com/cedricdelpoux/gatsby-source-google-docs/issues/new
