const data = require(`./data.json`)

const convertGoogleDocumentToJson = require("../convert-google-document-to-json")
const convertJsonToMarkdown = require("../convert-json-to-markdown")

test("converts document", () => {
  const content = convertGoogleDocumentToJson(data)
  const metadata = {id: `hi`, metadatIsCool: `yeah`}
  expect(convertJsonToMarkdown({content, metadata})).toMatchSnapshot()
})
