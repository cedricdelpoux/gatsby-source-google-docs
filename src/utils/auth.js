const fs = require("fs")
const {google} = require("googleapis")
const readline = require("readline-sync")

async function getToken({
  access_type,
  client,
  scope,
  token_path,
  token_env_variable,
  token,
}) {
  if (token) {
    return JSON.parse(token)
  } else if (process.env[token_env_variable]) {
    return JSON.parse(process.env[token_env_variable])
  } else if (fs.existsSync(token_path)) {
    return JSON.parse(fs.readFileSync(token_path, "utf-8"))
  } else {
    const newToken = await getNewToken({access_type, client, scope})
    fs.writeFileSync(token_path, JSON.stringify(newToken))
    return newToken
  }
}

async function getAuth({
  client_id,
  client_secret,
  redirect_uris,
  ...tokenProps
}) {
  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  const token = await getToken({...tokenProps, client})

  client.setCredentials(token)
  return client
}

async function getNewToken({access_type, client, scope}) {
  const authUrl = client.generateAuthUrl({
    access_type,
    scope,
  })

  /* eslint-disable-next-line */
  console.info("Authorize this app by visiting this url:", authUrl)
  const code = readline.question("Enter the code from that page here: ")
  const {tokens} = await client.getToken(code)
  return tokens
}

module.exports = {
  getAuth,
}
