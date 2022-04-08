import React from "react"
export const Masonry = ({children}) => {
  return (
    <div
      style={{
        display: "block",
        columnCount: 3,
        columnGap: 10,
      }}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          style: {
            ...child.props.style,
            breakInside: "avoid",
            marginBottom: 10,
          },
        })
      )}
    </div>
  )
}
