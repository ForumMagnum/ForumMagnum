import type { NextFunction } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { addPickerRoute, initMeteorhacksPickerMiddleware } from '../../platform/current/server/meteorServerSideFns';

initMeteorhacksPickerMiddleware();

/// Add a route which renders by putting things into the http response body
/// directly, rather than using all the Meteor/Apollo/etc stuff.
export const addStaticRoute = (url: string, handler: (props: any, req: IncomingMessage, res: ServerResponse, next: NextFunction)=>void|Promise<void>) => {
  addPickerRoute(url, handler);
}
