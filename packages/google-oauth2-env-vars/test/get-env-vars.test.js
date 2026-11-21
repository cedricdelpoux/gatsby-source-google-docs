const assert = require("node:assert/strict")
const {beforeEach, test} = require("node:test")

const GoogleOAuth2 = require("..")

const TOKEN = {
  access_token: "ya29",
  refresh_token: "1//0g",
  scope: "https://www.googleapis.com/auth/documents.readonly",
  token_type: "Bearer",
  expiry_date: 1700000000000,
}

const googleOAuth2 = new GoogleOAuth2({token: "TEST_TOKEN"})

beforeEach(() => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "id"
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "secret"
  process.env.TEST_TOKEN = JSON.stringify(TOKEN)
})

test("returns the client ids and the parsed token", () => {
  assert.deepEqual(googleOAuth2.getEnvVars(), {
    GOOGLE_OAUTH_CLIENT_ID: "id",
    GOOGLE_OAUTH_CLIENT_SECRET: "secret",
    TEST_TOKEN: TOKEN,
  })
})

for (const name of [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "TEST_TOKEN",
]) {
  test(`throws when ${name} is missing`, () => {
    delete process.env[name]

    assert.throws(() => googleOAuth2.getEnvVars(), {
      message: `${name} not found in .env`,
    })
  })
}

test("explains the expected format when the token is not valid JSON", () => {
  process.env.TEST_TOKEN = "{access_token:'ya29'}"

  assert.throws(
    () => googleOAuth2.getEnvVars(),
    (e) => {
      assert.match(e.message, /^TEST_TOKEN is not valid JSON/)
      assert.match(e.message, /single line, with double quotes/)
      assert.match(e.message, /TEST_TOKEN=\{"access_token":"\.\.\."/)
      assert.match(e.message, /Run the token generation again/)
      assert.doesNotMatch(e.message, /\n/)
      assert.ok(e.cause instanceof SyntaxError)
      return true
    }
  )
})

test("throws when the token misses a field", () => {
  process.env.TEST_TOKEN = JSON.stringify({...TOKEN, refresh_token: undefined})

  assert.throws(() => googleOAuth2.getEnvVars(), {
    message: "TEST_TOKEN not valid. Please generate a new token",
  })
})

test("getAuth keeps the refresh_token when the token is refreshed", async () => {
  const auth = await googleOAuth2.getAuth()

  auth.emit("tokens", {access_token: "ya30", expiry_date: 1800000000000})

  assert.deepEqual(auth.credentials, {
    ...TOKEN,
    access_token: "ya30",
    expiry_date: 1800000000000,
  })
})
