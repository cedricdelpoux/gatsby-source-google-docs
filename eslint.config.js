import js from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: [
      ".claude/**",
      "types/**",
      "examples/*/.cache/**",
      "examples/*/public/**",
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
    files: ["examples/**/*.js", "examples/**/*.mjs"],
    languageOptions: {
      parserOptions: {ecmaFeatures: {jsx: true}},
      globals: globals.browser,
    },
  },
]
