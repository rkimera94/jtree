//onsave jtree build produce DesignerApp.browser.js

const { AbstractTreeComponent, WillowConstants, TreeComponentFrameworkDebuggerComponent, AbstractGithubTriangleComponent } = require("../products/TreeComponentFramework.node.js")
const { jtree } = require("../index.js")

declare var jQuery: any

// todo: get typings in here.
declare var CodeMirror: any
declare var saveAs: any
declare var JSZip: any
declare var dumbdownNode: any
declare type html = string

class DesignerApp extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      githubTriangleComponent: githubTriangleComponent,
      samplesComponent: samplesComponent,
      tableComponent: tableComponent,
      shareComponent: shareComponent,
      headerComponent: headerComponent,
      otherErrorsComponent: otherErrorsComponent,
      TreeComponentFrameworkDebuggerComponent: TreeComponentFrameworkDebuggerComponent
    })
  }

  _clearResults() {
    jQuery(".resultsDiv").html("")
    jQuery(".resultsDiv").val("")
  }

  ///
  async executeCommand() {
    const result = await this.program.execute()
    jQuery("#executeResultsDiv").val(Array.isArray(result) ? result.join(",") : result)
  }

  compileCommand() {
    jQuery("#compileResultsDiv").val(this.program.compile())
  }

  showAutoCompleteCubeCommand() {
    jQuery("#explainResultsDiv").html(this.program.toAutoCompleteCube().toHtmlCube())
  }

  visualizeCommand() {
    jQuery("#explainResultsDiv").html(this._toIceTray(this.program))
  }

  inferPrefixGrammarCommand() {
    this.setGrammarCode(new jtree.UnknownGrammarProgram(this.getCodeValue()).inferGrammarFileForAKeywordLanguage("inferredLanguage"))
    this._onGrammarKeyup()
  }

  synthesizeProgramCommand() {
    const grammarProgram = new jtree.GrammarProgram(this.getGrammarCode())
    this.setCodeCode(
      grammarProgram
        ._getRootNodeTypeDefinitionNode()
        .synthesizeNode()
        .join("\n")
    )
    this._onCodeKeyUp()
  }

  resetCommand() {
    Object.values(this._localStorageKeys).forEach(val => localStorage.removeItem(val))
    const willowBrowser = this.getWillowProgram()
    willowBrowser.reload()
  }

  async fetchAndLoadJtreeShippedLanguageCommand(name: string) {
    const samplePath = `/langs/${name}/sample.${name}`
    const grammarPath = `/langs/${name}/${name}.grammar`

    const willowBrowser = this.getWillowProgram()
    const grammar = await willowBrowser.httpGetUrl(grammarPath)
    const sample = await willowBrowser.httpGetUrl(samplePath)

    this._setGrammarAndCode(grammar.text, sample.text)
  }

  // TODO: ADD TESTS!!!!!
  async downloadBundleCommand() {
    const grammarProgram = new jtree.GrammarProgram(this.getGrammarCode())
    const bundle = grammarProgram.toBundle()
    const languageName = grammarProgram.getExtensionName()
    return this._makeZipBundle(languageName + ".zip", bundle)
  }

  private async _makeZipBundle(fileName: string, bundle: any) {
    const zip = new JSZip()
    Object.keys(bundle).forEach(key => {
      zip.file(key, bundle[key])
    })

    zip.generateAsync({ type: "blob" }).then((content: any) => {
      // see FileSaver.js
      saveAs(content, fileName)
    })
  }

  private _toIceTray(program: any) {
    const columns = program.getProgramWidth()

    const cellTypes = new jtree.TreeNode(program.toCellTypeTreeWithNodeConstructorNames())
    const rootCellTypes = new jtree.TreeNode(program.toPreludeCellTypeTreeWithNodeConstructorNames())

    const table = program
      .getProgramAsCells()
      .map((line: any, lineIndex: number) => {
        const nodeType = cellTypes.nodeAt(lineIndex).getWord(0)
        let cells = `<td class="iceTrayNodeType">${nodeType}</td>` // todo: add ancestry
        for (let cellIndex = 0; cellIndex < columns; cellIndex++) {
          const cell = line[cellIndex]
          if (!cell) cells += `<td>&nbsp;</td>`
          else {
            const cellType = cellTypes.nodeAt(lineIndex).getWord(cellIndex + 1)
            const rootCellType = rootCellTypes.nodeAt(lineIndex).getWord(cellIndex + 1)
            const cellTypeDivs = [cellType, rootCellType] // todo: add full ancestry
            cells += `<td><span class="cellTypeSpan">${cellTypeDivs.join(" ")}</span>${cell.getWord()}</td>`
          }
        }
        return `<tr>${cells}</tr>`
      })
      .join("\n")
    return `<table class="iceCubes">${table}</table>`
  }
  ///

  public languages = "newlang hakon stump dumbdown arrow dug iris fire chuck wwt swarm project stamp grammar config jibberish numbers poop".split(" ")

  public program: any
  public grammarProgram: any

  private get _codeErrorsConsole() {
    return jQuery("#codeErrorsConsole")
  }
  private get _codeConsole() {
    return jQuery("#codeConsole")
  }
  private get _grammarConsole() {
    return jQuery("#grammarConsole")
  }
  private get _grammarErrorsConsole() {
    return jQuery("#grammarErrorsConsole")
  }
  private get _readmeComponent() {
    return jQuery("#readmeComponent")
  }
  private get _shareLink() {
    return jQuery("#shareLink")
  }

  _localStorageKeys = {
    grammarConsole: "grammarConsole",
    codeConsole: "codeConsole"
  }

  private GrammarConstructor: any
  private grammarInstance: any
  private codeInstance: any

  private _grammarConstructor: any
  private _cachedGrammarCode: string

  private codeWidgets: any[] = []

  private async _loadFromDeepLink() {
    const hash = location.hash
    if (hash.length < 2) return false

    const deepLink = new jtree.TreeNode(decodeURIComponent(hash.substr(1)))
    const standard = deepLink.get("standard")
    if (standard) {
      console.log("Loading standard from deep link....")
      await this.fetchAndLoadJtreeShippedLanguageCommand(standard)
      return true
    } else {
      const grammarCode = deepLink.getNode("grammar")
      const sampleCode = deepLink.getNode("sample")
      if (grammarCode && sampleCode) {
        console.log("Loading custom from deep link....")
        this._setGrammarAndCode(grammarCode.childrenToString(), sampleCode.childrenToString())
        return true
      }
    }
    return false
  }

  private _clearHash() {
    history.replaceState(null, null, " ")
  }

  _onGrammarKeyup() {
    this._grammarDidUpdate()
    this._onCodeKeyUp()
    // Hack to break CM cache:
    if (true) {
      const val = this.getCodeValue()
      this.setCodeCode("\n" + val)
      this.setCodeCode(val)
    }
  }

  async appWillFirstRender() {
    const willowBrowser = this.getWillowProgram()
    const result = await willowBrowser.httpGetUrl("/langs/grammar/grammar.grammar")
    this.GrammarConstructor = new jtree.GrammarProgram(result.text).getRootConstructor()
  }

  async appDidFirstRender() {
    this.grammarInstance = new jtree.TreeNotationCodeMirrorMode("grammar", () => this.GrammarConstructor, undefined, CodeMirror).register().fromTextAreaWithAutocomplete(<any>this._grammarConsole[0], { lineWrapping: true })

    this.grammarInstance.on("keyup", () => {
      this._onGrammarKeyup()
    })

    this.codeInstance = new jtree.TreeNotationCodeMirrorMode("custom", () => this._getGrammarConstructor(), undefined, CodeMirror).register().fromTextAreaWithAutocomplete(<any>this._codeConsole[0], { lineWrapping: true })

    this.codeInstance.on("keyup", () => this._onCodeKeyUp())

    // loadFromURL
    const wasLoadedFromDeepLink = await this._loadFromDeepLink()
    if (!wasLoadedFromDeepLink) await this._restoreFromLocalStorage()
  }

  getGrammarCode() {
    return this.grammarInstance.getValue()
  }

  setGrammarCode(code: string) {
    this.grammarInstance.setValue(code)
  }

  setCodeCode(code: string) {
    this.codeInstance.setValue(code)
  }

  getCodeValue() {
    return this.codeInstance.getValue()
  }

  private async _restoreFromLocalStorage() {
    console.log("Restoring from local storage....")
    const grammarCode: any = localStorage.getItem(this._localStorageKeys.grammarConsole)
    const code = localStorage.getItem(this._localStorageKeys.codeConsole)

    if (typeof grammarCode === "string" && typeof code === "string") this._setGrammarAndCode(grammarCode, code)

    return grammarCode || code
  }

  private _updateLocalStorage() {
    localStorage.setItem(this._localStorageKeys.grammarConsole, this.getGrammarCode())
    localStorage.setItem(this._localStorageKeys.codeConsole, this.getCodeValue())
    this._updateShareLink() // todo: where to put this?
    console.log("Local storage updated...")
  }

  private _getGrammarErrors(grammarCode: string) {
    return new this.GrammarConstructor(grammarCode).getAllErrors()
  }

  private _getGrammarConstructor() {
    let currentGrammarCode = this.getGrammarCode()

    if (!this._grammarConstructor || currentGrammarCode !== this._cachedGrammarCode) {
      try {
        const grammarErrors = this._getGrammarErrors(currentGrammarCode)
        this._grammarConstructor = new jtree.GrammarProgram(currentGrammarCode).getRootConstructor()
        this._cachedGrammarCode = currentGrammarCode
        jQuery("#otherErrorsDiv").html("")
      } catch (err) {
        console.error(err)
        jQuery("#otherErrorsDiv").html(err)
      }
    }
    return this._grammarConstructor
  }

  protected onCommandError(err: any) {
    console.log(err)
    jQuery("#otherErrorsDiv").html(err)
  }

  private _grammarDidUpdate() {
    const grammarCode = this.getGrammarCode()
    this._updateLocalStorage()
    this.grammarProgram = new this.GrammarConstructor(grammarCode)
    const errs = this.grammarProgram.getAllErrors().map((err: any) => err.toObject())
    this._grammarErrorsConsole.html(errs.length ? new jtree.TreeNode(errs).toFormattedTable(200) : "0 errors")
    const grammarProgram = new jtree.GrammarProgram(this.grammarInstance.getValue())
    const readme = new dumbdownNode(grammarProgram.toReadMe()).compile()
    this._readmeComponent.html(readme)
  }

  private _updateShareLink() {
    const url = new URL(location.href)
    url.hash = ""
    const base = url.toString()
    this._shareLink.val(base + this.toShareLink())
  }

  toShareLink() {
    const tree = new jtree.TreeNode()
    tree.appendLineAndChildren("grammar", this.getGrammarCode())
    tree.appendLineAndChildren("sample", this.getCodeValue())
    return "#" + encodeURIComponent(tree.toString())
  }

  _onCodeKeyUp() {
    const code = this.getCodeValue()
    this._updateLocalStorage()
    const programConstructor = this._getGrammarConstructor()
    const that = this

    this.program = new programConstructor(code)
    const errs = this.program.getAllErrors()
    this._codeErrorsConsole.html(errs.length ? new jtree.TreeNode(errs.map((err: any) => err.toObject())).toFormattedTable(200) : "0 errors")

    const cursor = this.codeInstance.getCursor()

    // todo: what if 2 errors?
    this.codeInstance.operation(() => {
      this.codeWidgets.forEach(widget => this.codeInstance.removeLineWidget(widget))
      this.codeWidgets.length = 0

      errs
        .filter((err: any) => !err.isBlankLineError())
        .filter((err: any) => !err.isCursorOnWord(cursor.line, cursor.ch))
        .slice(0, 1) // Only show 1 error at a time. Otherwise UX is not fun.
        .forEach((err: any) => {
          const el = err.getCodeMirrorLineWidgetElement(() => {
            this.codeInstance.setValue(this.program.toString())
            this._onCodeKeyUp()
          })
          this.codeWidgets.push(this.codeInstance.addLineWidget(err.getLineNumber() - 1, el, { coverGutter: false, noHScroll: false }))
        })
      const info = this.codeInstance.getScrollInfo()
      const after = this.codeInstance.charCoords({ line: cursor.line + 1, ch: 0 }, "local").top
      if (info.top + info.clientHeight < after) this.codeInstance.scrollTo(null, after - info.clientHeight + 3)
    })

    jQuery(".onCodeUp:checked").each(function() {
      that[jQuery(this).val()]()
    })
  }

  _setGrammarAndCode(grammar: string, code: string) {
    this.setGrammarCode(grammar)
    this.setCodeCode(code)
    this._clearHash()
    this._grammarDidUpdate()
    this._clearResults()
    this._onCodeKeyUp()
  }

  toHakonCode() {
    const theme = this.getTheme()
    return `body
 font-family "San Francisco", "Myriad Set Pro", "Lucida Grande", "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif
 margin auto
 max-width 1200px
 background #eee
 color rgba(1, 47, 52, 1)
 h1
  font-weight 300
.CodeMirror-gutters
 background transparent !important
.CodeMirror
 background transparent !important
input,textarea
 background transparent
table
 width 100%
 table-layout fixed
td
 vertical-align top
 width 50%
 border 1px solid gray
.iceCubes
 tr,td
  margin 0
  overflow scroll
  border 0
 td
  box-shadow rgba(1,1,1,.1) 1px 1px 1px
  position relative
  padding 10px 3px 2px 2px
  .cellTypeSpan
   position absolute
   white-space nowrap
   left 0
   top 0
   font-size 8px
   color rgba(1,1,1,.2)
 .iceTrayNodeType
  box-shadow none
  font-size 8px
  color rgba(1,1,1,.2)
 tr
  &:hover
   td
    .iceTrayNodeType
     color rgba(1,1,1,.5)
    .cellTypeSpan
     color rgba(1,1,1,.5)
code
 white-space pre
pre
 overflow scroll
.htmlCubeSpan
 --topIncrement 1px
 --leftIncrement 1px
 --cellWidth 100px
 --rowHeight 30px
 position absolute
 box-sizing border-box
 width var(--cellWidth)
 height var(--rowHeight)
 overflow hidden
 text-overflow hidden
 display inline-block
 text-align center
 line-height var(--rowHeight)
 font-size 12px
 font-family -apple-system, BlinkMacSystemFont, sans-serif
 color rgba(0, 0, 0, 0.8)
 background rgba(255, 255, 255, 1)
 border 1px solid rgba(0, 0, 0, 0.3)
.htmlCubeSpan:hover
 opacity 1
 background rgba(255, 255, 255, 1)
 z-index 2
a
 cursor pointer
 color rgba(1, 47, 52, 1)
 text-decoration underline
.LintError,.LintErrorWithSuggestion,.LintCellTypeHints
 white-space pre
 color red
 background #e5e5e5
.LintCellTypeHints
 color black
.LintErrorWithSuggestion
 cursor pointer`
  }

  static getDefaultStartState() {
    return `headerComponent
samplesComponent
shareComponent
otherErrorsComponent
tableComponent
githubTriangleComponent`
  }
}

class samplesComponent extends AbstractTreeComponent {
  toStumpCode() {
    const langs = this.getRootNode()
      .languages.map(
        (lang: string) => ` a ${jtree.Utils.ucfirst(lang)}
  href #standard%20${lang}
  value ${lang}
  ${WillowConstants.DataShadowEvents.onClickCommand} fetchAndLoadJtreeShippedLanguageCommand`
      )
      .join("\n span  | \n")
    return `p
 span Example Languages
${langs}`
  }
}

class shareComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 id shareDiv
 span Share
 input
  id shareLink
  readonly`
  }
  toHakonCode() {
    return `#shareDiv
 font-size 16px
 width 100%
 span
  width 50px
  display inline-block
 input
  font-size 16px
  padding 5px
  width calc(100% - 70px)`
  }
}

class otherErrorsComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 id otherErrorsDiv`
  }
  toHakonCode() {
    return `#otherErrorsDiv
 color red`
  }
}

// Todo: use these 3
class compiledResultsComponent extends AbstractTreeComponent {}
class executionResultsComponent extends AbstractTreeComponent {
  toHakonCode() {
    return `#execResultsTextArea
 border 0
 width 100%`
  }
  toStumpCode() {
    return `textarea
 id execResultsTextArea
 placeholder Results...`
  }
}

class explainResultsComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div`
  }
}

class tableComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      compiledResultsComponent: compiledResultsComponent,
      executionResultsComponent: executionResultsComponent,
      explainResultsComponent: explainResultsComponent
    })
  }

  toHakonCode() {
    return `textarea.resultsDiv
 height 120px
 width 220px`
  }

  toStumpCode() {
    return `table
 tr
  td
   span Grammar for your Tree Language
   a Infer Prefix Grammar
    ${WillowConstants.DataShadowEvents.onClickCommand} inferPrefixGrammarCommand
   span  |
   a Download Bundle
    ${WillowConstants.DataShadowEvents.onClickCommand} downloadBundleCommand
   span  |
   a Synthesize Program
    ${WillowConstants.DataShadowEvents.onClickCommand} synthesizeProgramCommand
   textarea
    id grammarConsole
  td
   span Source Code in your Language
   input
    type checkbox
    value executeCommand
    class onCodeUp
   a Execute
    ${WillowConstants.DataShadowEvents.onClickCommand} executeCommand
   span  |
   input
    type checkbox
    value compileCommand
    class onCodeUp
   a Compile
    ${WillowConstants.DataShadowEvents.onClickCommand} compileCommand
   span  |
   input
    type checkbox
    value visualizeCommand
    class onCodeUp
   a Explain
    ${WillowConstants.DataShadowEvents.onClickCommand} visualizeCommand
   textarea
    id codeConsole
 tr
  td
   div Grammar Errors
   pre
    id grammarErrorsConsole
   div
    id readmeComponent
  td
   div Language Errors
   pre
    id codeErrorsConsole
   textarea
    class resultsDiv
    id executeResultsDiv
    placeholder Execution results
   textarea
    class resultsDiv
    id compileResultsDiv
    placeholder Compilation results
   div
    class resultsDiv
    style position:relative;
    id explainResultsDiv`
  }
}

class headerComponent extends AbstractTreeComponent {
  _getTitle() {
    return `Tree Language Designer`
  }
  toHakonCode() {
    return `#logo
 width 100px
 vertical-align middle`
  }
  toStumpCode() {
    return `div
 h1
  a
   href https://treenotation.org
   style text-decoration: none;
   img
    id logo
    src /helloWorld3D.svg
    title TreeNotation.org
  span ${this._getTitle()}
 p
  a Tree Notation Sandbox
   href /sandbox/
  span  |
  a Help
   id helpToggleButton
   onclick $('#helpSection').toggle(); return false;
  span  |
  a Watch the Tutorial Video
   href https://www.youtube.com/watch?v=UQHaI78jGR0=
  span  |
  a Reset
   ${WillowConstants.DataShadowEvents.onClickCommand} resetCommand
  span  |
  a Debug
   ${WillowConstants.DataShadowEvents.onClickCommand} toggleTreeComponentFrameworkDebuggerCommand
  span  | Version ${jtree.getVersion()}
 div
  id helpSection
  style display: none;
  p This is a simple web IDE for designing and building Tree Languages. To build a Tree Language, you write code in a "grammar language" in the textarea on the left. You can then write code in your new language in the textarea on the right. You instantly get syntax highlighting, autocomplete, type/cell checking, suggested corrections, and more.
  p Click "Newlang" to create a New Language, or explore/edit existing languages. In dev tools, you can access the parsed trees below as "app.grammarProgram" and program at "app.program". We also have a work-in-progress <a href="https://github.com/breck7/jtree/blob/master/languageChecklist.md">checklist for creating new Tree Languages</a>.`
  }
}

class githubTriangleComponent extends AbstractGithubTriangleComponent {
  githubLink = `https://github.com/treenotation/jtree/tree/master/designer`
}

export { DesignerApp }
