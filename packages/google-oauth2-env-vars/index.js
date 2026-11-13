const {askClientIds} = require("./utils/ask-client-ids")
const {getNewToken} = require("./utils/get-new-token")
const {initAuth} = require("./utils/init-auth")

const {
  CLIENT_ID,
  CLIENT_SECRET,
  DEFAULT_PORT,
  TOKEN_FIELDS,
} = require("./utils/constants")

try {
  process.loadEnvFile()
} catch (e) {
  if (e.code !== "ENOENT") {
    throw e
  }
}

/**
 * @typedef {object} Options
 * @property {string} [token] Name of the .env variable holding the token
 * @property {string[]} [scope] Scopes the token is authorized for
 * @property {string[]} [apis] APIs to enable in the Google Cloud console
 * @property {number} [port] Port of the local server receiving the authorization code
 */

/** @typedef {import("google-auth-library").Credentials} Token */

class GoogleOAuth2 {
  /** @param {Options} [options] */
  constructor(options = {}) {
    this.tokenName = options.token || null
    this.scope = options.scope || null
    this.apisToEnable = options.apis || []
    this.port = options.port || DEFAULT_PORT
  }

  /** @param {Token} token */
  isTokenValid(token) {
    return token && TOKEN_FIELDS.every((field) => !!token[field])
  }

  /**
   * @param {string} rawToken
   * @returns {Token}
   */
  parseToken(rawToken) {
    try {
      return JSON.parse(rawToken)
    } catch (e) {
      throw new Error(
        `${this.tokenName} is not valid JSON (${e.message}). ` +
          "It must be on a single line, with double quotes around every key and string value: " +
          `${this.tokenName}={"access_token":"...","refresh_token":"...","scope":"...","token_type":"Bearer","expiry_date":0}. ` +
          "Run the token generation again to get a new one.",
        {cause: e}
      )
    }
  }

  async getNewEnvVars() {
    if (!this.scope) {
      throw new Error("You need to define `scope` in GoogleOAuth2 constructor")
    }

    const {clientId, clientSecret} = await askClientIds({port: this.port})

    const token = await getNewToken({
      clientId,
      clientSecret,
      scope: this.scope,
      tokenName: this.tokenName,
      apisToEnable: this.apisToEnable,
      port: this.port,
    })

    return {
      [CLIENT_ID]: clientId,
      [CLIENT_SECRET]: clientSecret,
      [this.tokenName]: token,
    }
  }

  /**
   * Read the variables from the environment, and throw when one of them is
   * missing or invalid.
   *
   * @returns {Record<string, string | Token>}
   */
  getEnvVars() {
    const clientId = process.env[CLIENT_ID]
    const clientSecret = process.env[CLIENT_SECRET]
    const rawToken = this.tokenName && process.env[this.tokenName]

    if (!clientId) {
      throw new Error(`${CLIENT_ID} not found in .env`)
    }

    if (!clientSecret) {
      throw new Error(`${CLIENT_SECRET} not found in .env`)
    }

    if (!rawToken) {
      throw new Error(`${this.tokenName} not found in .env`)
    }

    const token = this.parseToken(rawToken)

    if (!this.isTokenValid(token)) {
      throw new Error(
        `${this.tokenName} not valid. Please generate a new token`
      )
    }

    return {
      [CLIENT_ID]: clientId,
      [CLIENT_SECRET]: clientSecret,
      [this.tokenName]: token,
    }
  }

  /**
   * Read the variables, or walk through their generation when they are missing.
   *
   * @returns {Promise<Record<string, string | Token>>}
   */
  async generateEnvVars() {
    let envVars

    try {
      envVars = this.getEnvVars()
      console.log(`✅${CLIENT_ID} found in .env`)
      console.log(`✅${CLIENT_SECRET} found in .env`)
      console.log(`✅${this.tokenName} found in .env`)
    } catch (e) {
      console.log(`❌${e.message}`)
      envVars = await this.getNewEnvVars()
    }

    console.log("")
    console.log("------------------------")
    console.log("|      .env vars       |")
    console.log("------------------------")
    console.log(envVars)

    return envVars
  }

  async getAuth() {
    const envVars = this.getEnvVars()

    return initAuth({
      clientId: envVars[CLIENT_ID],
      clientSecret: envVars[CLIENT_SECRET],
      token: envVars[this.tokenName],
    })
  }
}

module.exports = GoogleOAuth2
