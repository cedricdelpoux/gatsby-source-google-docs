import {Link} from "gatsby"
import React from "react"

export default () => {
  return (
    <main>
      <Link to="/">
        <button>{"Home"}</button>
      </Link>
      <h1>{"404"}</h1>
    </main>
  )
}
