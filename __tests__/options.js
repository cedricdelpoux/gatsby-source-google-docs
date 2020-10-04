const documentTexts = require("./documents/texts.json")
const {GoogleDocument} = require("../utils/google-document")

test(`"DemoteHeading" option`, () => {
  const googleDocument = new GoogleDocument(
    documentTexts,
    {},
    {demoteHeadings: true}
  )
  const documentObject = googleDocument.toObject()
  expect(documentObject).toMatchSnapshot()
})

test(`Crosslinks between documents`, () => {
  const options = {
    crosslinksPaths: {
      [documentTexts.documentId]: "/relative-path",
    },
  }
  const googleDocument = new GoogleDocument(documentTexts, {}, options)
  const documentObject = googleDocument.toObject()
  expect(documentObject).toMatchSnapshot()
})
