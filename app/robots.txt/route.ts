import { robotsTxtSetting } from "@/server/databaseSettings";
import type { NextRequest } from "next/server";

// ea-forum-look-here
const ALLOWED_HOSTS = new Set([
  'www.lesswrong.com',
  'www.alignmentforum.org',
]);

export async function GET(req: NextRequest) {
  if (!ALLOWED_HOSTS.has(req.nextUrl.host)) {
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
`, {status: 200});
}
