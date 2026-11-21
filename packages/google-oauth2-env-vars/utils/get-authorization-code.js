const http = require("node:http")

const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  Connection: "close",
}

const getAuthorizationCode = ({port, onListening}) =>
  new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const {pathname, searchParams} = new URL(req.url, "http://localhost")

      if (pathname !== "/callback") {
        res.writeHead(404, TEXT_HEADERS).end()
        return
      }

      const code = searchParams.get("code")
      server.close()

      if (code) {
        console.log("✅  Application authorized")
        res
          .writeHead(200, TEXT_HEADERS)
          .end("Success! You can close this tab and go back to your terminal.")
        resolve(code)
      } else {
        const message = `Authorization failed: ${searchParams.get("error") || "no code received"}`
        res.writeHead(400, TEXT_HEADERS).end(message)
        reject(new Error(message))
      }
    })

    server.on("error", (/** @type {NodeJS.ErrnoException} */ e) => {
      if (e.code !== "EADDRINUSE") {
        reject(e)
        return
      }
      reject(
        new Error(
          `Port ${port} is already in use. Free it, or leave out \`port\` ` +
            'to listen on any free port, which needs a "Desktop app" OAuth client.',
          {cause: e}
        )
      )
    })
    server.listen(port, () => {
      const address = /** @type {import("node:net").AddressInfo} */ (
        server.address()
      )
      onListening(address.port)
    })
  })

module.exports = {
  getAuthorizationCode,
}
