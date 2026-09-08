const js = require("@eslint/js")
const globals = require("globals")
const jest = require("eslint-plugin-jest")
const react = require("eslint-plugin-react")
const prettier = require("eslint-config-prettier")

module.exports = [
  {
    ignores: [
      "coverage/**",
      // Nested git worktrees (e.g. from Claude Code) live inside the repo
      // tree with their own node_modules; never lint their contents.
      ".claude/**",
      "examples/*/.cache/**",
      "examples/*/public/**",
      "**/node_modules/**",
    ],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-control-regex": 0,
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unknown-property": [
        "error",
        {ignore: ["sx"]} /* theme-ui in examples */,
      ],
    },
  },
  {
    // Browser/SSR entrypoints shipped with the package: ES modules and JSX.
    files: [
      "index.js",
      "gatsby-browser.js",
      "gatsby-ssr.js",
      "utils/google-docs-context.js",
      "utils/wrap-page-element.js",
    ],
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {jsx: true},
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Examples are Gatsby sites: ES modules, JSX and browser globals.
    files: [
      "examples/**/src/**/*.js",
      "examples/*/gatsby-browser.js",
      "examples/*/gatsby-ssr.js",
      // `remark-gfm` is ESM only, so the MDX example's config is a ".mjs" file
      "examples/*/*.mjs",
    ],
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {jsx: true},
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["__tests__/**/*.js"],
    ...jest.configs["flat/recommended"],
    rules: {
      ...jest.configs["flat/recommended"].rules,
      "jest/expect-expect": "off",
    },
  },
]
