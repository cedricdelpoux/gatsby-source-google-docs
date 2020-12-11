# Create pages

## Create templates pages

By default, `gatsby-source-google-docs` will look for a default template named `page` with the following path `src/templates/page.js`.

You need to create a `src/templates/page.js` file where you will define your page template.

> You can also specify a choose a different default template. See [Options](./options.md)

```js
import {graphql} from "gatsby"
import Img from "gatsby-image"
import React from "react"

export default ({
    data: {
        page: {
            name,
            cover,
            childMarkdownRemark: {html},
        },
    },
}) => {
    return (
        <main>
            <h1>{name}</h1>
            {cover && <Img fluid={cover.image.childImageSharp.fluid} />}
            <div dangerouslySetInnerHTML={{__html: html}} />
        </main>
    )
}

export const pageQuery = graphql`
    query Page($path: String!) {
        page: googleDocs(slug: {eq: $path}) {
            name
            cover {
                image {
                    childImageSharp {
                        fluid(maxWidth: 500, quality: 100) {
                            ...GatsbyImageSharpFluid
                        }
                    }
                }
            }
            childMarkdownRemark {
                html
            }
        }
    }
`
```

## Automatic pages creation

Set `createPages` to `true` in your `gatsby-config.js`

```js
module.exports = {
    plugins: [
        "gatsby-plugin-sharp",
        "gatsby-transformer-sharp",
        {
            resolve: "gatsby-source-google-docs",
            options: {
                folder: process.env.GOOGLE_DOCS_FOLDER,
                createPages: true,
                // You also can specify a different default template
                // And extra fields that are needed in pages context
                // createPages: {
                //     template: "default-template-name",
                //     context: ["locale"],
                // },
            },
        },
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: ["gatsby-remark-images"],
            },
        },
    ],
}
```

## Manual pages creation

Copy the default `createPages` from [create-pages.js](../utils/create-pages.js), paste it in your `gatsby-node.js` and do your own recipe!
