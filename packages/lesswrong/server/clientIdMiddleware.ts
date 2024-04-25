import { randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import { createMutator } from './vulcan-lib/mutators';
import { ClientIds } from '../lib/collections/clientIds/collection';
import type { AddMiddlewareType } from './apolloServer';

const isApplicableUrl = (url: string) =>
  url !== "/robots.txt" && url.indexOf("/api/") < 0;

// TODO:
// - [ ] Make sure this doesn't add set-cookie to requests that might be cached
// - [ ] Make sure those users do still get a clientId cookie
//   - [ ] Check if the cookies are forwarded when the refresh request is sent to CloudFront
//   - [ ] If so, generate one there and make sure it is applied to the viewer request, so we can still track all page loads
//   - [ ] As a fallback, create one on the client. Make sure this is stored in the db the first time it is seen on the server
//         (this ensures that even if the CDN isn't set up properly we do get a clientId after the first request)
//   - [ ] Add a setting to enable the caching thing, so other instances can still set cookies if they want (or ideally infer it from the request)

// Middleware for assigning a client ID, if one is not currently assigned.
export const addClientIdMiddleware = (addMiddleware: AddMiddlewareType) => {
  addMiddleware(function addClientId(req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) {
    if (!getCookieFromReq(req, "clientId")) {
      const newClientId = randomId();
      setCookieOnResponse({
        req, res,
        cookieName: "clientId",
        cookieValue: newClientId,
        maxAge: 315360000
      });
      
      try {
        if (isApplicableUrl(req.url)) {
          const referrer = req.headers?.["referer"] ?? null;
          const url = req.url;
          
          void ClientIds.rawInsert({
            clientId: newClientId,
            firstSeenReferrer: referrer,
            firstSeenLandingPage: url,
            userIds: undefined,
          });
        }
      } catch(e) {
        //eslint-disable-next-line no-console
        console.error(e);
      }
    }
    
    next();
  });
}
