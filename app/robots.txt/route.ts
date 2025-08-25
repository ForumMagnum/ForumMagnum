import { disallowCrawlersSetting } from "@/lib/instanceSettings";
import { robotsTxtSetting } from "@/server/databaseSettings";
import { NextResponse } from "next/server";

export async function GET() {
  if (disallowCrawlersSetting.get()) {
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
