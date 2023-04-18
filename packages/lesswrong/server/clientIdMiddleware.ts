import { randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import { createMutator } from './vulcan-lib/mutators';
import { ClientIds } from '../lib/collections/clientIds/collection';

const isApplicableUrl = (url: string) =>
  url !== "/robots.txt" && url.indexOf("/api/") < 0;

// Middleware for assigning a client ID, if one is not currently assigned.
export const addClientIdMiddleware = (addMiddleware: AnyBecauseTodo) => {
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
          
          void createMutator({
            collection: ClientIds,
            document: {
              clientId: newClientId,
              firstSeenReferrer: referrer,
              firstSeenLandingPage: url,
              userIds: undefined,
            },
            validate: false,
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
