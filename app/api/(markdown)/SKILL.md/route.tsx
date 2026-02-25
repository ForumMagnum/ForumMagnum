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
 * /api/home
 * /api/latest
 * /api/recent
 * /api/curated
 * /api/search (docs when no query, results with ?search=...)
 * /api/community (?lat=..&lng=.. for nearby in-person events)
 * Add ?limit=n to list routes (max 100)
Reading posts:
 * /api/post/[id]
 * /api/events/[id]
 * /api/events/[id]/[slug]
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

Helping Users With Drafts
=========================
The API can also be used to edit and comment on post drafts, which will appear
in the post editor. This feature is only available for Lexical, which is enabled
for users who have enabled the "Beta features" option in their settings, which
can be found at https://www.lesswrong.com/account?tab=preferences. To give an AI
agent access, the user needs to press the Share button, change the permissions
for "Anyone with the link can" to "Edit", then copy the edit-post URL for you.
The URL will look like this:
    https://www.lesswrong.com/editPost?postId=XYZXYZ&key=XYZXYZ
The key in the URL is called the "link sharing key"; do not share this key with
anyone unless the user is asking you to give that person permission to edit
the post. Once you have the post URL, read the post at:
    GET /api/editPost?postId=[id]&key=[linkSharingKey]

To add add Google Docs-style comments to the draft, make a request to:
    POST /api/agent/commentOnDraft
    with JSON body: { postId, key, agentName?, paragraphId?, quote?, comment }
If a quote is provided, the comment will be attached to matching quoted text. The
quote should be long enough to be unambiguous. If no quote is provided, the
comment will be top-level. Both the quote and your comment should be in markdown.

To replace text inside the draft, make a POST request to:
    POST /api/agent/replaceText
    with JSON body: { postId, key, quote, replacement, mode?: "edit"|"suggest" }
The quote and replacement should be in markdown. If the mode is "edit", the
change will be applied immediately; if the mode is "suggest", the change will be
displayed as a suggestion in the post editor. If the user hasn't said whether to
use edit mode or suggest mode, use suggest mode.

To insert new blocks of test into the draft, make a POST request to:
    POST /api/agent/insertBlock
    with JSON body: { postId, key, location, markdown, mode?: "edit"|"suggest" }
The location should be a markdown string that matches the start of a paragraph
that already exists in the draft. The location can be one of the following:
    "start": insert at the beginning of the post
    "end": insert at the end of the post
    "before": insert before the specified paragraph
    "after": insert after the specified paragraph
    "mode": "edit"|"suggest"

To delete an existing block from the draft, make a POST request to:
    POST /api/agent/deleteBlock
    with JSON body: { postId, key, prefix, mode?: "edit"|"suggest" }
The prefix should be a markdown string that matches the start of a paragraph
that already exists in the draft.
In edit mode, the matched block is removed immediately. In suggest mode, the
matched block is wrapped as a deletion suggestion.
`;

export function GET(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
