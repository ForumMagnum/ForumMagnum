import { isNotRandomId, randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import express from 'express';
import { responseIsCacheable } from './cacheControlMiddleware';
import { ClientIdsRepo } from './repos';
import LRU from 'lru-cache';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';

// Cache of seen (clientId, userId) pairs
const seenClientIds = new LRU<string, boolean>({ max: 10_000, maxAge: 1000 * 60 * 60 });

const hasSeen = ({ clientId, userId }: { clientId: string; userId?: string }) =>
  seenClientIds.get(`${clientId}_${userId}`);

const setHasSeen = ({ clientId, userId }: { clientId: string; userId?: string }) =>
  seenClientIds.set(`${clientId}_${userId}`, true);

const isApplicableUrl = (url: string) =>
  url !== "/robots.txt" && url.indexOf("/api/") < 0;

// Set a 10-year expiry. Chrome won't respect this (it has a max of 400 days
// for cookies) so this is equivalent to asking for the max allowable.
const CLIENT_ID_COOKIE_EXPIRATION_SECONDS = 10 * 365 * 24 * 60 * 60;

/**
 * This is used in three contexts:
 * 1. In the middleware, where we want to conditionally await the promise depending on the route
 * 2. In both cachedPageRender and renderPage, where we want to ensure the clientId is set before prefetching resources (but don't want to block the render)
 */
export async function ensureClientId(req: express.Request, res: express.Response) {
  const existingClientId = getCookieFromReq(req, "clientId")
  const referrer = req.headers?.["referer"] ?? null;
  const url = req.url;

  const clientIdsRepo = new ClientIdsRepo()

  // 1. If there is no client id, and this page won't be cached, create a clientId and add it to the response
  let newClientId: string | null = null
  if (!existingClientId && !responseIsCacheable(res)) {
    newClientId = randomId();
    setCookieOnResponse({
      req, res,
      cookieName: "clientId",
      cookieValue: newClientId,
      maxAge: CLIENT_ID_COOKIE_EXPIRATION_SECONDS
    });
  }

  // 2. If there is a client id, ensure (asynchronously) that it is stored in the DB
  const clientId = existingClientId ?? newClientId;
  const userId = getUserFromReq(req)?._id;

  const shouldEnsureClientId = clientId && isApplicableUrl(req.url) && !isNotRandomId(clientId) && !hasSeen({ clientId, userId });
  if (!shouldEnsureClientId) {
    return () => Promise.resolve();
  }

  try {
    const { invalidated } = await clientIdsRepo.ensureClientId({
      clientId,
      userId,
      referrer,
      landingPage: url,
    });

    if (invalidated) {
      const refreshedClientId = randomId();

      await clientIdsRepo.ensureClientId({
        clientId: refreshedClientId,
        userId,
        referrer,
        landingPage: url,
      });

      // Cookies are returned with the headers
      if (!res.headersSent) {
        setCookieOnResponse({
          req, res,
          cookieName: "clientId",
          cookieValue: refreshedClientId,
          maxAge: CLIENT_ID_COOKIE_EXPIRATION_SECONDS
        });
      }

      setHasSeen({ clientId: refreshedClientId, userId });
    } else {
      setHasSeen({ clientId, userId });
    }
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error(e);
  }
}

/**
 * - Assign a client id if there isn't one currently assigned
 * - Ensure the client id is stored in our DB (it may have been generated externally)
 * - Ensure the clientId and userId are associated
 */

export async function clientIdMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // TODO: don't execute this call in the middleware on requests that might trigger renders?
  if (req.url === '/analyticsEvent') {
    await ensureClientId(req, res);
  } else {
    void ensureClientId(req, res);
  }

  next();
}
