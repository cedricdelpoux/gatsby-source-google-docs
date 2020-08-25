import {graphql, Link} from "gatsby"
import React from "react"

export default ({data: {allMarkdownRemark}}) => {
  return (
    <div>
      <ul>
        {allMarkdownRemark.nodes.map(({frontmatter: {path, title}}) => (
          <li key={path}>
            <Link to={path}>{title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(sort: {fields: frontmatter___date, order: DESC}) {
      nodes {
        frontmatter {
          path
          title
        }
      }
    }
  }
`
