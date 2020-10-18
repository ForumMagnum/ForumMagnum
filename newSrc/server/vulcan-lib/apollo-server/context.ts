/**
 * Context prop of the ApolloServer config
 *
 * It sets up the server options based on the current request
 * Replacement to the syntax graphqlExpress(async req => {... })
 * Current pattern:
 * @see https://www.apollographql.com/docs/apollo-server/migration-two-dot.html#request-headers
 * @see https://github.com/apollographql/apollo-server/issues/1066
 * Previous implementation:
 * @see https://github.com/apollographql/apollo-server/issues/420
 */

import { configureScope } from '@sentry/node';
import DataLoader from 'dataloader';
import { Accounts } from '../../../lib/meteorAccounts';
import Cookies from 'universal-cookie';
import { runCallbacks } from '../../../lib/vulcan-lib/callbacks';
import { Collections } from '../../../lib/vulcan-lib/collections';
import { GraphQLSchema } from '../../../lib/vulcan-lib/graphql';
import findByIds from '../findbyids';
import { getHeaderLocale } from '../intl';
import Users from '../../../lib/collections/users/collection';

// From https://github.com/apollographql/meteor-integration/blob/master/src/server.js
const getUser = async (loginToken: string): Promise<DbUser|null> => {
  if (loginToken) {
    if (typeof loginToken !== 'string')
      throw new Error("Login token is not a string");

    const hashedToken = Accounts._hashLoginToken(loginToken)

    const user = Users.findOne({
      'services.resume.loginTokens.hashedToken': hashedToken
    })

    if (user) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = user.services.resume.loginTokens.find(
        tokenInfo => tokenInfo.hashedToken === hashedToken
      )

      const expiresAt = Accounts._tokenExpiration(tokenInformation.when)

      const isExpired = expiresAt < new Date()

      if (!isExpired) {
        return user
      }
    }
  }
  
  return null;
}

// initial request will get the login token from a cookie, subsequent requests from
// the header
const getAuthToken = req => {
  return req.headers.authorization || new Cookies(req.cookies).get('meteor_login_token');
};
// @see https://www.apollographql.com/docs/react/recipes/meteor#Server
const setupAuthToken = (user, context) => {
  if (user) {
    context.userId = user._id;
    context.currentUser = user;
    
    configureScope(scope => {
      scope.setUser({
        id: user._id,
        email: user.email,
        username: user.username
      });
    });
    
    // identify user to any server-side analytics providers
    runCallbacks('events.identify', user);
  } else {
    context.userId = undefined;
    context.currentUser = undefined;
  }
};

// @see https://github.com/facebook/dataloader#caching-per-request
const generateDataLoaders = (context) => {
  // go over context and add Dataloader to each collection
  Collections.forEach(collection => {
    context[collection.options.collectionName].loader = new DataLoader(
      (ids: Array<string>) => findByIds(collection, ids, context),
      {
        cache: true,
      }
    );
    context[collection.options.collectionName].extraLoaders = {};
  });
  return context;
};


export const computeContextFromUser = async (user, headers): Promise<ResolverContext> => {
  let context: ResolverContext = {...GraphQLSchema.context};

  generateDataLoaders(context);
  if (user)
    context.Users.loader.prime(user._id, user);

  setupAuthToken(user, context);

  //add the headers to the context
  context.headers = headers;

  context.locale = getHeaderLocale(headers, null);

  return context;
}

export const getUserFromReq = async (req) => {
  return getUser(getAuthToken(req));
}

// Returns a function called on every request to compute context
export const computeContextFromReq = async (req): Promise<ResolverContext> => {
  const user = await getUserFromReq(req);
  return computeContextFromUser(user, req.headers);
};
