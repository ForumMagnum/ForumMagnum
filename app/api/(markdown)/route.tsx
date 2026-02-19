import { NextRequest } from "next/server";
import { markdownApiDocumentationMarkdown } from "./SKILL.md/route";

export function GET(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
