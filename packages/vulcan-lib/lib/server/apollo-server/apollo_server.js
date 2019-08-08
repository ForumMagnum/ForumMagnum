/**
 * @see https://www.apollographql.com/docs/apollo-server/whats-new.html
 * @see https://www.apollographql.com/docs/apollo-server/migration-two-dot.html
 */

// Meteor WebApp use a Connect server, so we need to
// use apollo-server-express integration
//import express from 'express';
import { ApolloServer } from 'apollo-server-express';

import { Meteor } from 'meteor/meteor';

import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';

// import cookiesMiddleware from 'universal-cookie-express';
// import Cookies from 'universal-cookie';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from './voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from './graphiql';
import getPlaygroundConfig from './playground';

import initGraphQL from './initGraphQL';
import './settings';
import { engineConfig } from './engine';
import { computeContextFromReq } from './context.js';

import { GraphQLSchema } from '../../modules/graphql.js';

import { populateComponentsApp, populateRoutesApp, initializeFragments } from 'meteor/vulcan:lib';
// onPageLoad is mostly equivalent to an Express middleware
// excepts it is tailored to handle Meteor server side rendering
import { onPageLoad } from 'meteor/server-render';

import makePageRenderer from '../apollo-ssr/renderPage';

import universalCookiesMiddleware from 'universal-cookie-express';

import { getApolloApplyMiddlewareOptions, getApolloServerOptions } from './settings';

import { getSetting } from '../../modules/settings.js';
import { formatError } from 'apollo-errors';

//import timber from 'timber';
const timberApiKey = getSetting('timber.apiKey');

const sentryUrl = getSetting('sentry.url');
const sentryEnvironment = getSetting('sentry.environment');
const sentryRelease = getSetting('sentry.release');
import Sentry from '@sentry/node';

if (sentryUrl) {
  Sentry.init({ dsn: sentryUrl, environment: sentryEnvironment, release: sentryRelease });
} else {
  // eslint-disable-next-line no-console
  console.warn("Sentry is not configured. To activate error reporting, please set the sentry.url variable in your settings file.");
}

export const setupGraphQLMiddlewares = (apolloServer, config, apolloApplyMiddlewareOptions) => {
  // IMPORTANT: order matters !
  // 1 - Add request parsing middleware
  // 2 - Add apollo specific middlewares
  // 3 - CLOSE CONNEXION (otherwise the endpoint hungs)
  // 4 - ONLY THEN you can start adding other middlewares (graphql voyager etc.)

  // WebApp.connectHandlers is a connect server
  // you can add middlware as usual when using Express/Connect

  // parse cookies and assign req.universalCookies object
  WebApp.connectHandlers.use(universalCookiesMiddleware());

  // parse request (order matters)
  WebApp.connectHandlers.use(
    config.path,
    bodyParser.json({ limit: '50mb' })
  );
  WebApp.connectHandlers.use(config.path, bodyParser.text({ type: 'application/graphql' }));

  // Provide the Meteor WebApp Connect server instance to Apollo
  // Apollo will use it instead of its own HTTP server when handling requests

  //   For the list of already set middlewares (cookies, compression...), see:
  //  @see https://github.com/meteor/meteor/blob/master/packages/webapp/webapp_server.js
  apolloServer.applyMiddleware({
    ...apolloApplyMiddlewareOptions,
  });

  // setup the end point otherwise the request hangs
  // TODO: undestand why this is necessary
  // @see
  WebApp.connectHandlers.use(config.path, (req, res) => {
    if (req.method === 'GET') {
      res.end();
    }
  });
};

export const setupToolsMiddlewares = config => {
  // Voyager is a GraphQL schema visual explorer
  // available on /voyager as a default
  WebApp.connectHandlers.use(config.voyagerPath, voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  WebApp.connectHandlers.use(config.graphiqlPath, graphiqlMiddleware(getGraphiqlConfig(config)));
};

/**
 * Options: Apollo server usual options
 * Config: a config specific to Vulcan
 */
export const createApolloServer = ({
  apolloServerOptions = {}, // apollo options
  config = {}, // Vulcan options
}) => {
  // given options contains the schema
  const apolloServer = new ApolloServer({
    // graphql playground (replacement to graphiql), available on the app path
    playground: getPlaygroundConfig(config),
    // context optionbject or a function of the current request (+ maybe some other params)
    debug: Meteor.isDevelopment,
    ...apolloServerOptions,
  });

  // default function does nothing
  config.configServer(apolloServer);

  return apolloServer;
};

Meteor.startup(() => {
  // Vulcan specific options
  const config = {
    path: '/graphql',
    maxAccountsCacheSizeInMB: 1,
    configServer: apolloServer => {},
    voyagerPath: '/graphql-voyager',
    graphiqlPath: '/graphiql',
    // customConfigFromReq
  };
  const apolloApplyMiddlewareOptions = {
    // @see https://github.com/meteor/meteor/blob/master/packages/webapp/webapp_server.js
    // @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#Parameters-2
    bodyParser: false, // added manually later
    path: config.path,
    app: WebApp.connectHandlers,
    ...getApolloApplyMiddlewareOptions(),
  };

  // define executableSchema
  initGraphQL();
  // create server
  const apolloServer = createApolloServer({
    config,
    apolloServerOptions: {
      engine: engineConfig,
      schema: GraphQLSchema.executableSchema,
      formatError: (e) => {
        Sentry.captureException(e);
        return formatError(e);
      },
      tracing: getSetting('apolloTracing', Meteor.isDevelopment),
      cacheControl: true,
      context: ({ req }) => computeContextFromReq(req),
      ...getApolloServerOptions(),
    },
  });
  
  WebApp.connectHandlers.use(Sentry.Handlers.requestHandler());
  WebApp.connectHandlers.use(Sentry.Handlers.errorHandler());
  
  if (timberApiKey) {
    console.info("Starting timber integration");
    /*WebApp.connectHandlers.use(timber.middlewares.express({
      capture_request_body: true,
      capture_response_body: true,
    }));*/
  }
  
  // NOTE: order matters here
  // /graphql middlewares (request parsing)
  setupGraphQLMiddlewares(apolloServer, config, apolloApplyMiddlewareOptions);
  //// other middlewares (dev tools etc.)
  // LW: Made available in production environment
  setupToolsMiddlewares(config);
  
  // init the application components and routes, including components & routes from 3rd-party packages
  initializeFragments();
  populateComponentsApp();
  populateRoutesApp();
  // render the page
  onPageLoad(makePageRenderer);
});
