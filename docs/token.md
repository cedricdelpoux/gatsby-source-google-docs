# Token

Token can be provided to `gatsby-source-google-docs` with two different way.

## Token file

`gatsby-source-google-docs` provides a command-line script to generate a Google token.

```shell
gatsby-source-google-docs-token
```

Follow the instructions and the token will be added to your `.env` file with the format `GATSBY_SOURCE_GOOGLE_DOCS_TOKEN={...}`

If you have multiple `.env` files for your different environments, you need to copy the token to your different files

You should add the `.env/` folder to your `.gitignore` because it contains some sensitive informations.

## Troubleshooting

### `'gatsby-source-google-docs-token' is not recognized as an internal or external command,`

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
