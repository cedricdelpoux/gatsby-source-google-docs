require("dotenv").config()

module.exports = {
  plugins: [
    {
      // resolve: "gatsby-source-google-docs",
      resolve: require.resolve(`..`),
      options: {
        folder: process.env.GOOGLE_DOCS_FOLDER,
        // --------
        // Optional
        // --------
        debug: false,
        createPages: true,
        pageContext: [],
        skipImages: process.env.NODE_ENV === "development" ? true : false,
        imagesOptions: {width: 512, height: 512, crop: true},
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          "gatsby-remark-images",
          {
            resolve: "gatsby-remark-strava",
            options: {
              debug: true,
              stravaClientId: process.env.STRAVA_CLIENT_ID,
              stravaClientSecret: process.env.STRAVA_CLIENT_SECRET,
              stravaToken: process.env.STRAVA_TOKEN,
            },
          },
          {
            resolve: "gatsby-remark-youtube",
            options: {
              debug: true,
            },
          },
          "gatsby-remark-prismjs",
        ],
      },
    },
  ],
}
