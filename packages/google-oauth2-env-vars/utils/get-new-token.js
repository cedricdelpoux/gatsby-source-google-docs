const {CodeChallengeMethod, OAuth2Client} = require("google-auth-library")

const {ask} = require("./ask")
const {getAuthorizationCode} = require("./get-authorization-code")
const {openUrl} = require("./open-url")
const {writeToEnvFiles} = require("./write-to-env-files")
const {ENABLE_API_URL} = require("./constants")

const enableApi = async (api) => {
  console.log(`🤚  You need to enable "${api}" API`)
  openUrl({message: "API URL:", url: `${ENABLE_API_URL}${api}`})
  console.log(`🛑  Follow the URL and enable "${api}" API`)
  console.log("")
  await ask("🚦  API enabled? Press Enter to continue setup")
  console.log("")
  console.log("------------------------")
}

const getNewToken = async ({
  clientId,
  clientSecret,
  scope,
  tokenName,
  apisToEnable,
  port,
}) => {
  console.log("------------------------")
  console.log("| Generating new token |")
  console.log("------------------------")
  console.log("")

  for (const api of apisToEnable) {
    await enableApi(api)
  }

  const client = new OAuth2Client({clientId, clientSecret})
  const {codeVerifier, codeChallenge} = await client.generateCodeVerifierAsync()
  let redirectUri

  const code = await getAuthorizationCode({
    port,
    onListening: (listeningPort) => {
      redirectUri = `http://localhost:${listeningPort}/callback`
      const url = client.generateAuthUrl({
        access_type: "offline",
        scope,
        prompt: "consent",
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
      })
      console.log("🤚  You need to authorize your application")
      openUrl({message: "Authorization URL:", url})
      console.log("🛑  Follow the URL to authorize your application")
    },
  })

  const {tokens} = await client.getToken({
    code,
    codeVerifier,
    redirect_uri: redirectUri,
  })

  if (tokenName) {
    writeToEnvFiles(tokenName, JSON.stringify(tokens))
  }

  return tokens
}

module.exports = {
  getNewToken,
}
