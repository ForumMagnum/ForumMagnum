/**
 * @see https://www.apollographql.com/docs/apollo-server/whats-new.html
 * @see https://www.apollographql.com/docs/apollo-server/migration-two-dot.html
 */

// Meteor WebApp use a Connect server, so we need to
// use apollo-server-express integration
//import express from 'express';
import { ApolloServer } from 'apollo-server-express';

import { onStartup, isDevelopment } from '../../../lib/executionEnvironment';

// import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';

// import cookiesMiddleware from 'universal-cookie-express';
// import Cookies from 'universal-cookie';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from './voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from './graphiql';
import getPlaygroundConfig from './playground';

import initGraphQL from './initGraphQL';
//import { engineConfig } from './engine';
import { computeContextFromReq, computeContextFromUser } from './context';

import { GraphQLSchema } from '../../../lib/vulcan-lib/graphql';

import { Components, populateComponentsApp } from '../../../lib/vulcan-lib/components';
// onPageLoad is mostly equivalent to an Express middleware
// excepts it is tailored to handle Meteor server side rendering
// import { onPageLoad } from 'meteor/server-render';

import makePageRenderer from '../apollo-ssr/renderPage';

import universalCookiesMiddleware from 'universal-cookie-express';

import { formatError } from 'apollo-errors';

import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../../../lib/instanceSettings';
import express from 'express'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import React from 'react';
import AppGenerator from '../apollo-ssr/components/AppGenerator';
import { createClient } from '../apollo-ssr/apolloClient';
import { wrapWithMuiTheme } from '../../material-ui/themeProvider';
import { getMergedStylesheet } from '../../styleGeneration';
import { ApolloProvider, getDataFromTree } from 'react-apollo';
import { Cookies, CookiesProvider } from 'react-cookie';
import { ABTestGroupsContext } from '../../../lib/abTestImpl';
import path from 'path'
import { publicSettings } from '../../../lib/publicSettings';
import { embedAsGlobalVar } from '../apollo-ssr/renderUtil';


const sentryUrl = sentryUrlSetting.get()
const sentryEnvironment = sentryEnvironmentSetting.get()
const sentryRelease = sentryReleaseSetting.get()

if (sentryUrl && sentryEnvironment && sentryRelease) {
  Sentry.init({
    dsn: sentryUrl,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [
      new SentryIntegrations.Dedupe(),
      new SentryIntegrations.ExtraErrorData(),
    ],
  });
} else {
  // eslint-disable-next-line no-console
  console.warn("Sentry is not configured. To activate error reporting, please set the sentry.url variable in your settings file.");
}


export const setupToolsMiddlewares = config => {
  // Voyager is a GraphQL schema visual explorer
  // available on /voyager as a default
  // WebApp.connectHandlers.use(config.voyagerPath, voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  // WebApp.connectHandlers.use(config.graphiqlPath, graphiqlMiddleware(getGraphiqlConfig(config)));
};

export const app = express();

onStartup(() => {
  // Vulcan specific options
  const config = {
    path: '/graphql',
    maxAccountsCacheSizeInMB: 1,
    voyagerPath: '/graphql-voyager',
    graphiqlPath: '/graphiql',
  };
  const apolloApplyMiddlewareOptions = {
    // @see https://github.com/meteor/meteor/blob/master/packages/webapp/webapp_server.js
    // @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#Parameters-2
    bodyParser: false, // added manually later
    path: config.path,
    // app: WebApp.connectHandlers,
  };

  // define executableSchema
  initGraphQL();
  
  // create server
  // given options contains the schema
  const apolloServer = new ApolloServer({
    // graphql playground (replacement to graphiql), available on the app path
    playground: getPlaygroundConfig(config),
    introspection: true,
    // context optionbject or a function of the current request (+ maybe some other params)
    debug: isDevelopment,
    
    //engine: engineConfig,
    schema: GraphQLSchema.executableSchema,
    formatError: (e) => {
      Sentry.captureException(e);
      // eslint-disable-next-line no-console
      console.error(e.extensions.exception)
      return formatError(e);
    },
    //tracing: isDevelopment,
    tracing: false,
    cacheControl: true,
    context: ({ req }) => computeContextFromReq(req),
  });

  apolloServer.applyMiddleware({ app })

  // Static files folder
  console.log(__dirname)
  console.log(path.join(__dirname, '../', '../', 'client'))
  app.use(express.static(path.join(__dirname, '../', '../', 'client')))

  app.get('*', async (request, response) => {
    let status = 200
    const context: any = {};
  
    // const matches = routes.reduce((matches, route) => {
    //   const match = matchPath(request.url, route.path, route)
    //   if (match && match.isExact) {
    //     matches.push({
    //       route,
    //       match
    //     })
    //   }
    //   return matches
    // }, [])
  
    // // No such route, send 404 status
    // if (matches.length === 0) {
    //   status = 404
    // }
    populateComponentsApp();
    const requestContext = await computeContextFromUser(null, request.headers);
    const client = await createClient(requestContext);

    const App = <AppGenerator
      req={request} apolloClient={client}
      serverRequestStatus={{}}
      abTestGroups={{}}
    />
  
    const WrappedApp = wrapWithMuiTheme(App, context);

    await getDataFromTree(WrappedApp, {isGetDataFromTree: true});

    const appHtml = renderToString(WrappedApp)

    const initialState = client.extract();
    const serializedApolloState = embedAsGlobalVar("__APOLLO_STATE__", initialState);

    const ssrBody = `<div id="react-app">${appHtml}</div>`;

    const sheetsRegistry = context.sheetsRegistry;
    const jssSheets = `<style id="jss-server-side">${sheetsRegistry.toString()}</style>`
      +'<style id="jss-insertion-point"></style>'
      +`<link rel="stylesheet" onerror="window.missingMainStylesheet=true" href="${getMergedStylesheet().url}"></link>`

    const clientScript = `<script type="text/javascript" src="/js/bundle.js?${Math.random()}"></script>`

    if (!publicSettings) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    const publicSettingsHeader = embedAsGlobalVar("publicSettings", publicSettings);
    
    // // Get Meta header tags
    // const helmet = Helmet.renderStatic()

    // let html = index(helmet, appHtml)
    if(request.url === `/allStyles?hash=${getMergedStylesheet().hash}`) {
      response.writeHead(200, {
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Type": "text/css"
      });
      return response.end(getMergedStylesheet().css);
    }

    // Finally send generated HTML with initial data to the client
    return response.status(status).send(publicSettingsHeader + jssSheets + ssrBody  + clientScript + serializedApolloState)
  })
  
  // WebApp.connectHandlers.use(Sentry.Handlers.requestHandler());
  // WebApp.connectHandlers.use(Sentry.Handlers.errorHandler());
  
  // NOTE: order matters here
  // /graphql middlewares (request parsing)
  // setupGraphQLMiddlewares(apolloServer, config, apolloApplyMiddlewareOptions);
  //// other middlewares (dev tools etc.)
  // LW: Made available in production environment
  // setupToolsMiddlewares(config);
  
  // init the application components and routes, including components & routes from 3rd-party packages
  
  // render the page
  // onPageLoad(makePageRenderer);

  // Start Server
  const port = process.env.PORT || 4000
  const env = process.env.NODE_ENV || 'production'
  app.listen({ port }, () => {
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
})
