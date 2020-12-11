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
  const googleDocument = new GoogleDocument({document: documentTexts, options})
  expect(googleDocument.toMarkdown()).toMatchSnapshot()
})

test(`Crosslinks between documents`, () => {
  const links = {
    [documentLinks.documentId]: "/relative-path",
    ["unknow"]: "/404",
  }

  const googleDocument = new GoogleDocument({
    document: documentLinks,
    links,
  })
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip headings`, () => {
  const options = {
    skip: {
      headings: true,
    },
  }
  const googleDocument = new GoogleDocument({document: documentTexts, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip images`, () => {
  const options = {
    skip: {
      images: true,
    },
  }
  const googleDocument = new GoogleDocument({document: documentImages, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip footnotes`, () => {
  const options = {
    skip: {
      footnotes: true,
    },
  }
  const googleDocument = new GoogleDocument({
    document: documentFootnotes,
    options,
  })
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip lists`, () => {
  const options = {
    skip: {
      lists: true,
    },
  }
  const googleDocument = new GoogleDocument({document: documentLists, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip quotes`, () => {
  const options = {
    skip: {
      quotes: true,
    },
  }
  const googleDocument = new GoogleDocument({document: documentQuotes, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip codes`, () => {
  const options = {
    skip: {
      codes: true,
    },
  }
  const googleDocument = new GoogleDocument({document: documentCodes, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip tables`, () => {
  const options = {
    skip: {
      tables: true,
    },
  }
  const googleDocument = new GoogleDocument({document: documentTables, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})
