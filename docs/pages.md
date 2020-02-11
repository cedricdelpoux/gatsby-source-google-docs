# Create pages

## Create template

Create a `src/templates/post.js` file where you will define your post template:

```js
export default ({data: {post}}) => (
    <>
        <h1>{post.frontmatter.name}</h1>
        <p>{post.frontmatter.createdTime}</p>
        <div dangerouslySetInnerHTML={{__html: post.html}} />
    </>
)

export const pageQuery = graphql`
    query Post($path: String!) {
        post: markdownRemark(fields: {path: {eq: $path}}) {
            html
            frontmatter {
                name
                createdTime
            }
        }
    }
`
```

## Create a page for each post

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
