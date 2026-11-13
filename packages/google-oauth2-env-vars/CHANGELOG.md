# Changelog

## 2.0.0

### Breaking changes

- Node.js 22 or later is required.
- The setup asks for an OAuth client of type "Desktop app" instead of "Web application", and the callback server listens on any free port instead of port 5000, as RFC 8252 recommends for local tools. This avoids the conflict with the macOS AirPlay Receiver, which listens on port 5000. An existing "Web application" client keeps working when `port: 5000` is passed to the constructor.
- `generateEnvVars()` no longer throws. It prints the error on a single line in the console, sets `process.exitCode` to 1 and returns `undefined`. `getEnvVars()` and `getAuth()` still throw.
- The "browser / clipboard / terminal" menu shown before each URL is removed. The URL is now always printed in the terminal and opened in the browser when possible.

### Changes

- `googleapis` is replaced by `google-auth-library`, so the package installs about 12 MB instead of about 125 MB.
- `express`, `inquirer`, `dotenv`, `glob`, `open` and `clipboardy` are replaced by Node.js built-ins.
- The authorization uses PKCE, as Google recommends for installed applications.
- The package comes with its TypeScript types.
- `generateEnvVars()` returns the same object (client ID, client secret and token) whether the variables were found or just generated.

### Fixes

- `getAuth()` sends the `Authorization` header again. Its client predated the WHATWG `Headers` used by `googleapis-common@8` and later, so every request failed with "Method doesn't allow unregistered callers".
- `getAuth()` keeps the `refresh_token` when the access token is refreshed, including when the token has not expired yet.
- Generating a token again replaces the variable in the `.env` files instead of adding a duplicate line.
- The `.env*` files are looked up when the variables are written, not when the package is loaded.
- The variables are no longer written to `.envrc`, `.env.example`, `.env.sample` and `.env.template`, which are often committed.
- An invalid JSON token now gives an error that explains the expected format, instead of a bare `SyntaxError`.
- The redirect URI shown during the setup uses the configured `port`.
- The errors keep their original stack trace.
