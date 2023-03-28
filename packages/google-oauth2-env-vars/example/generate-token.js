#! /usr/bin/env node
/* eslint-disable no-console */

const GoogleOAuth2 = require("../")

async function generateToken() {
  const googleOAuth2 = new GoogleOAuth2({
    scope: [
      "https://www.googleapis.com/auth/documents.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    token: "GOOGLE_DOCS_TOKEN",
    apis: ["docs.googleapis.com", "drive.googleapis.com"],
  })

  await googleOAuth2.generateEnvVars()

  process.exit()
}

generateToken()
