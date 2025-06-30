import { addStaticRoute } from './vulcan-lib/staticRoutes';
import { DatabaseServerSetting } from './databaseSettings';
import { PublicInstanceSetting } from '../lib/instanceSettings';

// disallowCrawlers: If set, robots.txt will request that no crawlers touch the
// site at all. Use for test and staging servers like lessestwrong.com and
// baserates.org, so that only the real site will be indexed by search engines.
//
// If set, this takes precedence over the robotsTxt setting.
const disallowCrawlersSetting = new PublicInstanceSetting<boolean>('disallowCrawlers', false, "optional")


// robotsTxt: Optional setting to entirely replace the contents of robots.txt,
// to allow quickly banning a bad crawler or a slow endpoint without a redeploy,
// if quick response is needed. If null (the default), robots.txt is generated
// from other settings and the function below instead.
//
// (If you use this setting, remember to convert the robots.txt update into a
// PR to this file, and then set the setting back to null when it's merged,
// since the setting will override any future robots.txt updates.)
const robotsTxtSetting = new DatabaseServerSetting<string|null>('robotsTxt', null)

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
Disallow: /out?*
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
