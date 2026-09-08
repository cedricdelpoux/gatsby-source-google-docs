// `quiet` silences the "injected env" banner dotenv prints on every load,
// which would otherwise show up in the middle of every Gatsby build.
require("dotenv").config({quiet: true})

const {OAuth2Client} = require("google-auth-library")

const {
  ENV_CLIENT_ID_VAR,
  ENV_CLIENT_SECRET_VAR,
  ENV_TOKEN_VAR,
  TOKEN_FIELDS,
} = require("./constants")

/**
 * Read the OAuth2 credentials from the environment variables.
 *
 * The token is stored as a JSON string, so a copy/paste accident (single
 * quotes, unquoted keys, ...) makes `JSON.parse` throw a `SyntaxError` whose
 * message ("Expected property name or '}' in JSON at position 1", ...) gives no
 * clue about what has to be fixed. It is turned into an actionable one here.
 */
function getEnvVars() {
  const clientId = process.env[ENV_CLIENT_ID_VAR]
  const clientSecret = process.env[ENV_CLIENT_SECRET_VAR]
  const rawToken = process.env[ENV_TOKEN_VAR]

  if (!clientId) {
    throw new Error(`${ENV_CLIENT_ID_VAR} not found in .env`)
  }

  if (!clientSecret) {
    throw new Error(`${ENV_CLIENT_SECRET_VAR} not found in .env`)
  }

  if (!rawToken) {
    throw new Error(`${ENV_TOKEN_VAR} not found in .env`)
  }

  let token

  try {
    token = JSON.parse(rawToken)
  } catch (e) {
    throw new Error(
      `"${ENV_TOKEN_VAR}" is not a valid JSON string (${e.message}).\n` +
        `It must be the single line printed by "npx gatsby-source-google-docs-token", ` +
        `with double quotes around every key and value:\n` +
        `${ENV_TOKEN_VAR}={"access_token":"...","refresh_token":"...","scope":"...","token_type":"Bearer","expiry_date":0}\n` +
        `Run "npx gatsby-source-google-docs-token" again to generate a new one.`
    )
  }

  if (!TOKEN_FIELDS.every((field) => Boolean(token[field]))) {
    throw new Error(`${ENV_TOKEN_VAR} not valid. Please generate a new token`)
  }

  return {clientId, clientSecret, token}
}

/**
 * Build an authenticated Google client from the environment variables.
 *
 * The client is created from `google-auth-library` directly rather than from
 * `google-oauth2-env-vars`: the latter still bundles `googleapis@114`, whose
 * `OAuth2Client` predates the WHATWG `Headers` used by `googleapis-common@8`
 * and silently drops the `Authorization` header, so every request comes back
 * as "Method doesn't allow unregistered callers".
 */
async function getAuth() {
  const {clientId, clientSecret, token} = getEnvVars()

  const auth = new OAuth2Client(clientId, clientSecret)

  auth.setCredentials(token)

  // Persist the refreshed credentials in memory so a single build does not
  // request a new access token for every document.
  auth.on("tokens", (refreshedToken) => {
    auth.setCredentials({...token, ...refreshedToken})
  })

  return auth
}

module.exports = {
  getAuth,
}
