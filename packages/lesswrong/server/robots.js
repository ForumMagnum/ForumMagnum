import { getSetting, addStaticRoute } from './vulcan-lib';

// Vary robots.txt based on a setting, because we want development servers
// (lessestwrong.com, baserates.org) to not be indexed by search engines.
addStaticRoute('/robots.txt', ({query}, req, res, next) => {
  if (getSetting('disallowCrawlers', false)) {
    res.end("User-agent: *\nDisallow: /");
  } else {
    // We block all request with query parameters to the allPosts page, since that results in a ton of Google requests
    // that don't really want to index or handle
    res.end("User-agent: *\nDisallow: /allPosts?*");
  }
});
