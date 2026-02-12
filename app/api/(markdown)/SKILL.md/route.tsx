import { NextRequest } from "next/server";

export const markdownApiDocumentationMarkdown = `
LessWrong: A site dedicated to improving the art of rationality
===============================================================

Most pages on LessWrong have an HTML version and a Markdown version. Routes
starting with /api/ are either Markdown or JSON. For routes not starting with
/api, you can control which version you get with the Accept header, eg

    curl -H "Accept: text/markdown" https://lesswrong.com/

The Markdown versions of pages are designed to be more AI-agent-friendly than
the HTML versions.

Finding content to read:
 * /api/front
 * /api/home
 * /api/latest
 * /api/recent
 * /api/curated
 * Add ?limit=n to list routes (max 100)
Reading posts:
 * /api/post/[id]
 * Add ?compact=1 on post route to omit some heavy media/math/table content
Post comments:
 * /api/post/[id]/comments
 * /api/post/[id]/comments/[commentId]
 * comments route supports ?sort=top|new|old, ?limit=n, ?includeReactionUsers=1
Reading tags:
 * /api/tag/[slug]
`;

export function GET(req: NextRequest) {
  return new Response(markdownApiDocumentationMarkdown);
}
