import type { Request, Response, NextFunction } from 'express';
import { botSiteUrlSetting, botSiteUserAgentRegexesSetting, botSiteRedirectEnabledSetting } from '@/lib/instanceSettings';
import { combineUrls } from '../lib/vulcan-lib/utils';

const getBaseUrl = () => {
  const botSiteBaseUrl = botSiteUrlSetting.get();
  if (botSiteBaseUrl && !botSiteBaseUrl.startsWith('http://') && !botSiteBaseUrl.startsWith('https://')) {
    // eslint-disable-next-line no-console
    console.error("Invalid botSiteBaseUrl configuration: URL must start with http:// or https://");
    return null;
  }
  return botSiteBaseUrl;
}

/**
 * Middleware function to redirect bot requests to a separate bot site.
 *
 * This function inspects the user agent and path of incoming requests. If the user agent matches
 * a certain pattern and the bot site redirect setting is enabled, it redirects the request to
 * the bot site. The redirect is a 307 (temporary) redirect to try and prevent search engines and
 * browser caches from permanently saving the bot site if we mess this up
 */
export const botRedirectMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers["user-agent"];
  const botSiteBaseUrl = getBaseUrl();
  const userAgentRegexes = botSiteUserAgentRegexesSetting.get();

  if (!botSiteRedirectEnabledSetting.get() || !botSiteBaseUrl || !userAgent || !userAgentRegexes) {
    return next();
  }

  // Check each path and associated user agent regexes
  for (let path in userAgentRegexes) {
    const pathRegex = new RegExp(path);

    // If request URL matches path and user agent matches any regex, redirect to bot site
    if (pathRegex.test(req.url)) {
      const regexes = userAgentRegexes[path];
      if (regexes.some(regex => new RegExp(regex).test(userAgent))) {
        const botSiteUrl = combineUrls(botSiteBaseUrl, req.url);
        return res.redirect(307, botSiteUrl);
      }
    }
  }

  next();
}
