import fs from "node:fs"
import path from "node:path"

import {expect, test} from "vitest"

import {GoogleDocument} from "../index.js"

const documentsPath = path.join(import.meta.dirname, "documents")

for (const filename of fs.readdirSync(documentsPath)) {
  const file = fs.readFileSync(path.join(documentsPath, filename), "utf8")
  const document = JSON.parse(file)
  const googleDocument = new GoogleDocument(document)

  test(`Document "${document.title}" to Markdown`, () => {
    expect(googleDocument.toMarkdown()).toMatchSnapshot()
  })

  test(`Document "${document.title}" to Object`, () => {
    const {cover, elements} = googleDocument

    expect({cover, elements}).toMatchSnapshot()
  })
}
