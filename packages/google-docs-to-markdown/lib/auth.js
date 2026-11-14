import GoogleOAuth2 from "google-oauth2-env-vars"

const TOKEN_VAR = "GOOGLE_DOCS_TOKEN"

/**
 * Build a Google client from the GOOGLE_OAUTH_CLIENT_ID,
 * GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_DOCS_TOKEN environment variables,
 * read from `.env` when it exists.
 */
export const getAuth = () => new GoogleOAuth2({token: TOKEN_VAR}).getAuth()

/**
 * Generate GOOGLE_DOCS_TOKEN, as `npx google-docs-to-markdown-token` does.
 */
export const generateToken = async () => {
  await new GoogleOAuth2({
    // Drive lets the same token list the documents of a folder
    scope: [
      "https://www.googleapis.com/auth/documents.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    token: TOKEN_VAR,
    apis: ["docs.googleapis.com", "drive.googleapis.com"],
  }).generateEnvVars()
}
