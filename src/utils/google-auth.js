// const fs = require("fs")
// const path = require("path")
require("dotenv").config({
  path: `.env`,
})

const {google} = require("googleapis")

// const googledocsPath = path.join(process.cwd(), ".google")
// const tokenPath = path.join(googledocsPath, "token.json")
const token_fields = [
  "client_id",
  "client_secret",
  "access_token",
  "refresh_token",
  "scope",
  "token_type",
  "expiry_date",
]

const isScopeValid = scope =>
  [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ].every(permission => scope.includes(permission))

const isTokenValid = token =>
  token &&
  token_fields.every(field => !!token[field]) &&
  isScopeValid(token.scope)

class GoogleAuth {
  constructor() {
    // if (!fs.existsSync(googledocsPath)) {
    //   fs.mkdirSync(googledocsPath)
    // }

    const {client_id, client_secret, ...token} = this.getToken()

    const auth = new google.auth.OAuth2(client_id, client_secret)

    auth.setCredentials(token)

    let expired = true

    if (token.expiry_date) {
      const nowDate = new Date()
      const expirationDate = new Date(token.expiry_date)
      expired = expirationDate.getTime() < nowDate.getTime()
    }

    if (expired) {
      auth.on("tokens", refreshedToken => {
        this.setToken({
          client_id,
          client_secret,
          ...refreshedToken,
        })

        auth.setCredentials({
          refresh_token: refreshedToken.refresh_token,
        })
      })
    }

    this.auth = auth
  }

  getToken() {
    if (this.token) {
      return this.token
    }

    let token

    if (process.env.GATSBY_SOURCE_GOOGLE_DOCS_TOKEN) {
      token = JSON.parse(process.env.GATSBY_SOURCE_GOOGLE_DOCS_TOKEN)
    }

    if (!token) {
      throw new Error(
        "No token. Please generate one using `gatsby-source-google-docs-token` command"
      )
    }

    if (!isTokenValid(token)) {
      throw new Error(
        "Invalid token. Please regenerate one using `gatsby-source-google-docs-token` command"
      )
    }

    this.token = token

    return this.token
  }

  setToken(token) {
    if (isTokenValid(token)) {
      this.token = token
    }
  }

  getAuth() {
    return this.auth
  }

  setAuth(auth) {
    this.auth = auth
  }
}

let googleAuth = new GoogleAuth()

module.exports = {
  googleAuth,
}
