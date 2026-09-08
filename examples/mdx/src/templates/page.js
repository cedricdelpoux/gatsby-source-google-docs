import {Link, graphql} from "gatsby"
import {GatsbyImage, getImage} from "gatsby-plugin-image"
import React from "react"

// Since gatsby-plugin-mdx v4 the compiled document is handed over as
// `children`, which is why `createPages` appends "?__contentFilePath=" to the
// component path.
const TemplatePage = ({
  data: {
    page: {
      frontmatter: {name, cover},
    },
  },
  children,
}) => {
  return (
    <>
      <Link to="/">
        <button>{"Home"}</button>
      </Link>
      <h1>{name}</h1>
      {cover && <GatsbyImage image={getImage(cover.image)} />}
      {children}
    </>
  )
}

export default TemplatePage

export const pageQuery = graphql`
  query Page($slug: String!) {
    page: mdx(frontmatter: {slug: {eq: $slug}}) {
      frontmatter {
        name
        cover {
          image {
            childImageSharp {
              gatsbyImageData
            }
          }
        }
      }
    }
  }
`
