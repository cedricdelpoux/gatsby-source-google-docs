import {unified} from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

// `unified` and its plugins are ESM only, which is why this file is a
// ".mjs" (Gatsby resolves "gatsby-node.mjs" the same way as "gatsby-node.js").

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify)

// Strip the YAML frontmatter this plugin writes: the `File` node's content
// is the whole ".mdx" file, frontmatter included.
const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n/

/**
 * Add a `staticHtml` field to `Mdx` nodes: the document body compiled to
 * plain HTML, with no JSX evaluation.
 *
 * `gatsby-plugin-mdx` v4+ only compiles MDX into a page component wired up
 * through `createPages`'s `?__contentFilePath=` — there is no supported way
 * to render a document's *compiled* body from a `useStaticQuery`, which is
 * exactly what the sidebar menu needs to show the "Menu" document (a
 * `page: false` document, so it never goes through `createPages` itself).
 * The "Menu" document is plain CommonMark with no JSX in it, so rendering it
 * as static HTML is equivalent to what MDX would have produced.
 */
export const createResolvers = ({createResolvers}) => {
  createResolvers({
    Mdx: {
      staticHtml: {
        type: "String",
        async resolve(source, args, context) {
          const fileNode = context.nodeModel.getNodeById({
            id: source.parent,
            type: "File",
          })

          if (!fileNode || typeof fileNode.internal.content !== "string") {
            return null
          }

          const body = fileNode.internal.content.replace(FRONTMATTER_REGEX, "")
          const file = await processor.process(body)

          return String(file)
        },
      },
    },
  })
}
