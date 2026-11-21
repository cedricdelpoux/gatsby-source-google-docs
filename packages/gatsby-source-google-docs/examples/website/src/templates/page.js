import {graphql} from "gatsby"
import {GatsbyImage, getImage} from "gatsby-plugin-image"

// Since gatsby-plugin-mdx v4, the compiled document is handed over as
// `children` — this is why `createPages` (in the core plugin) appends
// "?__contentFilePath=" to this component's path, and `<MDXRenderer>` is
// gone.
const PageTemplate = ({
  data: {
    page: {
      frontmatter: {name, cover},
    },
  },
  children,
}) => {
  return (
    <>
      <h1>{name}</h1>
      {/*
        To add a cover:
        Add an image in your Google Doc first page header
        https://support.google.com/docs/answer/86629
      */}
      {cover && <GatsbyImage image={getImage(cover.image)} />}
      {children}
    </>
  )
}

export default PageTemplate

export const pageQuery = graphql`
  query Page($slug: String!) {
    page: mdx(frontmatter: {slug: {eq: $slug}}) {
      frontmatter {
        name
        cover {
          image {
            childImageSharp {
              gatsbyImageData(placeholder: BLURRED)
            }
          }
        }
      }
    }
  }
`
