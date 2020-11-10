const inquirer = require("inquirer")

const {openUrl} = require("./open-url")
const {writeToEnvFiles} = require("./write-to-env-files")

const {CLIENT_ID, CLIENT_SECRET, OAUTH_URL} = require("./constants")

const askClientIds = async () => {
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
  console.info('Create an "Google OAuth 2.0 Client ID" with the config:')
  console.info('Type: "Web application"')
  console.info('Redirect uri: "http://localhost:5000/callback"')

  await openUrl({message: "Google OAuth 2.0 URL:", url: OAUTH_URL})

  console.log("Copy your `Client ID` and `Client secret`")

  const {clientId, clientSecret} = await inquirer.prompt([
    {
      type: "input",
      name: "clientId",
      message: "Client ID:",
      validate: (input) => !!input,
    },
    {
      type: "input",
      name: "clientSecret",
      message: "Client Secret:",
      validate: (input) => !!input,
    },
  ])

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
