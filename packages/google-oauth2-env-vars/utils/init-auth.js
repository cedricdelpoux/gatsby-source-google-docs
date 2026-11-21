const {OAuth2Client} = require("google-auth-library")

const initAuth = ({clientId, clientSecret, token}) => {
  const auth = new OAuth2Client({clientId, clientSecret})

  auth.setCredentials(token)

  // A refreshed token comes without its refresh_token, which must be kept
  auth.on("tokens", (refreshedToken) => {
    auth.setCredentials({...token, ...refreshedToken})
  })

  return auth
}

module.exports = {
  initAuth,
}
