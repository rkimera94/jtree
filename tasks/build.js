#! /usr/local/bin/node

const fs = require("fs")
const recursiveReadSync = require("recursive-readdir-sync")
const ProjectProgram = require("project-lang")

const BrowserScript = require("../BrowserScript.js")

const outputFile = __dirname + `/../otree.browser.js`

const files = recursiveReadSync(__dirname + "/../src").filter(file => file.includes(".js"))
const projectCode = ProjectProgram.getProjectProgram(files)
fs.writeFileSync(__dirname + "/../otree.project", projectCode, "utf8")
const projectProgram = new ProjectProgram(projectCode)
const scripts = projectProgram.getOrderedDependenciesArray().filter(file => !file.endsWith("node.js"))

const combined = scripts
  .map(src => fs.readFileSync(src, "utf8"))
  .map(content =>
    new BrowserScript(content)
      .removeRequires()
      .changeNodeExportsToWindowExports()
      .getString()
  )
  .join("\n")

fs.writeFileSync(outputFile, `"use strict"\n` + combined, "utf8")
