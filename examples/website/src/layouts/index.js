import {MDXProvider} from "@mdx-js/react"
import {useLocation} from "@reach/router"
import {Link} from "gatsby"
import {useEffect, useState} from "react"
import {RiMenuLine, RiMoonLine, RiSunLine} from "react-icons/ri"
/** @jsx jsx */
import {Button, Themed, jsx, useColorMode} from "theme-ui"

import {Details} from "../components/details"
import {GatsbyLogo} from "../components/gatsby-logo"
import {Masonry} from "../components/masonry"
import {Menu} from "../components/menu"

const LayoutIndex = ({children}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [colorMode, setColorMode] = useColorMode()
  const location = useLocation()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  return (
    <div
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "1024px",
        mx: "auto",
      }}
    >
      <header
        sx={{
          alignSelf: "stretch",
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          color: "white",
          mb: 3,
        }}
      >
        <div
          sx={{
            p: 2,
            fontSize: 3,
            display: "flex",
            cursor: "pointer",
          }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          onKeyDown={() => setIsMenuOpen(!isMenuOpen)}
          role="button"
          tabIndex="0"
        >
          <RiMenuLine />
        </div>
        <Link
          to="/"
          sx={{
            color: "inherit",
            textDecoration: "none",
            fontSize: [1, 3, 4],
            textAlign: "center",
          }}
        >
          {"gatsby-source-google-docs"}
        </Link>
        <div //eslint-disable-line
          sx={{
            display: "flex",
            p: 2,
            fontSize: 3,
            cursor: "pointer",
          }}
          onClick={() => {
            setColorMode(colorMode === "default" ? "dark" : "default")
          }}
        >
          {colorMode === "default" ? <RiMoonLine /> : <RiSunLine />}
        </div>
      </header>
      <main
        sx={{
          display: "flex",
          flexDirection: "column",
          p: [2, 3],
          bg: "background",
          color: "text",
          borderRadius: 2,
        }}
      >
        <Menu open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div
          sx={{
            "& > p": {
              mb: 0,
            },
            "& > * + *:not(h1):not(h2):not(h3)": {
              mt: 2,
            },
            "& > * + h1, & > * + h2, & > * + h3": {
              mt: 3,
            },
            "& > table": {
              width: "100%",
              border: "1px solid",
              borderColor: "grey",
              "& td, & th": {
                p: 1,
                border: "1px solid",
                borderColor: "grey",
              },
            },
            "& a": {
              color: "secondary",
              "&:hover": {
                textDecoration: "underline",
              },
            },
          }}
        >
          <MDXProvider
            components={{Button, Details, GatsbyLogo, Masonry, Link}}
          >
            {children}
          </MDXProvider>
        </div>
        {location.pathname !== "/" && (
          <Link to="/" sx={{mt: 3, alignSelf: "center"}}>
            <Button>{"Home"}</Button>
          </Link>
        )}
      </main>
      <footer
        sx={{
          mt: 2,
          mx: "auto",
          color: "white",
          textAlign: "center",
        }}
      >
        <div>
          Made by{" "}
          <Themed.a href="https://cedricdelpoux.fr">Cédric Delpoux</Themed.a>
        </div>
        <div>
          Source code available on{" "}
          <Themed.a href="https://github.com/cedricdelpoux/gatsby-source-google-docs">
            Github
          </Themed.a>
        </div>
      </footer>
    </div>
  )
}

export default LayoutIndex
