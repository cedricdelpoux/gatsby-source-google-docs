const json2md = require("json2md")
const YAML = require("yamljs")

module.exports = ({content, metadata}) => {
  return `---
${YAML.stringify(metadata)}---

${json2md(content)}`
}
