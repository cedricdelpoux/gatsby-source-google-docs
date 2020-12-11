const {existsSync: exists} = require("fs")
const {resolve} = require("path")

const {DEFAULT_TEMPLATE} = require("./constants")

const getTemplatePath = (template) => resolve(`src/templates/${template}.js`)

exports.createPages = async (
  {graphql, actions: {createPage}, reporter},
  pluginOptions
) => {
  if (!pluginOptions.createPages) return

  const fields = pluginOptions.createPages.context || []
  const defaultTemplate = pluginOptions.createPages.template || DEFAULT_TEMPLATE

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

    if (allGoogleDocs) {
      allGoogleDocs.nodes.forEach(({slug, template, ...context}) => {
        let component = getTemplatePath(defaultTemplate)

        if (template && exists(getTemplatePath(template))) {
          component = getTemplatePath(template)
        }

        if (!exists(component)) {
          reporter.warn(
            `source-google-docs: skipping "${slug}" page. template "${component}" does not exist`
          )
          return
        }

        createPage({
          path: slug,
          component,
          context,
        })
      })
    }
  } catch (e) {
    reporter.panic(`source-google-docs: createPages`, e)
  }
}
