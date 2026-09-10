const {getTransformer} = require("../utils/get-transformer")

const createStore = (...names) => ({
  getState: () => ({flattenedPlugins: names.map((name) => ({name}))}),
})

test("detects gatsby-transformer-remark", () => {
  expect(
    getTransformer({store: createStore("gatsby-transformer-remark")})
  ).toBe("remark")
})

test("detects gatsby-plugin-mdx", () => {
  expect(getTransformer({store: createStore("gatsby-plugin-mdx")})).toBe("mdx")
})

test("prefers mdx when both are installed", () => {
  // A site can source markdown from elsewhere with remark while its Google Docs
  // documents are written as ".mdx"
  const store = createStore("gatsby-transformer-remark", "gatsby-plugin-mdx")

  expect(getTransformer({store})).toBe("mdx")
})

test("returns null when neither is installed", () => {
  expect(getTransformer({store: createStore("gatsby-plugin-sharp")})).toBeNull()
})

test("returns null before the plugins are flattened", () => {
  expect(getTransformer({store: {getState: () => ({})}})).toBeNull()
})
