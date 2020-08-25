module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2019,
  },
  extends: ["eslint:recommended", "plugin:react/recommended", "prettier"],
  settings: {
    react: {
      version: "16.12",
    },
  },
  rules: {
    "react/prop-types": "off",
    "react/display-name": "off",
  },
}
