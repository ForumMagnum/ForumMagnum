import type {AddMiddlewareType} from './apolloServer.ts'
import express from 'express'
import {getRouteMatchingPathname} from '../lib/vulcan-lib'

export const addAdminRoutesMiddleware = (addConnectHandler: AddMiddlewareType) => {
  addConnectHandler(checkAdminRouteAccess)
}

const checkAdminRouteAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (nonAdminTryingAccessAdminRoute(req)) {
    res.redirect('/404')
  } else {
    next()
  }
}

const nonAdminTryingAccessAdminRoute = (req: express.Request) => {
  const route = getRouteMatchingPathname(req.path)
  if (!route) return false

  return route.isAdmin && !req.user?.isAdmin
}

