import {Link, graphql} from "gatsby"
import {GatsbyImage, getImage} from "gatsby-plugin-image"

const TemplatePage = ({
  data: {
    page: {
      html,
      frontmatter: {name, cover},
    },
  },
}) => {
  return (
    <>
      <Link to="/">
        <button>{"Home"}</button>
      </Link>
      <h1>{name}</h1>
      {/*
        To add a cover:
        Add an image in your Google Doc first page header
        https://support.google.com/docs/answer/86629
      */}
      {cover && <GatsbyImage image={getImage(cover.image)} />}
      <div dangerouslySetInnerHTML={{__html: html}} />
    </>
  )
}

export default TemplatePage

export const pageQuery = graphql`
  query Page($slug: String!) {
    page: markdownRemark(frontmatter: {slug: {eq: $slug}}) {
      html
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
