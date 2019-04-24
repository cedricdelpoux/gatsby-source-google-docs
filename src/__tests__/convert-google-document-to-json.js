const data = require(`./data.json`)

const convertGoogleDocumentToJson = require("../utils/convert-google-document-to-json")
const convertJsonToMarkdown = require("../utils/convert-json-to-markdown")

test("converts document", () => {
  const file = {id: `hi`, metadatIsCool: `yeah`}
  const content = convertGoogleDocumentToJson(data)
  expect(convertJsonToMarkdown({file, content})).toMatchSnapshot()
})
