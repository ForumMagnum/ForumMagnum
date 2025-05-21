import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { isDevelopment } from '../lib/executionEnvironment';
import { handleRequest } from './rendering/renderPage';
import { pickerMiddleware, addStaticRoute } from './vulcan-lib/staticRoutes';
import { graphiqlMiddleware } from './vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from './vulcan-lib/apollo-server/playground';
import { getUserFromReq, configureSentryScope, getContextFromReqAndRes } from './vulcan-lib/apollo-server/context';
import universalCookiesMiddleware from 'universal-cookie-express';
import { formatError } from 'apollo-errors';
import * as Sentry from '@sentry/node';
import { app } from './expressServer';
import path from 'path'
import { addAuthMiddlewares, expressSessionSecretSetting } from './authenticationMiddlewares';
import { addForumSpecificMiddleware } from './forumSpecificMiddleware';
import { addSentryMiddlewares, logGraphqlQueryStarted, logGraphqlQueryFinished } from './logging';
import { clientIdMiddleware } from './clientIdMiddleware';
import expressSession from 'express-session';
import MongoStore from './vendor/ConnectMongo/MongoStore';
import { ckEditorTokenHandler } from './ckEditor/ckEditorToken';
import { getEAGApplicationData } from './zohoUtils';
import { addTestingRoutes } from './testingSqlClient';
import { addCrosspostRoutes } from './fmCrosspost/routes';
import { addV2CrosspostHandlers } from './crossposting/handlers';
import { getUserEmail } from "../lib/collections/users/helpers";
import { inspect } from "util";
import { datadogMiddleware } from './datadog/datadogMiddleware';
import { Sessions } from '../server/collections/sessions/collection';
import { addServerSentEventsEndpoint } from "./serverSentEvents";
import { botRedirectMiddleware } from './botRedirect';
import { hstsMiddleware } from './hsts';
import { getClientBundle } from './utils/bundleUtils';
import ElasticController from './search/elastic/ElasticController';
import type { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener } from 'apollo-server-plugin-base';
import { closePerfMetric, openPerfMetric, perfMetricMiddleware } from './perfMetrics';
import { addAdminRoutesMiddleware } from './adminRoutesMiddleware'
import { addCacheControlMiddleware } from './cacheControlMiddleware';
import { addAutocompleteEndpoint } from './autocompleteEndpoint';
import { getSqlClientOrThrow } from './sql/sqlClient';
import { addLlmChatEndpoint } from './resolvers/anthropicResolvers';
import { getCommandLineArguments } from './commandLine';
import { isDatadogEnabled, isEAForum, isElasticEnabled, performanceMetricLoggingEnabled, testServerSetting } from "../lib/instanceSettings";
import { resolvers, typeDefs } from './vulcan-lib/apollo-server/initGraphQL';
import express from 'express';


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
    
    schema: makeExecutableSchema({ typeDefs, resolvers }),
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
  app.use('/graphql', clientIdMiddleware, perfMetricMiddleware);
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

  app.get('*', async (request, response) => handleRequest(request, response));

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
