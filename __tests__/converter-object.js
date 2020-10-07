const fs = require("fs")
const path = require(`path`)

const {GoogleDocument} = require("../utils/google-document")

const documentsPath = path.join(__dirname, "documents")
const filenames = fs.readdirSync(documentsPath)

filenames.forEach(function (filename) {
  const filepath = path.join(documentsPath, filename)
  const file = fs.readFileSync(filepath, "utf8")
  const sourceDoc = JSON.parse(file)
  const googleDocument = new GoogleDocument(sourceDoc)

  test(`Document "${googleDocument.document.title}" to Object`, () => {
    const documentObject = googleDocument.toObject()
    expect(documentObject).toMatchSnapshot()
  })

  if (filename === "texts.json" || filename === "links.json") {
    const options = {
      crosslinksPaths: {[sourceDoc.documentId]: "/itself"},
    }
    const doc = new GoogleDocument(JSON.parse(file), {}, options)
    test(`Document "${googleDocument.document.title}" to Object with links `, () => {
      const documentObject = doc.toObject()
      expect(documentObject).toMatchSnapshot()
    })
  }
})
