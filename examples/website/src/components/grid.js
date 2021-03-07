import React from "react"
export const Grid = ({children}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))",
        gap: "10px",
      }}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          style: {...child.props.style, width: "100%"},
        })
      )}
    </div>
  )
}
