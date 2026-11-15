import {Link} from "gatsby"

const Page404 = () => {
  return (
    <main>
      <Link to="/">
        <button>{"Home"}</button>
      </Link>
      <h1>{"404"}</h1>
    </main>
  )
}

export default Page404
