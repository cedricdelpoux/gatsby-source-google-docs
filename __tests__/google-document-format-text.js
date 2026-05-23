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
})
