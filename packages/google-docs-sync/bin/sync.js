#! /usr/bin/env node

import {runCli} from "../lib/cli.js"

try {
  process.loadEnvFile()
} catch (e) {
  if (e.code !== "ENOENT") throw e
}

try {
  await runCli(process.argv.slice(2))
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
}
