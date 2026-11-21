const assert = require("node:assert/strict")
const {beforeEach, test} = require("node:test")

const {getAuthorizationCode} = require("../utils/get-authorization-code")

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
})

const startServer = (port = 0) =>
  new Promise((resolveListening) => {
    const code = getAuthorizationCode({
      port,
      onListening: (listeningPort) =>
        resolveListening({
          code,
          port: listeningPort,
          request: (pathname) =>
            fetch(`http://localhost:${listeningPort}${pathname}`),
        }),
    })
    // Avoids an unhandled rejection before the test awaits it
    code.catch(() => {})
  })

test("listens on a free port when none is given", async () => {
  const {code, port, request} = await startServer()

  assert.ok(port > 0)
  await request("/callback?code=abc")
  assert.equal(await code, "abc")
})

test("resolves with the code received on /callback", async () => {
  const {code, request} = await startServer()
  const response = await request("/callback?code=4%2F0Ae")

  assert.equal(response.status, 200)
  assert.match(await response.text(), /^Success!/)
  assert.equal(await code, "4/0Ae")
})

test("rejects when /callback has an error instead of a code", async () => {
  const {code, request} = await startServer()
  const response = await request("/callback?error=access_denied")

  assert.equal(response.status, 400)
  await assert.rejects(code, {message: "Authorization failed: access_denied"})
})

test("rejects when /callback has neither a code nor an error", async () => {
  const {code, request} = await startServer()
  await request("/callback")

  await assert.rejects(code, {
    message: "Authorization failed: no code received",
  })
})

test("ignores the other paths", async () => {
  const {code, request} = await startServer()

  assert.equal((await request("/favicon.ico")).status, 404)
  await request("/callback?code=abc")
  assert.equal(await code, "abc")
})

test("rejects when the given port is already in use", async () => {
  const {code, port, request} = await startServer()

  await assert.rejects(
    getAuthorizationCode({port, onListening: () => {}}),
    (e) => {
      assert.match(e.message, new RegExp(`^Port ${port} is already in use`))
      assert.equal(e.cause.code, "EADDRINUSE")
      return true
    }
  )
  await request("/callback?code=abc")
  assert.equal(await code, "abc")
})
