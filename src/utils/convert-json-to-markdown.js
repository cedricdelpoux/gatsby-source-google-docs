const json2md = require("json2md")
const YAML = require("yamljs")

module.exports = ({content, file}) => {
  return `---
${YAML.stringify(file)}---

${json2md(content)}`
}
