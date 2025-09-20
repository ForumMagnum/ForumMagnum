import { robotsTxtSetting } from "@/server/databaseSettings";
import type { NextRequest } from "next/server";

// ea-forum-look-here
// We only want robots.txt to make the site crawlable if it's one of our site's primary domains,
// rather than a test/debug server like baserates.org.  We have this domain whitelist, but when
// forwarding through cloudfront, the domain in nextUrl.host will be the forwarding destination
// (i.e. *.vercel.app) rather than the origin.  So, while we're having cloudfront forward traffic,
// we also have it add headers that mark where it was forwarded from.
const CRAWLABLE_HOSTS = new Set([
  'www.lesswrong.com',
  'www.alignmentforum.org',
]);

const CRAWLABLE_HEADERS = [
  'X-Is-LessWrongCom',
  'X-Is-AlignmentForumOrg',
];

function isCrawlable(req: NextRequest) {
  return CRAWLABLE_HOSTS.has(req.nextUrl.host) || CRAWLABLE_HEADERS.some(header => req.headers.get(header));
}

export async function GET(req: NextRequest) {
  if (!isCrawlable(req)) {
    return new Response("User-agent: *\nDisallow: /", {status: 200});
  } else if (robotsTxtSetting.get()) {
    return new Response(robotsTxtSetting.get(), {status: 200});
  }

  return new Response(
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
`, {status: 200});
}
