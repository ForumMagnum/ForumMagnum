import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { isDevelopment, isE2E } from '../lib/executionEnvironment';
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
import { addAuthMiddlewares, expressSessionSecretSetting } from './authenticationMiddlewares';
import { addForumSpecificMiddleware } from './forumSpecificMiddleware';
import { addSentryMiddlewares, logGraphqlQueryStarted, logGraphqlQueryFinished } from './logging';
import { clientIdMiddleware } from './clientIdMiddleware';
import { classesForAbTestGroups } from '../lib/abTestImpl';
import expressSession from 'express-session';
import MongoStore from './vendor/ConnectMongo/MongoStore';
import { ckEditorTokenHandler } from './ckEditor/ckEditorToken';
import { getEAGApplicationData } from './zohoUtils';
import { faviconUrlSetting, isEAForum, testServerSetting, performanceMetricLoggingEnabled, isDatadogEnabled } from '../lib/instanceSettings';
import { parseRoute, parsePath } from '../lib/vulcan-core/appContext';
import { globalExternalStylesheets } from '../themes/globalStyles/externalStyles';
import { addTestingRoutes } from './testingSqlClient';
import { addCrosspostRoutes } from './fmCrosspost/routes';
import { addV2CrosspostHandlers } from './crossposting/handlers';
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
import { randomId } from '../lib/random';
import { addCacheControlMiddleware, responseIsCacheable } from './cacheControlMiddleware';
import { SSRMetadata } from '../lib/utils/timeUtil';
import type { RouterLocation } from '../lib/vulcan-lib/routes';
import { getCookieFromReq, trySetResponseStatus } from './utils/httpUtil';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '@/lib/cookies/cookies';
import { addAutocompleteEndpoint } from './autocompleteEndpoint';
import { getSqlClientOrThrow } from './sql/sqlClient';
import { addLlmChatEndpoint } from './resolvers/anthropicResolvers';
import { getInstanceSettings } from '@/lib/getInstanceSettings';
import { getCommandLineArguments } from './commandLine';
import { makeAbsolute } from '@/lib/vulcan-lib/utils';

/**
 * End-to-end tests automate interactions with the page. If we try to, for
 * instance, click on a button before the page has been hydrated then the "click"
 * will occur but nothing will happen as the event listener won't be attached
 * yet which leads to flaky tests. To avoid this we add some static styles to
 * the top of the SSR'd page which are then manually deleted _after_ React
 * hydration has finished. Be careful editing this - it would ve very bad for
 * this to end up in production builds.
 */
const ssrInteractionDisable = isE2E
  ? `
    <style id="ssr-interaction-disable">
      #react-app * {
        display: none;
      }
    </style>
  `
  : "";

/**
 * If allowed, write the prefetchPrefix to the response so the client can start downloading resources
 */
const maybePrefetchResources = ({
  request,
  response,
  parsedRoute,
  prefetchPrefix
}: {
  request: express.Request;
  response: express.Response;
  parsedRoute: RouterLocation,
  prefetchPrefix: string;
}) => {

  const maybeWritePrefetchedResourcesToResponse = async () => {
    const enableResourcePrefetch = parsedRoute.currentRoute?.enableResourcePrefetch;
    const prefetchResources =
      typeof enableResourcePrefetch === "function"
        ? await enableResourcePrefetch(request, response, parsedRoute, createAnonymousContext())
        : enableResourcePrefetch;

    if (prefetchResources) {
      response.setHeader("X-Accel-Buffering", "no"); // force nginx to send start of response immediately
      trySetResponseStatus({ response, status: 200 });
      response.write(prefetchPrefix);
    }
    return prefetchResources;
  };

  return maybeWritePrefetchedResourcesToResponse;
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

  if (enableVite) {
    // When vite is running the backend is proxied which means we have to
    // enable CORS for API routes to work
    app.use((_req, res, next) => {
      res.set("Access-Control-Allow-Origin", "*");
      next();
    });
  }

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
  app.use('/analyticsEvent', express.json({ limit: '50mb' }), clientIdMiddleware);
  app.use('/ckeditor-webhook', express.json({ limit: '50mb' }));

  if (isElasticEnabled) {
    // We register this here (before the auth middleware) to avoid blocking
    // search requests whilst waiting to fetch the current user from Postgres,
    // which is never actually used.
    ElasticController.addRoutes(app);
  }

  // Most middleware need to run after those added by addAuthMiddlewares, so that they can access the user that passport puts on the request.  Be careful if moving it!
  addAuthMiddlewares(addMiddleware);
  addAdminRoutesMiddleware(addMiddleware);
  addForumSpecificMiddleware(addMiddleware);
  addSentryMiddlewares(addMiddleware);
  addCacheControlMiddleware(addMiddleware);
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
    context: async ({ req, res }: { req: express.Request, res: express.Response }) => {
      const context = await getContextFromReqAndRes({req, res, isSSR: false});
      configureSentryScope(context);
      return context;
    },
    plugins: [new ApolloServerLogging()],
  });

  app.use('/graphql', express.json({ limit: '50mb' }));
  app.use('/graphql', express.text({ type: 'application/graphql' }));
  app.use('/graphql', perfMetricMiddleware, clientIdMiddleware);
  apolloServer.applyMiddleware({ app })

  addStaticRoute("/js/bundle.js", ({query}, req, res, context) => {
    const {hash: bundleHash, content: bundleBuffer, brotli: bundleBrotliBuffer} = getClientBundle().resource;
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
  app.use("/ckeditor-token", clientIdMiddleware, ckEditorTokenHandler)
  
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
    
    const currentUser = getUserFromReq(req)
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
  addV2CrosspostHandlers(app);
  addTestingRoutes(app);
  addLlmChatEndpoint(app);

  if (testServerSetting.get()) {
    app.post('/api/quit', (_req, res) => {
      res.status(202).send('Quiting server');
      process.kill(buildProcessPid, 'SIGQUIT');
    })
  }

  addServerSentEventsEndpoint(app);
  addAutocompleteEndpoint(app);
  
  app.get('/node_modules/*', (req, res) => {
    // Under some circumstances (I'm not sure exactly what the trigger is), the
    // Chrome JS debugger tries to load a bunch of /node_modules/... paths
    // (presumably for some sort of source mapping). If these were treated as
    // normal pageloads, this would produce a ton of console-log spam, which is
    // disruptive. So instead just serve a minimal 404.
    res.status(404);
    res.end("");
  });

  app.get('/api/health', async (request, response) => {
    try {
      const db = getSqlClientOrThrow();
      await db.one('SELECT 1');
      response.status(200);
      response.end("");
    } catch (err) {
      response.status(500);
      response.end("");
    }
  });

  app.get('*', async (request, response) => {
    response.setHeader("Content-Type", "text/html; charset=utf-8"); // allows compression

    if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
    const publicSettingsHeader = embedAsGlobalVar("publicSettings", getPublicSettings())

    const bundleHash = getClientBundle().resource.hash;
    const clientScript = enableVite
      ? ""
      : `<script async src="/js/bundle.js?hash=${bundleHash}"></script>`
    const instanceSettingsHeader = embedAsGlobalVar("publicInstanceSettings", getInstanceSettings().public);

    // Check whether the requested route has enableResourcePrefetch. If it does,
    // we send HTTP status and headers early, before we actually rendered the
    // page, so that the browser can get started on loading the stylesheet and
    // JS bundle while SSR is still in progress.
    const parsedRoute = parseRoute({
      location: parsePath(request.url)
    });
    
    const user = getUserFromReq(request);
    const themeOptions = getThemeOptionsFromReq(request, user);
    const jssStylePreload = renderJssSheetPreloads(themeOptions);
    const externalStylesPreload = globalExternalStylesheets.map(url =>
      `<link rel="stylesheet" type="text/css" href="${url}">`
    ).join("");
    
    const faviconHeader = `<link rel="shortcut icon" href="${faviconUrlSetting.get()}"/>`;

    // Inject a tab ID into the page, by injecting a script fragment that puts
    // it into a global variable. If the response is cacheable (same html may be used
    // by multiple tabs), this is generated in `clientStartup.ts` instead.
    const tabId = responseIsCacheable(response) ? null : randomId();
    
    const isReturningVisitor = !!getCookieFromReq(request, LAST_VISITED_FRONTPAGE_COOKIE);

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
        + ssrInteractionDisable
        + instanceSettingsHeader
        + faviconHeader
        // Embedded script tags that must precede the client bundle
        + publicSettingsHeader
        + embedAsGlobalVar("tabId", tabId)
        + embedAsGlobalVar("isReturningVisitor", isReturningVisitor)
        // The client bundle. Because this uses <script async>, its load order
        // relative to any scripts that come later than this is undetermined and
        // varies based on timings and the browser cache.
        + clientScript
    );

    // Note: this may write to the response
    const prefetchResourcesPromise = maybePrefetchResources({ request, response, parsedRoute, prefetchPrefix });

    const renderResultPromise = performanceMetricLoggingEnabled.get()
      ? asyncLocalStorage.run({}, () => renderWithCache(request, response, user, tabId, prefetchResourcesPromise))
      : renderWithCache(request, response, user, tabId, prefetchResourcesPromise);

    const renderResult = await renderResultPromise;

    if (renderResult.aborted) {
      trySetResponseStatus({ response, status: 499 });
      response.end();
      return;
    }

    const prefetchingResources = await renderResult.prefetchedResources;

    const {
      ssrBody,
      headers,
      serializedApolloState,
      serializedForeignApolloState,
      jssSheets,
      status,
      redirectUrl,
      renderedAt,
      timezone,
      cacheFriendly,
      allAbTestGroups,
    } = renderResult;
    
    // TODO: Move this up into prefetchPrefix. Take the <link> that loads the stylesheet out of renderRequest and move that up too.
    const themeOptionsHeader = embedAsGlobalVar("themeOptions", themeOptions);
    
    // Finally send generated HTML with initial data to the client
    if (redirectUrl) {
      // eslint-disable-next-line no-console
      console.log(`Redirecting to ${redirectUrl}`);
      trySetResponseStatus({ response, status: status || 301 }).redirect(makeAbsolute(redirectUrl));
    } else {
      trySetResponseStatus({ response, status: status || 200 });
      const ssrMetadata: SSRMetadata = {
        renderedAt: renderedAt.toISOString(),
        cacheFriendly,
        timezone
      }

      response.write(
        (prefetchingResources ? '' : prefetchPrefix)
          + headers.join('\n')
          + themeOptionsHeader
          + jssSheets
        + '</head>\n'
        + '<body class="'+classesForAbTestGroups(allAbTestGroups)+'">\n'
          + ssrBody + '\n'
        + '</body>\n'
        + embedAsGlobalVar("ssrRenderedAt", renderedAt) + '\n' // TODO Remove after 2024-05-14, here for backwards compatibility
        + embedAsGlobalVar("ssrMetadata", ssrMetadata) + '\n'
        + serializedApolloState + '\n'
        + serializedForeignApolloState + '\n'
        + '</html>\n')
      response.end();
    }
  })

  // Start Server
  const listenPort = getCommandLineArguments().listenPort;
  const env = process.env.NODE_ENV || 'production'
  const server = app.listen({ port: listenPort }, () => {
    // eslint-disable-next-line no-console
    return console.info(`Server running on http://localhost:${listenPort} [${env}]`)
  })
  server.keepAliveTimeout = 120000;
  
  // Route used for checking whether the server is ready for an auto-refresh
  // trigger. Added last so that async stuff can't lead to auto-refresh
  // happening before the server is ready.
  addStaticRoute('/api/ready', ({query}, _req, res, next) => {
    res.end('true');
  });
}
