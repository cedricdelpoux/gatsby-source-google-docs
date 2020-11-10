const inquirer = require("inquirer")
const clipboardy = require("clipboardy")
const open = require("open")

exports.openUrl = async ({message, url}) => {
  console.log("")
  const {choice} = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message,
      choices: [
        {
          name: "Open in my browser",
          value: "browser",
          short: "🌐  Opened in your browser",
        },
        {
          name: "Copy to clipboard",
          value: "clipboard",
          short: "📋  Added to your clipboard",
        },
        {
          name: "Write to terminal",
          value: "terminal",
          short: `🔗  ${url}`,
        },
      ],
    },
  ])

  if (choice === "browser") {
    open(url)
  } else if (choice === "clipboard") {
    clipboardy.writeSync(url)
  }

  console.log("")
}
