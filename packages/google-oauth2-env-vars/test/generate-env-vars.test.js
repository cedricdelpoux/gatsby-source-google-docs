const assert = require("node:assert/strict")
const {afterEach, beforeEach, test} = require("node:test")

const GoogleOAuth2 = require("..")

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
  t.mock.method(console, "error", () => {})
  delete process.env.GOOGLE_OAUTH_CLIENT_ID
})

afterEach(() => {
  process.exitCode = undefined
})

test("prints a generation error instead of throwing it", async (t) => {
  const googleOAuth2 = new GoogleOAuth2({token: "TEST_TOKEN"})
  t.mock.method(googleOAuth2, "getNewEnvVars", async () => {
    throw new Error("Authorization failed: access_denied")
  })

  assert.equal(await googleOAuth2.generateEnvVars(), undefined)

  const errors = console.error.mock.calls.map((call) => call.arguments[0])
  assert.ok(errors.includes("❌  Authorization failed: access_denied"))
  assert.equal(process.exitCode, 1)
})

test("prints the missing scope as an error", async () => {
  const googleOAuth2 = new GoogleOAuth2({token: "TEST_TOKEN"})

  await googleOAuth2.generateEnvVars()

  const errors = console.error.mock.calls.map((call) => call.arguments[0])
  assert.ok(
    errors.includes(
      "❌  You need to define `scope` in GoogleOAuth2 constructor"
    )
  )
  assert.equal(process.exitCode, 1)
})
