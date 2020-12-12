const {existsSync: exists} = require("fs")
const {resolve} = require("path")

const {DEFAULT_TEMPLATE} = require("./constants.js")

const getComponentPath = (template) => resolve(`src/templates/${template}.js`)

exports.createPages = async (
  {graphql, actions: {createPage}, reporter},
  pluginOptions
) => {
  if (!pluginOptions.createPages) return

  const fields = pluginOptions.pageContext || []

  const result = await graphql(
    `
      {
        allGoogleDocs {
          nodes {
            slug
            template
            ${fields.join(" ")}
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
    const defaultComponent = exists(getComponentPath(DEFAULT_TEMPLATE))
      ? getComponentPath(DEFAULT_TEMPLATE)
      : null

    if (allGoogleDocs) {
      allGoogleDocs.nodes.forEach(({slug, template, ...context}) => {
        let component = defaultComponent

        if (template && exists(getComponentPath(template))) {
          component = getComponentPath(template)
        }

        if (!component) {
          const defaultTemplateError = `Default template "${DEFAULT_TEMPLATE}" not found.`

          if (template) {
            throw new Error(
              `template "${template}" not found. ${defaultTemplateError}`
            )
          }

          throw new Error(
            `missing template for "${slug}". ${defaultTemplateError}`
          )
        }

        createPage({
          path: slug,
          component,
          context,
        })
      })
    }
  } catch (e) {
    reporter.panic(`source-google-docs: ` + e.message)
  }
}
