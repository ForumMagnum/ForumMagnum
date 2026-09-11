import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { markdownApiDocumentationMarkdown } from "app/api/(markdown)/SKILL.md/route";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const hostname = getSiteUrlFromReq(req);
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
