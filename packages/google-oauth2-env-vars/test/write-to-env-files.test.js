const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const {beforeEach, afterEach, test} = require("node:test")

const {writeToEnvFiles} = require("../utils/write-to-env-files")

const initialDir = process.cwd()

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
  process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), "env-files-")))
})

afterEach(() => {
  process.chdir(initialDir)
})

const read = (file) => fs.readFileSync(file, "utf8")

test("creates .env when there is no .env file", () => {
  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env"), "TOKEN=a\n")
})

test("adds the line when the variable is missing", () => {
  fs.writeFileSync(".env", "OTHER=1")

  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env"), "OTHER=1\nTOKEN=a\n")
})

test("replaces the line instead of duplicating it", () => {
  fs.writeFileSync(".env", "A=1\nTOKEN=old\nB=2\n")

  writeToEnvFiles("TOKEN", "new")
  writeToEnvFiles("TOKEN", "newer")

  assert.equal(read(".env"), "A=1\nTOKEN=newer\nB=2\n")
})

test("removes the duplicates left by previous versions", () => {
  fs.writeFileSync(".env", "TOKEN=1\nA=1\nTOKEN=2\n")

  writeToEnvFiles("TOKEN", "3")

  assert.equal(read(".env"), "TOKEN=3\nA=1\n")
})

test("keeps the variables whose name starts with the same prefix", () => {
  fs.writeFileSync(".env", "TOKEN_OLD=1\n")

  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env"), "TOKEN_OLD=1\nTOKEN=a\n")
})

test("writes to every .env* file", () => {
  fs.writeFileSync(".env", "TOKEN=old\n")
  fs.writeFileSync(".env.development", "")
  fs.writeFileSync("other", "")
  fs.mkdirSync(".env.d")

  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env"), "TOKEN=a\n")
  assert.equal(read(".env.development"), "TOKEN=a\n")
  assert.equal(read("other"), "")
})

const LEFT_OUT_FILES = [
  ".envrc",
  ".env.example",
  ".env.sample",
  ".env.template",
]

test("leaves out .envrc and the templates", () => {
  for (const file of LEFT_OUT_FILES) {
    fs.writeFileSync(file, "")
  }
  fs.writeFileSync(".env.local", "")

  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env.local"), "TOKEN=a\n")
  for (const file of LEFT_OUT_FILES) {
    assert.equal(read(file), "")
  }
  assert.equal(fs.existsSync(".env"), false)
})

test("creates .env when there are only files left out", () => {
  fs.writeFileSync(".envrc", "")

  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env"), "TOKEN=a\n")
  assert.equal(read(".envrc"), "")
})

test("looks for the .env* files when writing, not when loaded", () => {
  fs.writeFileSync(".env.production", "")

  writeToEnvFiles("TOKEN", "a")

  assert.equal(read(".env.production"), "TOKEN=a\n")
  assert.equal(fs.existsSync(".env"), false)
})
