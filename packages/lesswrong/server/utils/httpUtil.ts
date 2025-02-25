import { isProduction } from '@/lib/executionEnvironment';
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import Cookies from 'universal-cookie';

// Utility functions for dealing with HTTP requests/responses, eg getting and
// setting cookies, headers, getting the URL, etc. The main purpose for these
// functions is to paper over some awkward differencess between Meteor and
// Express; after we've gotten rid of Meteor, these functions will be trivial
// and unnecessary wrappers.

/** 
 * Given an HTTP request, get a cookie. Exists mainly to cover up a difference
 * between the Meteor and Express server middleware setups.
 * 
 * Default to the value pulled from `universalCookies` if there is one, but if not try `cookies` as well
 *  
 * We need to do this because {@link setCookieOnResponse} can only assign to `cookies`, not `universalCookies`, so sometimes `universalCookies` will exist but won't have the (newly assigned) cookie value.
 */
export function getCookieFromReq(req: Request | IncomingMessage, cookieName: string) {
  const untypedReq: any = req;
  if (!untypedReq.universalCookies && !untypedReq.cookies)
    throw new Error("Tried to get a cookie but middleware not correctly configured");

  return untypedReq.universalCookies?.get(cookieName) ?? untypedReq.cookies?.[cookieName];
}

// Given an HTTP request, clear a named cookie. Handles the difference between
// the Meteor and Express server middleware setups. Works by setting an
// expiration date in the past, which apparently is the recommended way to
// remove cookies.
export function clearCookie(req: Request & { universalCookies?: any }, res: Response<any, Record<string, any>> | undefined, cookieName: string) {
  if ((req.cookies && req.cookies[cookieName])
    || (req.universalCookies && req.universalCookies.get(cookieName)))
  {
    res?.setHeader("Set-Cookie", `${cookieName}= ; expires=${new Date(0).toUTCString()};`)   
  }
}

// Differs between Meteor-wrapped Express and regular Express, for some reason.
// (In Express it's a string; in Meteor it's parsed.)
export function getPathFromReq(req: Request): string {
  const untypedReq: any = req;
  if (untypedReq.url?.path) return untypedReq.url.path;
  else return untypedReq.url;
}

export function setCookieOnResponse({req, res, cookieName, cookieValue, maxAge}: {
  req: Request, res: Response,
  cookieName: string, cookieValue: string,
  maxAge: number
}) {
  // universalCookies should be defined here, but it isn't
  // @see https://github.com/meteor/meteor-feature-requests/issues/174#issuecomment-441047495
  const untypedReq: any = req;
  if (untypedReq.cookies) {
    untypedReq.cookies[cookieName] = cookieValue;
  } else {
    // We need this in the case of e.g. clientId
    // The server-side code depends on the cookie existing on the very first request, before the client can send back the cookie we set via header
    untypedReq.cookies = { [cookieName]: cookieValue };
  }

  (res as any).setHeader("Set-Cookie", `${cookieName}=${cookieValue}; Max-Age=${maxAge}; Path=/`);
}

export function getAllCookiesFromReq(req: Request) {
  const untypedReq: any = req;

  if (untypedReq.universalCookies) {
    /**
     * Because of the current logic in setCookieOnResponse (for the clientIdMiddleware),
     * we will have a clientId in cookies but not in universalCookies.
     * In that case we want to prioritize cookies which exist in universalCookies,
     * but default to whatever cookies exist in cookies for those that don't exist in universalCookies.
     * We should be able to delete this after verifying that universalCookies is always present on inbound requests.
     */
    if (untypedReq.cookies) {
      const returnCookies = new Cookies(untypedReq.cookies).getAll();
      Object.assign(returnCookies, untypedReq.universalCookies.getAll());
      return new Cookies(returnCookies);
    }
    return untypedReq.universalCookies;
  }
  else {
    return new Cookies(untypedReq.cookies); // req.universalCookies;
  }
}

/**
 * Try to set the response status, but log an error if the headers have already been sent.
 */
export const trySetResponseStatus = ({ response, status }: { response: Response, status: number; }) => {
  if (!response.headersSent) {
    response.status(status);
  } else if (response.statusCode !== status) {
    const message = `Tried to set status to ${status} but headers have already been sent with status ${response.statusCode}. This may be due to enableResourcePrefetch wrongly being set to true.`;
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error(message);
    } else {
      throw new Error(message);
    }
  }

  return response;
}
