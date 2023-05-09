import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { isDevelopment, getInstanceSettings, getServerPort } from '../lib/executionEnvironment';
import { renderWithCache, getThemeOptionsFromReq } from './vulcan-lib/apollo-ssr/renderPage';

import { pickerMiddleware } from './vendor/picker';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import { graphiqlMiddleware } from './vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from './vulcan-lib/apollo-server/playground';

import { getExecutableSchema } from './vulcan-lib/apollo-server/initGraphQL';
import { getUserFromReq, configureSentryScope, getContextFromReqAndRes } from './vulcan-lib/apollo-server/context';

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
import MongoStore from './vendor/ConnectMongo/MongoStore';
import { ckEditorTokenHandler } from './ckEditor/ckEditorToken';
import { getEAGApplicationData } from './zohoUtils';
import { forumTypeSetting, isEAForum, testServerSetting } from '../lib/instanceSettings';
import { parseRoute, parsePath } from '../lib/vulcan-core/appContext';
import { globalExternalStylesheets } from '../themes/globalStyles/externalStyles';
import { addCypressRoutes } from './createTestingPgDb';
import { addCrosspostRoutes } from './fmCrosspost/routes';
import { getUserEmail } from "../lib/collections/users/helpers";
import { inspect } from "util";
import { renderJssSheetPreloads } from './utils/renderJssSheetImports';
import { datadogMiddleware } from './datadog/datadogMiddleware';
import { Sessions } from '../lib/collections/sessions';
import ElasticSearchController from './search/elastic/ElasticSearchController';

const loadClientBundle = () => {
  const bundlePath = path.join(__dirname, "../../client/js/bundle.js");
  const bundleBrotliPath = `${bundlePath}.br`;

  const lastModified = fs.statSync(bundlePath).mtimeMs;
  // there is a brief window on rebuild where a stale brotli file is present, fall back to the uncompressed file in this case
  const brotliFileIsValid = fs.existsSync(bundleBrotliPath) && fs.statSync(bundleBrotliPath).mtimeMs >= lastModified

  const bundleText = fs.readFileSync(bundlePath, 'utf8');
  const bundleBrotliBuffer = brotliFileIsValid ? fs.readFileSync(bundleBrotliPath) : null;

  // Store the bundle in memory as UTF-8 (the format it will be sent in), to
  // save a conversion and a little memory
  const bundleBuffer = Buffer.from(bundleText, 'utf8');
  return {
    bundlePath,
    bundleHash: crypto.createHash('sha256').update(bundleBuffer).digest('hex'),
    lastModified,
    bundleBuffer,
    bundleBrotliBuffer,
  };
}
let clientBundle: {bundlePath: string, bundleHash: string, lastModified: number, bundleBuffer: Buffer, bundleBrotliBuffer: Buffer|null}|null = null;
const getClientBundle = () => {
  if (!clientBundle) {
    clientBundle = loadClientBundle();
    return clientBundle;
  }
  
  // Reload if bundle.js has changed or there is a valid brotli version when there wasn't before
  const lastModified = fs.statSync(clientBundle.bundlePath).mtimeMs;
  const bundleBrotliPath = `${clientBundle.bundlePath}.br`
  const brotliFileIsValid = fs.existsSync(bundleBrotliPath) && fs.statSync(bundleBrotliPath).mtimeMs >= lastModified
  if (clientBundle.lastModified !== lastModified || (clientBundle.bundleBrotliBuffer === null && brotliFileIsValid)) {
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
      willSendResponse(props: AnyBecauseTodo) {
        logGraphqlQueryFinished(operationName, query);
      }
    };
  }
}

export function startWebserver() {
  const addMiddleware: typeof app.use = (...args: any[]) => app.use(...args);
  const config = { path: '/graphql' };
  const expressSessionSecret = expressSessionSecretSetting.get()

  app.use(universalCookiesMiddleware());
  // Required for passport-auth0, and for login redirects
  if (expressSessionSecret) {
    const store = new MongoStore({
      collection: Sessions,
    });
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

  app.use(express.urlencoded({ extended: true })); // We send passwords + username via urlencoded form parameters
  app.use('/analyticsEvent', express.json({ limit: '50mb' }));
  app.use('/ckeditor-webhook', express.json({ limit: '50mb' }));

  addStripeMiddleware(addMiddleware);
  addAuthMiddlewares(addMiddleware);
  addSentryMiddlewares(addMiddleware);
  addClientIdMiddleware(addMiddleware);
  app.use(datadogMiddleware);
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
      const {message, ...properties} = e;
      // eslint-disable-next-line no-console
      console.error(`[GraphQLError: ${message}]`, inspect(properties, {depth: null}));
      // TODO: Replace sketchy apollo-errors package with something first-party
      // and that doesn't require a cast here
      return formatError(e) as any;
    },
    //tracing: isDevelopment,
    tracing: false,
    cacheControl: true,
    context: async ({ req, res }: { req: express.Request, res: express.Response }) => {
      const context = await getContextFromReqAndRes(req, res);
      configureSentryScope(context);
      return context;
    },
    plugins: [new ApolloServerLogging()]
  });

  app.use('/graphql', express.json({ limit: '50mb' }));
  app.use('/graphql', express.text({ type: 'application/graphql' }));
  apolloServer.applyMiddleware({ app })

  addStaticRoute("/js/bundle.js", ({query}, req, res, context) => {
    const {bundleHash, bundleBuffer, bundleBrotliBuffer} = getClientBundle();
    let headers: Record<string,string> = {}
    const acceptBrotli = req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('br')

    if ((query.hash && query.hash !== bundleHash) || (acceptBrotli && bundleBrotliBuffer === null)) {
      // If the query specifies a hash, but it's wrong, this probably means there's a
      // version upgrade in progress, and the SSR and the bundle were handled by servers
      // on different versions. Serve whatever bundle we have (there's really not much
      // else to do), but set the Cache-Control header differently so that it will be
      // fixed on the next refresh.
      //
      // If the client accepts brotli compression but we don't have a valid brotli compressed bundle,
      // that either means we are running locally (in which case chache control isn't important), or that
      // the brotli bundle is currently being built (in which case set a short cache TTL to prevent the CDN
      // from serving the uncompressed bundle for too long).
      headers = {
        "Cache-Control": "public, max-age=60",
        "Content-Type": "text/javascript; charset=utf-8"
      }
    } else {
      headers = {
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Type": "text/javascript; charset=utf-8"
      }
    }

    if (bundleBrotliBuffer !== null && acceptBrotli) {
      headers["Content-Encoding"] = "br";
      res.writeHead(200, headers);
      res.end(bundleBrotliBuffer);
    } else {
      res.writeHead(200, headers);
      res.end(bundleBuffer);
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
    if (!currentUser || !getUserEmail(currentUser)){
      res.status(403).send("Not logged in or current user has no email address")
      return
    }
    
    const eagApp = await getEAGApplicationData(currentUser.email)
    res.send(eagApp)
  })

  addCrosspostRoutes(app);
  addCypressRoutes(app);

  if (isEAForum) {
    new ElasticSearchController(app);
  }

  if (testServerSetting.get()) {
    app.post('/api/quit', (_req, res) => {
      res.status(202).send('Quiting server');
      process.kill(estrellaPid, 'SIGQUIT');
    })
  }

  app.get('*', async (request, response) => {
    response.setHeader("Content-Type", "text/html; charset=utf-8"); // allows compression

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
    const themeOptions = getThemeOptionsFromReq(request, user);
    const jssStylePreload = renderJssSheetPreloads(themeOptions);
    const externalStylesPreload = globalExternalStylesheets.map(url =>
      `<link rel="stylesheet" type="text/css" href="${url}">`
    ).join("");
    
    // The part of the header which can be sent before the page is rendered.
    // This includes an open tag for <html> and <head> but not the matching
    // close tags, since there's stuff inside that depends on what actually
    // gets rendered. The browser will pick up any references in the still-open
    // tag and start fetching the, without waiting for the closing tag.
    const prefetchPrefix = (
      '<!doctype html>\n'
      + '<html lang="en">\n'
      + '<head>\n'
        + jssStylePreload
        + externalStylesPreload
        + instanceSettingsHeader
        + clientScript
    );
    
    if (prefetchResources) {
      response.setHeader("X-Accel-Buffering", "no"); // force nginx to send start of response immediately
      response.status(200);
      response.write(prefetchPrefix);
    }
    
    const renderResult = await renderWithCache(request, response, user);
    
    const {
      ssrBody,
      headers,
      serializedApolloState,
      serializedForeignApolloState,
      jssSheets,
      status,
      redirectUrl,
      renderedAt,
      allAbTestGroups,
    } = renderResult;

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
        + serializedForeignApolloState + '\n'
        + '</html>\n')
      response.end();
    }
  })

  // Start Server
  const port = getServerPort();
  const env = process.env.NODE_ENV || 'production'
  const server = app.listen({ port }, () => {
    // eslint-disable-next-line no-console
    return console.info(`Server running on http://localhost:${port} [${env}]`)
  })
  server.keepAliveTimeout = 120000;
  
  // Route used for checking whether the server is ready for an auto-refresh
  // trigger. Added last so that async stuff can't lead to auto-refresh
  // happening before the server is ready.
  addStaticRoute('/api/ready', ({query}, _req, res, next) => {
    res.end('true');
  });
}
