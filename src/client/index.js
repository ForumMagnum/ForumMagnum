// Imports
import React from 'react'
import { hydrate } from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'

// App Imports
import App from './components/App'

// Client App
const Client = () => (
  <Router>
    <App/>
  </Router>
)

// Mount client app
window.onload = () => {
  hydrate(
    <Client/>,
    document.getElementById('app')
  )
}