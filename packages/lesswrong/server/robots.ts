import { addStaticRoute } from './vulcan-lib/staticRoutes';
import { robotsTxtSetting } from './databaseSettings';
import { disallowCrawlersSetting } from '../lib/instanceSettings';

addStaticRoute('/robots.txt', ({query}, req, res, next) => {
  if (disallowCrawlersSetting.get()) {
    res.end("User-agent: *\nDisallow: /");
  } else if (robotsTxtSetting.get()) {
    res.end(robotsTxtSetting.get());
  } else {
    // We block all request with query parameters to the allPosts page, since that results in a ton of Google requests
    // that don't really want to index or handle
    res.end(
`User-agent: *
Disallow: /allPosts?*
Disallow: /allPosts
Disallow: /allposts
Disallow: /allposts?*
Disallow: /graphiql
Disallow: /debug
Disallow: /admin
Disallow: /compare
Disallow: /emailToken
Disallow: /*?commentId=*
Disallow: /users/*/replies
Crawl-Delay: 3

User-Agent: SemrushBot
Disallow: /
`);
  }
});
