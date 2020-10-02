const json2md = require("json2md")
const YAML = require("yamljs")
const _last = require("lodash/last")
const _get = require("lodash/get")
const _repeat = require("lodash/repeat")

// If the table has only one cell
// and the monospace font "Consolas" is applied everywhere
function isCodeBlocks(table) {
  const hasOneCell = table.rows === 1 && table.columns === 1

  if (!hasOneCell) {
    return false
  }

  const firstRow = table.tableRows[0]
  const firstCell = firstRow.tableCells[0]
  const hasMonospaceFont = firstCell.content.every(({paragraph}) =>
    paragraph.elements.every(({textRun}) => {
      const content = textRun.content
        .replace(/\n/g, "")
        .replace(/\x0B/g, "") //eslint-disable-line no-control-regex
        .trim()
      const isEmpty = content === ""
      const fontFamily = _get(textRun, [
        "textStyle",
        "weightedFontFamily",
        "fontFamily",
      ])
      const hasConsolasFont = fontFamily === "Consolas"

      return isEmpty || hasConsolasFont
    })
  )

  return hasMonospaceFont
}

function isQuote(table) {
  const hasOneCell = table.rows === 1 && table.columns === 1

  if (!hasOneCell) {
    return false
  }

  const firstRow = table.tableRows[0]
  const firstCell = firstRow.tableCells[0]
  let {
    0: firstContent,
    [firstCell.content.length - 1]: lastContent,
  } = firstCell.content

  const startText = firstContent.paragraph.elements[0].textRun.content || ""
  const lastText = lastContent.paragraph.elements[0].textRun.content || ""
  const startsWithQuote = startText.replace(/\n/g, "").startsWith("“")
  const endsWithQuote = lastText.replace(/\n/g, "").endsWith("”")

  return startsWithQuote && endsWithQuote
}

function convertYamlToObject(yamlString) {
  return YAML.parse(yamlString)
}

function getParagraphTag(p) {
  const tags = {
    NORMAL_TEXT: "p",
    SUBTITLE: "blockquote",
    HEADING_1: "h1",
    HEADING_2: "h2",
    HEADING_3: "h3",
    HEADING_4: "h4",
    HEADING_5: "h5",
  }

  return tags[p.paragraphStyle.namedStyleType]
}

function getListTag(list) {
  const glyphType = _get(list, [
    "listProperties",
    "nestingLevels",
    0,
    "glyphType",
  ])
  return glyphType !== undefined ? "ol" : "ul"
}

function getNestedListIndent(level, listTag) {
  const indentType = listTag === "ol" ? "1." : "-"
  return `${_repeat("  ", level)}${indentType} `
}

function getTableCellContent(content) {
  if (!content.length === 0) return ""

  return content
    .map(({paragraph}) => paragraph.elements.map(getText).join(""))
    .join("")
    .replace(/\n/g, "<br/>") // Replace newline characters by <br/> to avoid multi-paragraphs
}

function getImage(document, element) {
  const {inlineObjects} = document

  if (!inlineObjects || !element.inlineObjectElement) {
    return null
  }

  const inlineObject = inlineObjects[element.inlineObjectElement.inlineObjectId]
  const embeddedObject = inlineObject.inlineObjectProperties.embeddedObject

  if (embeddedObject && embeddedObject.imageProperties) {
    return {
      source: embeddedObject.imageProperties.contentUri,
      title: embeddedObject.title || "",
      alt: embeddedObject.description || "",
    }
  }

  return null
}

function getBulletContent(document, element) {
  if (element.inlineObjectElement) {
    const image = getImage(document, element)
    return `![${image.alt}](${image.source} "${image.title}")`
  }

  return getText(element, {inline: true})
}

function getText(element, {withBold = true, inline = false} = {}) {
  if (!element.textRun) {
    return ""
  }

  let text = inline
    ? element.textRun.content.replace(/\n/g, "").trim()
    : element.textRun.content

  if (!text) {
    return ""
  }

  const {
    link,
    underline,
    strikethrough,
    bold,
    italic,
    weightedFontFamily,
  } = element.textRun.textStyle
  const inlineCode =
    weightedFontFamily && weightedFontFamily.fontFamily === "Consolas"

  if (inlineCode) {
    return "`" + text + "`"
  }

  text = text.replace(/\*/g, "\\*")
  text = text.replace(/_/g, "\\_")

  if (underline) {
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

  if (link) {
    return `[${text}](${link.url})`
  }

  return text
}

function getCover(document) {
  const {headers, documentStyle} = document

  if (
    !documentStyle ||
    !documentStyle.firstPageHeaderId ||
    !headers[documentStyle.firstPageHeaderId]
  ) {
    return null
  }

  const headerElement = _get(headers[documentStyle.firstPageHeaderId], [
    "content",
    0,
    "paragraph",
    "elements",
    0,
  ])

  const image = getImage(document, headerElement)

  return image
    ? {
        image: image.source,
        title: image.title,
        alt: image.alt,
      }
    : null
}

function convertGoogleDocumentToJson(document) {
  const {body, footnotes = {}} = document
  const cover = getCover(document)

  const content = []
  const footnoteIDs = {}
  const headings = []

  body.content.forEach(({paragraph, table}, i) => {
    // Paragraphs
    if (paragraph) {
      const tag = getParagraphTag(paragraph)

      // Lists
      if (paragraph.bullet) {
        const listId = paragraph.bullet.listId
        const list = document.lists[listId]
        const listTag = getListTag(list)

        const bulletContent = paragraph.elements
          .map((el) => getBulletContent(document, el))
          .filter((el) => el) // Remove empty elements before join
          .join(" ")
          .replace(" .", ".")
          .replace(" ,", ",")

        const prev = body.content[i - 1]
        const prevListId = _get(prev, "paragraph.bullet.listId")

        if (prevListId === listId) {
          const list = _last(content)[listTag]
          const {nestingLevel} = paragraph.bullet

          if (nestingLevel !== undefined) {
            // mimic nested lists
            const lastIndex = list.length - 1
            const indent = getNestedListIndent(nestingLevel, listTag)

            list[lastIndex] += `\n${indent} ${bulletContent}`
          } else {
            list.push(bulletContent)
          }
        } else {
          content.push({
            [listTag]: [bulletContent],
          })
        }
      }

      // Headings, Images, Texts
      else if (tag) {
        let tagContent = []

        paragraph.elements.forEach((el) => {
          // EmbeddedObject
          if (el.inlineObjectElement) {
            const image = getImage(document, el)

            if (image) {
              tagContent.push({
                img: image,
              })
            }
          }

          // Headings, Texts
          else if (el.textRun && el.textRun.content !== "\n") {
            const isHeader = tag !== "p"

            const text = getText(el, {
              withBold: !isHeader,
              inline: true,
            })

            if (!text) {
              return
            }

            if (isHeader) {
              headings.push({index: content.length, tag, text})
            }

            tagContent.push({
              [tag]: text,
            })
          }

          // Footnotes
          else if (el.footnoteReference) {
            tagContent.push({
              [tag]: `[^${el.footnoteReference.footnoteNumber}]`,
            })
            footnoteIDs[el.footnoteReference.footnoteId] =
              el.footnoteReference.footnoteNumber
          }
        })

        if (tagContent.length > 0) {
          if (tagContent.every((el) => el[tag] !== undefined)) {
            content.push({
              [tag]: tagContent
                .map((el) => el[tag])
                .filter((el) => el)
                .join(" ")
                .replace(" .", ".")
                .replace(" ,", ","),
            })
          } else {
            content.push(...tagContent)
          }
        }
      }
    }

    // Quote
    else if (table && isQuote(table)) {
      const firstRow = table.tableRows[0]
      const firstCell = firstRow.tableCells[0]
      const quote = getTableCellContent(firstCell.content)
      const blockquote = quote.replace(/“|”/g, "") // Delete smart-quotes

      content.push({blockquote})
    }

    // Code Blocks
    else if (table && isCodeBlocks(table)) {
      const firstRow = table.tableRows[0]
      const firstCell = firstRow.tableCells[0]
      const codeContent = firstCell.content
        .map(({paragraph}) =>
          paragraph.elements.map((el) => el.textRun.content).join("")
        )
        .join("")
        .replace(/\x0B/g, "\n") //eslint-disable-line no-control-regex
        .split("\n")

      if (codeContent.length > 0) {
        let lang = "text"
        const langMatch = codeContent[0].match(/^\s*lang:\s*(.*)$/)

        if (langMatch) {
          codeContent.shift()
          lang = langMatch[1]
        }

        content.push({
          code: {
            language: lang,
            content: codeContent,
          },
        })
      }
    }

    // Table
    else if (table && table.rows > 0) {
      const [thead, ...tbody] = table.tableRows
      content.push({
        table: {
          headers: thead.tableCells.map(({content}) =>
            getTableCellContent(content)
          ),
          rows: tbody.map((row) =>
            row.tableCells.map(({content}) => getTableCellContent(content))
          ),
        },
      })
    }
  })

  // Footnotes reference section (end of document)
  let formatedFootnotes = []
  Object.entries(footnotes).forEach(([, value]) => {
    // Concatenate all content
    const text_items = value.content[0].paragraph.elements.map((element) =>
      getText(element, {inline: true})
    )
    const text = text_items.join(" ").replace(" .", ".").replace(" ,", ",")

    formatedFootnotes.push({
      footnote: {number: footnoteIDs[value.footnoteId], text: text},
    })
  })
  formatedFootnotes.sort(
    (item1, item2) =>
      parseInt(item1.footnote.number) - parseInt(item2.footnote.number)
  )
  content.push(...formatedFootnotes)

  return {
    cover,
    content,
    headings,
  }
}

// Add extra converter for footnotes
json2md.converters.footnote = function (footnote) {
  return `[^${footnote.number}]: ${footnote.text}`
}

function convertJsonToMarkdown({content, metadata}) {
  // Do NOT move the formatting of the following lines
  // to prevent markdown parsing errors
  return `---
${YAML.stringify(metadata)}
---

${json2md(content)}`
}

module.exports = {
  convertGoogleDocumentToJson,
  convertJsonToMarkdown,
  convertYamlToObject,
}
