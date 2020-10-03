# FAQ

## How can I get a breadcrumb?

Organize your documents in Google Drive with folders:

```
/
  ↳ Category 1
    ↳ Drafts
        ↳ Draft Post 1
    ↳ Post 1
  ↳ Category 2
    ↳ Post 2
```

Then you can query the breadcrumb:

```graphql
{
  allGoogleDocs {
    nodes {
      document {
        breadcrumb
      }
    }
  }
}

```

> `breadcrumb` field will be deleted if you don't have subtrees

## How can I add a cover?

Add an image in your [Google Doc first page header](https://support.google.com/docs/answer/86629).

Then you can query your header cover like any Sharp node.

```js
import {graphql} from "gatsby"
import Img from "gatsby-image"

const PostTemplate = ({data: {post}}) => (
    <>
        {post.frontmatter.cover && (
            <Img
                style={{width: "200px", marginBottom: "2rem"}}
                fluid={post.frontmatter.cover.image.childImageSharp.fluid}
            />
        )}
        <div dangerouslySetInnerHTML={{__html: post.html}} />
    </>
)

export const pageQuery = graphql`
    query BlogPost($path: String!) {
        post: markdownRemark(frontmatter: {path: {eq: $path}}) {
            html
            frontmatter {
                cover {
                    image {
                        childImageSharp {
                            fluid(maxWidth: 200, quality: 100) {
                                ...GatsbyImageSharpFluid
                            }
                        }
                    }
                }
            }
        }
    }
`
```

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
    plugins: ["gatsby-remark-images", "gatsby-remark-prismjs"],
  },
},
```

> If you use inline code, you should set the `noInlineHighlight` option of `gatsby-remark-prismjs` to .true` to avoid warnings during the build about missing lang

Import a `prismjs` theme in your `gatsby-browser.js`

```js
require("prismjs/themes/prism.css")
```

## How can I manage drafts?

All document into `Drafts` or `drafts` folders will be ignored.

You can also use a different name using the `ignoredFolders` option:

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

## How can I add extra data to my documents?

Fill the description field of your document in Google Drive with a JSON object:

```json
{
    "author": "Yourself",
    "category": "yourCageory",
    "tags": ["tag1", "tag2"],
    "draft": true
}
```

## How can I set a custom path for one of my document?

Fill the description field of your document in Google Drive with a YAML object containing a `path` key:

```yaml
path: custom-path
```

## How can I set a fixed date for one of my document?

Fill the description field of your document in Google Drive with a YAML object overriding Google `createdTime` field

```yaml
createdTime: 2019-01-01
```

## How can I add some metadata to one of my document?

Fill the description field of your document in Google Drive with a YAML object

```yaml
template: post
```

## How can I query images only?

```js
query GoogleDocsImages {
    googleDocImages: allFile(filter: {name: {glob: "google-docs-image-**"}}) {
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
```

## How to use `gatsby-source-google-docs` without `remark` ecosystem?

You can query the JSON and Markdown used to generate the html and do your custom processing:

```graphql
query {
    allGoogleDocs {
        nodes {
            document {
                name
                cover
                markdown
                content {
                    p
                    ul
                    img {
                        source
                        title
                        description
                    }
                }
            }
        }
    }
}
```
