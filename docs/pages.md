# Create pages

## Create template

Create a `src/templates/post.js` file where you will define your post template:

```js
export default ({data: {post}}) => (
    <>
        <h1>{post.document.name}</h1>
        <p>{post.document.createdTime}</p>
        <div
            dangerouslySetInnerHTML={{__html: post.childMarkdownRemark.html}}
        />
    </>
)

export const query = graphql`
    query($path: String) {
        post: googleDocs(document: {path: {eq: $path}}) {
            document {
                name
                createdTime
            }
            childMarkdownRemark {
                html
            }
        }
    }
`
```

## Create a page for each post

Add this to `gatsby-node.js`

```js
const path = require(`path`)

exports.createPages = async ({graphql, actions}) =>
    graphql(
        `
            {
                allGoogleDocs {
                    nodes {
                        document {
                            path
                        }
                    }
                }
            }
        `
    ).then(result => {
        result.data.allGoogleDocs.nodes.forEach(({document}, index) => {
            actions.createPage({
                path: document.path,
                component: path.resolve(`./src/templates/post.js`),
            })
        })
    })
```
