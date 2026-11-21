import {expect, test} from "vitest"

import {GoogleDocsContext} from "../utils/google-docs-context.js"
import {wrapPageElement} from "../utils/wrap-page-element.js"

test("gives the page context to the documents", () => {
  const element = {type: "page"}
  const wrapped = wrapPageElement({
    element,
    props: {pageContext: {slug: "/home"}},
  })

  expect(wrapped.type).toBe(GoogleDocsContext.Provider)
  expect(wrapped.props).toEqual({value: {slug: "/home"}, children: element})
})
