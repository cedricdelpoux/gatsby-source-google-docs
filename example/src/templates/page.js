import {graphql} from "gatsby"

import React from "react"

export default ({data: {page}}) => {
  const {
    frontmatter: {title},
    html,
  } = page

  return (
    <div>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{__html: html}} />
    </div>
  )
}

export const pageQuery = graphql`
  query PageBySlug($path: String!) {
    page: markdownRemark(fields: {slug: {eq: $path}}) {
      html
      frontmatter {
        title
      }
    }
  }
`
