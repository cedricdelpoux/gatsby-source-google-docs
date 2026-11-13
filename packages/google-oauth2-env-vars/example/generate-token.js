#! /usr/bin/env node

const GoogleOAuth2 = require("../")

const googleOAuth2 = new GoogleOAuth2({
  scope: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  token: "GOOGLE_DOCS_TOKEN",
  apis: ["docs.googleapis.com", "drive.googleapis.com"],
})

googleOAuth2.generateEnvVars()
