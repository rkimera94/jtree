const TreeNotation = require("../treenotation.js")
const Tape = require("tape")

class UnitTestSection extends TreeNotation {}

class Wall extends TreeNotation {
	parseNodeType(line) {
		return UnitTestSection
	}

	getSectionsToRun() {
		const onlyRun = this.getChildren().filter(node => node.getLine().startsWith("+"))
		return onlyRun.length ? onlyRun : this.getChildren().filter(node => !node.getLine().startsWith("!"))
	}

	execute(testFn) {
		this.getSectionsToRun().map(child => {
			Tape(child.getHead(), assert => {
				const results = testFn(child)
				assert.equal(results.actual, results.expected, results.message)
				assert.end()
			})
		})
	}
}

module.exports = Wall
