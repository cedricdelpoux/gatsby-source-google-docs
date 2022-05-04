require("dotenv").config()

module.exports = {
  plugins: [
    {
      resolve: require.resolve(`../..`),
      options: {
        // https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag
        folder: "1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag",
        createPages: true,
        skipImages: false,
        debug: true,
      },
    },
    "gatsby-plugin-image",
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
