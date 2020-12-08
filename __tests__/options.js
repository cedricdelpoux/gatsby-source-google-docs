const documentLinks = require("./documents/links.json")
const documentTexts = require("./documents/texts.json")
const documentImages = require("./documents/images.json")
const documentFootnotes = require("./documents/footnotes.json")
const documentLists = require("./documents/lists.json")
const documentQuotes = require("./documents/quotes.json")
const documentCodes = require("./documents/codes.json")
const documentTables = require("./documents/tables.json")
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

test(`Skip headings`, () => {
  const options = {
    skipHeadings: true,
  }
  const googleDocument = new GoogleDocument(documentTexts, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip images`, () => {
  const options = {
    skipImages: true,
  }
  const googleDocument = new GoogleDocument(documentImages, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip footnotes`, () => {
  const options = {
    skipFootnotes: true,
  }
  const googleDocument = new GoogleDocument(documentFootnotes, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip lists`, () => {
  const options = {
    skipLists: true,
  }
  const googleDocument = new GoogleDocument(documentLists, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip quotes`, () => {
  const options = {
    skipQuotes: true,
  }
  const googleDocument = new GoogleDocument(documentQuotes, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip codes`, () => {
  const options = {
    skipCodes: true,
  }
  const googleDocument = new GoogleDocument(documentCodes, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip tables`, () => {
  const options = {
    skipTables: true,
  }
  const googleDocument = new GoogleDocument(documentTables, {}, options)
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})
