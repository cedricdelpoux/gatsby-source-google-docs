const readline = require("node:readline/promises")

const ask = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}

const askRequired = async (question) => {
  let answer = ""

  while (!answer) {
    answer = await ask(question)
  }

  return answer
}

module.exports = {
  ask,
  askRequired,
}
