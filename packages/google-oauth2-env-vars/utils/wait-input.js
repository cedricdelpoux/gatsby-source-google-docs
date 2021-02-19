/* global Promise */
const readline = require("readline")

exports.waitInput = async (message) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log("")

    rl.question(`🚦  ${message} Press any key to continue setup`, () => {
      console.log("")
      console.log("------------------------")
      resolve()
    })
  })
}
