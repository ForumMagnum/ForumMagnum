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
import { allCollections } from '../../collections/allCollections';
import findByIds from '../findbyids';
import { getHeaderLocale } from '../intl';
import * as _ from 'underscore';
import { hashLoginToken, tokenExpiration, userIsBanned } from '../../loginTokens';
import type { Request, Response } from 'express';
import {getUserEmail} from "../../../lib/collections/users/helpers";
import { getAllRepos } from '../../repos';
import UsersRepo from '../../repos/UsersRepo';
import UserActivities from '../../../server/collections/useractivities/collection';
import { getCookieFromReq } from '../../utils/httpUtil';
import { isEAForum } from '../../../lib/instanceSettings';
import { asyncLocalStorage } from '../../perfMetrics';
import { visitorGetsDynamicFrontpage } from '../../../lib/betas';

// From https://github.com/apollographql/meteor-integration/blob/master/src/server.js
export const getUser = async (loginToken: string): Promise<DbUser|null> => {
  if (loginToken) {
    if (typeof loginToken !== 'string')
      throw new Error("Login token is not a string");

    const hashedToken = hashLoginToken(loginToken)

    const user = await new UsersRepo().getUserByLoginToken(hashedToken);

    if (user && !userIsBanned(user)) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = user.services.resume.loginTokens.find(
        (tokenInfo: AnyBecauseTodo) => tokenInfo.hashedToken === hashedToken
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
const setupAuthToken = async (user: DbUser|null): Promise<{
  userId: string|null,
  currentUser: DbUser|null,
}> => {
  if (user) {
    return {
      userId: user._id,
      currentUser: user,
    };
  } else {
    return {
      userId: null,
      currentUser: null,
    };
  }
};

// Generate a set of DataLoader objects, one per collection, to be added to a resolver context
export const generateDataLoaders = (): {
  loaders: Record<CollectionNameString, DataLoader<string,any>>
  extraLoaders: Record<string,any>
} => {
  const loaders = _.mapObject(allCollections, (collection,name) =>
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


export function requestIsFromGreaterWrong(req?: Request): boolean {
  if (!req) return false;
  const userAgent = req.headers?.["user-agent"];
  if (!userAgent) return false;
  if (typeof userAgent !== "string") return false;
  return userAgent.startsWith("Dexador");
}

export const computeContextFromUser = async ({user, req, res, isSSR}: {
  user: DbUser|null,
  req?: Request,
  res?: Response,
  isSSR: boolean
}): Promise<ResolverContext> => {
  let visitorActivity: DbUserActivity|null = null;
  const clientId = req ? getCookieFromReq(req, "clientId") : null;
  if ((user || clientId) && (isEAForum || visitorGetsDynamicFrontpage(user))) {
    visitorActivity = user ?
      await UserActivities.findOne({visitorId: user._id, type: 'userId'}) :
      await UserActivities.findOne({visitorId: clientId, type: 'clientId'});
  }
  
  let context: ResolverContext = {
    ...allCollections,
    ...generateDataLoaders(),
    req: req as any,
    res,
    headers: (req as any)?.headers,
    locale: (req as any)?.headers ? getHeaderLocale((req as any).headers, null) : "en-US",
    isSSR,
    isGreaterWrong: requestIsFromGreaterWrong(req),
    repos: getAllRepos(),
    clientId,
    visitorActivity,
    ...await setupAuthToken(user),
    perfMetric: asyncLocalStorage.getStore()?.requestPerfMetric,
  };

  if (user) {
    context.loaders.Users.prime(user._id, user);
  }

  return context;
}

export function configureSentryScope(context: ResolverContext) {
  const user = context.currentUser;
  
  if (user) {
    configureScope(scope => {
      scope.setUser({
        id: user._id,
        email: getUserEmail(user),
        username: context.isGreaterWrong ? `${user.username} (via GreaterWrong)` : user.username ?? undefined,
      });
    });
  } else if (context.isGreaterWrong) {
    configureScope(scope => {
      scope.setUser({
        username: context.isGreaterWrong ? `Logged out (via GreaterWrong)` : "Logged out",
      });
    });
  }
}

export const getUserFromReq = (req: AnyBecauseTodo): DbUser|null => {
  return req.user
  // return getUser(getAuthToken(req));
}

export async function getContextFromReqAndRes({req, res, isSSR}: {
  req: Request,
  res: Response,
  isSSR: boolean
}): Promise<ResolverContext> {
  const user = getUserFromReq(req);
  const context = await computeContextFromUser({user, req, res, isSSR});
  return context;
}
