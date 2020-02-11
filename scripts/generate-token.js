#! /usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs")
const path = require("path")
const {google} = require("googleapis")
const inquirer = require("inquirer")

const GOOGLEDOCS_PATH = path.join(process.cwd(), ".google")
const TOKEN_PATH = path.join(GOOGLEDOCS_PATH, "token.json")
const NEW_PROJECT_URL = "https://console.developers.google.com/projectcreate"
const DOCS_API_URL =
  "https://console.developers.google.com/apis/library/docs.googleapis.com"
const DRIVE_API_URL =
  "https://console.developers.google.com/apis/library/drive.googleapis.com"
const OAUTH_URL =
  "https://console.developers.google.com/apis/credentials/oauthclient"

async function waitConfirmation() {
  const {confirm} = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "I read and followed the instructions",
      default: false,
    },
  ])

  if (!confirm) {
    throw new Error("Please read and follow the instructions")
  }
}
async function generateToken() {
  try {
    console.log("Create a new Google project:")
    console.log(NEW_PROJECT_URL)
    console.log("")

    await waitConfirmation()

    console.log("")
    console.info("Enable Google Docs API:")
    console.log(DOCS_API_URL)
    console.log("")

    await waitConfirmation()

    console.log("")
    console.info("Enable Google Drive API:")
    console.log(DRIVE_API_URL)
    console.log("")

    await waitConfirmation()

    console.log("")
    console.info('Create an "OAuth Client ID" with the config:')
    console.info('Name: "gatsby-source-google-docs"')
    console.info('Type: "Web application"')
    console.info('Redirect uri: "http://localhost"')
    console.log("")
    console.log(OAUTH_URL)
    console.log("")

    await waitConfirmation()

    console.log("")
    console.log("Copy your `Client ID` and `Client secret`")
    const {client_id, client_secret} = await inquirer.prompt([
      {
        type: "input",
        name: "client_id",
        message: "Client ID:",
        validate: input => !!input,
      },
      {
        type: "input",
        name: "client_secret",
        message: "Client Secret:",
        validate: input => !!input,
      },
    ])

    const client = new google.auth.OAuth2(
      client_id,
      client_secret,
      "http://localhost"
    )

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/documents.readonly",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
      ],
      prompt: "consent",
    })

    console.log("")
    console.log("Open the following URL in a browser")
    console.log(authUrl)
    console.log("")
    console.log("Ignore the insecure warning")
    console.log("Authorize the application")
    console.log("Copy the code from the callback URL")
    console.log("http://localhost/?...&code=  [_COPY_THIS_]  &...")
    console.log("")

    const {authorization_code} = await inquirer.prompt([
      {
        type: "input",
        name: "authorization_code",
        message: "Code:",
        validate: input => !!input,
      },
    ])

    if (!authorization_code) {
      console.error("Invalid authorisation code")
      return
    }

    const {tokens} = await client.getToken(authorization_code)

    if (!fs.existsSync(GOOGLEDOCS_PATH)) {
      fs.mkdirSync(GOOGLEDOCS_PATH)
    }

    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify({
        client_id,
        client_secret,
        ...tokens,
      })
    )

    console.log("")
    console.log("Token generated successfully")
    console.log("Enjoy `gatsby-source-google-docs` plugin")
  } catch (e) {
    console.log("")
    console.error(e.message)
  }
}

generateToken()
