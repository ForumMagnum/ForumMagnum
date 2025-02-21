import { isNotRandomId, randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import type { AddMiddlewareType } from './apolloServer';
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
 * - Assign a client id if there isn't one currently assigned
 * - Ensure the client id is stored in our DB (it may have been generated externally)
 * - Ensure the clientId and userId are associated
 */
export const addClientIdMiddleware = (addMiddleware: AddMiddlewareType) => {
  addMiddleware(async function addClientId(req: express.Request, res: express.Response, next: express.NextFunction) {

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
    if (clientId && isApplicableUrl(req.url) && !isNotRandomId(clientId) && !hasSeen({ clientId, userId })) {
      try {
        // This is a wrapped promise because we don't want to hold up the rest of the request with the round trip
        // However, if we get a request with a clientId that we've invalidated (i.e. because we had an oopsie and wrote too many userIds to it),
        // we want to return a new clientId to the requester.
        // We do this in a blocking way when the request is for /analyticsEvent, since clients don't care about response times on that route.
        const ensureClientIdPromise = (async () => {
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
        });

        if (url === '/analyticsEvent') {
          await ensureClientIdPromise();
        } else {
          void ensureClientIdPromise();
        }
      } catch(e) {
        //eslint-disable-next-line no-console
        console.error(e);
      }
    }

    next();
  });
}
