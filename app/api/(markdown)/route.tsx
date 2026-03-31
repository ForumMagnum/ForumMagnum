import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { NextRequest } from "next/server";
import { markdownApiDocumentationMarkdown } from "./SKILL.md/route";

export function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);
  const hostname = new URL(siteUrl).hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
