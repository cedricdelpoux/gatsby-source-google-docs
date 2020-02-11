const data = require(`./data.json`)

const {
  convertGoogleDocumentToJson,
  convertJsonToMarkdown,
} = require("../utils/converters")

test("Converts document", () => {
  const file = {id: `hi`, metadatIsCool: `yeah`}
  const content = convertGoogleDocumentToJson(data)
  expect(convertJsonToMarkdown({file, content})).toMatchSnapshot()
})
