const data = require(`./data.json`)

const {
  convertGoogleDocumentToJson,
  convertJsonToMarkdown,
} = require("../utils/converters")

test("Converts document", () => {
  const {cover, content} = convertGoogleDocumentToJson(data)
  const metadata = {id: `hi`, metadatIsCool: `yeah`, cover}
  expect(convertJsonToMarkdown({metadata, content})).toMatchSnapshot()
})
