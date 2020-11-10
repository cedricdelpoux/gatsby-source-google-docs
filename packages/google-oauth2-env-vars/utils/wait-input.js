/* global Promise */
const readline = require("readline")

exports.waitInput = async () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question("🚦  Type to continue", () => {
      console.log("")
      console.log("------------------------")
      resolve()
    })
  })
}
