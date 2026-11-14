import {expect, test} from "vitest"

import {toMarkdown} from "../index.js"
import documentCodes from "./documents/codes.json" with {type: "json"}
import documentFootnotes from "./documents/footnotes.json" with {type: "json"}
import documentImages from "./documents/images.json" with {type: "json"}
import documentLinks from "./documents/links.json" with {type: "json"}
import documentLists from "./documents/lists.json" with {type: "json"}
import documentQuotes from "./documents/quotes.json" with {type: "json"}
import documentTables from "./documents/tables.json" with {type: "json"}
import documentTexts from "./documents/texts.json" with {type: "json"}

const createDocument = (content) => ({
  body: {
    content: [
      {
        paragraph: {
          elements: [{textRun: {content, textStyle: {}}}],
          paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
        },
      },
    ],
  },
})

test(`"KeepDefaultStyle" option`, () => {
  expect(toMarkdown(documentTexts, {keepDefaultStyle: true})).toMatchSnapshot()
})

test(`"DemoteHeading" option enabled`, () => {
  expect(toMarkdown(documentTexts, {demoteHeadings: true})).toMatchSnapshot()
})

test(`"DemoteHeading" option disabled`, () => {
  expect(toMarkdown(documentTexts, {demoteHeadings: false})).toMatchSnapshot()
})

test(`Crosslinks between documents`, () => {
  const links = {
    [documentLinks.documentId]: "/relative-path",
    ["unknow"]: "/404",
  }

  expect(toMarkdown(documentLinks, {links})).toMatchSnapshot()
})

test.each([
  ["Skip headings", "skipHeadings", documentTexts],
  ["Skip images", "skipImages", documentImages],
  ["Skip footnotes", "skipFootnotes", documentFootnotes],
  ["Skip lists", "skipLists", documentLists],
  ["Skip quotes", "skipQuotes", documentQuotes],
  ["Skip codes", "skipCodes", documentCodes],
  ["Skip tables", "skipTables", documentTables],
])("%s", (_, option, document) => {
  expect(toMarkdown(document, {[option]: true})).toMatchSnapshot()
})

test(`"mdx" option escapes MDX syntax and emits JSX styles`, () => {
  const markdown = toMarkdown(documentTexts, {
    mdx: true,
    keepDefaultStyle: true,
  })

  // `style` as a string makes React throw once the page renders
  expect(markdown).not.toMatch(/<span style='/)
  expect(markdown).toMatch(/<span style=\{\{/)
  // camelCased properties, as JSX requires
  expect(markdown).not.toMatch(/"font-size"/)

  expect(markdown).toMatchSnapshot()
})

test(`"mdx" option escapes braces and angle brackets in text`, () => {
  const document = createDocument("Use {props} and a <Component /> here")
  const asMarkdown = toMarkdown(document)
  const asMdx = toMarkdown(document, {mdx: true})

  // MDX would read these as an expression and a JSX tag
  expect(asMarkdown).toContain("{props}")
  expect(asMdx).toContain("\\{props}")
  expect(asMdx).toContain("\\<Component />")
})

test(`"escapeMdxSyntax: false" lets a well-formed literal component compile as JSX`, () => {
  const document = createDocument("Will render: <GatsbyLogo />")
  const escaped = toMarkdown(document, {mdx: true})
  const raw = toMarkdown(document, {mdx: true, escapeMdxSyntax: false})

  expect(escaped).toContain("\\<GatsbyLogo />")
  expect(raw).toContain("<GatsbyLogo />")
  expect(raw).not.toContain("\\<")
})
