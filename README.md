# gatsby-source-google-docs

[![npm package][npm-badge]][npm]

`gatsby-source-google-docs` is a [Gatsby](https://www.gatsbyjs.org/) plugin to use Google Docs as a data source.

-   🔥 No need for a CMS anymore.
-   🖋 Write your blog posts on Google Docs.
-   🗂 Organize your documents in one or multiple folder in Google Drive (trees allowed)
-   🤡 Add custom metadata fields to your documents

It's that simple!

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

> `token_path` can be customized in the configuration object (`config/token_path`).

## Usage

### Add the plugin to your configuration:

In your `gatsby-config.js` file, configure the `gatsby-source-google-docs` and the `gatsby-transformer-remark` plugins:

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
                    // There are three different ways to set your token
                    token: {
                        access_token: "...",
                        refresh_token: "...",
                        scope: "...",
                        token_type: "Bearer",
                        expiry_date: 1556201561825,
                    },
                    // or
                    token_path: "google-docs-token.json",
                    // or
                    token_env_variable: "GATSBY_GOOGLE_DOCS_TOKEN",
                },
                // Optional
                // --------
                fields: ["createdTime"], // https://developers.google.com/drive/api/v3/reference/files#resource
                fieldsMapper: {createdTime: "date", name: "title"}, // To rename fields
                fieldsDefault: {draft: false}, // To add default fields values
                convertImgToNode: true, // To convert images to remote node files
                debug: true, // To display folders names
                timeBetweenCalls: 2000, // To prevent reaching Google api short limits
            },
        },
        // Use gatsby-transformer-remark to modify the generated markdown
        // Not mandatory, but recommended to be compliant with the Gatsby remark ecosystem
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
exports.onCreateNode = ({node, actions}) => {
    // You need to enable `gatsby-transformer-remark` to transform `GoogleDocs` type to `MarkdownRemark` type.
    if (node.internal.type === `MarkdownRemark`) {
        const customSlug = node.frontmatter.slug // If you add extra data `slug` with description field
        actions.createNodeField({
            name: `slug`,
            node,
            value: customSlug || node.frontmatter.path,
        })
    }
}
```

> `node.frontmatter.name` contains the title of the Google Doc

### Create a post template

Create a `src/templates/post.js` file where you will define your post template:

```jsx
import React from "react"

const PostTemplate = ({data: {post}}) => (
    <>
        <h1>{post.frontmatter.name}</h1>
        <p>{post.frontmatter.date}</p>
        <div dangerouslySetInnerHTML={{__html: post.html}} />
    </>
)

export default PostTemplate

// You need to enable `gatsby-transformer-remark` to query `markdownRemark`.
// If you don't use it, query `googleDocs`
// If you use convertImgToNode then add googleDocImages query
export const pageQuery = graphql`
    query BlogPostBySlug($slug: String!) {
        post: markdownRemark(fields: {slug: {eq: $slug}}) {
            html
            frontmatter {
                name
                date(formatString: "DD MMMM YYYY", locale: "fr")
            }
        }
        googleDocImages: allFile(
            filter: {name: {glob: "google-doc-image-**"}}
        ) {
            edges {
                node {
                    id
                    name
                    childImageSharp {
                        fluid {
                            base64
                            tracedSVG
                            aspectRatio
                            src
                            srcSet
                            srcWebp
                            srcSetWebp
                            sizes
                            originalImg
                            originalName
                            presentationWidth
                            presentationHeight
                        }
                    }
                }
            }
        }
    }
`
```

### Create a page for each post

Use the `createPages` API from gatsby in your `gatsby-node.js` to create a page for each post.

```js
const path = require("path")

// You need to enable `gatsby-transformer-remark` to query `allMarkdownRemark`.
// If you don't use it, query `allGoogleDocs`
exports.createPages = async ({graphql, actions}) =>
    graphql(
        `
            {
                allMarkdownRemark(
                    sort: {fields: [frontmatter___date], order: DESC}
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
        if (result.errors) {
            throw result.errors
        }
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
    "slug": "custom-url",
    "date": "2019-01-01",
    "author": "Yourself",
    "category": "yourCageory",
    "tags": ["tag1", "tag2"]
}
```

JSON will be transformed to YAML and added to your markdown frontmatter and ovveride the existing ones.

> /!\ Do not use `id`, `name`, `description` or any `Google Docs` field you add to the config `fields` option

### If convertImgToNode is enabled. You will need to search the id in the HTML file and replace it with Gatsby image tag

### Create a post template

Create a `src/templates/post.js` file where you will define your post template:

```jsx
import React from "react"
import Img from "gatsby-image"
import parse from "html-react-parser"

const PostTemplate = ({data: {post, googleDocImages}}) => {
    //This is needed if convertImgToNode is enabled
    const options = {
        replace: domNode => {
            const {children} = domNode
            if (!children) return
            const hasImgTag = children.find(img => img.name === "img")
            if (hasImgTag) {
                const {attribs} = hasImgTag
                const {src, alt} = attribs
                return (
                    <Img
                        fluid={
                            googleDocImages.edges.find(
                                ({node}) => node.id === src
                            ).node.childImageSharp.fluid
                        }
                        alt={alt}
                        className="ui fluid image"
                    />
                )
            }
        },
    }
    const htmlContent = parse(post.html, options)
    return (
        <>
            <h1>{post.frontmatter.name}</h1>
            <p>{post.frontmatter.date}</p>
            <React.Fragment>{htmlContent}</React.Fragment>
        </>
    )
}

export default PostTemplate

// You need to enable `gatsby-transformer-remark` to query `markdownRemark`.
// If you don't use it, query `googleDocs`
// If you use convertImgToNode then add googleDocImages query
export const pageQuery = graphql`
    query BlogPostBySlug($slug: String!) {
        post: markdownRemark(fields: {slug: {eq: $slug}}) {
            html
            frontmatter {
                name
                date(formatString: "DD MMMM YYYY", locale: "fr")
            }
        }
        googleDocImages: allFile(
            filter: {name: {glob: "google-doc-image-**"}}
        ) {
            edges {
                node {
                    id
                    name
                    childImageSharp {
                        fluid {
                            base64
                            tracedSVG
                            aspectRatio
                            src
                            srcSet
                            srcWebp
                            srcSetWebp
                            sizes
                            originalImg
                            originalName
                            presentationWidth
                            presentationHeight
                        }
                    }
                }
            }
        }
    }
`
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
