import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";
import { combineUrls } from "../../lib/vulcan-lib";
import { json } from "body-parser";
import type { Application, Request, Response } from "express";
import {
  onCrosspostTokenRequest,
  onConnectCrossposterRequest,
  onUnlinkCrossposterRequest,
  onCrosspostRequest,
  onUpdateCrosspostRequest,
} from "./requestHandlers";

export const makeApiUrl = (route: ApiRoute) => combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", route);

export const apiRoutes = {
  crosspostToken: "/api/crosspostToken",
  connectCrossposter: "/api/connectCrossposter",
  unlinkCrossposter: "/api/unlinkCrossposter",
  crosspost: "/api/crosspost",
  updateCrosspost: "/api/updateCrosspost",
} as const;

export type ApiRoute = typeof apiRoutes[keyof typeof apiRoutes];

export const addCrosspostRoutes = (app: Application) => {
  const addPostRoute = (route: string, callback: (req: Request, res: Response) => Promise<void>) => {
    app.use(route, json({ limit: "1mb" }));
    app.post(route, callback);
  }
  app.get(apiRoutes.crosspostToken, onCrosspostTokenRequest);
  addPostRoute(apiRoutes.connectCrossposter, onConnectCrossposterRequest);
  addPostRoute(apiRoutes.unlinkCrossposter, onUnlinkCrossposterRequest);
  addPostRoute(apiRoutes.crosspost, onCrosspostRequest);
  addPostRoute(apiRoutes.updateCrosspost, onUpdateCrosspostRequest);
}
