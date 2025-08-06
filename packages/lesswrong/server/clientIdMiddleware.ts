import { isNotRandomId, randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import express from 'express';
import { responseIsCacheable } from './cacheControlMiddleware';
import ClientIdsRepo from './repos/ClientIdsRepo';
import LRU from 'lru-cache';
import { getUserFromReq } from './vulcan-lib/apollo-server/getUserFromReq';
import type { NextRequest } from 'next/server';
import { backgroundTask } from './utils/backgroundTask';

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
 * Fields on the request filled in by prepareClientId
 */
declare module "express" {
  interface Request {
    clientId?: string
    shouldSendClientId?: boolean
    clientIdHeaderSet?: boolean
  }
}

declare module "next/server" {
  interface NextRequest {
    clientId?: string
    shouldSendClientId?: boolean
    clientIdHeaderSet?: boolean
  }
}

/**
 * Handling of client IDs is split into two parts. The first, prepareClientId,
 * is run in parallel with fetching the user and is called from
 * cookieAuthStrategy. (This is a pretty awkward place to call it from, but it
 * has to be from there to be well parallelized.) This includes looking up the
 * clientId and determining whether it's been invalidated (which would mean we
 * want to send a header assigning a new clientId). The results of these
 * queries are added to the request. In this context, we have
 * access to the request, but not to the user object (which is being fetched in
 * parallel) or to the response (which passport didn't give us).
 *
 * The second part, ensureClientId, uses information added to the request to
 * add cookie headers. This function is non-async (writes to the DB but
 * shouldn't wait for the result) and needs to run before headers are sent.
 */
export async function prepareClientId(req: express.Request | NextRequest): Promise<void> {
  const existingClientId = getCookieFromReq(req, "clientId")

  if (!isApplicableUrl(req.url) || (existingClientId && isNotRandomId(existingClientId))) {
    return;
  }

  // If there isn't already a client ID, or if there is a client ID but it's invalidated, assign one.
  if (existingClientId) {
    const clientIdsRepo = new ClientIdsRepo()
    const invalidated = await clientIdsRepo.isClientIdInvalidated(existingClientId);
    if (invalidated) {
      req.clientId = randomId();
      req.shouldSendClientId = true;
    } else {
      req.clientId = existingClientId;
    }
  } else {
    req.clientId = randomId();
    req.shouldSendClientId = true;
  }
}

export function ensureClientId(req: express.Request | NextRequest, res: express.Response): void {
  if (req.clientId) {
    if (req.shouldSendClientId && !req.clientIdHeaderSet && !responseIsCacheable(res)) {
      try {
        req.clientIdHeaderSet = true;
        const userId = getUserFromReq(req)?._id;
        const referrer = req.headers?.["referer"] ?? null;
        const url = req.url;
        const clientIdsRepo = new ClientIdsRepo()


        setCookieOnResponse({
          req, res,
          cookieName: "clientId",
          cookieValue: req.clientId,
          maxAge: CLIENT_ID_COOKIE_EXPIRATION_SECONDS
        });
        
        if (!hasSeen({ clientId: req.clientId, userId })) {
          backgroundTask(clientIdsRepo.ensureClientId({
            clientId: req.clientId,
            userId,
            referrer,
            landingPage: url,
          }));
        }
        setHasSeen({ clientId: req.clientId, userId: getUserFromReq(req)?._id });
      } catch (e) {
        //eslint-disable-next-line no-console
        console.error(e);
      }
    } else {
      setHasSeen({ clientId: req.clientId, userId: getUserFromReq(req)?._id});
    }
  }
}

