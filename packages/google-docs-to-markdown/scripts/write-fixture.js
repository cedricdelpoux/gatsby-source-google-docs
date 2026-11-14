import fs from "node:fs"
import path from "node:path"

import {fetchDocument} from "../google.js"

const toKebabCase = (text) =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

const document = await fetchDocument(process.argv[2])
const file = path.join(
  import.meta.dirname,
  "..",
  "test",
  "documents",
  `${toKebabCase(document.title)}.json`
)

fs.writeFileSync(file, JSON.stringify(document))
console.log(path.relative(process.cwd(), file))
