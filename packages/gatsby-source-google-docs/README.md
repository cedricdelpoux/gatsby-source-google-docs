<div align="center">
  <h1>gatsby-source-google-docs</h1>
  <br/>
  <p>
    <img src="./logo.svg" alt="gatsby-source-google-docs" height="100px">
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

- 👨🏻‍💻 [Source code](./examples/website)
- 🗂 [Google Docs content](https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag)

Two runnable examples live in this repository, both sourcing the folder above:

- [`examples/basic`](./examples/basic) — `gatsby-transformer-remark`
- [`examples/mdx`](./examples/mdx) — `gatsby-plugin-mdx`

> 💯 100% content of the website is from Google Docs. Please suggest edits to improve it.

## Installation

Requires **Node 22.12 or later** and **Gatsby 5.3 or later**. Gatsby 5 does not support Node 26 yet.

Download `gatsby-source-google-docs` and `gatsby-transformer-remark` (or `gatsby-plugin-mdx` for [advanced usage](./examples/website))

```shell
npm install gatsby-source-google-docs gatsby-transformer-remark
```

- `gatsby-source-google-docs` transform **Google Docs** to **Markdown**, with [google-docs-sync](https://github.com/cedricdelpoux/google-docs-sync/tree/master/packages/google-docs-sync), which you can also use without Gatsby
- `gatsby-transformer-remark` transform **Markdown** to **HTML**
- `gatsby-plugin-mdx` transform **Markdown** to **MDX**

## Token generation

The plugin needs 3 `.env` variables (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` and `GOOGLE_DOCS_TOKEN`), described in the [`google-docs-sync` documentation](../google-docs-sync#token-generation).

`gatsby-source-google-docs` exposes a script to generate them.

- Open a terminal at the root of your project
- Type the following command

```shell
npx gatsby-source-google-docs-token
```

## Usage

### Organize your documents

Go to your [Google Drive](https://drive.google.com/drive/), create a folder and put some documents inside it. The folders tree gives the slugs and breadcrumbs, and the `description` of the folders and documents holds their `YAML` metadata (`template`, `locale`, `slug`, `date`, `exclude`, `skip`, ...): see [organize your documents](../google-docs-sync#organize-your-documents).

Every metadata is available under `frontmatter` in the `File` nodes of the documents.

### Add the plugin to your `gatsby-config.js` file

`folder`, `outputDir`, `cacheDir`, `extension`, `imagesOptions` and the conversion options are shared with [`google-docs-sync`](../google-docs-sync#options), which does the work. `createPages` and `pageContext` are specific to Gatsby.

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
npm install gatsby-plugin-sharp gatsby-transformer-sharp gatsby-remark-images
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
npm install gatsby-remark-prismjs prismjs
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
> [`examples/mdx`](./examples/mdx/gatsby-config.mjs).

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

A build only fetches the documents and images that changed since the previous one. They are kept in a `.google-docs` directory next to your `gatsby-config.js` (the `cacheDir` option), which is **not** the Gatsby cache, on purpose: Gatsby empties its own whenever a plugin version, `package.json`, `gatsby-config.js` or `gatsby-node.js` changes, and a continuous integration job never has one, so adding a dependency to your site would cost a complete refetch.

Add `.google-docs` to your `.gitignore`, or commit it to give your continuous integration a folder it does not have to fetch. See [how the cache works](../google-docs-sync#only-what-changed-is-fetched).

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

If you prefer to create pages manualy, checkout the [createPages API](./utils/create-pages.js) et adapt it to your needs.

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

```shell
npm install
npm run lint
npm test
```

The examples are Gatsby sites that use the plugin of the repository: run `npm install` in one of them, then `npm run dev` or `npm run build`.

The code is plain JavaScript. The types of the options are written as [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) comments: `npm run lint` checks them with TypeScript, and `npm pack` turns them into the `.d.ts` files of the package.

To release a version, describe the change with `npm run changeset` and commit the generated file with your pull request. Once it is merged, the `Release` workflow opens a "Version packages" pull request, and merging it publishes the packages to npm with their provenance. See the [monorepo README](https://github.com/cedricdelpoux/google-docs-sync#releases).

[badge-paypal]: https://img.shields.io/badge/sponsor-PayPal-3b7bbf.svg?style=flat-square
[badge-npm]: https://img.shields.io/npm/v/gatsby-source-google-docs.svg?style=flat-square
[badge-downloads]: https://img.shields.io/npm/dt/gatsby-source-google-docs.svg?style=flat-square
[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/google-docs-sync/ci.yml?branch=master&style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/google-docs-sync/master.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[npm]: https://www.npmjs.org/package/gatsby-source-google-docs
[actions]: https://github.com/cedricdelpoux/google-docs-sync/actions/workflows/ci.yml
[codecov]: https://codecov.io/gh/cedricdelpoux/google-docs-sync
[github-issue]: https://github.com/cedricdelpoux/google-docs-sync/issues/new
