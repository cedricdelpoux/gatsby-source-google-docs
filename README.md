# gatsby-source-google-docs

[![npm package][npm-badge]][npm]

Gatsby plugin to use Google Docs as a data source

## Getting started

### Download `gatsby-source-google-docs` package

[![gatsby-source-google-docs](https://nodei.co/npm/gatsby-source-google-docs.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/gatsby-source-google-docs/)

You can download `gatsby-source-google-docs` from the NPM registry via the
`npm` or `yarn` commands

```shell
yarn add gatsby-source-google-docs
npm install gatsby-source-google-docs --save
```

### Turn on the Google Docs API and set configuration

-   Follow the [Step 1: Turn on the Google Docs API](https://developers.google.com/docs/api/quickstart/js)
-   Get a `client_id` and a `client_secret` from the Google console. If you downloaded `credential.json` file, you can extract them from it
-   Get an `api_key` from the Google console
-   Fill the `gatsby-source-google-docs` gatsby config object.

> More info can be found [on the official Google Docs quickstart guide](https://developers.google.com/docs/api/quickstart/js).

### Generate a token file

Run `yarn dev` to generate a token file.

> `token_path` can be customized in the configuration object.

### Generate slug field

Modify your `onCreateNode` function in your `gatsby-node.js` to generate a `slug` field:

```js
const _ = require("lodash") // Optional

exports.onCreateNode = ({node, actions: {createNodeField}}) => {
    if (node.internal.type === `MarkdownRemark`) {
        if (node.frontmatter && node.frontmatter.title) {
            createNodeField({
                name: `slug`,
                node,
                value: `/${_.kebabCase(node.frontmatter.title)}`,
            })
        }
    }
}
```

> `node.frontmatter.title` contains the title of the Google Doc

## Usage

Add the plugin in your `gatsby-config.js` file:

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {
                documents: ["GOOGLE_DOCUMENT_ID_1", "GOOGLE_DOCUMENT_ID_2"], // Documents IDs can be found in Google Docs URLs
                config: {
                    // Mandatory
                    // --------
                    api_key: "YOUR_API_KEY",
                    client_id: "YOUR_CLIENT_ID",
                    client_secret: "YOUR_CLIENT_SECRET",
                    // Optional
                    // --------
                    access_type: "offline",
                    redirect_uris: [
                        "urn:ietf:wg:oauth:2.0:oob",
                        "http://localhost",
                    ],
                    scope: [
                        "https://www.googleapis.com/auth/documents.readonly",
                    ],
                    token_path: "google-docs-token.json",
                },
            },
        },
        // Add gatsby-source-filesystem to have the `MarkdownRemark` type
        {
            resolve: "gatsby-source-filesystem",
            options: {
                name: "posts",
                path: `${__dirname}/content/`,
            },
        },
        // Use gatsby-transformer-remark to modify the generated markdown
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: [],
            },
        },
    ],
}
```

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
