import '@/lib/utils/extendSimpleSchemaOptions';
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
import type { NextRequest } from 'next/server';
import { prepareClientId } from '@/server/clientIdMiddleware';
import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { unstable_cache } from 'next/cache';


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

function requestIsFromUserAgent(headers: Headers | undefined, userAgentPrefix: string): boolean {
  if (!headers) return false;
  const userAgent = headers.get("user-agent");
  if (!userAgent) return false;
  if (typeof userAgent !== "string") return false;
  return userAgent.startsWith(userAgentPrefix);
}

export function requestIsFromGreaterWrong(headers?: Headers): boolean {
  if (!headers) return false;
  return requestIsFromUserAgent(headers, "Dexador");
}

export function requestIsFromIssaRiceReader(headers?: Headers): boolean {
  if (!headers) return false;
  return requestIsFromUserAgent(headers, "LW/EA Forum Reader (https://github.com/riceissa/ea-forum-reader/)");
}

export const computeContextFromUser = ({user, headers, searchParams, cookies, isSSR}: {
  user: DbUser|null,
  headers?: Headers,
  searchParams?: URLSearchParams,
  cookies?: RequestCookie[],
  req?: NextRequest,
  isSSR: boolean
}): ResolverContext => {
  const clientId = cookies?.find(cookie => cookie.name === "clientId")?.value ?? null;
  
  let context: ResolverContext = {
    ...getAllCollectionsByName(),
    ...generateDataLoaders(),
    searchParams,
    headers,
    locale: headers ? getHeaderLocale(headers, null) : "en-US",
    isSSR,
    isGreaterWrong: requestIsFromGreaterWrong(headers),
    isIssaRiceReader: requestIsFromIssaRiceReader(headers),
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

const getCachedUser = unstable_cache(getUser, undefined, { revalidate: 5 });

export const getUserFromReq = async (req: NextRequest): Promise<DbUser|null> => {
  // We check both cookies and headers, because requests from the browser come with cookies,
  // but requests made by the apollo client (even during SSR) have to send it via header
  const loginToken = req.cookies.get('loginToken')?.value ?? req.headers.get('loginToken') ?? null;
  return getCachedUser(loginToken);
}

export async function getContextFromReqAndRes({req, isSSR}: {
  req: NextRequest,
  isSSR: boolean
}): Promise<ResolverContext> {
  // TODO: do we want to abstract this out into something shared across all routes that need to grab the authenticated user for the current request?
  const [user] = await Promise.all([
    getUserFromReq(req),
    prepareClientId(req)
  ]);

  const context = await computeContextFromUser({user, req, isSSR});
  return context;
}
