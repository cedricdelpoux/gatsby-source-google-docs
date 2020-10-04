const fs = require("fs")
const path = require("path")
const _kebabCase = require("lodash/kebabCase")

exports.writeDocumentToTests = (googleDocument) => {
  fs.writeFileSync(
    path.join(
      process.cwd(),
      "..",
      "__tests__",
      "documents",
      `${_kebabCase(googleDocument.document.title)}.json`
    ),
    JSON.stringify(googleDocument.document)
  )
}
