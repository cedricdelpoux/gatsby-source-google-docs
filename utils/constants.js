module.exports = {
  ENV_TOKEN_VAR: "GOOGLE_DOCS_TOKEN",
  DEFAULT_OPTIONS: {
    debug: false,
    fields: [],
    fieldsDefault: {},
    fieldsMapper: {},
    demoteHeadings: false,
    ignoredFolders: [],
    folders: [null],
    updateMetadata: (metadata) => metadata,
  },
}
