module.exports = {
  ENV_CLIENT_ID_VAR: "GOOGLE_OAUTH_CLIENT_ID",
  ENV_CLIENT_SECRET_VAR: "GOOGLE_OAUTH_CLIENT_SECRET",
  ENV_TOKEN_VAR: "GOOGLE_DOCS_TOKEN",
  TOKEN_FIELDS: [
    "access_token",
    "refresh_token",
    "scope",
    "token_type",
    "expiry_date",
  ],
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
    escapeMdxSyntax: true,
    debug: false,
    demoteHeadings: true,
    folder: undefined,
    imagesOptions: undefined,
    keepDefaultStyle: false,
    pageContext: [],
    skipCodes: false,
    skipFootnotes: false,
    skipHeadings: false,
    skipImages: false,
    skipLists: false,
    skipQuotes: false,
    skipTables: false,
  },
  DEFAULT_TEMPLATE: "page",
}
