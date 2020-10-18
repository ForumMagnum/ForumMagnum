// Imports
import React from 'react'

// App Imports
import Home from '../components/home/Home'
import About from '../components/home/About'

// Routes
const routes = [
  {
    path: '/',
    component: Home,
    exact: true
  },
  {
    path: '/about',
    component: About
  }
]

export default routes