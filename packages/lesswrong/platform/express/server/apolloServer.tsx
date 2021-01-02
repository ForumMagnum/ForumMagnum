import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { onStartup, isDevelopment, isAnyTest, getInstanceSettings } from '../../../lib/executionEnvironment';
import { renderWithCache } from '../../../server/vulcan-lib/apollo-ssr/renderPage';

import bodyParser from 'body-parser';
import { pickerMiddleware } from './picker';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from '../../../server/vulcan-lib/apollo-server/voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from '../../../server/vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from '../../../server/vulcan-lib/apollo-server/playground';

import { initGraphQL, getExecutableSchema } from '../../../server/vulcan-lib/apollo-server/initGraphQL';
import { computeContextFromReq, getUserFromReq } from '../../../server/vulcan-lib/apollo-server/context';

import universalCookiesMiddleware from 'universal-cookie-express';

import { formatError } from 'apollo-errors';

import * as Sentry from '@sentry/node';
import express from 'express'
import { app } from './expressServer';
import React from 'react';
import path from 'path'
import { getPublicSettingsLoaded } from '../../../lib/settingsCache';
import { embedAsGlobalVar } from '../../../server/vulcan-lib/apollo-ssr/renderUtil';
import { createVoteableUnionType } from '../../../server/votingGraphQL';
import { addStripeMiddleware } from '../../../server/stripeMiddleware';
import { addAuthMiddlewares } from '../../../server/authenticationMiddlewares';
import { addSentryMiddlewares } from '../../../server/logging';
import { addClientIdMiddleware } from '../../../server/clientIdMiddleware';
import { addStaticRoute } from '../../../server/vulcan-lib/staticRoutes';
import fs from 'fs';
import crypto from 'crypto';

const getClientBundle= () => {
  const bundlePath = path.join(__dirname, "../../client/js/bundle.js");
  const bundleText = fs.readFileSync(bundlePath, 'utf8');
  return {
    bundleHash: crypto.createHash('sha256').update(bundleText, 'utf8').digest('hex'),
    bundleText,
  };
}

onStartup(() => {
  const addMiddleware = (...args) => app.use(...args);
  const config = { path: '/graphql' };

  app.use(universalCookiesMiddleware());
  app.use(bodyParser.urlencoded({ extended: true })) // We send passwords + username via urlencoded form parameters
  app.use(pickerMiddleware);

  addStripeMiddleware(addMiddleware);
  addAuthMiddlewares(addMiddleware);
  addSentryMiddlewares(addMiddleware);
  addClientIdMiddleware(addMiddleware);

  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  
  if (isAnyTest) {
    // Don't set up a webserver if this is a unit test
    return;
  }

  //eslint-disable-next-line no-console
  console.log("Starting LessWrong server. Versions: "+JSON.stringify(process.versions));
  
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

  app.use('/graphql', bodyParser.json({ limit: '50mb' }));
  app.use('/graphql', bodyParser.text({ type: 'application/graphql' }));
  apolloServer.applyMiddleware({ app })

  const {bundleHash, bundleText } = getClientBundle();

  addStaticRoute("/js/bundle.js", ({query}, req, res, context) => {
    res.writeHead(200, {
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Type": "text/javascript; charset=utf-8"
    });
    res.end(bundleText);
  });
  
  // Static files folder
  console.log(`Serving static files from ${path.join(__dirname, '../../client')}`);
  app.use(express.static(path.join(__dirname, '../../client')))
  console.log(`Serving static files from ${path.join(__dirname, '../../../public')}`);
  app.use(express.static(path.join(__dirname, '../../../public')))
  
  // Voyager is a GraphQL schema visual explorer
  app.use("/graphql-voyager", voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  app.use("/graphiql", graphiqlMiddleware(getGraphiqlConfig(config)));

  app.get('*', async (request, response) => {
    const renderResult = await renderWithCache(request, response);
    
    const {ssrBody, headers, serializedApolloState, jssSheets, status, redirectUrl } = renderResult;

    const clientScript = `<script defer type="text/javascript" src="/js/bundle.js?hash=${bundleHash}"></script>`

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    
    const instanceSettingsHeader = embedAsGlobalVar("publicInstanceSettings", getInstanceSettings().public);
    
    // Finally send generated HTML with initial data to the client
    if (redirectUrl) {
      console.log(`Redirecting to ${redirectUrl}`);
      response.status(status||301).redirect(redirectUrl);
    } else {
      return response.status(status||200).send(
        '<!doctype html>\n'
        + '<head>\n'
          + clientScript
          + headers.join('\n')
          + instanceSettingsHeader
        + '</head>\n'
        + jssSheets
        + '<body>\n'+ssrBody+'</body>\n'
        + serializedApolloState)
    }
  })

  // Start Server
  const port = process.env.PORT || 3000
  const env = process.env.NODE_ENV || 'production'
  app.listen({ port }, () => {
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
})

