import type { Request, Response } from 'express';
import { DatabasePublicSetting } from '../lib/publicSettings';
import { combineUrls } from './vulcan-lib';

const botSitUrlSetting = new DatabasePublicSetting<string|null>('botSiteUrl', null);

export const botRedirectMiddleware = (req: Request, res: Response, next: AnyBecauseTodo) => {
  // TODO; inspect for user agent
  // const blockedFromEverythingBots
  // const blockedFromGraphqlAndAllPostsBots
  // Redirect bots to the bot site
  // TODO; add protocol if not already present
  const botSiteBaseUrl = botSitUrlSetting.get();
  if (!botSiteBaseUrl) {
    return next();
  }
  const botSiteUrl = combineUrls(botSiteBaseUrl, req.originalUrl);
  res.redirect(307, botSiteUrl);
}
