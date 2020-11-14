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

import Sentry from '@sentry/node';
import DataLoader from 'dataloader';
import Cookies from 'universal-cookie';
import { runCallbacks } from '../../../lib/vulcan-lib/callbacks';
import { Collections } from '../../../lib/vulcan-lib/collections';
import { getSchemaContextBase } from './initGraphQL';
import findByIds from '../findbyids';
import { getHeaderLocale } from '../intl';
import Users from '../../../lib/collections/users/collection';
import * as _ from 'underscore';
import { hashLoginToken, tokenExpiration } from './apollo_server';

// From https://github.com/apollographql/meteor-integration/blob/master/src/server.js
export const getUser = async (loginToken: string): Promise<DbUser|null> => {
  if (loginToken) {
    if (typeof loginToken !== 'string')
      throw new Error("Login token is not a string");

    const hashedToken = hashLoginToken(loginToken)

    const user = Users.findOne({
      'services.resume.loginTokens.hashedToken': hashedToken
    })

    if (user) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = user.services.resume.loginTokens.find(
        tokenInfo => tokenInfo.hashedToken === hashedToken
      )

      const expiresAt = tokenExpiration(tokenInformation.when)

      const isExpired = expiresAt < new Date()

      if (!isExpired) {
        return user
      }
    }
  }
  
  return null;
}

// @see https://www.apollographql.com/docs/react/recipes/meteor#Server
const setupAuthToken = (user: DbUser|null, context: ResolverContext) => {
  if (user) {
    context.userId = user._id;
    context.currentUser = user;
    
    Sentry.configureScope(scope => {
      scope.setUser({
        id: user._id,
        email: user.email,
        username: user.username
      });
    });
    
    // identify user to any server-side analytics providers
    runCallbacks({
      name: 'events.identify',
      iterator: user
    });
  } else {
    context.userId = null;
    context.currentUser = null;
  }
};

// Generate a set of DataLoader objects, one per collection, to be added to a resolver context
export const generateDataLoaders = (): {
  loaders: Record<CollectionNameString, DataLoader<string,any>>
  extraLoaders: Record<string,any>
} => {
  const loaders = _.mapObject(getCollectionsByName(), (collection,name) =>
    new DataLoader(
      (ids: Array<string>) => findByIds(collection, ids),
      { cache: true, }
    )
  ) as Record<CollectionNameString, DataLoader<string,any>>;
  
  return {
    loaders,
    extraLoaders: {}
  };
};


export const computeContextFromUser = async (user: DbUser|null, req?: Request, res?: Response): Promise<ResolverContext> => {
  let context: ResolverContext = {
    ...getSchemaContextBase(),
    ...getCollectionsByName(),
    ...generateDataLoaders(),
    req,
    res
  };

  if (user)
    context.loaders.Users.prime(user._id, user);

  setupAuthToken(user, context);

  //add the headers to the context
  if (req) {
    context.headers = req.headers;
    context.locale = getHeaderLocale(req.headers, null);
  }  

  return context;
}

export const getCollectionsByName = (): CollectionsByName => {
  const result: any = {};
  Collections.forEach((collection: CollectionBase<DbObject>) => {
    result[collection.collectionName] = collection;
  });
  return result as CollectionsByName;
}

export const getUserFromReq = async (req) => {
  return req.user
  // return getUser(getAuthToken(req));
}

// Returns a function called on every request to compute context
export const computeContextFromReq = async (req, res): Promise<ResolverContext> => {
  const user = await getUserFromReq(req);
  return computeContextFromUser(user, req, res);
};
