import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { isDevelopment, getInstanceSettings } from '../lib/executionEnvironment';
import { renderWithCache, getThemeOptions } from './vulcan-lib/apollo-ssr/renderPage';

import bodyParser from 'body-parser';
import { pickerMiddleware } from './vendor/picker';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import { graphiqlMiddleware } from './vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from './vulcan-lib/apollo-server/playground';

import { getExecutableSchema } from './vulcan-lib/apollo-server/initGraphQL';
import { getUserFromReq, computeContextFromUser, configureSentryScope } from './vulcan-lib/apollo-server/context';

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
import { addSentryMiddlewares, logGraphqlQueryStarted, logGraphqlQueryFinished } from './logging';
import { addClientIdMiddleware } from './clientIdMiddleware';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import { classesForAbTestGroups } from '../lib/abTestImpl';
import fs from 'fs';
import crypto from 'crypto';
import expressSession from 'express-session';
import MongoStore from 'connect-mongo'
import { ckEditorTokenHandler } from './ckEditorToken';
import { getMongoClient } from '../lib/mongoCollection';
import { getEAGApplicationData } from './zohoUtils';
import { forumTypeSetting } from '../lib/instanceSettings';
import { parseRoute, parsePath } from '../lib/vulcan-core/appContext';
import { getMergedStylesheet } from './styleGeneration';

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

class ApolloServerLogging {
  requestDidStart(context: any) {
    const {request} = context;
    const {operationName, query, variables} = request;
    logGraphqlQueryStarted(operationName, query, variables);
    
    return {
      willSendResponse(props) {
        logGraphqlQueryFinished(operationName, query);
      }
    };
  }
}

export function startWebserver() {
  const addMiddleware = (...args) => app.use(...args);
  const config = { path: '/graphql' };
  const expressSessionSecret = expressSessionSecretSetting.get()

  app.use(universalCookiesMiddleware());
  // Required for passport-auth0, and for login redirects
  if (expressSessionSecret) {
    const store = MongoStore.create({
      client: getMongoClient()
    })
    app.use(expressSession({
      secret: expressSessionSecret,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        // NB: Although the Set-Cookie HTTP header takes seconds,
        // express-session wants milliseconds for some reason
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10
      }
    }))
  }
  app.use(bodyParser.urlencoded({ extended: true })) // We send passwords + username via urlencoded form parameters
  app.use('/analyticsEvent', bodyParser.json({ limit: '50mb' }));

  addStripeMiddleware(addMiddleware);
  addAuthMiddlewares(addMiddleware);
  addSentryMiddlewares(addMiddleware);
  addClientIdMiddleware(addMiddleware);
  app.use(pickerMiddleware);
  
  //eslint-disable-next-line no-console
  console.log("Starting ForumMagnum server. Versions: "+JSON.stringify(process.versions));
  
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
    context: async ({ req, res }) => {
      const user = await getUserFromReq(req);
      const context = await computeContextFromUser(user, req, res);
      configureSentryScope(context);
      return context;
    },
    plugins: [new ApolloServerLogging()]
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
  
  app.get('/api/eag-application-data', async function(req, res, next) {
    if (forumTypeSetting.get() !== 'EAForum') {
      next()
      return
    }
    
    const currentUser = await getUserFromReq(req)
    if (!currentUser || !currentUser.email) {
      res.status(403).send("Not logged in or current user has no email address")
      return
    }
    
    const eagApp = await getEAGApplicationData(currentUser.email)
    res.send(eagApp)
  })

  app.get('*', async (request, response) => {
    const {bundleHash} = getClientBundle();
    const clientScript = `<script defer src="/js/bundle.js?hash=${bundleHash}"></script>`
    const instanceSettingsHeader = embedAsGlobalVar("publicInstanceSettings", getInstanceSettings().public);

    // Check whether the requested route has enableResourcePrefetch. If it does,
    // we send HTTP status and headers early, before we actually rendered the
    // page, so that the browser can get started on loading the stylesheet and
    // JS bundle while SSR is still in progress.
    const parsedRoute = parseRoute({
      location: parsePath(request.url)
    });
    const prefetchResources = parsedRoute.currentRoute?.enableResourcePrefetch;
    
    const user = await getUserFromReq(request);
    const themeOptions = getThemeOptions(request, user);
    const stylesheet = getMergedStylesheet(themeOptions);
    
    // The part of the header which can be sent before the page is rendered.
    // This includes an open tag for <html> and <head> but not the matching
    // close tags, since there's stuff inside that depends on what actually
    // gets rendered. The browser will pick up any references in the still-open
    // tag and start fetching the, without waiting for the closing tag.
    const prefetchPrefix = (
      '<!doctype html>\n'
      + '<html lang="en">\n'
      + '<head>\n'
        + `<link rel="preload" href="${stylesheet.url}" as="style">`
        + instanceSettingsHeader
        + clientScript
    );
    
    if (prefetchResources) {
      response.status(200);
      response.write(prefetchPrefix);
    }
    
    const renderResult = await renderWithCache(request, response, user);
    
    const {ssrBody, headers, serializedApolloState, jssSheets, status, redirectUrl, renderedAt, allAbTestGroups} = renderResult;

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    
    // TODO: Move this up into prefetchPrefix. Take the <link> that loads the stylesheet out of renderRequest and move that up too.
    const themeOptionsHeader = embedAsGlobalVar("themeOptions", themeOptions);
    
    // Finally send generated HTML with initial data to the client
    if (redirectUrl && !prefetchResources) {
      // eslint-disable-next-line no-console
      console.log(`Redirecting to ${redirectUrl}`);
      response.status(status||301).redirect(redirectUrl);
    } else {
      if (!prefetchResources) {
        response.status(status||200);
        response.write(prefetchPrefix);
      }
      response.write(
        // <html><head> opened by the prefetch prefix
          headers.join('\n')
          + themeOptionsHeader
          + jssSheets
        + '</head>\n'
        + '<body class="'+classesForAbTestGroups(allAbTestGroups)+'">\n'
          + ssrBody + '\n'
        + '</body>\n'
        + embedAsGlobalVar("ssrRenderedAt", renderedAt) + '\n'
        + serializedApolloState + '\n'
        + '</html>\n')
      response.end();
    }
  })

  // Start Server
  const port = process.env.PORT || 3000
  const env = process.env.NODE_ENV || 'production'
  const server = app.listen({ port }, () => {
    // eslint-disable-next-line no-console
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
  server.keepAliveTimeout = 120000;
}
