import type { Request, Response } from 'express';
import Cookies from 'universal-cookie';

// Utility functions for dealing with HTTP requests/responses, eg getting and
// setting cookies, headers, getting the URL, etc. The main purpose for these
// functions is to paper over some awkward differencess between Meteor and
// Express; after we've gotten rid of Meteor, these functions will be trivial
// and unnecessary wrappers.

// Given an HTTP request, get a cookie. Exists mainly to cover up a difference
// between the Meteor and Webpack server middleware setups.
export function getCookieFromReq(req: Request, cookieName: string) {
  const untypedReq: any = req;
  if (untypedReq.universalCookies)
    return untypedReq.universalCookies.get(cookieName);
  else if (untypedReq.cookies)
    return untypedReq.cookies[cookieName];
  else
    throw new Error("Tried to get a cookie but middleware not correctly configured");
}

// Given an HTTP request, clear a named cookie. Handles the difference between
// the Meteor and Webpack server middleware setups. Works by setting an
// expiration date in the past, which apparently is the recommended way to
// remove cookies.
export function clearCookie(req, res, cookieName) {
  if ((req.cookies && req.cookies[cookieName])
    || (req.universalCookies && req.universalCookies.get(cookieName)))
  {
    res.setHeader("Set-Cookie", `${cookieName}= ; expires=${new Date(0).toUTCString()};`)   
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
  }
  (res as any).setHeader("Set-Cookie", `${cookieName}=${cookieValue}; Max-Age=${maxAge}`);
}

export function getAllCookiesFromReq(req: Request) {
  const untypedReq: any = req;
  if (untypedReq.universalCookies)
    return untypedReq.universalCookies
  else
    return new Cookies(untypedReq.cookies); // req.universalCookies;
  
}
