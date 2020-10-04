const _get = require("lodash/get")

// If the table has only one cell
// and the monospace font "Consolas" is applied everywhere
exports.isCodeBlocks = (table) => {
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

// If the table has only one cell
// and the content is surrounded by smart quotes: “quote”
exports.isQuote = (table) => {
  const hasOneCell = table.rows === 1 && table.columns === 1

  if (!hasOneCell) {
    return false
  }

  const firstRow = table.tableRows[0]
  const firstCell = firstRow.tableCells[0]
  const {
    0: firstContent,
    [firstCell.content.length - 1]: lastContent,
  } = firstCell.content
  const startText = firstContent.paragraph.elements[0].textRun.content
  const lastText = lastContent.paragraph.elements[0].textRun.content
  const startsWithQuote = startText.replace(/\n/g, "").startsWith("“")
  const endsWithQuote = lastText.replace(/\n/g, "").endsWith("”")

  return startsWithQuote && endsWithQuote
}
