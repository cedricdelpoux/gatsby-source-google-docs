<div align="center">
  <h1>gatsby-source-google-docs</h1>
  <br/>
  <p>
    <img src="./logo.png" alt="gatsby-source-google-docs" height="100px">
  </p>
  <br/>

[![Npm][badge-npm]][npm]
[![Build Status][badge-build]][travis]
[![Coverage][badge-coverage]][codecov]
[![Downloads][badge-downloads]][npm]
[![PRs welcome][badge-prs]](#contributing)
[![MIT license][badge-licence]](./LICENCE.md)
[![Paypal][badge-paypal]](https://paypal.me/cedricdelpoux)

</div>

---

`gatsby-source-google-docs` is a [Gatsby](https://www.gatsbyjs.org/) plugin to use [Google Docs](https://docs.google.com/) as a data source.

<p><details><summary>Why use Google Docs to write your content ?</summary>

-   🖋 Best online WYSIWYG editor
-   🖥 Desktop web app
-   📱 Mobile app
-   🛩 Offline redaction
-   🔥 No need for external CMS
-   ✅ No more content in your source code
-   🗂 Automatic breadcrumb generation
-   🤡 Custom metadata fields

</details></p>

## Install

Download `gatsby-source-google-docs` and `gatsby-transformer-remark`

```shell
yarn add gatsby-source-google-docs gatsby-transformer-remark
```

-   `gatsby-source-google-docs` transform **Google Docs** to **Markdown**
-   `gatsby-transformer-remark` transform **Markdown** to **HTML**

## Generate a token

The package needs 3 `.env` variables.

<p><details><summary>Preview variables</summary>

```dotenv
GOOGLE_OAUTH_CLIENT_ID=2...m.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=Q...axL
GOOGLE_DOCS_TOKEN={"access_token":"ya...J0","refresh_token":"1..mE","scope":"https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/documents.readonly","token_type":"Bearer","expiry_date":1598284554759}
```

</details></p>

`gatsby-source-google-docs` expose a script to generate them.

-   Open a terminal at the root of your project
-   Type the following command

```shell
gatsby-source-google-docs-token
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

<p><details><summary>🤡 How to add metadata?</summary>

-   Fill the document (or folder) `description` field in Google Drive with a `YAML` object

```yaml
locale: fr
template: post
category: Category Name
tags: [tag1, tag2]
slug: /custom-slug
date: 2019-01-01
```

-   Spread metadata into the tree using folders metadata.

> ⬆️ For the tree example above:
>
> -   Every node will have `template: page` defined as default excepts if you redefine it later.
> -   You need to create 3 different templates: `page` (default), `home`, `post`. [Checkout the example template](./example/src/templates/page.js)

-   Exclude folders and documents using `exclude: true`. Perfect to keep drafts documents. One you want to publish a page, juste move the document one level up.

> ⬆️ For the tree example above:
>
> -   Documents under `Drafts` will be exclude because of `exclude: true`.

-   Every metadata will be available in `GoogleDocs` nodes and you can use everywhere in you `Gatsby` site

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

| Option         | Required | Type    | Default | Example      |
| -------------- | -------- | ------- | ------- | ------------ |
| folder         | true     | String  | -       | "1Tn1dCbIc"  |
| createPages    | false    | Boolean | false   | true         |
| pageContext    | false    | Array   | []      | ["locale"]   |
| demoteHeadings | false    | Boolean | true    | false        |
| imagesOptions  | false    | Object  | -       | {width: 512} |
| skipCodes      | false    | Boolean | false   | true         |
| skipFootnotes  | false    | Boolean | false   | true         |
| skipHeadings   | false    | Boolean | false   | true         |
| skipImages     | false    | Boolean | false   | true         |
| skipLists      | false    | Boolean | false   | true         |
| skipQuotes     | false    | Boolean | false   | true         |
| skipTables     | false    | Boolean | false   | true         |
| debug          | false    | Boolean | false   | true         |

### Create templates and pages

Using `createPages: true` option, pages will be created automatically.
You need to create templates and define wich template to use using `YAML` metadata.

Checkout the [example template](./example/src/templates/page.js) et adapt it to your needs.

> You can use `pageContext` option if you need extra data into the context of your pages.

<p><details><summary>How to create pages manualy?</summary>

If you prefer to create pages manualy, checkout the [createPages API](./src/urils/create-pages.js) et adapt it to your needs.

</details></p>

## Showcase

You are using `gatsby-source-google-docs` for your website? Thank you!
Please add the link bellow:

-   [cedricdelpoux](https://cedricdelpoux.fr/en)

## Contributing

-   ⇄ Pull/Merge requests and ★ Stars are always welcome.
-   For bugs and feature requests, please [create an issue][github-issue].

[badge-paypal]: https://img.shields.io/badge/sponsor-PayPal-3b7bbf.svg?style=flat-square
[badge-npm]: https://img.shields.io/npm/v/gatsby-source-google-docs.svg?style=flat-square
[badge-downloads]: https://img.shields.io/npm/dt/gatsby-source-google-docs.svg?style=flat-square
[badge-build]: https://img.shields.io/travis/cedricdelpoux/gatsby-source-google-docs/master?style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/gatsby-source-google-docs/master.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[npm]: https://www.npmjs.org/package/gatsby-source-google-docs
[travis]: https://travis-ci.org/cedricdelpoux/gatsby-source-google-docs
[codecov]: https://codecov.io/gh/cedricdelpoux/gatsby-source-google-docs
[github-issue]: https://github.com/cedricdelpoux/gatsby-source-google-docs/issues/new
