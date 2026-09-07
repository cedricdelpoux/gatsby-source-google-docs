const ENV_VARS = [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_DOCS_TOKEN",
]

describe("getAuth", () => {
  const initialEnv = {}

  beforeEach(() => {
    jest.resetModules()
    ENV_VARS.forEach((name) => {
      initialEnv[name] = process.env[name]
    })
  })

  afterEach(() => {
    ENV_VARS.forEach((name) => {
      if (initialEnv[name] === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = initialEnv[name]
      }
    })
  })

  test("explains how to fix a malformed token", async () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id"
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret"
    // What users copy from the token generator console output
    process.env.GOOGLE_DOCS_TOKEN = "{ access_token: 'xxx' }"

    const {getAuth} = require("../utils/get-auth")

    await expect(getAuth()).rejects.toThrow(
      /"GOOGLE_DOCS_TOKEN" is not a valid JSON string/
    )
    await expect(getAuth()).rejects.toThrow(/gatsby-source-google-docs-token/)
  })

  test("does not hide the other errors", async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret"
    process.env.GOOGLE_DOCS_TOKEN = "{}"

    const {getAuth} = require("../utils/get-auth")

    await expect(getAuth()).rejects.toThrow(
      "GOOGLE_OAUTH_CLIENT_ID not found in .env"
    )
  })
})
