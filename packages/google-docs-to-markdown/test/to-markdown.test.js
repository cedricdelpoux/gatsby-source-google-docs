import {expect, test} from "vitest"

import {GoogleDocument, toMarkdown} from "../index.js"
import documentCover from "./documents/cover.json" with {type: "json"}
import documentLinks from "./documents/links.json" with {type: "json"}
import documentTexts from "./documents/texts.json" with {type: "json"}

test("converts a document like GoogleDocument does", () => {
  const options = {demoteHeadings: true, keepDefaultStyle: true}

  expect(toMarkdown(documentTexts, options)).toBe(
    new GoogleDocument(documentTexts, options).toMarkdown()
  )
})

test("writes the frontmatter and the related documents", () => {
  const markdown = toMarkdown(documentLinks, {
    frontmatter: {title: "Links"},
    links: {[documentLinks.documentId]: "/links"},
  })

  expect(markdown).toMatch(/^---\ntitle: Links\nrelated:\n {2}- [\w-]+\n---\n/)
})

test("quotes the strings a YAML 1.1 parser would read as another type", () => {
  // gray-matter, used by gatsby-transformer-remark and gatsby-plugin-mdx,
  // parses YAML 1.1, where an unquoted date is a Date and "yes" a boolean
  const markdown = toMarkdown(documentTexts, {
    frontmatter: {createdTime: "2021-01-06T17:27:14.445Z", draft: "yes"},
  })

  expect(markdown).toContain('createdTime: "2021-01-06T17:27:14.445Z"\n')
  expect(markdown).toContain('draft: "yes"\n')
})

test("lists the images it writes, the cover first", () => {
  const googleDocument = new GoogleDocument(documentCover)

  expect(googleDocument.images).toEqual([
    {
      id: expect.any(String),
      url: googleDocument.cover.image,
      title: googleDocument.cover.title,
      alt: googleDocument.cover.alt,
    },
  ])
  expect(new GoogleDocument(documentCover, {skipImages: true}).images).toEqual(
    []
  )
})

test("lists an image once when two objects share its URL", () => {
  const image = (title) => ({
    inlineObjectProperties: {
      embeddedObject: {title, imageProperties: {contentUri: "https://image"}},
    },
  })
  const paragraph = (id) => ({
    paragraph: {
      paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
      elements: [{inlineObjectElement: {inlineObjectId: id}}],
    },
  })
  const document = {
    body: {content: [paragraph("kix.first"), paragraph("kix.second")]},
    inlineObjects: {"kix.first": image("First"), "kix.second": image("")},
  }

  expect(new GoogleDocument(document).images).toEqual([
    {id: "kix.first", url: "https://image", title: "First", alt: ""},
  ])
})
