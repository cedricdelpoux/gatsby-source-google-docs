import {createElement} from "react"

import {GoogleDocsContext} from "./google-docs-context.js"

// No JSX, so that it does not depend on how each site compiles its JSX
export const wrapPageElement = ({element, props}) =>
  createElement(
    GoogleDocsContext.Provider,
    {value: {...props.pageContext}},
    element
  )
