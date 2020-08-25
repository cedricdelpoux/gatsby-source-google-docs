const {google} = require("googleapis")

const initAuth = async ({clientId, clientSecret, token}) => {
  const auth = new google.auth.OAuth2(clientId, clientSecret)

  auth.setCredentials(token)

  let expired = true

  if (token.expiry_date) {
    const nowDate = new Date()
    const expirationDate = new Date(token.expiry_date)
    expired = expirationDate.getTime() < nowDate.getTime()
  }

  if (expired) {
    auth.on("tokens", (refreshedToken) => {
      auth.setCredentials(refreshedToken)
    })
  }

  return auth
}

module.exports = {
  initAuth,
}
