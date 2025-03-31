// Adapted from https://github.com/meteorhacks/picker
//
// Which is under the MIT License:
//
// Copyright (c) 2014 MeteorHacks PVT Ltd. hello@meteorhacks.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import pathToRegexp from 'path-to-regexp';
import URL from 'url';
import type { Request, NextFunction, ParamsDictionary, Query, Response } from 'express-serve-static-core';
import type { RequestHandler } from 'express';
const urlParse = URL.parse;

type Req = Parameters<RequestHandler>[0];
type Res = Response<any, Record<string, any>, number>;
type RouteCallback = (props: any, req: Request, res: Response, next: NextFunction) => void | Promise<void>;

let routes: (pathToRegexp.PathRegExp & { callback: any })[] = [];

function dispatch(req: Req, res: Res, next: NextFunction) {
  for (const route of routes) {
    var uri = req.url.replace(/\?.*/, '');
    var m = uri.match(route);
    if (!m) continue;

    var params = buildParams(route.keys, m);
    params.query = urlParse(req.url, true).query;

    route.callback.call(null, params, req, res, next);
    return;
  }
  next();
};

function buildParams(keys: pathToRegexp.Key[], m: RegExpMatchArray) {
  var params: any = {};
  for(var lc=1; lc<m.length; lc++) {
    var key = keys[lc-1].name;
    var value = m[lc];
    params[key] = value;
  }

  return params;
};

export const pickerMiddleware: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>> = function(req, res, next) {
  dispatch(req, res, next);
}

/// Add a route which renders by putting things into the http response body
/// directly, rather than using all the Meteor/Apollo/etc stuff.
export function addStaticRoute(path: pathToRegexp.Path, callback: RouteCallback) {
  var regExp = pathToRegexp(path);
  const regExpWithCallback = Object.assign(regExp, { callback });
  routes.push(regExpWithCallback);
};
