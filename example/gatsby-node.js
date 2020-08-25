const {resolve} = require("path")

exports.createPages = async ({graphql, actions: {createPage}, reporter}) => {
  const result = await graphql(
    `
      {
        allMarkdownRemark {
          nodes {
            frontmatter {
              path
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panic(result.errors)
  }

  try {
    const {allMarkdownRemark} = result.data

    if (allMarkdownRemark) {
      allMarkdownRemark.nodes.forEach(({frontmatter: {path}}) => {
        createPage({
          path,
          component: resolve(`src/templates/page.js`),
        })
      })
    }
  } catch (e) {
    console.error(e)
  }
}
