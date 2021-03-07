import {graphql} from "gatsby"
import Img from "gatsby-image"
import {MDXRenderer} from "gatsby-plugin-mdx"
import React from "react"
import {Styled} from "theme-ui"
/** @jsx jsx */
import {jsx} from "theme-ui"

export default ({
  data: {
    page: {name, cover, childMdx},
  },
}) => {
  return (
    <React.Fragment>
      <Styled.h1>{name}</Styled.h1>
      {/*
        To add a cover:
        Add an image in your Google Doc first page header
        https://support.google.com/docs/answer/86629
      */}
      {cover && <Img fluid={cover.image.childImageSharp.fluid} />}
      <MDXRenderer>{childMdx.body}</MDXRenderer>
    </React.Fragment>
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
      childMdx {
        body
      }
    }
  }
`
