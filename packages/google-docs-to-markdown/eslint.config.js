import js from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: ["types/**"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-control-regex": "off",
    },
  },
]
