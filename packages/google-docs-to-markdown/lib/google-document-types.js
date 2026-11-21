export const getSingleCell = (table) =>
  table.rows === 1 && table.columns === 1
    ? table.tableRows[0].tableCells[0]
    : null

// The monospace font "Consolas" is applied everywhere
export const isCodeBlocks = (cell) =>
  cell.content.every(({paragraph}) =>
    paragraph.elements.every(({textRun}) => {
      const content = textRun.content
        .replace(/\n/g, "")
        .replace(/\x0B/g, "")
        .trim()
      const isEmpty = content === ""
      const hasConsolasFont =
        textRun.textStyle?.weightedFontFamily?.fontFamily === "Consolas"

      return isEmpty || hasConsolasFont
    })
  )

// The content is surrounded by smart quotes: “quote”
export const isQuote = (cell) => {
  const startText = cell.content[0].paragraph.elements[0].textRun.content
  const lastText = cell.content.at(-1).paragraph.elements[0].textRun.content

  return (
    startText.replace(/\n/g, "").startsWith("“") &&
    lastText.replace(/\n/g, "").endsWith("”")
  )
}
