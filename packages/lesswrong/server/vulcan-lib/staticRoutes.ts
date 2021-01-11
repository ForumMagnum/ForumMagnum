import type { NextFunction } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { Picker } from '../vendor/picker';

/// Add a route which renders by putting things into the http response body
/// directly, rather than using all the Meteor/Apollo/etc stuff.
export const addStaticRoute = (url: string, handler: (props: any, req: IncomingMessage, res: ServerResponse, next: NextFunction)=>void|Promise<void>) => {
  Picker.route(url, handler);
}
