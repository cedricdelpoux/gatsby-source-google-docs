require("dotenv").config()

module.exports = {
  plugins: [
    {
      // resolve: "gatsby-source-google-docs",
      resolve: require.resolve(`..`),
      options: {
        debug: true,
        folders: [process.env.GOOGLE_DOCS_FOLDER],
        fields: ["createdTime", "name"],
        fieldsMapper: {createdTime: "date", name: "title"},
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-transformer-remark",
  ],
}
