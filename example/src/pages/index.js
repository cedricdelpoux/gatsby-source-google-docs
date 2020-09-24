import {graphql, Link} from "gatsby"
import React from "react"

export default ({data: {allGoogleDocs}}) => {
  return (
    <div>
      <ul>
        {allGoogleDocs.nodes.map(({path, name}) => (
          <li key={path}>
            <Link to={path}>{name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const pageQuery = graphql`
  query IndexQuery {
    allGoogleDocs(sort: {fields: createdTime, order: DESC}) {
      nodes {
        path
        name
      }
    }
  }
`
