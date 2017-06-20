#! /usr/local/bin/node --use_strict

const Hakon = require("./Hakon.js")
const Wall = require("./Wall.js")

const program = `basics
 in
  body
   font-size 12px
   h1,h2
    color red
  a
   &:hover
    color blue
    font-size 17px
 out
  body {
    font-size: 12px;
  }
  body h1,body h2 {
    color: red;
  }
  a:hover {
    color: blue;
    font-size: 17px;
  }
  `

const tests = new Wall(program)

!module.parent
  ? tests.execute(node => {
      const sourceETNCode = node.getNode("in").childrenToString()
      const expected = node.getNode("out").childrenToString()
      const actual = new Hakon(sourceETNCode).toCss()
      const message = node.getLine()
      return {
        actual: actual,
        expected: expected,
        message: message
      }
    })
  : (module.exports = tests)
