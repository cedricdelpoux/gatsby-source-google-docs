const {google} = require("googleapis")
const open = require("open")

const {getAuthorizationCode} = require("./get-authorization-code")
const {writeToEnvFiles} = require("./write-to-env-files")
const {ENABLE_API_URL} = require("./constants")

const getNewToken = async ({
  clientId,
  clientSecret,
  scope,
  tokenName,
  apisToEnable,
}) => {
  try {
    if (apisToEnable) {
      apisToEnable.forEach((api) => {
        open(`${ENABLE_API_URL}${api}`)
      })
    }

    const client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost:5000/callback"
    )

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope,
      prompt: "consent",
    })
    const code = await getAuthorizationCode(authUrl)

    const {tokens} = await client.getToken(code)

    if (tokenName) {
      writeToEnvFiles(tokenName, JSON.stringify(tokens))
    }

    return tokens
  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  getNewToken,
}
