<div align="center">
  <h1>google-oauth2-env-vars</h1>

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
GOOGLE_DOCS_TOKEN={"access_token":"ya..54c","refresh_token":"1..qq0","scope":"https://www.googleapis.com/auth/documents.readonly","token_type":"Bearer","expiry_date":1598277881619}
```

## Usage

It requires Node.js 22 or later. Download the package from the npm registry:

```shell
npm install google-oauth2-env-vars
```

### Generate .env vars

```js
const GoogleOAuth2 = require("google-oauth2-env-vars")

const googleOAuth2 = new GoogleOAuth2({
  // .env token var name
  token: "GOOGLE_DOCS_TOKEN",
  // Authorization scope
  scope: ["https://www.googleapis.com/auth/documents.readonly"],
  // APIs to enable in Google console
  apis: ["docs.googleapis.com"],
  //
  // Optional
  //
  // Port of the local server receiving the authorization code
  port: 5000, // DEFAULT
})

const envVars = await googleOAuth2.generateEnvVars()
```

When the variables are missing from the environment, `generateEnvVars()` walks you through the setup in the terminal:

1. It asks you to enable each API in `apis` in the Google Cloud console.
2. It asks for the `Client ID` and `Client secret` of an OAuth 2.0 client of type "Web application", whose authorized redirect URI is `http://localhost:<port>/callback` (`http://localhost:5000/callback` by default).
3. It asks you to authorize the application, and receives the authorization code on that redirect URI.
4. It writes `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` and the token to every `.env*` file of the current directory, or to a new `.env` file when there is none. A variable that is already there is replaced.

Each URL is printed in the terminal and opened in your browser when possible.

### Get Auth

`getAuth()` returns an `OAuth2Client` from [google-auth-library](https://www.npmjs.com/package/google-auth-library), which refreshes the access token when it expires:

```js
const GoogleOAuth2 = require("google-oauth2-env-vars")
const {docs} = require("@googleapis/docs")

const googleOAuth2 = new GoogleOAuth2({
  // .env token var name
  token: "GOOGLE_DOCS_TOKEN",
})
const auth = await googleOAuth2.getAuth()
const googleDocs = docs({version: "v1", auth})
```

`getEnvVars()` returns the same variables without creating a client, and throws when one of them is missing or invalid.

## Contributing

- ⇄ Pull/Merge requests and ★ Stars are always welcome.
- For bugs and feature requests, please [create an issue][github-issue].

```shell
npm install
npm run lint
npm test
```

The code is plain JavaScript. The types of the public API are written as [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) comments: `npm run lint` checks them with TypeScript, and `npm pack` turns them into the `.d.ts` files of the package.

To release a version, bump it in `package.json` and `CHANGELOG.md`, then publish a GitHub release: the `Publish` workflow publishes it to npm, with its provenance.

[badge-npm]: https://img.shields.io/npm/v/google-oauth2-env-vars.svg?style=flat-square
[badge-npm-dl]: https://img.shields.io/npm/dt/google-oauth2-env-vars.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs-welcome]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[npm]: https://www.npmjs.org/package/google-oauth2-env-vars
[github-issue]: https://github.com/cedricdelpoux/google-oauth2-env-vars/issues/new
