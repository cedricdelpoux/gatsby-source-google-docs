const {GoogleDocument} = require("../utils/google-document")

describe("GoogleDocument formatText special cases", () => {
  test("renders a person tag as the person name", () => {
    const document = {
      title: "Person Tag",
      body: {
        content: [
          {
            paragraph: {
              paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
              elements: [
                {
                  person: {
                    personProperties: {
                      name: "Alice",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      namedStyles: {
        styles: [
          {
            namedStyleType: "NORMAL_TEXT",
            textStyle: {},
          },
        ],
      },
    }

    const googleDocument = new GoogleDocument({document})
    expect(googleDocument.toMarkdown().trim()).toBe("Alice")
  })

  test("renders a rich link as a markdown link", () => {
    const document = {
      title: "Rich Link",
      body: {
        content: [
          {
            paragraph: {
              paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
              elements: [
                {
                  richLink: {
                    richLinkProperties: {
                      title: "Gatsby",
                      uri: "https://gatsbyjs.com",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      namedStyles: {
        styles: [
          {
            namedStyleType: "NORMAL_TEXT",
            textStyle: {},
          },
        ],
      },
    }

    const googleDocument = new GoogleDocument({document})
    expect(googleDocument.toMarkdown().trim()).toBe(
      "[Gatsby](https://gatsbyjs.com)"
    )
  })

  test("ignores non-paragraph content elements inside table cells", () => {
    const document = {
      title: "Table Cell Fallback",
      body: {
        content: [
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
                              {
                                textRun: {
                                  content: "Hello",
                                  textStyle: {},
                                },
                              },
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
        ],
      },
      namedStyles: {
        styles: [
          {
            namedStyleType: "NORMAL_TEXT",
            textStyle: {},
          },
        ],
      },
    }

    const googleDocument = new GoogleDocument({document})
    expect(googleDocument.toMarkdown()).toContain("Hello")
  })

  test("does not hang on texts containing exotic whitespaces", () => {
    const words = new Array(40).fill("word").join(" ")
    const document = {
      title: "Exotic Whitespaces",
      body: {
        content: [
          {
            paragraph: {
              paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
              elements: [
                {
                  textRun: {
                    // U+2028 (line separator) and U+00A0 (non breaking space)
                    // are commonly pasted from other editors
                    content: ` ${words}\u2028${words}\u00a0${words} `,
                    textStyle: {},
                  },
                },
              ],
            },
          },
        ],
      },
      namedStyles: {
        styles: [
          {
            namedStyleType: "NORMAL_TEXT",
            textStyle: {},
          },
        ],
      },
    }

    const start = Date.now()
    const googleDocument = new GoogleDocument({document})
    const markdown = googleDocument.toMarkdown()

    expect(Date.now() - start).toBeLessThan(1000)
    expect(markdown.trim()).toBe(`${words} ${words}\u00a0${words}`)
  })

  test("keeps images inside table cells", () => {
    const imageElement = (id) => ({
      inlineObjectElement: {inlineObjectId: id},
    })
    const document = {
      title: "Table Images",
      body: {
        content: [
          {
            table: {
              tableRows: [
                {
                  tableCells: [
                    {content: [{paragraph: {elements: [imageElement("i1")]}}]},
                    {content: [{paragraph: {elements: [imageElement("i2")]}}]},
                  ],
                },
                {
                  tableCells: [
                    {content: [{paragraph: {elements: [imageElement("i3")]}}]},
                    {
                      content: [
                        {
                          paragraph: {
                            elements: [
                              {textRun: {content: "Text", textStyle: {}}},
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
        ],
      },
      inlineObjects: {
        i1: {
          inlineObjectProperties: {
            embeddedObject: {
              imageProperties: {contentUri: "https://image.com/1"},
            },
          },
        },
        i2: {
          inlineObjectProperties: {
            embeddedObject: {
              imageProperties: {contentUri: "https://image.com/2"},
            },
          },
        },
        i3: {
          inlineObjectProperties: {
            embeddedObject: {
              imageProperties: {contentUri: "https://image.com/3"},
            },
          },
        },
      },
      namedStyles: {
        styles: [
          {
            namedStyleType: "NORMAL_TEXT",
            textStyle: {},
          },
        ],
      },
    }

    const googleDocument = new GoogleDocument({document})

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
  })
})
