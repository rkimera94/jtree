{
  class stampNode extends jtree.GrammarBackedNode {
    createParser() {
      return new jtree.TreeNode.Parser(
        errorNode,
        Object.assign(Object.assign({}, super.createParser()._getFirstWordMapAsObject()), { "#!": hashbangNode, file: fileNode, folder: folderNode }),
        undefined
      )
    }
    async executeSeries(parentDir) {
      const length = this.length
      for (let index = 0; index < length; index++) {
        const node = this.nodeAt(index)
        await node.execute(parentDir)
      }
      return parentDir
    }
    verbose = true
    silence() {
      this.verbose = false
      return this
    }
    log(message) {
      if (this.verbose) console.log(message)
    }
    async execute(parentDir = process.cwd()) {
      await this.executeSeries(parentDir)
    }
    static dirToStampWithContents(absPathWithoutEndingSlash) {
      return stampNode._dirToStampFn(absPathWithoutEndingSlash, "content")
    }
    static dirToStamp(absPathWithoutEndingSlash) {
      return stampNode._dirToStampFn(absPathWithoutEndingSlash, "list")
    }
    static _dirToStampFn(absPathWithoutEndingSlash, output) {
      const fs = require("fs")
      // todo: add chmod, file metadata
      if (absPathWithoutEndingSlash.startsWith(".")) absPathWithoutEndingSlash = jtree.Utils.resolvePath(absPathWithoutEndingSlash, process.cwd() + "/")
      const stat = fs.statSync(absPathWithoutEndingSlash)
      if (!stat.isDirectory()) throw new Error(`${absPath} is a file not a directory.`)
      const fns = {
        list: (file, reducedPath) => {
          const stat = fs.statSync(file)
          const isDir = stat.isDirectory()
          if (isDir) return `folder ` + reducedPath
          return `file ` + reducedPath
        },
        content: (file, reducedPath) => {
          const stat = fs.statSync(file)
          const isDir = stat.isDirectory()
          if (isDir) return `folder ` + reducedPath
          const content = fs.readFileSync(file, "utf8")
          return `file ${reducedPath}
 data${jtree.TreeNode.nest(content, 2)}`
        }
      }
      const fn = fns[output]
      return this._dirToStamp(absPathWithoutEndingSlash, fn)
    }
    static _dirToStamp(absPathWithoutEndingSlash, fileFn) {
      const files = require("recursive-readdir-sync")(absPathWithoutEndingSlash)
      const folderParts = absPathWithoutEndingSlash.split("/")
      const rootFolderName = folderParts.pop()
      const rootFolderPath = folderParts.join("/")
      const pathStartIndex = rootFolderPath.length + 1
      return files.map(file => fileFn(file, file.substr(pathStartIndex))).join("\n")
    }
    static cachedHandGrammarProgramRoot = new jtree.HandGrammarProgram(`tooling onsave jtree build produceLang stamp
todo File permissions
anyCell
extraCell
 highlightScope invalid
anyCell
 highlightScope string
promptWordsCell
 highlightScope string
filepathCell
varNameCell
 highlightScope string
commentCell
 highlightScope comment
inputTypeCell
 enum string int any lowercase
keywordCell
 highlightScope keyword.control
stampNode
 root
 description A prefix Tree Language for creating distributable text template files that expand to folders and files.
 catchAllNodeType errorNode
 javascript
  async executeSeries(parentDir) {
   const length = this.length
   for (let index = 0; index < length; index++) {
    const node = this.nodeAt(index)
    await node.execute(parentDir)
   }
   return parentDir
  }
  verbose = true
  silence(){
    this.verbose = false
    return this
  }
  log(message) {
    if (this.verbose)
      console.log(message)
  }
  async execute(parentDir = process.cwd()) {
   await this.executeSeries(parentDir)
  }
  static dirToStampWithContents(absPathWithoutEndingSlash) {
    return stampNode._dirToStampFn(absPathWithoutEndingSlash, "content")
  }
  static dirToStamp(absPathWithoutEndingSlash) {
    return stampNode._dirToStampFn(absPathWithoutEndingSlash, "list")
  }
  static _dirToStampFn(absPathWithoutEndingSlash, output) {
   const fs = require("fs")
   // todo: add chmod, file metadata
   if (absPathWithoutEndingSlash.startsWith(".")) absPathWithoutEndingSlash = jtree.Utils.resolvePath(absPathWithoutEndingSlash, process.cwd() + "/")
   const stat = fs.statSync(absPathWithoutEndingSlash)
   if (!stat.isDirectory()) throw new Error(\`\${absPath} is a file not a directory.\`)
   const fns = {
    list: (file, reducedPath) => {
     const stat = fs.statSync(file)
     const isDir = stat.isDirectory()
     if (isDir) return \`folder \` + reducedPath
     return \`file \` + reducedPath
    },
    content: (file, reducedPath) => {
     const stat = fs.statSync(file)
     const isDir = stat.isDirectory()
     if (isDir) return \`folder \` + reducedPath
     const content = fs.readFileSync(file, "utf8")
     return \`file \${reducedPath}
   data\${jtree.TreeNode.nest(content, 2)}\`
    }
   }
   const fn = fns[output]
   return this._dirToStamp(absPathWithoutEndingSlash, fn)
  }
  static _dirToStamp(absPathWithoutEndingSlash, fileFn) {
   const files = require("recursive-readdir-sync")(absPathWithoutEndingSlash)
   const folderParts = absPathWithoutEndingSlash.split("/")
   const rootFolderName = folderParts.pop()
   const rootFolderPath = folderParts.join("/")
   const pathStartIndex = rootFolderPath.length + 1
   return files.map(file => fileFn(file, file.substr(pathStartIndex))).join("\\n")
  }
 inScope hashbangNode folderNode fileNode
hashbangNode
 crux #!
 catchAllCellType commentCell
 cells commentCell
catchAllAnyLineNode
 catchAllCellType anyCell
 catchAllNodeType catchAllAnyLineNode
 cells anyCell
dataNode
 catchAllNodeType catchAllAnyLineNode
 cells keywordCell
 crux data
errorNode
 baseNodeType errorNode
executableNode
 cells keywordCell
 crux executable
fileNode
 cells keywordCell filepathCell
 javascript
  compileToBash(parentDir) {
   const filePath = this._getAbsolutePath(parentDir)
   return \`touch \${filePath}\\necho -e "\${this.childrenToString()}" >> \${filePath}\`
  }
  _getAbsolutePath(parentDir = process.cwd()) {
   return parentDir + "/" + this.cells.filepathCell
  }
  execute(parentDir) {
   const fs = require("fs")
   const fullPath = this._getAbsolutePath(parentDir)
   this.getRootNode().log(\`Creating file \${fullPath}\`)
   const data = this.getNode("data")
   const content = data ? data.childrenToString() : ""
   require("mkdirp").sync(require("path").dirname(fullPath))
   fs.writeFileSync(fullPath, content, "utf8")
   const isExecutable = this.has("executable") // todo: allow for all file permissions?
   if (isExecutable) fs.chmodSync(fullPath, "755")
  }
 inScope dataNode executableNode
 crux file
folderNode
 cells keywordCell filepathCell
 javascript
  compileToBash(parentDir) {
   return \`mkdir \${this._getAbsolutePath(parentDir)}\`
  }
  _getAbsolutePath(parentDir = process.cwd()) {
   return parentDir + "/" + this.cells.filepathCell
  }
  execute(parentDir) {
   const path = this._getAbsolutePath(parentDir)
   this.getRootNode().log(\`Creating folder \${path}\`)
   require("mkdirp").sync(path)
  }
 crux folder`)
    getHandGrammarProgram() {
      return this.constructor.cachedHandGrammarProgramRoot
    }
    static getNodeTypeMap() {
      return {
        stampNode: stampNode,
        hashbangNode: hashbangNode,
        catchAllAnyLineNode: catchAllAnyLineNode,
        dataNode: dataNode,
        errorNode: errorNode,
        executableNode: executableNode,
        fileNode: fileNode,
        folderNode: folderNode
      }
    }
  }

  class hashbangNode extends jtree.GrammarBackedNode {
    get commentCell() {
      return this.getWord(0)
    }
    get commentCell() {
      return this.getWordsFrom(1)
    }
  }

  class catchAllAnyLineNode extends jtree.GrammarBackedNode {
    createParser() {
      return new jtree.TreeNode.Parser(catchAllAnyLineNode, undefined, undefined)
    }
    get anyCell() {
      return this.getWord(0)
    }
    get anyCell() {
      return this.getWordsFrom(1)
    }
  }

  class dataNode extends jtree.GrammarBackedNode {
    createParser() {
      return new jtree.TreeNode.Parser(catchAllAnyLineNode, undefined, undefined)
    }
    get keywordCell() {
      return this.getWord(0)
    }
  }

  class errorNode extends jtree.GrammarBackedNode {
    getErrors() {
      return this._getErrorNodeErrors()
    }
  }

  class executableNode extends jtree.GrammarBackedNode {
    get keywordCell() {
      return this.getWord(0)
    }
  }

  class fileNode extends jtree.GrammarBackedNode {
    createParser() {
      return new jtree.TreeNode.Parser(
        undefined,
        Object.assign(Object.assign({}, super.createParser()._getFirstWordMapAsObject()), { data: dataNode, executable: executableNode }),
        undefined
      )
    }
    get keywordCell() {
      return this.getWord(0)
    }
    get filepathCell() {
      return this.getWord(1)
    }
    compileToBash(parentDir) {
      const filePath = this._getAbsolutePath(parentDir)
      return `touch ${filePath}\necho -e "${this.childrenToString()}" >> ${filePath}`
    }
    _getAbsolutePath(parentDir = process.cwd()) {
      return parentDir + "/" + this.cells.filepathCell
    }
    execute(parentDir) {
      const fs = require("fs")
      const fullPath = this._getAbsolutePath(parentDir)
      this.getRootNode().log(`Creating file ${fullPath}`)
      const data = this.getNode("data")
      const content = data ? data.childrenToString() : ""
      require("mkdirp").sync(require("path").dirname(fullPath))
      fs.writeFileSync(fullPath, content, "utf8")
      const isExecutable = this.has("executable") // todo: allow for all file permissions?
      if (isExecutable) fs.chmodSync(fullPath, "755")
    }
  }

  class folderNode extends jtree.GrammarBackedNode {
    get keywordCell() {
      return this.getWord(0)
    }
    get filepathCell() {
      return this.getWord(1)
    }
    compileToBash(parentDir) {
      return `mkdir ${this._getAbsolutePath(parentDir)}`
    }
    _getAbsolutePath(parentDir = process.cwd()) {
      return parentDir + "/" + this.cells.filepathCell
    }
    execute(parentDir) {
      const path = this._getAbsolutePath(parentDir)
      this.getRootNode().log(`Creating folder ${path}`)
      require("mkdirp").sync(path)
    }
  }

  window.stampNode = stampNode
}
