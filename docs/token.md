# Token

The package needs 3 `.env` variables with the following format to work:

```dotenv
GOOGLE_OAUTH_CLIENT_ID=2...m.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=Q...axL
GOOGLE_DOCS_TOKEN={"access_token":"ya...J0","refresh_token":"1..mE","scope":"https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/documents.readonly","token_type":"Bearer","expiry_date":1598284554759}
```

`gatsby-source-google-docs` provides a command-line script to generate a Google token.

> You must be in the root folder of your project to run the script

```shell
gatsby-source-google-docs-token
```

Follow the instructions and the token will be added to your different `.env` files with the format: `GATSBY_SOURCE_GOOGLE_DOCS_TOKEN={...}`

> If you have multiple `.env` files for your different environments, the script will write the token at the end of each file

You should add your `.env` files to your `.gitignore` because it contains some sensitive informations.

# Migration Guide

## From `2.0.0-beta.15` to `2.0.0-beta.16`

If your token name is `GATSBY_SOURCE_GOOGLE_DOCS_TOKEN` and want to update, you need to migrate to the new version.

It's easy to migrate to the new version manipulating manually your `.env` files:

1. Rename `GATSBY_SOURCE_GOOGLE_DOCS_TOKEN` to `GOOGLE_DOCS_TOKEN`
2. Create `GOOGLE_OAUTH_CLIENT_ID` var and move `client_id` to this new var.
3. Create `GOOGLE_OAUTH_CLIENT_SECRET` var and move `client_secret` to this new var.

# Troubleshooting

## `'gatsby-source-google-docs-token' is not recognized as an internal or external command,`

Add an `npm` script to your `package.json`:

```
"scripts": {
    "token": "gatsby-source-google-docs-token"
}
```

Then generate a token:

```
yarn token
# or
npm run token
```
