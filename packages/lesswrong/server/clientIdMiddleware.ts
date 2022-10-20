import { randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';
import { createMutator } from './vulcan-lib/mutators';
import { ClientIds } from '../lib/collections/clientIds/collection';

// Middleware for assigning a client ID, if one is not currently assigned.
export const addClientIdMiddleware = (addMiddleware) => {
  addMiddleware(function addClientId(req, res, next) {
    if (!getCookieFromReq(req, "clientId")) {
      const newClientId = randomId();
      setCookieOnResponse({
        req, res,
        cookieName: "clientId",
        cookieValue: newClientId,
        maxAge: 315360000
      });
      
      try {
        if (req.url !== '/robots.txt') {
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
