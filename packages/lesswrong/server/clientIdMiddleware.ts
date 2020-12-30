import { randomId } from '../lib/random';
import { getCookieFromReq, setCookieOnResponse } from './utils/httpUtil';

// Middleware for assigning a client ID, if one is not currently assigned.
// Since Meteor doesn't have an API for setting cookies, this calls setHeader
// on the HTTP response directly; if other middlewares also want to set
// cookies, they won't necessarily play nicely together.
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
    }
    
    next();
  });
}
