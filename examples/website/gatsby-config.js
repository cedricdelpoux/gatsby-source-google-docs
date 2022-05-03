require("dotenv").config()

const DEV = process.env.NODE_ENV === "development"

module.exports = {
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
    // "gatsby-plugin-tailwindcss",
    "gatsby-plugin-catch-links",
    "gatsby-plugin-react-svg",
    "gatsby-plugin-eslint",
    "gatsby-plugin-layout",
    "gatsby-plugin-theme-ui",
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-plugin-mdx-embed",
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
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
