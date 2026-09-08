const {
  getDocumentPath,
  getImagesDirectory,
} = require("../utils/write-documents")

describe("getDocumentPath", () => {
  test("maps the root document to an index file", () => {
    expect(getDocumentPath("/", "md")).toBe("index.md")
  })

  test("mirrors the slug tree", () => {
    expect(getDocumentPath("/foo/bar", "md")).toBe("foo/bar.md")
  })

  test("honours the extension", () => {
    expect(getDocumentPath("/foo", "mdx")).toBe("foo.mdx")
  })

  test("tolerates a missing slug", () => {
    expect(getDocumentPath(undefined, "md")).toBe("index.md")
  })
})

describe("getImagesDirectory", () => {
  test("gives each document a directory of its own", () => {
    expect(getImagesDirectory("/foo")).toBe("images/foo")
    expect(getImagesDirectory("/")).toBe("images/index")
  })

  test("keeps nested slugs apart from flattened ones", () => {
    // Kebab-casing would map both onto "foo-bar" and let one document
    // overwrite the other's images
    expect(getImagesDirectory("/foo/bar")).not.toBe(
      getImagesDirectory("/foo-bar")
    )
  })
})
