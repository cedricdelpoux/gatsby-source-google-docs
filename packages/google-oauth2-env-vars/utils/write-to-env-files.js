const fs = require("node:fs")

const TEMPLATE_FILES = new Set([".env.example", ".env.sample", ".env.template"])

const isEnvFile = (name) =>
  name === ".env" || (name.startsWith(".env.") && !TEMPLATE_FILES.has(name))

const getEnvFiles = () => {
  const files = fs
    .readdirSync(".", {withFileTypes: true})
    .filter((entry) => entry.isFile() && isEnvFile(entry.name))
    .map((entry) => entry.name)

  return files.length > 0 ? files : [".env"]
}

const setEnvLine = (content, name, line) => {
  const lines = content.split("\n")
  const isVarLine = (text) => text.startsWith(`${name}=`)
  const index = lines.findIndex(isVarLine)

  if (index === -1) {
    const separator = content && !content.endsWith("\n") ? "\n" : ""
    return `${content}${separator}${line}\n`
  }

  return lines
    .map((text, i) => (i === index ? line : text))
    .filter((text, i) => i === index || !isVarLine(text))
    .join("\n")
}

const writeToEnvFiles = (name, value) => {
  for (const file of getEnvFiles()) {
    const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
    fs.writeFileSync(file, setEnvLine(content, name, `${name}=${value}`))
    console.log(`✅  ${name} written to ${file}`)
  }
  console.log("")
}

module.exports = {
  writeToEnvFiles,
}
