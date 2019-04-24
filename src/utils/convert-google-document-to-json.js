const _last = require("lodash/last")
const _get = require("lodash/get")
const _repeat = require("lodash/repeat")

function getParagraphTag(p) {
  const tags = {
    NORMAL_TEXT: "p",
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

function cleanText(text) {
  return text.replace(/\n/g, "").trim()
}

function getNestedListIndent(level, listTag) {
  const indentType = listTag === "ol" ? "1." : "-"
  return `${_repeat("  ", level)}${indentType} `
}

function getTextFromParagraph(p) {
  return p.elements
    ? p.elements
        .filter(el => el.textRun && el.textRun.content !== "\n")
        .map(el => (el.textRun ? el.textRun.content : ""))
        .join("")
    : ""
}

function getTableCellContent(content) {
  if (!content.length === 0) return ""
  return content
    .map(({paragraph}) => cleanText(getTextFromParagraph(paragraph)))
    .join("")
}

function getText(element, {isHeader = false}) {
  let text = cleanText(element.textRun.content)
  const {
    link,
    underline,
    strikethrough,
    bold,
    italic,
  } = element.textRun.textStyle

  if (underline) {
    // Underline isn't supported in markdown so we'll use emphasis
    text = `_${text}_`
  }

  if (italic) {
    text = `_${text}_`
  }

  // Set bold unless it's a header
  if (bold & !isHeader) {
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

module.exports = data => {
  const {body, inlineObjects, lists} = data
  const content = []

  body.content.forEach(({paragraph, table}, i) => {
    // Paragraphs
    if (paragraph) {
      const tag = getParagraphTag(paragraph)

      // Lists
      if (paragraph.bullet) {
        const listId = paragraph.bullet.listId
        const listTag = getListTag(lists[listId])
        const bulletContent = paragraph.elements.map(getText).join(" ")

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
          content.push({[listTag]: [bulletContent]})
        }
      }

      // Headings, Images, Texts
      else if (tag) {
        let tagContent = []

        paragraph.elements.forEach(el => {
          // EmbeddedObject
          if (el.inlineObjectElement) {
            const embeddedObject =
              inlineObjects[el.inlineObjectElement.inlineObjectId]
                .inlineObjectProperties.embeddedObject

            // Images
            if (embeddedObject.imageProperties) {
              tagContent.push({
                img: {
                  source: embeddedObject.imageProperties.contentUri,
                  title: embeddedObject.title,
                },
              })
            }
          }

          // Headings, Texts
          else if (el.textRun && el.textRun.content !== "\n") {
            tagContent.push({
              [tag]: getText(el, {isHeader: tag !== "p"}),
            })
          }
        })

        if (tagContent.every(el => el[tag] !== undefined)) {
          content.push({
            [tag]: tagContent.map(el => el[tag]).join(" "),
          })
        } else {
          content.push(...tagContent)
        }
      }
    }

    // Table
    else if (table && table.tableRows.length > 0) {
      const [thead, ...tbody] = table.tableRows
      content.push({
        table: {
          headers: thead.tableCells.map(({content}) =>
            getTableCellContent(content)
          ),
          rows: tbody.map(row =>
            row.tableCells.map(({content}) => getTableCellContent(content))
          ),
        },
      })
    }
  })

  return content
}
