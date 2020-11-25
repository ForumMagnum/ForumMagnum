import { Picker } from 'meteor/meteorhacks:picker'
import cookieParser from 'cookie-parser'
import type { NextFunction } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';

if (Picker) Picker.middleware(cookieParser())
/// Add a route which renders by putting things into the http response body
/// directly, rather than using all the Meteor/Apollo/etc stuff.
export const addStaticRoute = (url: string, handler: (props: any, req: IncomingMessage, res: ServerResponse, next: NextFunction)=>void) => {
  Picker.route(url, handler);
}
