/* global Promise */
const express = require("express")

const {openUrl} = require("./open-url")

const getAuthorizationCode = async (authUrl) => {
  return new Promise((resolve, reject) => {
    const app = express()

    app.listen(5000, async () => {
      console.log("🤚🏻You need to authorize your application")

      await openUrl({message: "Authorization URL:", url: authUrl})

      console.log("🛑Follow the URL to authorize your application")
    })

    app.get("/callback", (req, res) => {
      if (req.query.code) {
        console.log("✅Application authorized")
        res.send(
          "Succeed! You can close this tab and go back to your terminal."
        )

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
