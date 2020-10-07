const json2md = require("json2md")
const yamljs = require("yamljs")
const _get = require("lodash/get")
const _repeat = require("lodash/repeat")

const {isCodeBlocks, isQuote} = require("./google-document-types")

const HORIZONTAL_TAB_CHAR = "\x09"
const GOOGLE_DOCS_INDENT = 18

class GoogleDocument {
  constructor(document, metadata = {}, options = {}) {
    this.document = document
    this.metadata = metadata
    this.demoteHeadings = options.demoteHeadings || false
    this.crosslinksPaths = options.crosslinksPaths || {}
    this.cover = null
    this.elements = []
    this.headings = []
    this.footnotes = {}

    // Keep the class scope in loops
    this.formatText = this.formatText.bind(this)

    this.process()
  }

  getImage(el) {
    const {inlineObjects} = this.document

    if (!inlineObjects || !el.inlineObjectElement) {
      return
    }

    const inlineObject = inlineObjects[el.inlineObjectElement.inlineObjectId]
    const embeddedObject = inlineObject.inlineObjectProperties.embeddedObject

    return {
      source: embeddedObject.imageProperties.contentUri,
      title: embeddedObject.title || "",
      alt: embeddedObject.description || "",
    }
  }

  processCover() {
    const {headers, documentStyle} = this.document
    const firstPageHeaderId = _get(documentStyle, ["firstPageHeaderId"])

    if (!firstPageHeaderId) {
      return
    }

    const headerElement = _get(headers[firstPageHeaderId], [
      "content",
      0,
      "paragraph",
      "elements",
      0,
    ])

    const image = this.getImage(headerElement)

    if (image) {
      this.cover = {
        image: image.source,
        title: image.title,
        alt: image.alt,
      }
    }
  }

  getTableCellContent(content) {
    return content
      .map(({paragraph}) => paragraph.elements.map(this.formatText).join(""))
      .join("")
      .replace(/\n/g, "<br/>") // Replace newline characters by <br/> to avoid multi-paragraphs
  }

  formatText(el, {withBold = true} = {}) {
    if (el.inlineObjectElement) {
      const image = this.getImage(el)
      return `![${image.alt}](${image.source} "${image.title}")`
    }

    if (!el.textRun || !el.textRun.content || el.textRun.content === "\n") {
      return ""
    }

    const contentMatch = el.textRun.content.match(/^( *)(\w+(?: \w+)*)( *)$/)
    let before = ""
    let text = ""
    let after = ""

    if (contentMatch) {
      before = contentMatch[1]
      text = contentMatch[2]
      after = contentMatch[3]
    } else {
      text = el.textRun.content
    }

    text = text.replace(/\n$/, "")

    const {
      baselineOffset,
      bold,
      italic,
      link,
      strikethrough,
      underline,
      weightedFontFamily,
    } = el.textRun.textStyle

    const inlineCode =
      weightedFontFamily && weightedFontFamily.fontFamily === "Consolas"

    if (inlineCode) {
      return "`" + text + "`"
    }

    text = text.replace(/\*/g, "\\*") // Prevent * to be bold
    text = text.replace(/_/g, "\\_") // Prevent _ to be italic

    if (baselineOffset === "SUPERSCRIPT") {
      text = `<sup>${text}</sup>`
    }

    if (baselineOffset === "SUBSCRIPT") {
      text = `<sub>${text}</sub>`
    }

    if (underline && !link) {
      text = `<ins>${text}</ins>`
    }

    if (italic) {
      text = `_${text}_`
    }

    if (bold & withBold) {
      text = `**${text}**`
    }

    if (strikethrough) {
      text = `~~${text}~~`
    }

    const fullText = before + text + after

    if (link) {
      return `[${fullText}](${link.url})`
    }

    return fullText
  }

  indentText(text, level) {
    return `${_repeat(HORIZONTAL_TAB_CHAR, level)}${text}`
  }

  stringifyContent(tagContent) {
    return tagContent.join("").replace(/\n$/, "")
  }

  appendToList({list, listItem, elementLevel, level}) {
    const lastItem = list[list.length - 1]

    if (listItem.level > level) {
      if (typeof lastItem === "object") {
        this.appendToList({
          list: lastItem.value,
          listItem,
          elementLevel,
          level: level + 1,
        })
      } else {
        list.push({
          type: listItem.tag,
          value: [listItem.text],
        })
      }
    } else {
      list.push(listItem.text)
    }
  }

  getListTag(listId, level) {
    const glyph = _get(this.document, [
      "lists",
      listId,
      "listProperties",
      "nestingLevels",
      level,
      "glyphType",
    ])

    return glyph ? "ol" : "ul"
  }

  processList(paragraph, index) {
    const prevListId = _get(this.document, [
      "body",
      "content",
      index - 1,
      "paragraph",
      "bullet",
      "listId",
    ])
    const isPrevList = prevListId === paragraph.bullet.listId
    const prevList = _get(this.elements, [this.elements.length - 1, "value"])
    const text = this.stringifyContent(paragraph.elements.map(this.formatText))

    if (isPrevList && Array.isArray(prevList)) {
      const {nestingLevel} = paragraph.bullet

      if (nestingLevel) {
        this.appendToList({
          list: prevList,
          listItem: {
            text,
            level: nestingLevel,
            tag: this.getListTag(paragraph.bullet.listId, prevList.length),
          },
          level: 0,
        })
      } else {
        prevList.push(text)
      }
    } else {
      this.elements.push({
        type: this.getListTag(paragraph.bullet.listId, 0),
        value: [text],
      })
    }
  }

  processParagraph(paragraph, index) {
    const headings = []
    const tags = {
      NORMAL_TEXT: "p",
      SUBTITLE: "blockquote",
      HEADING_1: "h1",
      HEADING_2: "h2",
      HEADING_3: "h3",
      HEADING_4: "h4",
      HEADING_5: "h5",
      HEADING_6: "h6",
    }
    const tag = tags[paragraph.paragraphStyle.namedStyleType]

    // Lists
    if (paragraph.bullet) {
      this.processList(paragraph, index)
      return
    }

    let tagContentArray = []

    paragraph.elements.forEach((el) => {
      // <hr />
      if (el.horizontalRule) {
        tagContentArray.push("<hr/>")
      }

      // Footnotes
      else if (el.footnoteReference) {
        tagContentArray.push(`[^${el.footnoteReference.footnoteNumber}]`)
        this.footnotes[el.footnoteReference.footnoteId] =
          el.footnoteReference.footnoteNumber
      }

      // Headings
      else if (tag !== "p") {
        const text = this.formatText(el, {
          withBold: false,
        })

        if (text) {
          headings.push({
            tag,
            text,
          })
          tagContentArray.push(text)
        }
      }

      // Texts
      else {
        const text = this.formatText(el)

        if (text) {
          tagContentArray.push(text)
        }
      }
    })

    if (tagContentArray.length === 0) return

    let content = this.stringifyContent(tagContentArray)
    let tagIndentLevel = 0

    if (paragraph.paragraphStyle.indentStart) {
      const {magnitude} = paragraph.paragraphStyle.indentStart
      tagIndentLevel = Math.round(magnitude / GOOGLE_DOCS_INDENT)
    }

    if (tagIndentLevel > 0) {
      content = this.indentText(content, tagIndentLevel)
    }

    if (!content.trim()) return

    this.elements.push({
      type: tag,
      value: content,
    })

    headings.forEach((heading) => {
      this.headings.push({...heading, index: this.elements.length - 1})
    })
  }

  processQuote(table) {
    const firstRow = table.tableRows[0]
    const firstCell = firstRow.tableCells[0]
    const quote = this.getTableCellContent(firstCell.content)
    const blockquote = quote.replace(/“|”/g, "") // Delete smart-quotes

    this.elements.push({type: "blockquote", value: blockquote})
  }

  processCode(table) {
    const firstRow = table.tableRows[0]
    const firstCell = firstRow.tableCells[0]
    const codeContent = firstCell.content
      .map(({paragraph}) =>
        paragraph.elements.map((el) => el.textRun.content).join("")
      )
      .join("")
      .replace(/\x0B/g, "\n") //eslint-disable-line no-control-regex
      .replace(/^\n|\n$/g, "")
      .split("\n")

    // "".split() -> [""]
    if (codeContent.length === 1 && codeContent[0] === "") return

    let lang = null
    const langMatch = codeContent[0].match(/^\s*lang:\s*(.*)$/)

    if (langMatch) {
      codeContent.shift()
      lang = langMatch[1]
    }

    this.elements.push({
      type: "code",
      value: {
        language: lang,
        content: codeContent,
      },
    })
  }

  processTable(table) {
    const [thead, ...tbody] = table.tableRows

    this.elements.push({
      type: "table",
      value: {
        headers: thead.tableCells.map(({content}) =>
          this.getTableCellContent(content)
        ),
        rows: tbody.map((row) =>
          row.tableCells.map(({content}) => this.getTableCellContent(content))
        ),
      },
    })
  }

  processFootnotes() {
    const footnotes = []
    const documentFootnotes = this.document.footnotes

    if (!documentFootnotes) return

    Object.entries(documentFootnotes).forEach(([, value]) => {
      const paragraphElements = value.content[0].paragraph.elements
      const tagContentArray = paragraphElements.map(this.formatText)
      const tagContentString = this.stringifyContent(tagContentArray)

      footnotes.push({
        type: "footnote",
        value: {
          number: this.footnotes[value.footnoteId],
          text: tagContentString,
        },
      })
    })

    footnotes.sort(
      (footnote1, footnote2) =>
        parseInt(footnote1.value.number) - parseInt(footnote2.value.number)
    )

    this.elements.push(...footnotes)
  }

  process() {
    this.processCover()

    this.document.body.content.forEach(
      ({paragraph, table, pageBreak, sectionBreak, tableOfContents}, i) => {
        // Unsupported elements
        if (pageBreak || sectionBreak || tableOfContents) {
          return
        }

        if (table) {
          // Quotes
          if (isQuote(table)) {
            this.processQuote(table)
          }

          // Code Blocks
          else if (isCodeBlocks(table)) {
            this.processCode(table)
          }

          // Tables
          else {
            this.processTable(table)
          }
        }

        // Paragraphs
        else {
          this.processParagraph(paragraph, i)
        }
      }
    )

    // Footnotes
    this.processFootnotes()
  }

  getDemoteHeadingsElements() {
    const elements = [...this.elements]

    this.headings.forEach((heading) => {
      const levelevel = Number(heading.tag.substring(1))
      const newLevel = levelevel < 6 ? levelevel + 1 : levelevel
      elements[heading.index] = {type: "h" + newLevel, value: heading.text}
    })

    return elements
  }

  getUpdatedElements() {
    let elements = [...this.elements]

    // h1 -> h2, h2 -> h3, ...
    if (this.demoteHeadings === true) {
      elements = this.getDemoteHeadingsElements()
    }

    // Replace absolute Google Docs Documents urls by relative paths
    if (Object.keys(this.crosslinksPaths).length > 0) {
      let elementsStringify = JSON.stringify(elements)

      elementsStringify = elementsStringify.replace(
        /https:\/\/docs.google.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9]+)(?:\/edit|\/preview)?/g,
        (match, id) => this.crosslinksPaths[id] || match
      )

      elements = JSON.parse(elementsStringify)
    }

    return elements
  }

  toObject() {
    return {
      elements: this.getUpdatedElements(),
      metadata: this.metadata,
      cover: this.cover,
    }
  }

  toMarkdown() {
    const frontmatter = {
      ...this.metadata,
      cover: this.cover,
    }
    const markdownFrontmatter = `---\n${yamljs.stringify(frontmatter)}---\n`
    const toJson2md = (element) => {
      if (element.type && element.value) {
        return {[element.type]: toJson2md(element.value)}
      }

      if (Array.isArray(element)) {
        return element.map(toJson2md)
      }

      return element
    }

    const json2mdContent = this.getUpdatedElements().map(toJson2md)
    const markdownContent = json2md(json2mdContent)

    return `${markdownFrontmatter}${markdownContent}`
  }
}

// Add extra converter for footnotes
json2md.converters.footnote = function (footnote) {
  return `[^${footnote.number}]: ${footnote.text}`
}

module.exports = {
  GoogleDocument: GoogleDocument,
}
