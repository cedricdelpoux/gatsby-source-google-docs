import json2md from "json2md"
import YAML from "yaml"

import {getSingleCell, isCodeBlocks, isQuote} from "./google-document-types.js"

/** @typedef {import("@googleapis/docs").docs_v1.Schema$Document} Document */

/**
 * @typedef {object} Options
 * @property {boolean} [demoteHeadings] h1 -> h2, h2 -> h3, ...
 * @property {boolean} [mdx] Write MDX: colors and font sizes become JSX styles, and the text is escaped for MDX
 * @property {boolean} [escapeMdxSyntax] Escape the "<" and "{" of the text, on which MDX fails. Ignored when `mdx` is not `true`.
 * @property {boolean} [keepDefaultStyle] Keep the bold, italic, underline, ... of the Google Docs default style
 * @property {boolean} [skipCodes]
 * @property {boolean} [skipFootnotes]
 * @property {boolean} [skipHeadings]
 * @property {boolean} [skipImages]
 * @property {boolean} [skipLists]
 * @property {boolean} [skipQuotes]
 * @property {boolean} [skipTables]
 * @property {Record<string, unknown>} [frontmatter] Fields written in the frontmatter, next to `cover` and `related`
 * @property {Record<string, string>} [links] Paths to rewrite the links to other Google Docs with, by document id
 */

/**
 * @typedef {object} Image
 * @property {string} id The id of the inline object, which stays the same when the URL changes
 * @property {string} url
 * @property {string} title
 * @property {string} alt
 */

/**
 * @typedef {object} Cover
 * @property {string} image
 * @property {string} title
 * @property {string} alt
 */

const GOOGLE_DOCS_INDENT = 18

const toRgb = ({red = 0, green = 0, blue = 0}) =>
  [red, green, blue].map((value) => Math.round(value * 255))

const demoteHeading = (tag) =>
  /^h[1-5]$/.test(tag) ? `h${Number(tag[1]) + 1}` : tag

const normalizeElement = (element) => {
  if (element.type && element.value) {
    return {[element.type]: normalizeElement(element.value)}
  }

  if (Array.isArray(element)) {
    return element.map(normalizeElement)
  }

  return element
}

/**
 * Turn ["font-size:1.2em", "color:rgb(0, 0, 0)"] into the object form JSX needs:
 * {fontSize: "1.2em", color: "rgb(0, 0, 0)"}.
 */
const getStyleObject = (styles) =>
  styles.reduce((acc, style) => {
    const separatorIndex = style.indexOf(":")
    const property = style
      .slice(0, separatorIndex)
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

    return {...acc, [property]: style.slice(separatorIndex + 1)}
  }, {})

export class GoogleDocument {
  /**
   * @param {Document} document
   * @param {Options} [options]
   */
  constructor(document, options = {}) {
    this.document = document
    this.options = options
    this.frontmatter = options.frontmatter || {}
    this.links = options.links || {}

    /** @type {Cover | null} The image of the first page header */
    this.cover = null
    /** @type {Image[]} The images written in the markdown, cover included, in their order, once per URL */
    this.images = []
    /** @type {string[]} The ids of the linked documents found in `links` */
    this.related = []
    this.elements = []
    this.footnotes = {}

    this.process()
  }

  formatText(el, {inlineImages = false, namedStyleType = "NORMAL_TEXT"} = {}) {
    if (el.inlineObjectElement) {
      const image = this.getImage(el)
      if (image) {
        if (inlineImages) {
          return `![${image.alt}](${image.url} "${image.title}")`
        }
        this.elements.push({
          type: "img",
          value: {source: image.url, title: image.title, alt: image.alt},
        })
      }
    }

    if (el.person) {
      return el.person.personProperties.name
    }

    if (el.richLink) {
      const props = el.richLink.richLinkProperties
      return `[${props.title}](${props.uri})`
    }

    if (!el.textRun || !el.textRun.content || !el.textRun.content.trim()) {
      return ""
    }

    const content = el.textRun.content
      .replace(/\n$/, "")
      .replace(/“|”/g, '"')
      .replace(/\u000b/g, "<br/>") // Soft line breaks
      // Line and paragraph separators are invisible in Google Docs but are
      // line terminators for javascript, so they break the markdown generation
      .replace(/[\u2028\u2029]/g, " ")

    // No regex on purpose: one with nested quantifiers backtracks exponentially
    // on whitespaces pasted from other editors (U+2028, U+00A0, ...)
    const contentWithoutSpacesBefore = content.trimStart()
    const before = content.slice(
      0,
      content.length - contentWithoutSpacesBefore.length
    )
    let text = contentWithoutSpacesBefore.trimEnd()
    const after = contentWithoutSpacesBefore.slice(text.length)

    const textStyle = el.textRun.textStyle
    const style = this.options.keepDefaultStyle
      ? {...this.getTextStyle(namedStyleType), ...textStyle}
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

    if (this.options.mdx && this.options.escapeMdxSyntax !== false) {
      // MDX fails on a stray "{" or "<" (a "<placeholder>", a generic "<T>"),
      // and the backslash escape stays valid CommonMark
      text = text.replace(/([{<])/g, "\\$1")
    }

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

    if (foregroundColor?.color?.rgbColor && !link) {
      const rgb = toRgb(foregroundColor.color.rgbColor)
      if (rgb.some((value) => value !== 0)) {
        styles.push(`color:rgb(${rgb.join(", ")})`)
      }
    }

    if (backgroundColor?.color?.rgbColor && !link) {
      const rgb = toRgb(backgroundColor.color.rgbColor)
      styles.push(`background-color:rgb(${rgb.join(", ")})`)
    }

    if (styles.length > 0) {
      // In MDX the span is JSX, where React only accepts a `style` object
      text = this.options.mdx
        ? `<span style={${JSON.stringify(getStyleObject(styles))}}>${text}</span>`
        : `<span style='${styles.join(";")}'>${text}</span>`
    }

    if (link) {
      return `${before}[${text}](${link.url})${after}`
    }

    return before + text + after
  }

  getTextStyle(type) {
    const documentStyles = this.document.namedStyles?.styles

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

    const id = el.inlineObjectElement.inlineObjectId
    const {embeddedObject} = inlineObjects[id].inlineObjectProperties
    const image = {
      id,
      url: embeddedObject.imageProperties.contentUri,
      title: embeddedObject.title || "",
      alt: embeddedObject.description || "",
    }

    if (!this.images.some((known) => known.url === image.url)) {
      this.images.push(image)
    }

    return image
  }

  processCover() {
    const {headers, documentStyle} = this.document
    const firstPageHeaderId = documentStyle?.firstPageHeaderId

    if (!firstPageHeaderId) {
      return
    }

    const headerElement =
      headers[firstPageHeaderId]?.content?.[0]?.paragraph?.elements?.[0]

    const image = this.getImage(headerElement)

    if (image) {
      this.cover = {image: image.url, title: image.title, alt: image.alt}
    }
  }

  getTableCellContent(content) {
    return content
      .map((contentElement) => {
        const hasParagraph = contentElement.paragraph

        if (!hasParagraph) return ""

        // Images have to stay in the cell, they can't be pushed as standalone
        // elements outside of the table
        return contentElement.paragraph.elements
          .map((el) => this.formatText(el, {inlineImages: true}))
          .join("")
      })
      .join("")
  }

  stringifyContent(tagContent) {
    return tagContent.join("").replace(/\n$/, "")
  }

  appendToList({list, listItem, level}) {
    const lastItem = list[list.length - 1]

    if (listItem.level > level) {
      if (typeof lastItem === "object") {
        this.appendToList({
          list: lastItem.value,
          listItem,
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
    const glyph =
      this.document.lists?.[listId]?.listProperties?.nestingLevels?.[level]
        ?.glyphType

    return glyph ? "ol" : "ul"
  }

  processList(paragraph, index) {
    if (this.options.skipLists) return

    const prevListId =
      this.document.body.content[index - 1]?.paragraph?.bullet?.listId
    const isPrevList = prevListId === paragraph.bullet.listId
    const prevList = this.elements.at(-1)?.value
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
    const isHeading = tags[namedStyleType].startsWith("h")
    const tag = this.options.demoteHeadings
      ? demoteHeading(tags[namedStyleType])
      : tags[namedStyleType]

    if (paragraph.bullet) {
      this.processList(paragraph, index)
      return
    }

    let tagContentArray = []

    paragraph.elements.forEach((el) => {
      if (el.pageBreak) {
        return
      } else if (el.horizontalRule) {
        tagContentArray.push("<hr/>")
      } else if (el.footnoteReference) {
        if (this.options.skipFootnotes) return

        tagContentArray.push(`[^${el.footnoteReference.footnoteNumber}]`)
        this.footnotes[el.footnoteReference.footnoteId] =
          el.footnoteReference.footnoteNumber
      } else {
        if (isHeading && this.options.skipHeadings) return

        const text = this.formatText(el, {namedStyleType})

        if (text) {
          tagContentArray.push(text)
        }
      }
    })

    if (tagContentArray.length === 0) return

    const indentLevel = Math.round(
      (paragraph.paragraphStyle.indentStart?.magnitude ?? 0) /
        GOOGLE_DOCS_INDENT
    )

    this.elements.push({
      type: tag,
      value: "\t".repeat(indentLevel) + this.stringifyContent(tagContentArray),
    })
  }

  processQuote(cell) {
    if (this.options.skipQuotes) return

    const quote = this.getTableCellContent(cell.content)
    const blockquote = quote.replace(/“|”/g, "")

    this.elements.push({type: "blockquote", value: blockquote})
  }

  processCode(cell) {
    if (this.options.skipCodes) return

    const codeContent = cell.content
      .map(({paragraph}) =>
        paragraph.elements.map((el) => el.textRun.content).join("")
      )
      .join("")
      .replace(/\x0B/g, "\n") // Soft line breaks
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

    const footnotes = Object.values(this.document.footnotes || {}).map(
      (footnote) => ({
        type: "footnote",
        value: {
          number: this.footnotes[footnote.footnoteId],
          text: this.stringifyContent(
            footnote.content[0].paragraph.elements.map((el) =>
              this.formatText(el)
            )
          ),
        },
      })
    )

    footnotes.sort((a, b) => Number(a.value.number) - Number(b.value.number))

    this.elements.push(...footnotes)
  }

  processInternalLinks() {
    if (Object.keys(this.links).length > 0) {
      const elementsStringified = JSON.stringify(this.elements)

      const elementsStringifiedWithRelativePaths = elementsStringified.replace(
        /https:\/\/docs.google.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)(?:\/edit|\/preview)?/g,
        (match, id) => {
          if (this.links[id]) {
            if (!this.related.includes(id)) {
              this.related.push(id)
            }
            return this.links[id]
          }

          return match
        }
      )

      this.elements = JSON.parse(elementsStringifiedWithRelativePaths)
    }
  }

  process() {
    this.bodyFontSize = this.getTextStyle("NORMAL_TEXT")?.fontSize?.magnitude

    this.processCover()

    this.document.body.content.forEach(
      ({paragraph, table, sectionBreak, tableOfContents}, i) => {
        const isUnsupported = sectionBreak || tableOfContents

        if (isUnsupported) return

        if (table) {
          const cell = getSingleCell(table)

          if (cell && isQuote(cell)) {
            this.processQuote(cell)
          } else if (cell && isCodeBlocks(cell)) {
            this.processCode(cell)
          } else {
            this.processTable(table)
          }
        } else {
          this.processParagraph(paragraph, i)
        }
      }
    )

    this.processFootnotes()
    this.processInternalLinks()
  }

  toMarkdown() {
    const frontmatter = {
      ...this.frontmatter,
      ...(this.cover ? {cover: this.cover} : {}),
      ...(this.related.length > 0 ? {related: this.related} : {}),
    }
    const json = this.elements.map(normalizeElement)
    const markdownContent = json2md(json)
    const markdownFrontmatter =
      Object.keys(frontmatter).length > 0
        ? `---\n${YAML.stringify(frontmatter, {lineWidth: 0, version: "1.1"})}---\n`
        : ""

    return `${markdownFrontmatter}${markdownContent}`
  }
}

json2md.converters.footnote = function (footnote) {
  return `[^${footnote.number}]:${footnote.text}`
}

/**
 * @param {Document} document
 * @param {Options} [options]
 */
export const toMarkdown = (document, options) =>
  new GoogleDocument(document, options).toMarkdown()
