# Create pages

## Create template

Create a `src/templates/page.js` file where you will define your page template:

```js
export default ({
    data: {
        googleDocs: {
            name: title,
            childMarkdownRemark: {html},
        },
    },
}) => (
    <>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{__html: html}} />
    </>
)

export const pageQuery = graphql`
    query Page($path: String!) {
        googleDocs(slug: {eq: $path}) {
            name
            childMarkdownRemark {
                html
            }
        }
    }
`
```

## Create a page for GoogleDocs document

Add this to `gatsby-node.js`

```js
const path = require(`path`)

exports.createPages = async ({graphql, actions}) =>
    graphql(
        `
            {
                allGoogleDocs {
                    nodes {
                        slug
                    }
                }
            }
        `
    ).then((result) => {
        result.data.allGoogleDocs.nodes.forEach(({slug}) => {
            createPage({
                path: slug,
                component: resolve(`src/templates/page.js`),
            })
        })
    })
```
