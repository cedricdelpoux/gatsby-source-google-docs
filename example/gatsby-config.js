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
        demoteHeadings: true,
        skipImages: process.env.NODE_ENV === "development" ? true : false,
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
