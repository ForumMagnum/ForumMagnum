// Picker
// Adapted from https://github.com/meteorhacks/picker
//
// (The MIT License)
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
import type { NextFunction, ParamsDictionary, Query, Response } from 'express-serve-static-core';
import type { RequestHandler } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
const urlParse = URL.parse;

type Req = Parameters<RequestHandler>[0];
type Res = Response<any, Record<string, any>, number>;
type FilterFunction = (req: Req, res: Res) => any;
type RouteCallback = (props: any, req: IncomingMessage, res: ServerResponse, next: NextFunction) => void | Promise<void>;

class PickerImp {
  filterFunction: FilterFunction | null
  routes: (pathToRegexp.PathRegExp & { callback: any })[]
  subRouters: PickerImp[]
  middlewares: any
  
  constructor(filterFunction: FilterFunction | null) {
    this.filterFunction = filterFunction;
    this.routes = [];
    this.subRouters = [];
    this.middlewares = [];
  }

  middleware = (callback: any) => {
    this.middlewares.push(callback);
  };

  route = (path: pathToRegexp.Path, callback: RouteCallback) => {
    var regExp = pathToRegexp(path);
    const regExpWithCallback = Object.assign(regExp, { callback });
    this.routes.push(regExpWithCallback);
    return this;
  };
  
  filter = (callback: FilterFunction) => {
    var subRouter = new PickerImp(callback);
    this.subRouters.push(subRouter);
    return subRouter;
  };
  
  _dispatch = (req: Req, res: Res, bypass: NextFunction) => {
    var self = this;
    var currentRoute = 0;
    var currentSubRouter = 0;
    var currentMiddleware = 0;
  
    if(this.filterFunction) {
      var result = this.filterFunction(req, res);
      if(!result) {
        return bypass();
      }
    }
  
    processNextMiddleware();
    function processNextMiddleware () {
      var middleware = self.middlewares[currentMiddleware++];
      if(middleware) {
        self._processMiddleware(middleware, req, res, processNextMiddleware);
      } else {
        processNextRoute();
      }
    }
  
    function processNextRoute () {
      var route = self.routes[currentRoute++];
      if(route) {
        var uri = req.url.replace(/\?.*/, '');
        var m = uri.match(route);
        if(m) {
          var params = self._buildParams(route.keys, m);
          params.query = urlParse(req.url, true).query;
          self._processRoute(route.callback, params, req, res, bypass);
        } else {
          processNextRoute();
        }
      } else {
        processNextSubRouter();
      } 
    }
  
    function processNextSubRouter () {
      var subRouter = self.subRouters[currentSubRouter++];
      if(subRouter) {
        subRouter._dispatch(req, res, processNextSubRouter);
      } else {
        bypass();
      }
    }
  };
  
  _buildParams = (keys: pathToRegexp.Key[], m: RegExpMatchArray) => {
    var params: any = {};
    for(var lc=1; lc<m.length; lc++) {
      var key = keys[lc-1].name;
      var value = m[lc];
      params[key] = value;
    }
  
    return params;
  };
  
  _processRoute = (callback: RouteCallback, params: any, req: IncomingMessage, res: Res, next: NextFunction) => {
    doCall();
  
    function doCall () {
      void callback.call(null, params, req, res, next); 
    }
  };
  
  _processMiddleware = (middleware: any, req: Req, res: Res, next: () => void) => {
    doCall();
  
    function doCall() {
      middleware.call(null, req, res, next);
    }
  };
}

export const Picker = new PickerImp(null);
export const pickerMiddleware: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>> = function(req, res, next) {
  Picker._dispatch(req, res, next);
}
