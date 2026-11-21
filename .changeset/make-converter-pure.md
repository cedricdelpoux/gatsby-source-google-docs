---
"google-docs-to-markdown": major
---

Turn the package into a pure converter. The `google-docs-to-markdown/google` entry (`getAuth`, `generateToken`, `fetchDocument`, `fetchMarkdown`) and the `google-docs-to-markdown-token` command move to the new `google-docs-sync` package, and the dependencies on `@googleapis/docs`, `google-auth-library` and `google-oauth2-env-vars` go with them. Fetch the document with `fetchDocument` from `google-docs-sync`, then give it to `toMarkdown`.
