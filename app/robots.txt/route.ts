import { isProduction } from "@/lib/executionEnvironment";
import { robotsTxtSetting } from "@/server/databaseSettings";
import type { NextRequest } from "next/server";

// ea-forum-look-here
// We only want robots.txt to make the site crawlable if it's one of our site's primary domains,
// rather than a test/debug server like baserates.org.  We have this domain whitelist, but when
// forwarding through cloudfront, the domain in nextUrl.host will be the forwarding destination
// (i.e. *.vercel.app) rather than the origin.  So we check x-forwarded-host/host headers first
// (which contain the actual domain), and only fall back to custom CloudFront headers when the
// host looks like a Vercel-internal domain.
const CRAWLABLE_HOSTS = new Set([
  'www.lesswrong.com',
  'www.alignmentforum.org',
]);

const CRAWLABLE_HEADERS = [
  'X-Is-LessWrongCom',
  'X-Is-AlignmentForumOrg',
];

const documentationComment = (hostname: string) =>
  `# This site has a Markdown version that is more friendly to AI agents than the HTML version. Documentation at: ${hostname}/api/SKILL.md`;

const nonCrawlableMirrorComment = `# This site is a secondary mirror that should not be crawled.`;

function getActualHost(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  if (forwardedHost) return forwardedHost.split(':')[0].trim();

  const host = req.headers.get('host');
  if (host) return host.split(':')[0].trim();

  return req.nextUrl.host;
}

function isCrawlable(req: NextRequest) {
  const host = getActualHost(req);

  // If we can determine the actual domain, check it against the whitelist
  if (CRAWLABLE_HOSTS.has(host)) return true;

  // If the host is a real domain (not a Vercel-internal host), and it's not
  // in the crawlable list, it's a non-canonical mirror
  if (!host.endsWith('.vercel.app') && host !== 'localhost') return false;

  // Fallback for Vercel-internal hosts: check CloudFront forwarding headers
  return CRAWLABLE_HOSTS.has(req.nextUrl.host) || CRAWLABLE_HEADERS.some(header => req.headers.get(header));
}

export async function GET(req: NextRequest) {
  const hostname = getActualHost(req);

  if (isProduction && !isCrawlable(req)) {
    return new Response(`${documentationComment(hostname)}\n${nonCrawlableMirrorComment}\n\nUser-agent: *\nDisallow: /`, {status: 200});
  } else if (robotsTxtSetting.get()) {
    return new Response(robotsTxtSetting.get(), {status: 200});
  }

  return new Response(
    `${documentationComment(hostname)}

    User-agent: *
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
Disallow: /moderation
Crawl-Delay: 3

User-Agent: SemrushBot
Disallow: /
`, {status: 200});
}
