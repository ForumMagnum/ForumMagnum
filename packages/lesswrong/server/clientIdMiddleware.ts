import { isNotRandomId, randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import type { AddMiddlewareType } from './apolloServer';
import express from 'express';
import { responseIsCacheable } from './cacheControlMiddleware';
import { ClientIdsRepo } from './repos';
import LRU from 'lru-cache';
import { getUserFromReq } from './vulcan-lib';

// Cache of seen (clientId, userId) pairs
const seenClientIds = new LRU<string, boolean>({ max: 10_000, maxAge: 1000 * 60 * 60 });

const hasSeen = ({ clientId, userId }: { clientId: string; userId?: string }) =>
  seenClientIds.get(`${clientId}_${userId}`);

const setHasSeen = ({ clientId, userId }: { clientId: string; userId?: string }) =>
  seenClientIds.set(`${clientId}_${userId}`, true);

const isApplicableUrl = (url: string) =>
  url !== "/robots.txt" && url.indexOf("/api/") < 0;

/**
 * - Assign a client id if there isn't one currently assigned
 * - Ensure the client id is stored in our DB (it may have been generated externally)
 * - Ensure the clientId and userId are associated
 */
export const addClientIdMiddleware = (addMiddleware: AddMiddlewareType) => {
  addMiddleware(function addClientId(req: express.Request, res: express.Response, next: express.NextFunction) {
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
        maxAge: 315360000
      });
    }

    // 2. If there is a client id, ensure (asynchronously) that it is stored in the DB
    const clientId = existingClientId ?? newClientId;
    const userId = getUserFromReq(req)?._id;
    if (clientId && isApplicableUrl(req.url) && !isNotRandomId(clientId) && !hasSeen({clientId, userId})) {
      try {
        void clientIdsRepo.ensureClientId({
          clientId,
          userId,
          referrer,
          landingPage: url,
        });
        setHasSeen({clientId, userId})
      } catch(e) {
        //eslint-disable-next-line no-console
        console.error(e);
      }
    }

    next();
  });
}
