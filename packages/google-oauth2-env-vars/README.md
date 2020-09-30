<div align="center">
  <h1>google-oauth2-env-vars<h1>

[![Npm version][badge-npm]][npm]
[![Npm downloads][badge-npm-dl]][npm]
[![MIT license][badge-licence]](./LICENCE.md)
[![PRs welcome][badge-prs-welcome]](#contributing)

</div>

---

Helper class to generate and cache `Google OAuth 2.0` tokens in `.env` files:

```dotenv
GOOGLE_OAUTH_CLIENT_ID=23...8o1jm.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=QL...naxL
GOOGLE_PHOTOS_TOKEN={"access_token":"ya..54c","refresh_token":"1..qq0","scope":"https://www.googleapis.com/auth/photoslibrary.readonly","token_type":"Bearer","expiry_date":1598277881619}
```

## Usage

Download package from the NPM registry:

```shell
yarn add google-oauth2-env-vars
```

### Generate .env vars

```js
const GoogleOAuth2 = require("google-oauth2-env-vars")

const googleOAuth2 = new GoogleOAuth2({
  // .env token var name
  token: "GOOGLE_PHOTOS_TOKEN",
  // Authorization scope
  scope: ["https://www.googleapis.com/auth/photoslibrary.readonly"],
  // APIs to enable in Google console
  apis: ["photoslibrary.googleapis.com"],
})

const envVars = await googleOAuth2.generateEnvVars()
```

### Get Auth

```js
const GoogleOAuth2 = require("google-oauth2-env-vars")

const googleOAuth2 = new GoogleOAuth2({
  // .env token var name
  token: "GOOGLE_PHOTOS_TOKEN",
})
const auth = await googleOAuth2.getAuth()
const {token} = await auth.getAccessToken()
const googlePhotos = new GooglePhotos(token)
```

## Contributing

- ⇄ Pull/Merge requests and ★ Stars are always welcome.
- For bugs and feature requests, please [create an issue][github-issue].

[badge-npm]: https://img.shields.io/npm/v/google-oauth2-env-vars.svg?style=flat-square
[badge-npm-dl]: https://img.shields.io/npm/dt/google-oauth2-env-vars.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs-welcome]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[npm]: https://www.npmjs.org/package/google-oauth2-env-vars
[github-issue]: https://github.com/cedricdelpoux/google-oauth2-env-vars/issues/new
