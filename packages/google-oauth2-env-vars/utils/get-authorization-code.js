/* global Promise */

const open = require("open")
const express = require("express")

const getAuthorizationCode = async (authUrl) => {
  return new Promise((resolve, reject) => {
    const app = express()

    app.listen(5000, async () => {
      open(authUrl)
    })

    app.get("/callback", (req, res) => {
      if (req.query.code) {
        res.send("<script>window.close()</script>")

        resolve(req.query.code)
      } else {
        reject("no code")
      }
    })
  })
}

module.exports = {
  getAuthorizationCode,
}
