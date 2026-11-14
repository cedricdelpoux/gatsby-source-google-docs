import {describe, expect, test} from "vitest"

import {GoogleDocument, toMarkdown} from "../index.js"

const createDocument = (content, extra) => ({
  body: {content},
  namedStyles: {styles: [{namedStyleType: "NORMAL_TEXT", textStyle: {}}]},
  ...extra,
})

const createParagraph = (elements) => ({
  paragraph: {paragraphStyle: {namedStyleType: "NORMAL_TEXT"}, elements},
})

const createImage = (id) => ({inlineObjectElement: {inlineObjectId: id}})

const createInlineObject = (url) => ({
  inlineObjectProperties: {
    embeddedObject: {imageProperties: {contentUri: url}},
  },
})

const createCell = (elements) => ({content: [{paragraph: {elements}}]})

describe("GoogleDocument formatText special cases", () => {
  test("renders a person tag as the person name", () => {
    const document = createDocument([
      createParagraph([{person: {personProperties: {name: "Alice"}}}]),
    ])

    expect(toMarkdown(document).trim()).toBe("Alice")
  })

  test("renders a rich link as a markdown link", () => {
    const document = createDocument([
      createParagraph([
        {
          richLink: {
            richLinkProperties: {title: "Gatsby", uri: "https://gatsbyjs.com"},
          },
        },
      ]),
    ])

    expect(toMarkdown(document).trim()).toBe("[Gatsby](https://gatsbyjs.com)")
  })

  test("ignores non-paragraph content elements inside table cells", () => {
    const document = createDocument([
      {
        table: {
          tableRows: [
            {
              tableCells: [
                {
                  content: [
                    {notAParagraph: true},
                    {
                      paragraph: {
                        elements: [
                          {textRun: {content: "Hello", textStyle: {}}},
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ])

    expect(toMarkdown(document)).toContain("Hello")
  })

  test("does not hang on texts containing exotic whitespaces", () => {
    const words = new Array(40).fill("word").join(" ")
    const document = createDocument([
      createParagraph([
        {
          textRun: {
            // U+2028 (line separator) and U+00A0 (non breaking space)
            // are commonly pasted from other editors
            content: ` ${words}\u2028${words}\u00a0${words} `,
            textStyle: {},
          },
        },
      ]),
    ])

    const start = Date.now()
    const markdown = toMarkdown(document)

    expect(Date.now() - start).toBeLessThan(1000)
    expect(markdown.trim()).toBe(`${words} ${words}\u00a0${words}`)
  })

  test("keeps images inside table cells", () => {
    const document = createDocument(
      [
        {
          table: {
            tableRows: [
              {
                tableCells: [
                  createCell([createImage("i1")]),
                  createCell([createImage("i2")]),
                ],
              },
              {
                tableCells: [
                  createCell([createImage("i3")]),
                  createCell([{textRun: {content: "Text", textStyle: {}}}]),
                ],
              },
            ],
          },
        },
      ],
      {
        inlineObjects: {
          i1: createInlineObject("https://image.com/1"),
          i2: createInlineObject("https://image.com/2"),
          i3: createInlineObject("https://image.com/3"),
        },
      }
    )

    const googleDocument = new GoogleDocument(document)

    expect(googleDocument.elements).toEqual([
      {
        type: "table",
        value: {
          headers: [
            '![](https://image.com/1 "")',
            '![](https://image.com/2 "")',
          ],
          rows: [['![](https://image.com/3 "")', "Text"]],
        },
      },
    ])
    expect(googleDocument.images.map(({id}) => id)).toEqual(["i1", "i2", "i3"])
  })
})
