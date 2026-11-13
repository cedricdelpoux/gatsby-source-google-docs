const {askRequired} = require("./ask")
const {openUrl} = require("./open-url")
const {writeToEnvFiles} = require("./write-to-env-files")

const {CLIENT_ID, CLIENT_SECRET, OAUTH_URL} = require("./constants")

const askClientIds = async ({port}) => {
  if (process.env[CLIENT_ID] && process.env[CLIENT_SECRET]) {
    console.log(`✅  ${CLIENT_ID} found in .env`)
    console.log(`✅  ${CLIENT_SECRET} found in .env`)
    console.log("")
    return {
      clientId: process.env[CLIENT_ID],
      clientSecret: process.env[CLIENT_SECRET],
    }
  }

  console.log("")
  console.info('Create a "Google OAuth 2.0 Client ID" of type "Desktop app"')
  if (port) {
    console.info(
      `or of type "Web application" with the redirect URI "http://localhost:${port}/callback"`
    )
  }

  openUrl({message: "Google OAuth 2.0 URL:", url: OAUTH_URL})

  console.log("Copy your `Client ID` and `Client secret`")

  const clientId = await askRequired("Client ID: ")
  const clientSecret = await askRequired("Client Secret: ")

  writeToEnvFiles(CLIENT_ID, clientId)
  writeToEnvFiles(CLIENT_SECRET, clientSecret)

  return {
    clientId,
    clientSecret,
  }
}

module.exports = {
  askClientIds,
}
