const {existsSync: exists} = require("fs")
const {resolve} = require("path")

const _merge = require("lodash/merge")

const {DEFAULT_OPTIONS, DEFAULT_TEMPLATE} = require("./constants.js")
const {getTransformer, TRANSFORMERS} = require("./get-transformer")

const getComponentPath = (template) =>
  template.includes(".")
    ? resolve(`src/templates/${template}`)
    : resolve(`src/templates/${template}.js`)

exports.createPages = async (
  {graphql, actions: {createPage}, store, reporter},
  pluginOptions
) => {
  if (!pluginOptions.createPages) return

  const options = _merge({}, DEFAULT_OPTIONS, pluginOptions)
  const transformer = getTransformer({store})

  if (!transformer) return

  const {allField} = TRANSFORMERS[transformer]
  const isMdx = transformer === "mdx"
  const fields = options.pageContext || []

  // The path of the file each node came from: it tells the documents of this
  // plugin apart from any other markdown the site sources, and MDX needs it on
  // the component path anyway.
  const filePathField = isMdx
    ? "internal { contentFilePath }"
    : "fileAbsolutePath"

  const result = await graphql(`
    {
      ${allField} {
        nodes {
          ${filePathField}
          frontmatter {
            slug
            template
            page
            ${fields.join(" ")}
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panic(result.errors)
  }

  try {
    const outputDir = resolve(options.outputDir)
    const defaultComponent = exists(getComponentPath(DEFAULT_TEMPLATE))
      ? getComponentPath(DEFAULT_TEMPLATE)
      : null
    const nodes = (result.data[allField] && result.data[allField].nodes) || []

    nodes.forEach((node) => {
      const contentFilePath = isMdx
        ? node.internal.contentFilePath
        : node.fileAbsolutePath

      // Other markdown of the site shares these GraphQL types, and must not
      // get pages created for it here.
      if (!contentFilePath || !resolve(contentFilePath).startsWith(outputDir)) {
        return
      }

      const {slug, template, page, ...context} = node.frontmatter

      if (page === false) return

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
        // Since v4, `gatsby-plugin-mdx` renders the document body as the
        // template's `children`, and only wires it up when the component path
        // carries the file to compile.
        component: isMdx
          ? `${component}?__contentFilePath=${contentFilePath}`
          : component,
        context: {
          // `slug` is provided explicitly because Gatsby's auto-injected
          // `path` variable is normalized by the `trailingSlash` option
          // (defaults to "always" since Gatsby 5) and no longer matches
          // the raw `slug` stored in the frontmatter.
          slug,
          ...context,
        },
      })
    })
  } catch (e) {
    reporter.panic(`source-google-docs: ` + e.message)
  }
}
