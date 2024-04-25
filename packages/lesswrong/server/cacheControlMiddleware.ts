import { randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import { createMutator } from './vulcan-lib/mutators';
import { ClientIds } from '../lib/collections/clientIds/collection';
import type { AddMiddlewareType } from './apolloServer';
import { parsePath, parseRoute } from '../lib/vulcan-core/appContext';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';

/**
 * Cache-control header indicating the response is private (user-specific) and should never be stored by a shared cache.
 * Note that for use with CloudFront, the max-age=0 is necessary to ensure the response is not cache (regardless of the
 * behaviour that is set up). This is a footgun imo.
 */
const privateCacheHeader = "private, no-cache, no-store, must-revalidate, max-age=0"
export const swrCacheHeader = "max-age=1, s-max-age=1, stale-while-revalidate=86400"

// TODO:
// - [ ] Make sure this doesn't add set-cookie to requests that might be cached
// - [ ] Make sure those users do still get a clientId cookie
//   - [ ] Check if the cookies are forwarded when the refresh request is sent to CloudFront
//   - [ ] If so, generate one there and make sure it is applied to the viewer request, so we can still track all page loads
//   - [ ] As a fallback, create one on the client. Make sure this is stored in the db the first time it is seen on the server
//         (this ensures that even if the CDN isn't set up properly we do get a clientId after the first request)
//   - [ ] Add a setting to enable the caching thing, so other instances can still set cookies if they want (or ideally infer it from the request)


export const addCacheControlMiddleware = (addMiddleware: AddMiddlewareType) => {
  addMiddleware(function addClientId(req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) {
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
