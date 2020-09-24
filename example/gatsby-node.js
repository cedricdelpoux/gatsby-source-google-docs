const {resolve} = require("path")

exports.createPages = async ({graphql, actions: {createPage}, reporter}) => {
  const result = await graphql(
    `
      {
        allGoogleDocs {
          nodes {
            path
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panic(result.errors)
  }

  try {
    const {allGoogleDocs} = result.data

    if (allGoogleDocs) {
      allGoogleDocs.nodes.forEach(({path}) => {
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
