require("dotenv").config()

module.exports = {
  plugins: [
    {
      // resolve: "gatsby-source-google-docs",
      resolve: require.resolve(`..`),
      options: {
        debug: true,
        folder: process.env.GOOGLE_DOCS_FOLDER,
        createPages: true,
        skipImages: process.env.NODE_ENV === "development" ? true : false,
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: ["gatsby-remark-images", "gatsby-remark-prismjs"],
      },
    },
  ],
}
