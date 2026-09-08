import {graphql, useStaticQuery} from "gatsby"
import React from "react"
/** @jsx jsx */
import {jsx} from "theme-ui"

export const Menu = ({open, onClose}) => {
  const data = useStaticQuery(graphql`
    query MenuQuery {
      menu: mdx(frontmatter: {name: {eq: "Menu"}}) {
        staticHtml
      }
    }
  `)

  return (
    <React.Fragment>
      {/* Sidebar Overlay */}
      <div
        onClick={onClose}
        onKeyDown={onClose}
        role="button"
        tabIndex="0"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          bg: "black",
          opacity: "0.5",
          display: open ? "block" : "none",
          zIndex: 1,
        }}
      >
        {" "}
      </div>
      {/* Sidebar */}
      <div
        sx={{
          zIndex: 2,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: "scroll",
          bg: "background",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transitionDuration: "300ms",
          transitionProperty: "transform",
          py: 3,
          "& > h5": {
            textAlign: "left",
            py: 1,
            px: 2,
            mt: 2,
          },
          "& > p": {
            px: 3,
          },
          "& > ul": {
            m: 0,
            p: 0,
            "& > li": {
              "& > a": {
                display: "block",
                py: 1,
                px: 3,
                "&:hover": {
                  bg: "secondary",
                  color: "white",
                },
              },
            },
          },
        }}
      >
        <div
          // The "Menu" document is plain CommonMark (no JSX in it), compiled
          // to static HTML by this site's own `gatsby-node.mjs` -- see the
          // comment on its `staticHtml` resolver for why.
          dangerouslySetInnerHTML={{__html: data.menu.staticHtml}}
        />
      </div>
    </React.Fragment>
  )
}
