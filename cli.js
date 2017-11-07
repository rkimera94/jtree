#! /usr/bin/env node --use_strict

const fs = require("fs")

const ConsoleApp = require("./consoleApp.js")

const app = new ConsoleApp()

const action = process.argv[2]
const param = process.argv[3]

if (app[action]) {
  app.addToHistory(action, param)
  console.log(app[action](param))
} else if (!action) {
  app.addToHistory()
  console.log(app.help())
} else if (fs.existsSync(action)) {
  app.addToHistory(undefined, action)
  console.log(app.run(action))
} else console.log(`Unknown command '${action}'. Type 'tree help' to see available commands.`)
