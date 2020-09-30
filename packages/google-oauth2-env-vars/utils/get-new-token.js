const {google} = require("googleapis")

const {getAuthorizationCode} = require("./get-authorization-code")
const {writeToEnvFiles} = require("./write-to-env-files")
const {ENABLE_API_URL} = require("./constants")
const {openUrl} = require("./open-url")
const {waitInput} = require("./wait-input")

const getNewToken = async ({
  clientId,
  clientSecret,
  scope,
  tokenName,
  apisToEnable,
}) => {
  try {
    console.log("------------------------")
    console.log("| Generating new token |")
    console.log("------------------------")
    console.log("")
    if (apisToEnable) {
      for (const api of apisToEnable) {
        console.log(`🤚🏻You need to enable "${api}" API`)

        await openUrl({message: "API URL:", url: `${ENABLE_API_URL}${api}`})

        console.log(`🛑Follow the URL to Enable "${api}" API`)

        await waitInput()
      }
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
