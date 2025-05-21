import type {AddMiddlewareType} from './apolloServer.ts'
import express from 'express'
import { getRouteMatchingPathname, userCanAccessRoute } from "../lib/vulcan-lib/routes";
import { makeAbsolute } from "../lib/vulcan-lib/utils";

export const addAdminRoutesMiddleware = (addConnectHandler: AddMiddlewareType) => {
  addConnectHandler(checkAdminRouteAccess)
}

const checkAdminRouteAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!userCanAccessRoute(req.user, getRouteMatchingPathname(req.path))) {
    res.redirect(makeAbsolute('/404'))
  } else {
    next()
  }
}

