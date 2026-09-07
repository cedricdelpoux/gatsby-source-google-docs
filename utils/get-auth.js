const GoogleOAuth2 = require("google-oauth2-env-vars")

const {ENV_TOKEN_VAR} = require("./constants")

/**
 * Get an authenticated Google client from the environment variables.
 *
 * `google-oauth2-env-vars` reads the token with `JSON.parse` and rethrows the
 * raw `SyntaxError` when the variable is not valid JSON. That message
 * ("Expected property name or '}' in JSON at position 1", ...) gives no clue
 * about what has to be fixed, so it is turned into an actionable one here.
 */
async function getAuth() {
  const googleOAuth2 = new GoogleOAuth2({
    token: ENV_TOKEN_VAR,
  })

  try {
    return await googleOAuth2.getAuth()
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(
        `"${ENV_TOKEN_VAR}" is not a valid JSON string (${e.message}).\n` +
          `It must be the single line printed by "npx gatsby-source-google-docs-token", ` +
          `with double quotes around every key and value:\n` +
          `${ENV_TOKEN_VAR}={"access_token":"...","refresh_token":"...","scope":"...","token_type":"Bearer","expiry_date":0}\n` +
          `Run "npx gatsby-source-google-docs-token" again to generate a new one.`
      )
    }

    throw e
  }
}

module.exports = {
  getAuth,
}
