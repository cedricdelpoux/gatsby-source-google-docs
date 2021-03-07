import React from "react"

export const Details = ({label, children}) => {
  return (
    <details>
      <summary>{label}</summary>
      {children}
    </details>
  )
}
