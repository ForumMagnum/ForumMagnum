// Imports
import path from 'path'
import Express from 'express'

import React from 'react'
import { renderToString } from 'react-dom/server'
import { matchPath } from 'react-router'
import { StaticRouter } from 'react-router-dom'
import { Helmet } from "react-helmet"

import routes from '../client/setup/routes'
import App from '../client/components/App'
import index from './views/index'
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql'


// Create new server
const app = new Express()



const server = new ApolloServer({
  introspection: true,
  ...schema
});
server.applyMiddleware({ app })

// Static files folder
app.use(Express.static(path.join(__dirname, '../', 'static')))

// Match any Route
app.get('*', (request, response) => {
  let status = 200

  const matches = routes.reduce((matches, route) => {
    const match = matchPath(request.url, route.path, route)
    if (match && match.isExact) {
      matches.push({
        route,
        match
      })
    }
    return matches
  }, [])

  // No such route, send 404 status
  if (matches.length === 0) {
    status = 404
  }


  const context = {}

  const appHtml = renderToString(
    <StaticRouter context={context} location={request.url}>
      <App/>
    </StaticRouter>
  )

  if (context.url) {
    response.redirect(context.url)
  } else {
    // Get Meta header tags
    const helmet = Helmet.renderStatic()

    let html = index(helmet, appHtml)

    // Finally send generated HTML with initial data to the client
    return response.status(status).send(html)
  }
})

// Start Server
const port = process.env.PORT || 4000
const env = process.env.NODE_ENV || 'production'
app.listen({ port }, () => {
  return console.info(`Server running on http://localhost:${port} [${env}]`)
})