import { markdownApiDocumentationMarkdown } from "app/api/(markdown)/SKILL.md/route";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
