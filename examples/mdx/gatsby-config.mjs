import dotenv from "dotenv"
import {createRequire} from "module"
import remarkGfm from "remark-gfm"

// `remark-gfm` is ESM only, which is why this config is a ".mjs" file.
const require = createRequire(import.meta.url)

dotenv.config({quiet: true})

const config = {
  plugins: [
    {
      resolve: require.resolve(`../..`),
      options: {
        // https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag
        folder: "1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag",
        createPages: true,
        // Documents are written as ".mdx" files, so `gatsby-plugin-mdx` picks
        // them up and `<ReactComponents />` can be used inside them.
        extension: "mdx",
        debug: true,
      },
    },
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        mdxOptions: {
          // MDX v2 only supports CommonMark: without this, the tables and the
          // ~~strikethrough~~ this plugin generates are rendered as raw text.
          remarkPlugins: [remarkGfm],
        },
        gatsbyRemarkPlugins: ["gatsby-remark-images"],
      },
    },
  ],
}

export default config
