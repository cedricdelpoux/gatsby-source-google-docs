# google-docs-sync monorepo

npm workspaces monorepo. Everything is ESM or plain JavaScript checked with tsc (JSDoc types), Node >= 22.12.

## Layout

- `packages/gatsby-source-google-docs`: the Gatsby plugin, a thin adapter over `google-docs-sync` (source nodes, pages, schema, Gatsby options). Its `examples/` are Gatsby sites with their own tooling, they are not workspaces.
- `packages/google-docs-sync`: the framework-agnostic sync (depends on `google-docs-to-markdown` and `google-oauth2-env-vars`). It owns everything that touches the Google APIs and the filesystem: auth and token, Drive folder walk, document fetching, the `.google-docs` store, writing the Markdown and images. Frameworks inject a logger (`{info, warn, error}`) and read the returned documents. Its CLI bins are `google-docs-sync` and `google-docs-sync-token`.
- `packages/google-docs-to-markdown`: the pure converter, Google Docs API document JSON in, Markdown or MDX out. It knows nothing about Google APIs or the filesystem.
- `packages/google-oauth2-env-vars`: token generation, CommonJS.
- Shared at the root: `eslint.config.js` (one flat config with per-package overrides), `.prettierrc`, `.prettierignore`, `.editorconfig`, `.npmrc`, `.github/`, `.changeset/`, and the single `package-lock.json`.
- The dev dependencies shared by the packages (eslint, prettier, typescript, vitest, coverage, `@types/node`, globals) live in the root `package.json`. A package declares only its own.
- Each package keeps its own `LICENCE.md` copy because npm packs it from the package folder.
- The repository is `cedricdelpoux/google-docs-sync` on GitHub (formerly `google-docs-to-markdown`), the `repository.url` of every package points to it.
- Internal dependency ranges (`google-docs-to-markdown: ^1.0.1`) stay as they are: npm links the workspace packages while the versions satisfy the ranges.

## Commands

Run from the root.

- `npm install`: install everything and link the packages. With npm 10, a fresh resolution without a lock fails on the gatsby peer dependencies (npm bug): use npm 11 (`npx npm@11 install`) when the lock needs to be regenerated.
- `npm run lint`: builds the types first (gatsby and google-docs-sync type-check against the built types of the packages they depend on), then runs `eslint` and `tsc --noEmit` in each package, then `prettier --check .` at the root.
- `npm test`: runs each package test script.
- `npm run build`: `tsc` in each package, it writes the git-ignored `types/` folders.
- `npm run format`: `prettier --write .`.
- `npm pack --dry-run -w <package>`: check the published files.

## Releases

Independent versions with changesets (`.changeset/config.json`, base branch `master`).

- A change to a package comes with a changeset: `npm run changeset`.
- `.github/workflows/release.yml` runs `changesets/action` on `master`: it opens the "Version packages" pull request (`npm run version-packages`, which also refreshes the lock), and when that is merged it publishes (`npm run release`, i.e. `changeset publish`) through npm trusted publishing (OIDC, no token).
- Tags are `<package>@<version>`. The ones imported before the merge are `google-docs-to-markdown@v1.0.1` and `google-oauth2-env-vars@v2.0.0`, the gatsby plugin keeps its old `vX.Y.Z` tags.
- `.github/workflows/ci.yml` runs lint and tests on Node 22 and 24 (Gatsby 5 does not support Node 26).
