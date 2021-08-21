import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { isDevelopment, getInstanceSettings } from '../lib/executionEnvironment';
import { renderWithCache } from './vulcan-lib/apollo-ssr/renderPage';

import bodyParser from 'body-parser';
import { pickerMiddleware } from './vendor/picker';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import { graphiqlMiddleware } from './vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from './vulcan-lib/apollo-server/playground';

import { getExecutableSchema } from './vulcan-lib/apollo-server/initGraphQL';
import { computeContextFromReq } from './vulcan-lib/apollo-server/context';

import universalCookiesMiddleware from 'universal-cookie-express';

import { formatError } from 'apollo-errors';

import * as Sentry from '@sentry/node';
import express from 'express'
import { app } from './expressServer';
import path from 'path'
import { getPublicSettingsLoaded } from '../lib/settingsCache';
import { embedAsGlobalVar } from './vulcan-lib/apollo-ssr/renderUtil';
import { addStripeMiddleware } from './stripeMiddleware';
import { addAuthMiddlewares, expressSessionSecretSetting } from './authenticationMiddlewares';
import { addSentryMiddlewares } from './logging';
import { addClientIdMiddleware } from './clientIdMiddleware';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import { classesForAbTestGroups } from '../lib/abTestImpl';
import fs from 'fs';
import crypto from 'crypto';
import expressSession from 'express-session';
import MongoStore from 'connect-mongo'
import { ckEditorTokenHandler } from './ckEditorToken';
import { getMongoClient } from '../lib/mongoCollection';

const loadClientBundle = () => {
  const bundlePath = path.join(__dirname, "../../client/js/bundle.js");
  const bundleText = fs.readFileSync(bundlePath, 'utf8');
  const lastModified = fs.statSync(bundlePath).mtimeMs;
  return {
    bundlePath,
    bundleHash: crypto.createHash('sha256').update(bundleText, 'utf8').digest('hex'),
    lastModified,
    bundleText,
  };
}
let clientBundle: {bundlePath: string, bundleHash: string, lastModified: number, bundleText: string}|null = null;
const getClientBundle = () => {
  if (!clientBundle) {
    clientBundle = loadClientBundle();
    return clientBundle;
  }
  
  const lastModified = fs.statSync(clientBundle.bundlePath).mtimeMs;
  if (clientBundle.lastModified !== lastModified) {
    clientBundle = loadClientBundle();
    return clientBundle;
  }
  
  return clientBundle;
}

export function startWebserver() {
  const addMiddleware = (...args) => app.use(...args);
  const config = { path: '/graphql' };
  const expressSessionSecret = expressSessionSecretSetting.get()

  app.use(universalCookiesMiddleware());
  if (expressSessionSecret) {
    const store = MongoStore.create({
      client: getMongoClient()
    })
    // Required by passport-auth0
    app.use(expressSession({
      secret: expressSessionSecret,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        // We match LW - ten year login tokens
        // NB: Although the Set-Cookie HTTP header takes seconds,
        // express-session wants milliseconds for some reason
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10
      }
    }))
  }
  app.use(bodyParser.urlencoded({ extended: true })) // We send passwords + username via urlencoded form parameters
  app.use(pickerMiddleware);

  addStripeMiddleware(addMiddleware);
  addAuthMiddlewares(addMiddleware);
  addSentryMiddlewares(addMiddleware);
  addClientIdMiddleware(addMiddleware);
  
  //eslint-disable-next-line no-console
  console.log("Starting LessWrong server. Versions: "+JSON.stringify(process.versions));
  
  // create server
  // given options contains the schema
  const apolloServer = new ApolloServer({
    // graphql playground (replacement to graphiql), available on the app path
    playground: getPlaygroundConfig(config.path),
    introspection: true,
    debug: isDevelopment,
    
    schema: getExecutableSchema(),
    formatError: (e: GraphQLError): GraphQLFormattedError => {
      Sentry.captureException(e);
      // eslint-disable-next-line no-console
      console.error(e);
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

  addStaticRoute("/js/bundle.js", ({query}, req, res, context) => {
    const {bundleHash, bundleText} = getClientBundle();
    if (query.hash && query.hash !== bundleHash) {
      // If the query specifies a hash, but it's wrong, this probably means there's a
      // version upgrade in progress, and the SSR and the bundle were handled by servers
      // on different versions. Serve whatever bundle we have (there's really not much
      // else to do), but set the Cache-Control header differently so that it will be
      // fixed on the next refresh.
      res.writeHead(200, {
        "Cache-Control": "public, max-age=60",
        "Content-Type": "text/javascript; charset=utf-8"
      });
      res.end(bundleText);
    } else {
      res.writeHead(200, {
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Type": "text/javascript; charset=utf-8"
      });
      res.end(bundleText);
    }
  });
  // Setup CKEditor Token
  app.use("/ckeditor-token", ckEditorTokenHandler)
  
  // Static files folder
  // eslint-disable-next-line no-console
  console.log(`Serving static files from ${path.join(__dirname, '../../client')}`);
  app.use(express.static(path.join(__dirname, '../../client')))
  // eslint-disable-next-line no-console
  console.log(`Serving static files from ${path.join(__dirname, '../../../public')}`);
  app.use(express.static(path.join(__dirname, '../../../public')))
  
  // Voyager is a GraphQL schema visual explorer
  app.use("/graphql-voyager", voyagerMiddleware({
    endpointUrl: config.path,
  }));
  // Setup GraphiQL
  app.use("/graphiql", graphiqlMiddleware({
    endpointURL: config.path,
    passHeader: "'Authorization': localStorage['Meteor.loginToken']", // eslint-disable-line quotes
  }));
  

  app.get('*', async (request, response) => {
    const renderResult = await renderWithCache(request, response);
    
    const {ssrBody, headers, serializedApolloState, jssSheets, status, redirectUrl, allAbTestGroups} = renderResult;
    const {bundleHash} = getClientBundle();

    const clientScript = `<script defer src="/js/bundle.js?hash=${bundleHash}"></script>`

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    
    const instanceSettingsHeader = embedAsGlobalVar("publicInstanceSettings", getInstanceSettings().public);
    
    // Finally send generated HTML with initial data to the client
    if (redirectUrl) {
      // eslint-disable-next-line no-console
      console.log(`Redirecting to ${redirectUrl}`);
      response.status(status||301).redirect(redirectUrl);
    } else {
      return response.status(status||200).send(
        '<!doctype html>\n'
        + '<head>\n'
          + clientScript
          + headers.join('\n')
          + instanceSettingsHeader
          + jssSheets
        + '</head>\n'
        + '<body class="'+classesForAbTestGroups(allAbTestGroups)+'">\n'
          + ssrBody
        +'</body>\n'
        + serializedApolloState)
    }
  })

  // Start Server
  const port = process.env.PORT || 3000
  const env = process.env.NODE_ENV || 'production'
  app.listen({ port }, () => {
    // eslint-disable-next-line no-console
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
}
