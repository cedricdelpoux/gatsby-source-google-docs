import {createRequire} from "module"

import dotenv from "dotenv"
import remarkGfm from "remark-gfm"

// `remark-gfm` is ESM only, which is why this config is a ".mjs" file.
const require = createRequire(import.meta.url)

dotenv.config({quiet: true})

const DEV = process.env.NODE_ENV === "development"

const config = {
  pathPrefix: "/gatsby-source-google-docs",
  plugins: [
    {
      // resolve: "gatsby-source-google-docs",
      resolve: require.resolve(`../..`),
      options: {
        // https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag
        folder: "1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag",
        // --------
        // Optional
        // --------
        debug: true,
        createPages: true,
        // skipImages: DEV ? true : false,
        imagesOptions: {
          width: DEV ? 512 : 1024,
        },
        // Documents are written as ".mdx" so `<ReactComponents />` can be
        // used inside them.
        extension: "mdx",
        // This site's own "Components" document deliberately embeds
        // "<GatsbyLogo />" as literal text to demonstrate a live component,
        // outside of any code block. Every document here is under our own
        // control and kept free of any other stray "<"/"{", so it is safe to
        // let MDX compile it as intended instead of escaping it to inert
        // text — see the "escapeMdxSyntax" option in the root README.
        escapeMdxSyntax: false,
      },
    },
    {
      resolve: "gatsby-plugin-webfonts",
      options: {
        fonts: {
          google: [
            {
              family: "Quicksand",
              variants: ["400", "700"],
              fontDisplay: "fallback",
            },
          ],
        },
        formats: ["woff2"],
        usePreload: true,
      },
    },
    "gatsby-plugin-catch-links",
    "gatsby-plugin-react-svg",
    "gatsby-plugin-layout",
    "gatsby-plugin-theme-ui",
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-plugin-mdx-embed",
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        mdxOptions: {
          // MDX v2 only supports CommonMark: without this, the tables and
          // ~~strikethrough~~ this plugin generates are rendered as raw text.
          remarkPlugins: [remarkGfm],
        },
        gatsbyRemarkPlugins: [
          "gatsby-remark-unwrap-images",
          "gatsby-remark-images",
          "gatsby-remark-gifs",
          "gatsby-remark-prismjs",
        ],
      },
    },
  ],
}

export default config
