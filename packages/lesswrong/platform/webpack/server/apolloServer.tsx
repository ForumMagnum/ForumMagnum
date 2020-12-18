import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { onStartup, isDevelopment } from '../../../lib/executionEnvironment';
import { renderRequest } from '../../../server/vulcan-lib/apollo-ssr/renderPage';

import bodyParser from 'body-parser';
import { pickerMiddleware } from './picker';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from '../../../server/vulcan-lib/apollo-server/voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from '../../../server/vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from '../../../server/vulcan-lib/apollo-server/playground';

import { initGraphQL, getExecutableSchema } from '../../../server/vulcan-lib/apollo-server/initGraphQL';
import { computeContextFromReq, getUserFromReq } from '../../../server/vulcan-lib/apollo-server/context';

import { populateComponentsApp } from '../../../lib/vulcan-lib/components';

import universalCookiesMiddleware from 'universal-cookie-express';

import { formatError } from 'apollo-errors';

import * as Sentry from '@sentry/node';
import express from 'express'
import { app } from './expressServer';
import React from 'react';
import path from 'path'
import { getPublicSettings, getPublicSettingsLoaded } from '../../../lib/settingsCache';
import { embedAsGlobalVar } from '../../../server/vulcan-lib/apollo-ssr/renderUtil';
import { createVoteableUnionType } from '../../../server/votingGraphQL';
import { addStripeMiddleware } from '../../../server/stripeMiddleware';
import { addAuthMiddlewares } from '../../../server/authenticationMiddlewares';
import { addSentryMiddlewares } from '../../../server/logging';
import { addClientIdMiddleware } from '../../../server/clientIdMiddleware';
import fs from 'fs';
import crypto from 'crypto';

const getClientBundleHash = () => {
  const bundlePath = path.join(__dirname, "../../client/js/bundle.js");
  const bundleText = fs.readFileSync(bundlePath, 'utf8');
  return crypto.createHash('sha256').update(bundleText, 'utf8').digest('hex');
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

  apolloServer.applyMiddleware({ app })

  // Static files folder
  console.log(`Serving static files from ${path.join(__dirname, '../../client')}`);
  app.use(express.static(path.join(__dirname, '../../client')))
  console.log(`Serving static files from ${path.join(__dirname, '../../../../public')}`);
  app.use(express.static(path.join(__dirname, '../../../../public')))
  
  const clientBundleHash = getClientBundleHash();

  // Voyager is a GraphQL schema visual explorer
  app.use("/graphql-voyager", voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  app.use("/graphiql", graphiqlMiddleware(getGraphiqlConfig(config)));

  app.get('*', async (request, response) => {
    const context: any = {};

    const user = await getUserFromReq(request);
    const renderResult = await renderRequest({req: request, res: response, user, startTime: new Date()})
    
    const {ssrBody, headers, serializedApolloState, jssSheets, status, redirectUrl } = renderResult;

    // FIXME: Hash client bundle on startup to control caching correctly
    const clientScript = `<script type="text/javascript" src="/js/bundle.js?hash=${clientBundleHash}"></script>`

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    const publicSettingsHeader = embedAsGlobalVar("publicSettings", getPublicSettings());
    
    const doctypeHeader = "<!doctype html>\n"

    // Finally send generated HTML with initial data to the client
    return response.status(status||200).send(doctypeHeader + publicSettingsHeader + jssSheets + ssrBody + serializedApolloState + clientScript)
  })

  // Start Server
  const port = process.env.PORT || 3000
  const env = process.env.NODE_ENV || 'production'
  app.listen({ port }, () => {
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
})
