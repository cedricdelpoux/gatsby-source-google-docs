import {graphql, Link} from "gatsby"
import Img from "gatsby-image"

import React from "react"

export default ({
  data: {
    page: {
      name,
      cover,
      childMarkdownRemark: {html},
    },
  },
}) => {
  return (
    <main>
      <Link to="/">
        <button>{"Home"}</button>
      </Link>
      <h1>{name}</h1>
      {/*
          To add a cover:
          Add an image in your Google Doc first page header
          https://support.google.com/docs/answer/86629
      */}
      {cover && (
        <Img
          style={{width: "500px", marginBottom: "2rem"}}
          fluid={cover.image.childImageSharp.fluid}
        />
      )}
      <div dangerouslySetInnerHTML={{__html: html}} />
    </main>
  )
}

export const pageQuery = graphql`
  query Page($path: String!) {
    page: googleDocs(slug: {eq: $path}) {
      name
      cover {
        image {
          childImageSharp {
            fluid(maxWidth: 500, quality: 100) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      childMarkdownRemark {
        html
      }
    }
  }
`
