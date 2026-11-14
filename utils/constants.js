module.exports = {
  DEFAULT_OPTIONS: {
    createPages: false,
    // Documents are written as real files: `gatsby-plugin-mdx` v4+ only reads
    // MDX from the filesystem, and `gatsby-remark-images` resolves image paths
    // relative to the directory of the file the markdown came from.
    outputDir: "content/google-docs",
    // The documents and images fetched from Google, kept between builds so
    // that only what changed is fetched again
    cacheDir: ".google-docs",
    extension: "md",
    debug: false,
    demoteHeadings: true,
    folder: undefined,
    imagesOptions: undefined,
    pageContext: [],
  },
  DEFAULT_TEMPLATE: "page",
}
