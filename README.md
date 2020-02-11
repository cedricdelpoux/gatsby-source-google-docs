# gatsby-source-google-docs

[![npm package][npm-badge]][npm]

`gatsby-source-google-docs` is a [Gatsby](https://www.gatsbyjs.org/) plugin to use [Google Docs](https://docs.google.com/) as a data source.

Why to use [Google Gocs](https://docs.google.com/) to write your content :

-   🖋 Best online WYSIWYG editor
-   🖥 Desktop web app
-   📱 Mobile app
-   🛩 Offline redaction
-   🔥 No need for external CMS
-   ✅ No more content is your source code
-   🗂 Automatic breadbrumb generation
-   🤡 Custom metadata fields

## Usage

1. Download `gatsby-source-google-docs` from the NPM registry:

```shell
yarn add gatsby-source-google-docs gatsby-transformer-remark gatsby-remark-images
```

2. Open a terminal at the root of your project and [Generate a token](./token.md)

```shell
gatsby-source-google-docs-token
```

3. [Add the plugin](./options.md) in your `gatsby-config.js` file

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

4. [Create pages](./pages.md)

## Documentation

-   [Token](./token.md)
-   [Options](./options.md)
-   [Create pages](./pages.md)
-   [FAQ](./faq.md)

## Contributing

-   ⇄ Pull/Merge requests and ★ Stars are always welcome.
-   For bugs and feature requests, please [create an issue][github-issue].

See [CONTRIBUTING](./CONTRIBUTING.md) guidelines

## Changelog

See [CHANGELOG](./CHANGELOG.md)

## License

This project is licensed under the MIT License - see the
[LICENCE](./LICENCE.md) file for details

[npm-badge]: https://img.shields.io/npm/v/gatsby-source-google-docs.svg?style=flat-square
[npm]: https://www.npmjs.org/package/gatsby-source-google-docs
[github-issue]: https://github.com/xuopled/gatsby-source-google-docs/issues/new
