/**
 * @see https://www.apollographql.com/docs/apollo-server/whats-new.html
 * @see https://www.apollographql.com/docs/apollo-server/migration-two-dot.html
 */

// Meteor WebApp use a Connect server, so we need to
// use apollo-server-express integration
//import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { onStartup, isDevelopment } from '../lib/executionEnvironment';

import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';

// import cookiesMiddleware from 'universal-cookie-express';
// import Cookies from 'universal-cookie';
import voyagerMiddleware from 'graphql-voyager/middleware/express';
import getVoyagerConfig from '../../../server/vulcan-lib/apollo-server/voyager';
import { graphiqlMiddleware, getGraphiqlConfig } from '../../../server/vulcan-lib/apollo-server/graphiql';
import getPlaygroundConfig from '../../../server/vulcan-lib/apollo-server/playground';

import { initGraphQL, getExecutableSchema } from '../../../server/vulcan-lib/apollo-server/initGraphQL';
//import { engineConfig } from './engine';
import { computeContextFromReq, getUser } from '../../../server/vulcan-lib/apollo-server/context';

import { populateComponentsApp } from '../../../lib/vulcan-lib/components';
import { createVoteableUnionType } from '../../../server/votingGraphQL';

// onPageLoad is mostly equivalent to an Express middleware
// excepts it is tailored to handle Meteor server side rendering
import { onPageLoad } from 'meteor/server-render';

import makePageRenderer from '../../../server/vulcan-lib/apollo-ssr/renderPage';

import universalCookiesMiddleware from 'universal-cookie-express';
import { randomId } from '../lib/random';

import { formatError } from 'apollo-errors';

import Stripe from 'stripe';
import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../../../lib/instanceSettings';
import { createHash } from 'crypto'
import passport from 'passport'
import { Strategy as CustomStrategy } from 'passport-custom'
import Users from '../../../lib/vulcan-users';
import { DatabaseServerSetting } from '../../../server/databaseSettings';

const sentryUrl = sentryUrlSetting.get()
const sentryEnvironment = sentryEnvironmentSetting.get()
const sentryRelease = sentryReleaseSetting.get()

const cookieAuthStrategy = new CustomStrategy(async function getUserPassport(req: any, done) {
  const loginToken = req.cookies['loginToken'] || req.cookies['meteor_login_token'] // Backwards compatibility with meteor_login_token here
  if (!loginToken) return done(null, false)
  const user = await getUser(loginToken)
  if (!user) return done(null, false)
  done(null, user)
})

async function deserializeUserPassport(id, done) {
  const user = await Users.findOne({_id: id})
  if (!user) done()
  done(null, user)
}

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)

export function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

export function tokenExpiration(when) {
  const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
  const tokenLifetimeMs = LOGIN_UNEXPIRING_TOKEN_DAYS * 24 * 60 * 60 * 1000
  // We pass when through the Date constructor for backwards compatibility;
  // `when` used to be a number.
  return new Date((new Date(when)).getTime() + tokenLifetimeMs);
}

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

const stripeMiddleware = async (req, res) => {
  if (req.method === "POST" && stripe) {
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
}

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
  
  WebApp.connectHandlers.use(universalCookiesMiddleware());
  WebApp.connectHandlers.use(bodyParser.urlencoded()) // We send passwords + username via urlencoded form parameters
  WebApp.connectHandlers.use(passport.initialize())
  if (stripePrivateKey && stripe) {
    WebApp.connectHandlers.use(stripeMiddleware);
  }

  passport.use(cookieAuthStrategy)
  WebApp.connectHandlers.use('/', (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, (err) => {
        if (err) return next(err)
        next()
      })
    })(req, res, next) 
  })


  WebApp.connectHandlers.use('/logout', (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logOut()

      // The accepted way to delete a cookie is to set an expiration date in the past.
      if (req.cookies['meteor_login_token']) {
        res.setHeader("Set-Cookie", `meteor_login_token= ; expires=${new Date(0).toUTCString()};`)   
      }
      if (req.cookies.loginToken) {
        res.setHeader("Set-Cookie", `loginToken= ; expires=${new Date(0).toUTCString()};`)   
      }
      
      
      res.statusCode=302;
      res.setHeader('Location','/');
      return res.end();
    })(req, res, next) 
  })

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
    context: ({ req, res }) => computeContextFromReq(req, res),
  });
  
  WebApp.connectHandlers.use(Sentry.Handlers.requestHandler());
  WebApp.connectHandlers.use(Sentry.Handlers.errorHandler());
  
  // NOTE: order matters here
  // /graphql middlewares (request parsing)
  // IMPORTANT: order matters !
  // 1 - Add request parsing middleware
  // 2 - Add apollo specific middlewares
  // 3 - Close connection (otherwise connection gets stuck)
  // 4 - ONLY THEN you can start adding other middlewares (graphql voyager etc.)

  // WebApp.connectHandlers is a connect server
  // you can add middlware as usual when using Express/Connect

  // parse cookies and assign req.universalCookies object
  

  // parse request (order matters)
  WebApp.connectHandlers.use(
    config.path,
    bodyParser.json({ limit: '50mb' })
  );
  WebApp.connectHandlers.use(config.path, bodyParser.text({ type: 'application/graphql' }));

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

  // Voyager is a GraphQL schema visual explorer
  // available on /voyager as a default
  WebApp.connectHandlers.use(config.voyagerPath, voyagerMiddleware(getVoyagerConfig(config)));
  // Setup GraphiQL
  WebApp.connectHandlers.use(config.graphiqlPath, graphiqlMiddleware(getGraphiqlConfig(config)));
  
  // init the application components and routes, including components & routes from 3rd-party packages
  populateComponentsApp();
  // render the page
  onPageLoad(makePageRenderer);
});
