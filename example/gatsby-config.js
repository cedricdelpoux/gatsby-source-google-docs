require("dotenv").config()

module.exports = {
  plugins: [
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      // resolve: "gatsby-source-google-docs",
      resolve: require.resolve(`..`),
      options: {
        debug: true,
        folder: process.env.GOOGLE_DOCS_FOLDER,
        imagesMaxWidth: process.env.NODE_ENV === "development" ? 512 : 1024,
        demoteHeadings: true,
      },
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: ["gatsby-remark-images", "gatsby-remark-prismjs"],
      },
    },
  ],
}
