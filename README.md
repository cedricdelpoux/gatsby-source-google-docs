# gatsby-source-google-docs

[![npm package][npm-badge]][npm]

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

2. Open a terminal at the root of your project and [Generate a token](./docs/token.md)

```shell
gatsby-source-google-docs-token
```

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

## Contributing

-   ⇄ Pull/Merge requests and ★ Stars are always welcome.
-   For bugs and feature requests, please [create an issue][github-issue].

## Changelog

See [CHANGELOG](./CHANGELOG.md)

## License

This project is licensed under the MIT License - see the
[LICENCE](./LICENCE.md) file for details

[npm-badge]: https://img.shields.io/npm/v/gatsby-source-google-docs.svg?style=flat-square
[npm]: https://www.npmjs.org/package/gatsby-source-google-docs
[github-issue]: https://github.com/cedricdelpoux/gatsby-source-google-docs/issues/new
