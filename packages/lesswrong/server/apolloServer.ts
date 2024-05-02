import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { isDevelopment, getInstanceSettings, getServerPort, isProduction } from '../lib/executionEnvironment';
import { renderWithCache, getThemeOptionsFromReq } from './vulcan-lib/apollo-ssr/renderPage';

import { pickerMiddleware, addStaticRoute } from './vulcan-lib/staticRoutes';
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
import { getPublicSettings, getPublicSettingsLoaded } from '../lib/settingsCache';
import { embedAsGlobalVar } from './vulcan-lib/apollo-ssr/renderUtil';
import { addStripeMiddleware } from './stripeMiddleware';
import { addAuthMiddlewares, expressSessionSecretSetting } from './authenticationMiddlewares';
import { addForumSpecificMiddleware } from './forumSpecificMiddleware';
import { addSentryMiddlewares, logGraphqlQueryStarted, logGraphqlQueryFinished } from './logging';
import { addClientIdMiddleware } from './clientIdMiddleware';
import { classesForAbTestGroups } from '../lib/abTestImpl';
import expressSession from 'express-session';
import MongoStore from './vendor/ConnectMongo/MongoStore';
import { ckEditorTokenHandler } from './ckEditor/ckEditorToken';
import { getEAGApplicationData } from './zohoUtils';
import { faviconUrlSetting, isEAForum, testServerSetting, performanceMetricLoggingEnabled, isDatadogEnabled } from '../lib/instanceSettings';
import { parseRoute, parsePath } from '../lib/vulcan-core/appContext';
import { globalExternalStylesheets } from '../themes/globalStyles/externalStyles';
import { addCypressRoutes } from './testingSqlClient';
import { addCrosspostRoutes } from './fmCrosspost/routes';
import { getUserEmail } from "../lib/collections/users/helpers";
import { inspect } from "util";
import { renderJssSheetPreloads } from './utils/renderJssSheetImports';
import { datadogMiddleware } from './datadog/datadogMiddleware';
import { Sessions } from '../lib/collections/sessions';
import { addServerSentEventsEndpoint } from "./serverSentEvents";
import { botRedirectMiddleware } from './botRedirect';
import { hstsMiddleware } from './hsts';
import { getClientBundle } from './utils/bundleUtils';
import { isElasticEnabled } from './search/elastic/elasticSettings';
import ElasticController from './search/elastic/ElasticController';
import type { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener } from 'apollo-server-plugin-base';
import { asyncLocalStorage, closePerfMetric, openPerfMetric, perfMetricMiddleware, setAsyncStoreValue } from './perfMetrics';
import { addAdminRoutesMiddleware } from './adminRoutesMiddleware'
import { createAnonymousContext } from './vulcan-lib/query';
import { DatabaseServerSetting } from './databaseSettings';
import { randomId } from '../lib/random';

/**
 * Try to set the response status, but log an error if the headers have already been sent.
 */
const trySetResponseStatus = ({ response, status }: { response: express.Response, status: number; }) => {
  if (!response.headersSent) {
    response.status(status);
  } else if (response.statusCode !== status) {
    const message = `Tried to set status to ${status} but headers have already been sent with status ${response.statusCode}. This may be due to enableResourcePrefetch wrongly being set to true.`;
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error(message);
    } else {
      throw new Error(message);
    }
  }

  return response;
}

const cloudfrontExperimentEnabledSetting = new DatabaseServerSetting<boolean>('cloudfrontExperiment.enabled', false);
const cloudfrontExperimentLoggedOutCacheControlSetting = new DatabaseServerSetting<string>('cloudfrontExperiment.loggedOutCacheControl', "s-max-age=1, stale-while-revalidate=86400");
const cloudfrontCachingExperimentLoggedInCacheControlSetting = new DatabaseServerSetting<string>('cloudfrontCachingExperiment.loggedInCacheControl', "no-cache, no-store, must-revalidate, max-age=0");
/**
 * For experimenting on staging to find out how CloudFront handles different cache-control headers set by the origin. The crux
 * is to figure out whether setting origin headers is sufficient to make it so responses are never cached for logged in users, but are cached
 * for logged out
 */
const cloudfrontCachingExperiment = ({ response, user }: { response: express.Response, user: DbUser | null; }) => {
  // TODO remove before this, the hard cutoff is just in case we forget
  if (!cloudfrontExperimentEnabledSetting.get() || new Date() > new Date('2024-05-07')) return;

  const loggedInCacheControl = cloudfrontCachingExperimentLoggedInCacheControlSetting.get();
  const loggedOutCacheControl = cloudfrontExperimentLoggedOutCacheControlSetting.get();

  if (user) {
    response.setHeader("Cache-Control", loggedInCacheControl);
  } else {
    response.setHeader("Cache-Control", loggedOutCacheControl);
  }
}

/**
 * If allowed, write the prefetchPrefix to the response so the client can start downloading resources
 */
const maybePrefetchResources = async ({
  request,
  response,
  enableResourcePrefetch,
  prefetchPrefix
}: {
  request: express.Request;
  response: express.Response;
  enableResourcePrefetch?: boolean | ((req: express.Request, res: express.Response, context: ResolverContext) => Promise<boolean>);
  prefetchPrefix: string;
}) => {
  const prefetchResources =
    typeof enableResourcePrefetch === "function"
      ? await enableResourcePrefetch(request, response, createAnonymousContext())
      : enableResourcePrefetch;

  if (prefetchResources) {
    response.setHeader("X-Accel-Buffering", "no"); // force nginx to send start of response immediately
    trySetResponseStatus({ response, status: 200 });
    response.write(prefetchPrefix);
  }
  return prefetchResources;
};

class ApolloServerLogging implements ApolloServerPlugin<ResolverContext> {
  requestDidStart({ request, context }: GraphQLRequestContext<ResolverContext>): GraphQLRequestListener<ResolverContext> {
    const { operationName = 'unknownGqlOperation', query, variables } = request;

    //remove sensitive data from variables such as password
    let filteredVariables = variables;
    if (variables) {
      filteredVariables =  Object.keys(variables).reduce((acc, key) => {
        return (key === 'password') ?  acc : { ...acc, [key]: variables[key] };
      }, {});
    }

    let startedRequestMetric: IncompletePerfMetric;
    if (performanceMetricLoggingEnabled.get()) {
      startedRequestMetric = openPerfMetric({
        op_type: 'query',
        op_name: operationName,
        parent_trace_id: context.perfMetric?.trace_id,
        extra_data: filteredVariables,
        gql_string: query
      });  
    }

    if (query) {
      logGraphqlQueryStarted(operationName, query, variables);
    }
    
    return {
      willSendResponse() { // hook for transaction finished
        if (performanceMetricLoggingEnabled.get()) {
          closePerfMetric(startedRequestMetric);
        }

        if (query) {
          logGraphqlQueryFinished(operationName, query);
        }
      }
    };
  }
}

export type AddMiddlewareType = typeof app.use;

export function startWebserver() {
  const addMiddleware: AddMiddlewareType = (...args: any[]) => app.use(...args);
  const config = { path: '/graphql' };
  const expressSessionSecret = expressSessionSecretSetting.get()

  app.use(universalCookiesMiddleware());

  // Required for passport-auth0, and for login redirects
  if (expressSessionSecret) {
    // express-session middleware, with MongoStore providing it a collection
    // to store stuff in. This adds a `req.session` field to requests, with
    // fancy accessors/setters. The only thing we actually use this for, however,
    // is redirects that happen on return from an OAuth login. So we can scope
    // this to only routes that start with /auth without loss of functionality.
    // We do this because if we don't it adds a webserver-to-database roundtrip
    // (or sometimes three) to each request.
    const store = new MongoStore({
      collection: Sessions,
    });
    app.use('/auth', expressSession({
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

  if (isElasticEnabled) {
    // We register this here (before the auth middleware) to avoid blocking
    // search requests whilst waiting to fetch the current user from Postgres,
    // which is never actually used.
    ElasticController.addRoutes(app);
  }

  addStripeMiddleware(addMiddleware);
  // Most middleware need to run after those added by addAuthMiddlewares, so that they can access the user that passport puts on the request.  Be careful if moving it!
  addAuthMiddlewares(addMiddleware);
  addAdminRoutesMiddleware(addMiddleware);
  addForumSpecificMiddleware(addMiddleware);
  addSentryMiddlewares(addMiddleware);
  addClientIdMiddleware(addMiddleware);
  if (isDatadogEnabled) {
    app.use(datadogMiddleware);
  }
  app.use(pickerMiddleware);
  app.use(botRedirectMiddleware);
  app.use(hstsMiddleware);
  
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
      setAsyncStoreValue('resolverContext', context);
      return context;
    },
    plugins: [new ApolloServerLogging()],
  });

  app.use('/graphql', express.json({ limit: '50mb' }));
  app.use('/graphql', express.text({ type: 'application/graphql' }));
  app.use('/graphql', perfMetricMiddleware);
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
  app.use(express.static(path.join(__dirname, '../../client')))
  app.use(express.static(path.join(__dirname, '../../../public'), {
    setHeaders: (res, requestPath) => {
      const relativePath = path.relative(__dirname, requestPath);
      if (relativePath.startsWith("../../../public/reactionImages")) {
        res.set("Cache-Control", "public, max-age=604800, immutable");
      }
    }
  }))
  
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
    if (!isEAForum) {
      next()
      return
    }
    
    const currentUser = await getUserFromReq(req)
    if (!currentUser) {
      res.status(403).send("Not logged in")
      return
    }

    const userEmail = getUserEmail(currentUser)
    if (!userEmail) {
      res.status(403).send("User does not have email")
      return
    }
    
    const eagApp = await getEAGApplicationData(userEmail)
  })

  addCrosspostRoutes(app);
  addCypressRoutes(app);

  if (testServerSetting.get()) {
    app.post('/api/quit', (_req, res) => {
      res.status(202).send('Quiting server');
      process.kill(estrellaPid, 'SIGQUIT');
    })
  }

  addServerSentEventsEndpoint(app);

  app.get('/node_modules/*', (req, res) => {
    // Under some circumstances (I'm not sure exactly what the trigger is), the
    // Chrome JS debugger tries to load a bunch of /node_modules/... paths
    // (presumably for some sort of source mapping). If these were treated as
    // normal pageloads, this would produce a ton of console-log spam, which is
    // disruptive. So instead just serve a minimal 404.
    res.status(404);
    res.end("");
  });

  app.get('*', async (request, response) => {
    response.setHeader("Content-Type", "text/html; charset=utf-8"); // allows compression

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    const publicSettingsHeader = embedAsGlobalVar("publicSettings", getPublicSettings())

    const {bundleHash} = getClientBundle();
    const clientScript = `<script async src="/js/bundle.js?hash=${bundleHash}"></script>`
    const instanceSettingsHeader = embedAsGlobalVar("publicInstanceSettings", getInstanceSettings().public);

    // Check whether the requested route has enableResourcePrefetch. If it does,
    // we send HTTP status and headers early, before we actually rendered the
    // page, so that the browser can get started on loading the stylesheet and
    // JS bundle while SSR is still in progress.
    const parsedRoute = parseRoute({
      location: parsePath(request.url)
    });
    
    const user = await getUserFromReq(request);
    const themeOptions = getThemeOptionsFromReq(request, user);
    const jssStylePreload = renderJssSheetPreloads(themeOptions);
    const externalStylesPreload = globalExternalStylesheets.map(url =>
      `<link rel="stylesheet" type="text/css" href="${url}">`
    ).join("");

    // TODO remove and replace with a permanent version
    cloudfrontCachingExperiment({ user, response })
    
    const faviconHeader = `<link rel="shortcut icon" href="${faviconUrlSetting.get()}"/>`;

    // Inject a tab ID into the page, by injecting a script fragment that puts
    // it into a global variable.
    const tabId = randomId();
    const tabIdHeader = `<script>var tabId = "${tabId}"</script>`;
    
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
        + faviconHeader
        // Embedded script tags that must precede the client bundle
        + publicSettingsHeader
        + tabIdHeader
        // The client bundle. Because this uses <script async>, its load order
        // relative to any scripts that come later than this is undetermined and
        // varies based on timings and the browser cache.
        + clientScript
    );

    // Note: this may write to the response
    const prefetchResourcesPromise = maybePrefetchResources({
      request,
      response,
      enableResourcePrefetch: parsedRoute.currentRoute?.enableResourcePrefetch,
      prefetchPrefix
    });

    const renderResultPromise = performanceMetricLoggingEnabled.get()
      ? asyncLocalStorage.run({}, () => renderWithCache(request, response, user, tabId))
      : renderWithCache(request, response, user, tabId);

    const [prefetchingResources, renderResult] = await Promise.all([prefetchResourcesPromise, renderResultPromise]);

    if (renderResult.aborted) {
      trySetResponseStatus({ response, status: 499 });
      response.end();
      return;
    }

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
    
    // TODO: Move this up into prefetchPrefix. Take the <link> that loads the stylesheet out of renderRequest and move that up too.
    const themeOptionsHeader = embedAsGlobalVar("themeOptions", themeOptions);
    
    // Finally send generated HTML with initial data to the client
    if (redirectUrl) {
      // eslint-disable-next-line no-console
      console.log(`Redirecting to ${redirectUrl}`);
      trySetResponseStatus({ response, status: status || 301 }).redirect(redirectUrl);
    } else {
      trySetResponseStatus({ response, status: status || 200 });

      response.write(
        (prefetchingResources ? '' : prefetchPrefix)
          + headers.join('\n')
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
