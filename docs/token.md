# Token

Token can be provided to `gatsby-source-google-docs` with two different way.

## Token file

`gatsby-source-google-docs` provides a command-line script to generate a Google token.

```shell
gatsby-source-google-docs-token
```

> You must be in the root folder of your project to run the script because it will write the token to your file system.
> Path should be /.google

You should add the `.google/` folder to your `.gitignore` because it contains some sensitive informartions.

### Troubleshooting

#### `'gatsby-source-google-docs-token' is not recognized as an internal or external command,`

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

## Environment variable

if `process.env.GATSBY_SOURCE_GOOGLE_DOCS_TOKEN` exists, it will take over the generated token file.

It is usefull on CDN like `Netlify` because you should not commit your token file.

Copy content of `/.google/token.json` and paste it in a environment variable
