import { NextRequest } from "next/server";

export const markdownApiDocumentationMarkdown = (hostname: string) => `
LessWrong: A site dedicated to improving the art of rationality
===============================================================

Most pages on LessWrong have an HTML version and a Markdown version. Routes
starting with /api/ are either Markdown or JSON. For routes not starting with
/api, you can control which version you get with the Accept header or with a
query parameter ?format=markdown, eg:

    curl -H "Accept: text/markdown" https://${hostname}/
    curl https://${hostname}/?format=markdown

The Markdown versions of pages are designed to be more AI-agent-friendly than
the HTML versions. If your "Accept" header is "text/markdown", you will only
get Markdown pages (pages that don't have a markdown version will return a 406
status code with a message.) If your "Accept" header is "*/*",

Finding content to read:
 * /api/front
 * /api/home
 * /api/latest
 * /api/recent
 * /api/curated
 * /api/search (docs when no query, results with ?search=...)
 * Add ?limit=n to list routes (max 100)
Reading posts:
 * /api/post/[id]
 * /api/rationality/[slug]
 * /api/codex/[slug]
 * /api/hpmor/[slug]
 * /api/about
 * /api/faq
 * /api/contact
 * Add ?compact=1 on post route to omit some heavy media/math/table content
Post comments:
 * /api/post/[id]/comments
 * /api/post/[id]/comments/[commentId]
 * comments route supports ?sort=top|new|old, ?limit=n, ?includeReactionUsers=1
Reading tags:
 * /api/tag/[slug]
Reading users:
 * /api/user/[slug]
Reading sequences:
 * /api/sequence/[id]
 * /api/sequence/[id]/post/[postId]
Reading collections:
 * /api/rationality
 * /api/codex
 * /api/hpmor
`;

export function GET(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
