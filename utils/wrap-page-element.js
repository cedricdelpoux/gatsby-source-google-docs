import React from "react"

import {GoogleDocsContext} from "./google-docs-context"

export const wrapPageElement = ({element, props}) => {
  return (
    <GoogleDocsContext.Provider value={{...props.pageContext}}>
      {element}
    </GoogleDocsContext.Provider>
  )
}
