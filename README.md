# google-docs-to-markdown

Use Google Docs as a content source. This monorepo holds the packages that read a Google Doc, convert it to Markdown or MDX, and handle the Google authentication they need.

| Package                                                             | Description                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`gatsby-source-google-docs`](./packages/gatsby-source-google-docs) | Gatsby plugin that uses Google Docs as a data source           |
| [`google-docs-to-markdown`](./packages/google-docs-to-markdown)     | Convert Google Docs to Markdown or MDX, with or without Gatsby |
| [`google-oauth2-env-vars`](./packages/google-oauth2-env-vars)       | Generate and cache Google OAuth 2.0 tokens in `.env` files     |

`gatsby-source-google-docs` depends on `google-docs-to-markdown`, which depends on `google-oauth2-env-vars`. Each package has its own README and CHANGELOG.

## Development

The repository uses [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) and requires Node.js 22.12 or later.

```shell
npm install
npm run lint   # build, then eslint and tsc in each package, then prettier
npm test       # run the tests of each package
npm run build  # generate the type declarations of each package
npm run format # format the repository with prettier
```

Use `-w <package>` to run a script in one package, for example `npm test -w google-docs-to-markdown`.

## Releases

The packages are versioned independently with [changesets](https://github.com/changesets/changesets).

1. Run `npm run changeset` to choose the packages and the bump (patch, minor or major) and to describe the change. Commit the generated file with your pull request.
2. When the pull request is merged into `master`, the `Release` workflow opens a "Version packages" pull request. It bumps the versions, updates the changelogs and the dependency ranges between the packages.
3. Merging the "Version packages" pull request publishes the new versions to npm with their provenance and creates the git tags.

## License

[MIT](./LICENCE.md)
