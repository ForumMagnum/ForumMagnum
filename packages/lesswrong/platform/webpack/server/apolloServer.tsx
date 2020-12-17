/**
 * @see https://www.apollographql.com/docs/apollo-server/whats-new.html
 * @see https://www.apollographql.com/docs/apollo-server/migration-two-dot.html
 */

// Meteor WebApp use a Connect server, so we need to
// use apollo-server-express integration
//import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { onStartup, isDevelopment } from '../../../lib/executionEnvironment';
import { renderRequest } from '../../../server/vulcan-lib/apollo-ssr/renderPage';

import bodyParser from 'body-parser';

// import cookiesMiddleware from 'universal-cookie-express';
// import Cookies from 'universal-cookie';
import { pickerMiddleware } from './picker';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from '../../../server/vulcan-lib/apollo-server/voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from '../../../server/vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from '../../../server/vulcan-lib/apollo-server/playground';

import { initGraphQL, getExecutableSchema } from '../../../server/vulcan-lib/apollo-server/initGraphQL';
import { computeContextFromReq, getUser, getUserFromReq } from '../../../server/vulcan-lib/apollo-server/context';

import { Components, populateComponentsApp } from '../../../lib/vulcan-lib/components';

import universalCookiesMiddleware from 'universal-cookie-express';

import { formatError } from 'apollo-errors';

import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../../../lib/instanceSettings';
import express from 'express'
import { app } from './expressServer';
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import React from 'react';
import AppGenerator from '../../../server/vulcan-lib/apollo-ssr/components/AppGenerator';
import { createClient } from '../../../server/vulcan-lib/apollo-ssr/apolloClient';
import { wrapWithMuiTheme } from '../../../server/material-ui/themeProvider';
import { getMergedStylesheet } from '../../../server/styleGeneration';
import { ApolloProvider } from '@apollo/client';
import { renderToStringWithData } from '@apollo/client/react/ssr';
import { Cookies, CookiesProvider } from 'react-cookie';
import { ABTestGroupsContext } from '../../../lib/abTestImpl';
import path from 'path'
import { getPublicSettings, getPublicSettingsLoaded } from '../../../lib/settingsCache';
import { embedAsGlobalVar } from '../../../server/vulcan-lib/apollo-ssr/renderUtil';
import { createVoteableUnionType } from '../../../server/votingGraphQL';
import passport from 'passport'
import { Strategy as CustomStrategy } from 'passport-custom'
import Users from '../../../lib/vulcan-users';
import { DatabaseServerSetting } from '../../../server/databaseSettings';
import { addOauthMiddlewares } from '../../../server/oauthMiddlewares';

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

const cookieAuthStrategy = new CustomStrategy(async function getUserPassport(req: any, done) {
  const loginToken = req.universalCookies.get('loginToken') || req.universalCookies.get('meteor_login_token') // Backwards compatibility with meteor_login_token here
  if (!loginToken) return done(null, false)
  const user = await getUser(loginToken)
  if (!user) return done(null, false)
  done(null, user)
})

async function deserializeUserPassport(id, done) {
  const user = await Users.findOne({_id: id})
  if (!user) done()
  done(null, user)
}

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)


export const setupToolsMiddlewares = config => {
  // Voyager is a GraphQL schema visual explorer
  // available on /voyager as a default
  // WebApp.connectHandlers.use(config.voyagerPath, voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  // WebApp.connectHandlers.use(config.graphiqlPath, graphiqlMiddleware(getGraphiqlConfig(config)));
};

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)

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

  app.use(universalCookiesMiddleware());
  app.use(bodyParser.urlencoded()) // We send passwords + username via urlencoded form parameters
  app.use(passport.initialize())
  app.use(pickerMiddleware);

  passport.use(cookieAuthStrategy)
  app.use('/', (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, (err) => {
        if (err) return next(err)
        next()
      })
    })(req, res, next) 
  })


  app.use('/logout', (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logOut()

      // The accepted way to delete a cookie is to set an expiration date in the past.
      if (req.universalCookies.get('meteor_login_token')) {
        res.setHeader("Set-Cookie", `meteor_login_token= ; expires=${new Date(0).toUTCString()};`)   
      }
      if (req.universalCookies.get('loginToken')) {
        res.setHeader("Set-Cookie", `loginToken= ; expires=${new Date(0).toUTCString()};`)   
      }
      
      
      res.statusCode=302;
      res.setHeader('Location','/');
      return res.end();
    })(req, res, next) 
  })
  
  addOauthMiddlewares((path,handler) => app.use(path, handler));

  // define executableSchema
  createVoteableUnionType();
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
    schema: getExecutableSchema(),
    formatError: (e: GraphQLError): GraphQLFormattedError => {
      Sentry.captureException(e);
      // eslint-disable-next-line no-console
      console.error(e?.extensions?.exception)
      // TODO: Replace sketchy apollo-errors package with something first-party
      // and that doesn't require a cast here
      return formatError(e) as any;
    },
    //tracing: isDevelopment,
    tracing: false,
    cacheControl: true,
    context: ({ req, res }) => computeContextFromReq(req, res),
  });

  apolloServer.applyMiddleware({ app })

  // Static files folder
  console.log(__dirname)
  console.log(path.join(__dirname, '../', '../', 'client'))
  app.use(express.static(path.join(__dirname, '../', '../', 'client')))

  app.get('*', async (request, response) => {
    const context: any = {};
    
    if(request.url === `/allStyles?hash=${getMergedStylesheet().hash}`) {
      response.writeHead(200, {
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Type": "text/css"
      });
      return response.end(getMergedStylesheet().css);
    }

    const user = await getUserFromReq(request);
    const renderResult = await renderRequest({req: request, res: response, user, startTime: new Date()})
    
    const {ssrBody, headers, serializedApolloState, jssSheets, status, redirectUrl } = renderResult;

    const clientScript = `<script type="text/javascript" src="/js/bundle.js?${Math.random()}"></script>`

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    const publicSettingsHeader = embedAsGlobalVar("publicSettings", getPublicSettings());
    
    const doctypeHeader = "<!doctype html>\n"

    // // Get Meta header tags
    // const helmet = Helmet.renderStatic()

    // let html = index(helmet, appHtml)
    // Finally send generated HTML with initial data to the client
    return response.status(status||200).send(doctypeHeader + publicSettingsHeader + jssSheets + ssrBody + serializedApolloState + clientScript)
  })

  // WebApp.connectHandlers.use(Sentry.Handlers.requestHandler());
  // WebApp.connectHandlers.use(Sentry.Handlers.errorHandler());

  // NOTE: order matters here
  // /graphql middlewares (request parsing)
  // setupGraphQLMiddlewares(apolloServer, config, apolloApplyMiddlewareOptions);
  //// other middlewares (dev tools etc.)
  // LW: Made available in production environment
  // setupToolsMiddlewares(config);

  // Start Server
  const port = process.env.PORT || 3000
  const env = process.env.NODE_ENV || 'production'
  app.listen({ port }, () => {
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
})
