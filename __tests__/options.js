const documentLinks = require("./documents/links.json")
const documentTexts = require("./documents/texts.json")
const documentImages = require("./documents/images.json")
const documentFootnotes = require("./documents/footnotes.json")
const documentLists = require("./documents/lists.json")
const documentQuotes = require("./documents/quotes.json")
const documentCodes = require("./documents/codes.json")
const documentTables = require("./documents/tables.json")
const {GoogleDocument} = require("../utils/google-document")

test(`"KeepDefaultStyle" option`, () => {
  const options = {keepDefaultStyle: true}
  const googleDocument = new GoogleDocument({document: documentTexts, options})
  expect(googleDocument.toMarkdown()).toMatchSnapshot()
})

test(`"DemoteHeading" option enabled`, () => {
  const options = {demoteHeadings: true}
  const googleDocument = new GoogleDocument({document: documentTexts, options})
  expect(googleDocument.toMarkdown()).toMatchSnapshot()
})

test(`"DemoteHeading" option disabled`, () => {
  const options = {demoteHeadings: false}
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
    skipHeadings: true,
  }
  const googleDocument = new GoogleDocument({document: documentTexts, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip images`, () => {
  const options = {
    skipImages: true,
  }
  const googleDocument = new GoogleDocument({document: documentImages, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip footnotes`, () => {
  const options = {
    skipFootnotes: true,
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
    skipLists: true,
  }
  const googleDocument = new GoogleDocument({document: documentLists, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip quotes`, () => {
  const options = {
    skipQuotes: true,
  }
  const googleDocument = new GoogleDocument({document: documentQuotes, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip codes`, () => {
  const options = {
    skipCodes: true,
  }
  const googleDocument = new GoogleDocument({document: documentCodes, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`Skip tables`, () => {
  const options = {
    skipTables: true,
  }
  const googleDocument = new GoogleDocument({document: documentTables, options})
  const documentObject = googleDocument.toMarkdown()
  expect(documentObject).toMatchSnapshot()
})

test(`"extension: mdx" option escapes MDX syntax and emits JSX styles`, () => {
  const options = {extension: "mdx", keepDefaultStyle: true}
  const googleDocument = new GoogleDocument({document: documentTexts, options})
  const markdown = googleDocument.toMarkdown()

  // `style` as a string makes React throw once the page renders
  expect(markdown).not.toMatch(/<span style='/)
  expect(markdown).toMatch(/<span style=\{\{/)
  // camelCased properties, as JSX requires
  expect(markdown).not.toMatch(/"font-size"/)

  expect(markdown).toMatchSnapshot()
})

test(`"extension: mdx" escapes braces and angle brackets in text`, () => {
  const document = {
    body: {
      content: [
        {
          paragraph: {
            elements: [
              {
                textRun: {
                  content: "Use {props} and a <Component /> here",
                  textStyle: {},
                },
              },
            ],
            paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
          },
        },
      ],
    },
  }

  const asMarkdown = new GoogleDocument({document, options: {}}).toMarkdown()
  const asMdx = new GoogleDocument({
    document,
    options: {extension: "mdx"},
  }).toMarkdown()

  // MDX would read these as an expression and a JSX tag
  expect(asMarkdown).toContain("{props}")
  expect(asMdx).toContain("\\{props}")
  expect(asMdx).toContain("\\<Component />")
})

test(`"escapeMdxSyntax: false" lets a well-formed literal component compile as JSX`, () => {
  const document = {
    body: {
      content: [
        {
          paragraph: {
            elements: [
              {
                textRun: {
                  content: "Will render: <GatsbyLogo />",
                  textStyle: {},
                },
              },
            ],
            paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
          },
        },
      ],
    },
  }

  const escaped = new GoogleDocument({
    document,
    options: {extension: "mdx"},
  }).toMarkdown()
  const raw = new GoogleDocument({
    document,
    options: {extension: "mdx", escapeMdxSyntax: false},
  }).toMarkdown()

  expect(escaped).toContain("\\<GatsbyLogo />")
  expect(raw).toContain("<GatsbyLogo />")
  expect(raw).not.toContain("\\<")
})
