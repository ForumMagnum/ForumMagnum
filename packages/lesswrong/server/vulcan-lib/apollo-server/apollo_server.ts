/**
 * @see https://www.apollographql.com/docs/apollo-server/whats-new.html
 * @see https://www.apollographql.com/docs/apollo-server/migration-two-dot.html
 */

// Meteor WebApp use a Connect server, so we need to
// use apollo-server-express integration
//import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { onStartup, isDevelopment } from '../../../lib/executionEnvironment';

import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';

// import cookiesMiddleware from 'universal-cookie-express';
// import Cookies from 'universal-cookie';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from './voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from './graphiql';
import getPlaygroundConfig from './playground';

import { initGraphQL, getExecutableSchema } from './initGraphQL';
//import { engineConfig } from './engine';
import { computeContextFromReq } from './context';

import { populateComponentsApp } from '../../../lib/vulcan-lib/components';
import { createVoteableUnionType } from '../../votingGraphQL';

// onPageLoad is mostly equivalent to an Express middleware
// excepts it is tailored to handle Meteor server side rendering
import { onPageLoad } from 'meteor/server-render';

import makePageRenderer from '../apollo-ssr/renderPage';

import universalCookiesMiddleware from 'universal-cookie-express';

import { formatError } from 'apollo-errors';

import Stripe from 'stripe';
import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../../../lib/instanceSettings';
import { DatabaseServerSetting } from '../../databaseSettings';

const sentryUrl = sentryUrlSetting.get()
const sentryEnvironment = sentryEnvironmentSetting.get()
const sentryRelease = sentryReleaseSetting.get()

const stripePrivateKeySetting = new DatabaseServerSetting<null|string>('stripe.privateKey', null)
const stripeURLRedirect = new DatabaseServerSetting<null|string>('stripe.redirectTarget', 'https://lesswrong.com')
const stripePrivateKey = stripePrivateKeySetting.get()
const stripe = stripePrivateKey && new Stripe(stripePrivateKey, {apiVersion: '2020-08-27'})

if (sentryUrl && sentryEnvironment && sentryRelease) {
  Sentry.init({
    dsn: sentryUrl,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [
      new SentryIntegrations.Dedupe(),
      new SentryIntegrations.ExtraErrorData(),
    ],
  });
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
  if (stripePrivateKey && stripe) {
    WebApp.connectHandlers.use('/create-session', async (req, res) => {
      if (req.method === "POST") {
        const redirectTarget = stripeURLRedirect.get()
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          shipping_address_collection: {
            allowed_countries: [
              // European Countries: https://www.europeancuisines.com/Europe-European-Two-Letter-Country-Code-Abbreviations
              'AL', 'AD', 'AM', 'AT', 'BY', 'BE', 'BA', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FO', 'FI', 'FR', 'GB', 'GE', 'GI', 'GR', 'HU', 'HR', 'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MC', 'MK', 'MT', 'NO', 'NL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA', 'VA', 'PL',
              // North American Countries
              'US', 'MX', 'CA',
              // Oceania Countries
              'AU', 'NZ',
              // Israel (Maybe shippable via Amazon North America?)
              'IL'
            ]
          },
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'A Map That Reflects the Territory',
                  images: ['https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606805322/w_1966_jahgq7.png'],
                },
                unit_amount: 2900,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${redirectTarget}?success=true`,
          cancel_url: `${redirectTarget}?canceled=true`,
        });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ id: session.id }));
      }
    })
  }
  

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

onStartup(() => {
  // Vulcan specific options
  const config = {
    path: '/graphql',
    maxAccountsCacheSizeInMB: 1,
    voyagerPath: '/graphql-voyager',
    graphiqlPath: '/graphiql',
  };
  const apolloApplyMiddlewareOptions = {
    // @see https://github.com/meteor/meteor/blob/master/packages/webapp/webapp_server.js
    // @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#Parameters-2
    bodyParser: false, // added manually later
    path: config.path,
    app: WebApp.connectHandlers,
  };

  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  
  // create server
  // given options contains the schema
  const apolloServer = new ApolloServer({
    // graphql playground (replacement to graphiql), available on the app path
    playground: getPlaygroundConfig(config),
    introspection: true,
    // context optionbject or a function of the current request (+ maybe some other params)
    debug: isDevelopment,
    
    //engine: engineConfig,
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
    context: ({ req }) => computeContextFromReq(req),
  });
  
  WebApp.connectHandlers.use(Sentry.Handlers.requestHandler());
  WebApp.connectHandlers.use(Sentry.Handlers.errorHandler());
  
  // NOTE: order matters here
  // /graphql middlewares (request parsing)
  setupGraphQLMiddlewares(apolloServer, config, apolloApplyMiddlewareOptions);
  //// other middlewares (dev tools etc.)
  // LW: Made available in production environment
  setupToolsMiddlewares(config);
  
  // init the application components and routes, including components & routes from 3rd-party packages
  populateComponentsApp();
  // render the page
  onPageLoad(makePageRenderer);
});
