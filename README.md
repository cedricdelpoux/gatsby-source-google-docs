# gatsby-source-google-docs

[![npm package][npm-badge]][npm]

`gatsby-source-google-docs` is a [Gatsby](https://www.gatsbyjs.org/) plugin to use Google Docs as a data source.

🔥 No need for a CMS anymore.
🖋 Write your blog posts on Google Docs.
🗂 Organize your documents in one or multiple folder in Google Drive
🤡 Add custom metadata fields to yours documents

It's that simple

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

-   Follow the [Step 1: Turn ON the Google Docs API](https://developers.google.com/docs/api/quickstart/js)
-   Turn ON the [Google Drive API](https://developers.google.com/drive/api/v3/quickstart/nodejs)
-   Get a `client_id` and a `client_secret` from the Google console. If you downloaded `credential.json` file, you can extract them from it
-   Get an `api_key` from the Google console
-   Fill the `gatsby-source-google-docs` gatsby config object.

> More info can be found [on the official Google Docs quickstart guide](https://developers.google.com/docs/api/quickstart/js).

### Generate a token file

Run `gatsby develop` to generate a token file.

> `token_path` can be customized in the configuration object.

## Usage

### Add the plugin to your configuration:

In your `gatsby-node.js` file, configure the `gatsby-source-google-docs` and the `gatsby-transformer-remark` plugins:

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {
                // Mandatory
                // --------
                foldersIds: ["FOLDER_ID_1", "FOLDER_ID_2"], // folders Ids can be found in Google Drive URLs
                config: {
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
                        "https://www.googleapis.com/auth/documents.readonly", // GoogleDocs API read access
                        "https://www.googleapis.com/auth/drive.metadata.readonly", // GoogleDrive API read access
                    ],
                    token_path: "google-docs-token.json",
                },
                // Optional
                // --------
                fields: ["createdTime"], // https://developers.google.com/drive/api/v3/reference/files#resource
                fieldsMapper: {createdTime: "date", name: "title"}, // To rename fields
            },
        },
        // Use gatsby-transformer-remark to modify the generated markdown
        // Not mandatary, but recommanded to be compliant with gatsby remark ecosystem
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: [],
            },
        },
    ],
}
```

### Add an automatic slug generation

Modify your `onCreateNode` function in your `gatsby-node.js` to generate a `slug` field:

```js
const _kebabCase = require("lodash/kebabCase") // Optional, you can use the lib you want or generate slug manually

exports.onCreateNode = ({node, actions}) => {
    // You need to enable `gatsby-transformer-remark` to transform `GoogleDocs` type to `MarkdownRemark` type.
    if (node.internal.type === `MarkdownRemark` && node.frontmatter.name) {
        actions.createNodeField({
            name: `slug`,
            node,
            value: `/${_kebabCase(node.frontmatter.name)}`,
        })
    }
}
```

> `node.frontmatter.name` contains the title of the Google Doc

### Create a post template

Create a `src/templates/post.js` file where you will define your post template:

```js
const PostTemplate = ({data: {post}}) => (
    <>
        <h1>{post.frontmatter.name}</h1>
        <p>{post.frontmatter.createdTime}</p>
        <div dangerouslySetInnerHTML={{__html: post.html}} />
    </>
)

export default PostTemplate

// You need to enable `gatsby-transformer-remark` to query `markdownRemark`.
// If you don't use it, query `googleDocs`
export const pageQuery = graphql`
    query BlogPostBySlug($slug: String!) {
        post: markdownRemark(fields: {slug: {eq: $slug}}) {
            html
            frontmatter {
                name
                createdTime(formatString: "DD MMMM YYYY", locale: "fr")
            }
        }
    }
`
```

### Create a page for each post

Use the `createPages` API from gatsby in your `gatsby-node.js` to create a page for each post.

```js
// You need to enable `gatsby-transformer-remark` to query `allMarkdownRemark`.
// If you don't use it, query `allGoogleDocs`
exports.createPages = async ({graphql, actions}) =>
    graphql(
        `
            {
                allMarkdownRemark(
                    sort: {fields: [frontmatter___createdTime], order: DESC}
                ) {
                    edges {
                        node {
                            fields {
                                slug
                            }
                        }
                    }
                }
            }
        `
    ).then(result => {
        result.data.allMarkdownRemark.edges.forEach((post, index) => {
            actions.createPage({
                path: post.node.fields.slug,
                component: path.resolve(`./src/templates/post.js`),
                context: {
                    slug: post.node.fields.slug,
                },
            })
        })
    })
```

### Add extra data

If you need more data attached to your documents, fill the description field in `Google Drive` with a JSON object:

```JSON
{
    "date": "2019-01-01",
    "author": "Yourself",
    "category": "yourCageory",
    "tags": ["tag1", "tag2"]
}
```

JSON will be transformed to YAML and added to your markdown frontmatter and ovveride the existing ones.

> /!\ Do not use `id`, `name`, `description` or any `Google Docs` field you add to the config `fields` option

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
