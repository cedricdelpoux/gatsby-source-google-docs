const fs = require("fs")
const {google} = require("googleapis")
const readline = require("readline-sync")

async function getToken({access_type, client, scope, token_path}) {
  if (fs.existsSync(token_path)) {
    const token = JSON.parse(fs.readFileSync(token_path, "utf-8"))
    return token
  } else {
    const token = await getNewToken({access_type, client, scope})
    fs.writeFileSync(token_path, JSON.stringify(token))
    return token
  }
}

async function getAuth({
  access_type,
  client_id,
  client_secret,
  redirect_uris,
  scope,
  token_path,
}) {
  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  const token = await getToken({access_type, client, scope, token_path})
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
