import js from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: [
      ".claude/**",
      "**/types/**",
      "**/examples/*/.cache/**",
      "**/examples/*/public/**",
      "**/node_modules/**",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["packages/gatsby-source-google-docs/examples/**/*.{js,mjs}"],
    languageOptions: {
      parserOptions: {ecmaFeatures: {jsx: true}},
      globals: globals.browser,
    },
  },
  {
    files: ["packages/google-docs-to-markdown/**/*.js"],
    rules: {
      "no-control-regex": "off",
    },
  },
  {
    files: ["packages/google-oauth2-env-vars/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
]
