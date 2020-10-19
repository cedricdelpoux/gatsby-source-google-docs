const documentLinks = require("./documents/links.json")
const documentTexts = require("./documents/texts.json")
const {GoogleDocument} = require("../utils/google-document")

test(`"DemoteHeading" option`, () => {
  const googleDocument = new GoogleDocument(
    documentTexts,
    {},
    {demoteHeadings: true, enableFontSize: false}
  )
  expect(googleDocument.toMarkdown()).toMatchSnapshot()
})

test(`Crosslinks between documents`, () => {
  const options = {
    crosslinksPaths: {
      [documentLinks.documentId]: "/relative-path",
      ["unknow"]: "/404",
    },
    enableFontSize: false,
  }
  const googleDocument = new GoogleDocument(documentLinks, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})
