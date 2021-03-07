require("dotenv").config()

module.exports = {
  plugins: [
    {
      resolve: require.resolve(`../..`),
      options: {
        folder: process.env.GOOGLE_DOCS_FOLDER,
        createPages: true,
        keepDefaultStyle: true,
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          "gatsby-remark-unwrap-images",
          "gatsby-remark-images",
          "gatsby-remark-gifs",
        ],
      },
    },
  ],
}
