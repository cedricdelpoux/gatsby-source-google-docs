const assert = require("node:assert/strict")
const {beforeEach, test} = require("node:test")

const {getAuthorizationCode} = require("../utils/get-authorization-code")

const PORT = 53682

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
})

const request = (pathname) => fetch(`http://localhost:${PORT}${pathname}`)

const startServer = () =>
  new Promise((resolveListening) => {
    const code = getAuthorizationCode({
      port: PORT,
      onListening: () => resolveListening({code}),
    })
    // Avoids an unhandled rejection before the test awaits it
    code.catch(() => {})
  })

test("resolves with the code received on /callback", async () => {
  const {code} = await startServer()
  const response = await request("/callback?code=4%2F0Ae")

  assert.equal(response.status, 200)
  assert.match(await response.text(), /^Success!/)
  assert.equal(await code, "4/0Ae")
})

test("rejects when /callback has an error instead of a code", async () => {
  const {code} = await startServer()
  const response = await request("/callback?error=access_denied")

  assert.equal(response.status, 400)
  await assert.rejects(code, {message: "Authorization failed: access_denied"})
})

test("rejects when /callback has neither a code nor an error", async () => {
  const {code} = await startServer()
  await request("/callback")

  await assert.rejects(code, {
    message: "Authorization failed: no code received",
  })
})

test("ignores the other paths", async () => {
  const {code} = await startServer()

  assert.equal((await request("/favicon.ico")).status, 404)
  await request("/callback?code=abc")
  assert.equal(await code, "abc")
})

test("rejects when the port is already in use", async () => {
  const {code} = await startServer()

  await assert.rejects(getAuthorizationCode({port: PORT}), {
    code: "EADDRINUSE",
  })
  await request("/callback?code=abc")
  assert.equal(await code, "abc")
})
