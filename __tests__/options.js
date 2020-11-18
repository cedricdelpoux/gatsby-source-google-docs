const documentLinks = require("./documents/links.json")
const documentTexts = require("./documents/texts.json")
const {GoogleDocument} = require("../utils/google-document")

test(`"DemoteHeading" option`, () => {
  const options = {demoteHeadings: true}
  const googleDocument = new GoogleDocument(documentTexts, {}, options)
  expect(googleDocument.toMarkdown()).toMatchSnapshot()
})

test(`Crosslinks between documents`, () => {
  const options = {
    internalLinks: {
      [documentLinks.documentId]: "/relative-path",
      ["unknow"]: "/404",
    },
  }
  const googleDocument = new GoogleDocument(documentLinks, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})
