// Imports
import React from 'react'
import { Link } from 'react-router-dom'

const Layout = ({ children }) => (
  <div>
    <header>
      <Link to="/">Home</Link>
      &nbsp;
      <Link to="/about">About</Link>
      &nbsp;
      <Link to="/blogs">Blogs</Link>
      &nbsp;
      <Link to="/blog-add">Add Blog</Link>
    </header>

    <section>
      { children }
    </section>

    <footer>
      &copy; 2017
    </footer>
  </div>
)

export default Layout
