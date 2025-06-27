import { configureScope } from '@sentry/node';
import DataLoader from 'dataloader';
import { getAllCollections, getAllCollectionsByName } from '../../collections/allCollections';
import findByIds from '../findbyids';
import { getHeaderLocale } from '../intl';
import { hashLoginToken, tokenExpiration, userIsBanned } from '../../loginTokens';
import type { Request, Response } from 'express';
import {getUserEmail} from "../../../lib/collections/users/helpers";
import { getAllRepos } from '../../repos';
import UsersRepo from '../../repos/UsersRepo';
import { getCookieFromReq } from '../../utils/httpUtil';
import { asyncLocalStorage } from '../../perfMetrics';
import type { NextRequest, NextResponse } from 'next/server';


export const getUser = async (loginToken: string|null): Promise<DbUser|null> => {
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

// Generate a set of DataLoader objects, one per collection, to be added to a resolver context
export const generateDataLoaders = (): {
  loaders: Record<CollectionNameString, DataLoader<string,any>>
  extraLoaders: Record<string,any>
} => {
  const loaders = Object.fromEntries(getAllCollections().map((collection) =>
    [collection.collectionName, new DataLoader(
      (ids: Array<string>) => findByIds(collection, ids),
      { cache: true, }
    )] as const
  )) as Record<CollectionNameString, DataLoader<string,any>>;
  
  return {
    loaders,
    extraLoaders: {}
  };
};

export function requestIsFromUserAgent(req: Request, userAgentPrefix: string): boolean {
  if (!req) return false;
  const userAgent = req.headers?.["user-agent"];
  if (!userAgent) return false;
  if (typeof userAgent !== "string") return false;
  return userAgent.startsWith(userAgentPrefix);
}

export function requestIsFromGreaterWrong(req?: Request): boolean {
  if (!req) return false;
  return requestIsFromUserAgent(req, "Dexador");
}

export function requestIsFromIssaRiceReader(req?: Request): boolean {
  if (!req) return false;
  return requestIsFromUserAgent(req, "LW/EA Forum Reader (https://github.com/riceissa/ea-forum-reader/)");
}

export const computeContextFromUser = async ({user, req, res, isSSR}: {
  user: DbUser|null,
  req?: NextRequest,
  res?: NextResponse,
  isSSR: boolean
}): Promise<ResolverContext> => {
  const clientId = req ? getCookieFromReq(req, "clientId") : null;
  
  let context: ResolverContext = {
    ...getAllCollectionsByName(),
    ...generateDataLoaders(),
    req: req,
    res,
    headers: (req as any)?.headers,
    locale: (req as any)?.headers ? getHeaderLocale((req as any).headers, null) : "en-US",
    isSSR,
    isGreaterWrong: requestIsFromGreaterWrong(req),
    isIssaRiceReader: requestIsFromIssaRiceReader(req),
    repos: getAllRepos(),
    clientId,
    userId: user?._id ?? null,
    currentUser: user,
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
        username: `Logged out (via GreaterWrong)`,
      });
    });
  } else if (context.isIssaRiceReader) {
    configureScope(scope => {
      scope.setUser({
        username: `Logged out (via lw2.issarice.com)`
      });
    });
  }
}

export const getUserFromReq = (req: AnyBecauseTodo): DbUser|null => {
  return req.user
  // return getUser(getAuthToken(req));
}

export async function getContextFromReqAndRes({req, res, isSSR}: {
  req: NextRequest,
  res: NextResponse,
  isSSR: boolean
}): Promise<ResolverContext> {
  const user = getUserFromReq(req);
  const context = await computeContextFromUser({user, req, res, isSSR});
  return context;
}
