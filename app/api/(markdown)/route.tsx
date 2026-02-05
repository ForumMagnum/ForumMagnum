import { NextRequest } from "next/server";
import { markdownApiDocumentationMarkdown } from "./SKILL.md/route";

export function GET(req: NextRequest) {
  return new Response(markdownApiDocumentationMarkdown);
}
