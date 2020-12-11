import {graphql, Link} from "gatsby"
import React from "react"

export default ({data: {allGoogleDocs}}) => {
  return (
    <div>
      <ul>
        {allGoogleDocs.nodes.map(({slug, name}) => (
          <li key={slug}>
            <Link to={slug}>{`${name} (${slug})`}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const pageQuery = graphql`
  query IndexQuery {
    allGoogleDocs(sort: {fields: slug}) {
      nodes {
        slug
        name
      }
    }
  }
`
