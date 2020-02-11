module.exports = {
  env: {
    es6: true,
    node: true,
    "jest/globals": true,
  },
  parserOptions: {
    ecmaVersion: 2019,
  },
  extends: ["eslint:recommended", "prettier"],
  plugins: ["jest"],
}
