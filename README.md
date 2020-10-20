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

Why use [Google Docs](https://docs.google.com/) to write your content :

-   🖋 Best online WYSIWYG editor
-   🖥 Desktop web app
-   📱 Mobile app
-   🛩 Offline redaction
-   🔥 No need for external CMS
-   ✅ No more content in your source code
-   🗂 Automatic breadcrumb generation
-   🤡 Custom metadata fields

## Usage

1. Download `gatsby-source-google-docs` from the NPM registry:

```shell
yarn add gatsby-source-google-docs gatsby-transformer-remark gatsby-remark-images
```

2. [Generate a token](./docs/token.md)

The package needs 3 `.env` variables with the following format to work:

```dotenv
GOOGLE_OAUTH_CLIENT_ID=2...m.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=Q...axL
GOOGLE_DOCS_TOKEN={"access_token":"ya...J0","refresh_token":"1..mE","scope":"https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/documents.readonly","token_type":"Bearer","expiry_date":1598284554759}
```

`gatsby-source-google-docs` expose a script to make the generation easier.
Open a terminal at the root of your project and type:

```shell
gatsby-source-google-docs-token
```

> The format changed in `v2.0.0-beta.16`. Check the [migration guide](./docs/token.md)

3. [Add the plugin](./docs/options.md) in your `gatsby-config.js` file

```js
module.exports = {
    plugins: [
        "gatsby-source-google-docs",
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: ["gatsby-remark-images"],
            },
        },
    ],
}
```

4. [Create pages](./docs/pages.md)

## Showcase

You are using `gatsby-source-google-docs` for your website?
Thank you!

Please add your website to the [Showcase](./showcase.yml)

## Documentation

-   [Token](./docs/token.md)
-   [Options](./docs/options.md)
-   [Create pages](./docs/pages.md)
-   [FAQ](./docs/faq.md)
-   [Sheets Usage](./docs/sheets.md)

## Contributing

-   ⇄ Pull/Merge requests and ★ Stars are always welcome.
-   For bugs and feature requests, please [create an issue][github-issue].

## Changelog

See [CHANGELOG](./CHANGELOG.md)

## License

This project is licensed under the MIT License - see the
[LICENCE](./LICENCE.md) file for details

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
