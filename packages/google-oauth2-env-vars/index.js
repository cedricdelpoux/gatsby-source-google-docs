require("dotenv").config()

const {askClientIds} = require("./utils/ask-client-ids")
const {getNewToken} = require("./utils/get-new-token")
const {initAuth} = require("./utils/init-auth")

const {CLIENT_ID, CLIENT_SECRET, TOKEN_FIELDS} = require("./utils/constants")

class GoogleOAuth2 {
  constructor(options = {}) {
    this.tokenName = options.token || null
    this.scope = options.scope || null
    this.apisToEnable = options.apis || []
  }

  isTokenValid(token) {
    return token && TOKEN_FIELDS.every((field) => !!token[field])
  }

  async getNewEnvVars() {
    if (!this.scope) {
      throw new Error("You need to define `scope` in GoogleOAuth2 constructor")
    }

    const {clientId, clientSecret} = await askClientIds()

    const token = await getNewToken({
      clientId,
      clientSecret,
      scope: this.scope,
      tokenName: this.tokenName,
      apisToEnable: this.apisToEnable,
    })

    return token
  }

  getEnvVars() {
    let envClientId
    let envClientSecret
    let envToken

    if (process.env[CLIENT_ID]) {
      envClientId = process.env[CLIENT_ID]
    } else {
      throw new Error(`${CLIENT_ID} not found in .env`)
    }

    if (process.env[CLIENT_SECRET]) {
      envClientSecret = process.env[CLIENT_SECRET]
    } else {
      throw new Error(`${CLIENT_SECRET} not found in .env`)
    }

    if (this.tokenName && process.env[this.tokenName]) {
      envToken = JSON.parse(process.env[this.tokenName])
    }

    if (!envToken) {
      throw new Error(`${this.tokenName} not found in .env`)
    }

    if (!this.isTokenValid(envToken)) {
      throw new Error(
        `${this.tokenName} not valid. Please generate a new token`
      )
    }

    return {
      [CLIENT_ID]: envClientId,
      [CLIENT_SECRET]: envClientSecret,
      [this.tokenName]: envToken,
    }
  }

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
    const clientId = envVars[CLIENT_ID]
    const clientSecret = envVars[CLIENT_SECRET]
    const token = envVars[this.tokenName]

    const auth = await initAuth({
      clientId,
      clientSecret,
      token,
    })

    return auth
  }
}

module.exports = GoogleOAuth2
