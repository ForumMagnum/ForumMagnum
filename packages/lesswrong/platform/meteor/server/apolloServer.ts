import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { onStartup, isDevelopment } from '../lib/executionEnvironment';

import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';

import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from '../../../server/vulcan-lib/apollo-server/voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from '../../../server/vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from '../../../server/vulcan-lib/apollo-server/playground';

import { initGraphQL, getExecutableSchema } from '../../../server/vulcan-lib/apollo-server/initGraphQL';
import { computeContextFromReq } from '../../../server/vulcan-lib/apollo-server/context';

import { populateComponentsApp } from '../../../lib/vulcan-lib/components';
import { createVoteableUnionType } from '../../../server/votingGraphQL';

// onPageLoad is mostly equivalent to an Express middleware
// excepts it is tailored to handle Meteor server side rendering
import { onPageLoad } from 'meteor/server-render';

import makePageRenderer from '../../../server/vulcan-lib/apollo-ssr/renderPage';

import universalCookiesMiddleware from 'universal-cookie-express';
import { randomId } from '../lib/random';

import { formatError } from 'apollo-errors';

import { addStripeMiddleware } from '../../../server/stripeMiddleware';
import * as Sentry from '@sentry/node';
import { addAuthMiddlewares } from '../../../server/authenticationMiddlewares';
import { addSentryMiddlewares } from '../../../server/logging';
import { getCookieFromReq, setCookieOnResponse } from '../../../server/utils/httpUtil';

// Middleware for assigning a client ID, if one is not currently assigned.
// Since Meteor doesn't have an API for setting cookies, this calls setHeader
// on the HTTP response directly; if other middlewares also want to set
// cookies, they won't necessarily play nicely together.
WebApp.connectHandlers.use(function addClientId(req, res, next) {
  if (!getCookieFromReq(req, "clientId")) {
    const newClientId = randomId();
    setCookieOnResponse({
      req, res,
      cookieName: "clientId",
      cookieValue: newClientId,
      maxAge: 315360000
    });
  }
  
  next();
}, {order: 100});

// A useful lesson about connect handlers: 
// Turns out, connect handlers also cover all subpaths. This means that if you
// want to have two paths /auth/google and /auth/google/callback then if you
// want the more specific path to be properly covered Then you have to first
// register the /auth/google/callback handler before you handle /auth/google.

onStartup(() => {
  const addMiddleware = (...args) => WebApp.connectHandlers.use(...args);
  const config = { path: '/graphql' };
  
  WebApp.connectHandlers.use(universalCookiesMiddleware());
  WebApp.connectHandlers.use(bodyParser.urlencoded()) // We send passwords + username via urlencoded form parameters
  
  addStripeMiddleware(addMiddleware);
  addAuthMiddlewares(addMiddleware);
  addSentryMiddlewares(addMiddleware);

  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  
  // create server
  // given options contains the schema
  const apolloServer = new ApolloServer({
    // graphql playground (replacement to graphiql), available on the app path
    playground: getPlaygroundConfig(config),
    introspection: true,
    debug: isDevelopment,
    
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
  
  
  // NOTE: order matters here
  // /graphql middlewares (request parsing)
  // IMPORTANT: order matters !
  // 1 - Add request parsing middleware
  // 2 - Add apollo specific middlewares
  // 3 - Close connection (otherwise connection gets stuck)
  // 4 - ONLY THEN you can start adding other middlewares (graphql voyager etc.)

  // WebApp.connectHandlers is a connect server
  // you can add middlware as usual when using Express/Connect

  // parse request (order matters)
  WebApp.connectHandlers.use(config.path, bodyParser.json({ limit: '50mb' }));
  WebApp.connectHandlers.use(config.path, bodyParser.text({ type: 'application/graphql' }));

  // Provide the Meteor WebApp Connect server instance to Apollo
  // Apollo will use it instead of its own HTTP server when handling requests

  //   For the list of already set middlewares (cookies, compression...), see:
  //  @see https://github.com/meteor/meteor/blob/master/packages/webapp/webapp_server.js
  apolloServer.applyMiddleware({
    bodyParser: false, // added manually later
    path: config.path,
    app: WebApp.connectHandlers,
  });

  // setup the end point otherwise the request hangs
  // TODO: undestand why this is necessary
  WebApp.connectHandlers.use(config.path, (req, res) => {
    if (req.method === 'GET') {
      res.end();
    }
  });

  // Voyager is a GraphQL schema visual explorer
  WebApp.connectHandlers.use("/graphql-voyager", voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  WebApp.connectHandlers.use("/graphiql", graphiqlMiddleware(getGraphiqlConfig(config)));
  
  // init the application components and routes, including components & routes from 3rd-party packages
  populateComponentsApp();
  // render the page
  onPageLoad(makePageRenderer);
});
