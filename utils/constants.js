module.exports = {
  ENV_TOKEN_VAR: "GOOGLE_DOCS_TOKEN",
  DEFAULT_OPTIONS: {
    debug: false,
    fields: [],
    defaults: {},
    demoteHeadings: true,
    ignore: [],
    folders: [null],
    skip: {
      codes: false,
      footnotes: false,
      headings: false,
      images: false,
      lists: false,
      quotes: false,
      tables: false,
    },
    images: {},
    depth: undefined,
    createPages: false,
  },
  DEFAULT_TEMPLATE: "page",
}
