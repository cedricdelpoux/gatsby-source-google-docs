module.exports = {
  env: {
    es6: true,
    node: true,
    "jest/globals": true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended", "prettier"],
  plugins: ["jest"],
}
