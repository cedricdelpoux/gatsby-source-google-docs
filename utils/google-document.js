const json2md = require("json2md")
const yamljs = require("yamljs")
const _get = require("lodash/get")
const _repeat = require("lodash/repeat")
const _merge = require("lodash/merge")

const {isCodeBlocks, isQuote} = require("./google-document-types")
const {DEFAULT_OPTIONS} = require("./constants")

const HORIZONTAL_TAB_CHAR = "\x09"
const GOOGLE_DOCS_INDENT = 18

class GoogleDocument {
  constructor({document, properties = {}, options = {}, links = {}}) {
    this.document = document
    this.links = links
    this.properties = properties
    this.options = _merge({}, DEFAULT_OPTIONS, options)

    this.cover = null
    this.elements = []
    this.headings = []
    this.footnotes = {}
    this.related = []

    // Keep the class scope in loops
    this.formatText = this.formatText.bind(this)
    this.normalizeElement = this.normalizeElement.bind(this)

    this.process()
  }

  formatText(el, {inlineImages = false, namedStyleType = "NORMAL_TEXT"} = {}) {
    if (el.inlineObjectElement) {
      const image = this.getImage(el)
      if (image) {
        if (inlineImages) {
          return `![${image.alt}](${image.source} "${image.title}")`
        }
        this.elements.push({
          type: "img",
          value: image,
        })
      }
    }

    // Person tag
    if (el.person) {
      return el.person.personProperties.name;
    }

    // Rich link
    if (el.richLink) {
      const props = el.richLink.richLinkProperties;
      return `[${props.title}](${props.uri})`;
    }

    if (!el.textRun || !el.textRun.content || !el.textRun.content.trim()) {
      return ""
    }

    let before = ""
    let after = ""
    let text = el.textRun.content
      .replace(/\n$/, "") // Remove new lines
      .replace(/“|”/g, '"') // Replace smart quotes by double quotes
      .replace(/\u000b/g, "<br/>") // Replace soft lines breaks, vertical tabs
    const contentMatch = text.match(/^(\s*)(\S+(?:[ \t\v]*\S+)*)(\s*)$/) // Match "text", "before" and "after"

    if (contentMatch) {
      before = contentMatch[1]
      text = contentMatch[2]
      after = contentMatch[3]
    }

    const defaultStyle = this.getTextStyle(namedStyleType)
    const textStyle = el.textRun.textStyle
    const style = this.options.keepDefaultStyle
      ? _merge({}, defaultStyle, textStyle)
      : textStyle

    const {
      backgroundColor,
      baselineOffset,
      bold,
      fontSize,
      foregroundColor,
      italic,
      link,
      strikethrough,
      underline,
      weightedFontFamily: {fontFamily} = {},
    } = style

    const isInlineCode = fontFamily === "Consolas"
    if (isInlineCode) {
      if (this.options.skipCodes) return text

      return "`" + text + "`"
    }

    const styles = []

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

    if (bold) {
      text = `**${text}**`
    }

    if (strikethrough) {
      text = `~~${text}~~`
    }

    if (fontSize) {
      const em = (fontSize.magnitude / this.bodyFontSize).toFixed(2)
      if (em !== "1.00") {
        styles.push(`font-size:${em}em`)
      }
    }

    if (_get(foregroundColor, ["color", "rgbColor"]) && !link) {
      const {rgbColor} = foregroundColor.color
      const red = Math.round((rgbColor.red || 0) * 255)
      const green = Math.round((rgbColor.green || 0) * 255)
      const blue = Math.round((rgbColor.blue || 0) * 255)
      if (red !== 0 || green !== 0 || blue !== 0) {
        styles.push(`color:rgb(${red}, ${green}, ${blue})`)
      }
    }

    if (_get(backgroundColor, ["color", "rgbColor"]) && !link) {
      const {rgbColor} = backgroundColor.color
      const red = Math.round((rgbColor.red || 0) * 255)
      const green = Math.round((rgbColor.green || 0) * 255)
      const blue = Math.round((rgbColor.blue || 0) * 255)
      styles.push(`background-color:rgb(${red}, ${green}, ${blue})`)
    }

    if (styles.length > 0) {
      text = `<span style='${styles.join(";")}'>${text}</span>`
    }

    if (link) {
      return `${before}[${text}](${link.url})${after}`
    }

    return before + text + after
  }

  getTextStyle(type) {
    const documentStyles = _get(this.document, ["namedStyles", "styles"])

    if (!documentStyles) return {}

    const style = documentStyles.find((style) => style.namedStyleType === type)
    return style.textStyle
  }

  getImage(el) {
    if (this.options.skipImages) return

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
      .map((contentElement) => {
        const hasParagraph = contentElement.paragraph

        if (!hasParagraph) return ""
        return contentElement.paragraph.elements.map(this.formatText).join("")
      })
      .join("")
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
    if (this.options.skipLists) return

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
    const text = this.stringifyContent(
      paragraph.elements.map((el) => this.formatText(el, {inlineImages: true}))
    )

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
    const tags = {
      HEADING_1: "h1",
      HEADING_2: "h2",
      HEADING_3: "h3",
      HEADING_4: "h4",
      HEADING_5: "h5",
      HEADING_6: "h6",
      NORMAL_TEXT: "p",
      SUBTITLE: "h2",
      TITLE: "h1",
    }
    const namedStyleType = paragraph.paragraphStyle.namedStyleType
    const tag = tags[namedStyleType]
    const isHeading = tag.startsWith("h")

    // Lists
    if (paragraph.bullet) {
      this.processList(paragraph, index)
      return
    }

    let tagContentArray = []

    paragraph.elements.forEach((el) => {
      if (el.pageBreak) {
        return
      }

      // <hr />
      else if (el.horizontalRule) {
        tagContentArray.push("<hr/>")
      }

      // Footnotes
      else if (el.footnoteReference) {
        if (this.options.skipFootnotes) return

        tagContentArray.push(`[^${el.footnoteReference.footnoteNumber}]`)
        this.footnotes[el.footnoteReference.footnoteId] =
          el.footnoteReference.footnoteNumber
      }

      // Headings
      else if (isHeading) {
        if (this.options.skipHeadings) return

        const text = this.formatText(el, {
          namedStyleType,
        })

        if (text) {
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

    this.elements.push({
      type: tag,
      value: content,
    })

    if (isHeading) {
      this.headings.push({tag, text: content, index: this.elements.length - 1})
    }
  }

  processQuote(table) {
    if (this.options.skipQuotes) return

    const firstRow = table.tableRows[0]
    const firstCell = firstRow.tableCells[0]
    const quote = this.getTableCellContent(firstCell.content)
    const blockquote = quote.replace(/“|”/g, "") // Delete smart-quotes

    this.elements.push({type: "blockquote", value: blockquote})
  }

  processCode(table) {
    if (this.options.skipCodes) return

    const firstRow = table.tableRows[0]
    const firstCell = firstRow.tableCells[0]
    const codeContent = firstCell.content
      .map(({paragraph}) =>
        paragraph.elements.map((el) => el.textRun.content).join("")
      )
      .join("") // Transform to string
      .replace(/\x0B/g, "\n") // Replace vertical tabs
      .replace(/^\n|\n$/g, "") // Remove new lines characters at the beginning and end of line
      .split("\n") // Transform to array

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
    if (this.options.skipTables) return

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
    if (this.options.skipFootnotes) return

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

  processDemoteHeadings() {
    this.headings.forEach((heading) => {
      const levelevel = Number(heading.tag.substring(1))
      const newLevel = levelevel < 6 ? levelevel + 1 : levelevel
      this.elements[heading.index] = {type: "h" + newLevel, value: heading.text}
    })
  }

  processInternalLinks() {
    if (Object.keys(this.links).length > 0) {
      const elementsStringified = JSON.stringify(this.elements)

      const elementsStringifiedWithRelativePaths = elementsStringified.replace(
        /https:\/\/docs.google.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)(?:\/edit|\/preview)?/g,
        (match, id) => {
          if (this.links[id]) {
            this.related.push(id)
            return this.links[id]
          }

          return match
        }
      )

      this.elements = JSON.parse(elementsStringifiedWithRelativePaths)
    }
  }

  process() {
    this.bodyFontSize = _get(
      this.getTextStyle("NORMAL_TEXT"),
      "fontSize.magnitude"
    )

    this.processCover()

    this.document.body.content.forEach(
      ({paragraph, table, sectionBreak, tableOfContents}, i) => {
        // Unsupported elements
        if (sectionBreak || tableOfContents) {
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

    // h1 -> h2, h2 -> h3, ...
    if (this.options.demoteHeadings === true) {
      this.processDemoteHeadings()
    }

    this.processInternalLinks()
  }

  normalizeElement(element) {
    if (element.type && element.value) {
      return {[element.type]: this.normalizeElement(element.value)}
    }

    if (Array.isArray(element)) {
      return element.map(this.normalizeElement)
    }

    return element
  }

  toMarkdown() {
    const frontmatter = {
      ...this.properties,
      ...(this.cover ? {cover: this.cover} : {}),
    }
    const json = this.elements.map(this.normalizeElement)
    const markdownContent = json2md(json)
    const markdownFrontmatter =
      Object.keys(frontmatter).length > 0
        ? `---\n${yamljs.stringify(frontmatter)}---\n`
        : ""

    return `${markdownFrontmatter}${markdownContent}`
  }
}

// Add extra converter for footnotes
json2md.converters.footnote = function (footnote) {
  return `[^${footnote.number}]:${footnote.text}`
}

module.exports = {
  GoogleDocument: GoogleDocument,
}
