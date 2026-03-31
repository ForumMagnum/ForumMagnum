import { markdownApiDocumentationMarkdown } from "app/api/(markdown)/SKILL.md/route";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);
  const hostname = new URL(siteUrl).hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
