import type { AddMiddlewareType } from './apolloServer';
import { parsePath, parseRoute } from '../lib/vulcan-core/appContext';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';
import express from 'express';

export const responseIsCacheable = (res: express.Response) => {
  const cacheControlHeader = res.get('Cache-Control')?.toLowerCase() || '';
  const highestMaxAge = Math.max(0, ...[...cacheControlHeader.matchAll(/max-age=(\d+)/g)].map(match => parseInt(match[1], 10)))

  return highestMaxAge > 0;
}

/**
 * Cache-control header indicating the response is private (user-specific) and should never be stored by a shared cache.
 * Note that for use with CloudFront, the max-age=0 is necessary to ensure the response is not cache (regardless of the
 * behaviour that is set up). This is a footgun imo.
 */
const privateCacheHeader = "private, no-cache, no-store, must-revalidate, max-age=0"
const swrCacheHeader = "max-age=1, s-max-age=1, stale-while-revalidate=86400"

export const addCacheControlMiddleware = (addMiddleware: AddMiddlewareType) => {
  addMiddleware((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const parsedRoute = parseRoute({
      location: parsePath(req.url)
    });

    const user = getUserFromReq(req);

    if (parsedRoute.currentRoute?.swrCaching === "logged-out" && !user) {
      res.setHeader("Cache-Control", swrCacheHeader);
    } else if (user) {
      res.setHeader("Cache-Control", privateCacheHeader)
    }

    next();
  });
}
