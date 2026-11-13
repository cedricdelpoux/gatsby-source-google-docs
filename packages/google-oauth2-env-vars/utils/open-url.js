const {spawn} = require("node:child_process")

/**
 * @param {string} url
 * @returns {[string, string[]]}
 */
const getOpenCommand = (url) => {
  switch (process.platform) {
    case "darwin":
      return ["open", [url]]
    case "win32":
      // Quoted so that cmd does not split the URL on its "&"
      return ["cmd", ["/c", "start", '""', `"${url}"`]]
    default:
      return ["xdg-open", [url]]
  }
}

const openUrl = ({message, url}) => {
  console.log("")
  console.log(`🔗  ${message} ${url}`)
  console.log("")

  const [command, args] = getOpenCommand(url)

  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsVerbatimArguments: true,
    })
    child.on("error", () => {})
    child.unref()
  } catch {
    // The URL is printed above, so it can still be opened by hand
  }
}

module.exports = {
  openUrl,
}
