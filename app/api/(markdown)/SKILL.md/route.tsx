import { NextRequest } from "next/server";

export const markdownApiDocumentationMarkdown = (hostname: string) => `
--
name: lesswrong
version: 2.0.0
description: APIs for reading content on LessWrong, and helping users edit posts they share with an agent.
homepage: https://www.lesswrong.com
--
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

Reporting Feedback About This API
=================================
AI agents should use this endpoint to report:
 * bugs in the markdown/agent API
 * gaps in functionality that make the API harder to use
 * anything your user asks you to report to the LessWrong developers

To submit feedback, make a POST request to:
    POST /api/agent/feedback
    with JSON body: {
      message: string,
      type?: "bug_report"|"functionality_gap"|"user_requested_report"|"other",
      agentName?: string,
      userRequest?: string,
      endpoint?: string,
      details?: object
    }
This endpoint forwards the message to the developers' Slack channel.

Helping Users With Drafts
=========================
(This feature is currently in development, the API should not be assumed stable,
and users using it should be reminded of LessWrong's policy on LLM writing, found
at https://www.lesswrong.com/api/post/KXujJjnmP85u8eM6B)

The API can also be used to edit and comment on post drafts, which will appear
in the post editor. This feature is only available for Lexical, which is enabled
for users who have enabled the "Beta features" option in their settings, which
can be found at https://www.lesswrong.com/account?tab=preferences. To give an AI
agent access, the user needs to press the Share button, change the permissions
for "Anyone with the link can" to "Edit", then copy the edit-post URL for you.
The URL will look like this:
    https://www.lesswrong.com/editPost?postId=XYZXYZ&key=XYZXYZ (or /collaborateOnPost?postId=XYZXYZ&key=XYZXYZ, which is functionally equivalent)
The key in the URL is called the "link sharing key"; do not share this key with
anyone unless the user is asking you to give that person permission to edit
the post. Once you have the post URL, read the post at:
    GET /api/editPost?postId=[id]&key=[linkSharingKey] (even if the user-provided URL uses the /collaborateOnPost route)

When making POST requests to these endpoints, pipe the JSON body from a heredoc
to avoid shell escaping issues (some environments mangle characters like ! in
inline curl -d arguments):
    cat <<'EOF' | curl -X POST https://${hostname}/api/agent/commentOnDraft -H 'Content-Type: application/json' -d @-
    { "postId": "...", "key": "...", "comment": "..." }
    EOF

To add add Google Docs-style comments to the draft, make a request to:
    POST /api/agent/commentOnDraft
    with JSON body: { postId, key, agentName?, quote?, comment }
If a quote is provided, the comment will be attached to matching quoted text. The
quote should be long enough to be unambiguous. If no quote is provided, the
comment will be top-level. Both the quote and your comment should be in markdown.

To replace text inside the draft, make a POST request to:
    POST /api/agent/replaceText
    with JSON body: { postId, key, agentName?, quote, replacement, mode?: "edit"|"suggest" }
The quote and replacement should be in markdown. If the mode is "edit", the
change will be applied immediately; if the mode is "suggest", the change will be
displayed as a suggestion in the post editor. If the user hasn't said whether to
use edit mode or suggest mode, use suggest mode.

To insert new blocks of text into the draft, make a POST request to:
    POST /api/agent/insertBlock
    with JSON body: { postId, key, agentName?, location: "start"|"end"|{ before: string }|{ after: string }, markdown, mode?: "edit"|"suggest" }
The location should be a markdown string that matches the start of a paragraph
that already exists in the draft. The location can be one of the following:
    "start": insert at the beginning of the post
    "end": insert at the end of the post
    "before": insert before the paragraph with the given markdown prefix
    "after": insert after the paragraph with the given markdown prefix

To delete an existing block from the draft, make a POST request to:
    POST /api/agent/deleteBlock
    with JSON body: { postId, key, prefix, mode?: "edit"|"suggest" }
The prefix should be a markdown string that matches the start of a paragraph
that already exists in the draft.
In edit mode, the matched block is removed immediately. In suggest mode, the
matched block is wrapped as a deletion suggestion.

Custom widgets are represented in markdown with fenced code blocks using:
    \`\`\`widget[widgetId]
    ... html/js content ...
    \`\`\`
Newly inserted widgets will have a unique widgetId in the bracket.

To replace the HTML/JS contents of a widget, make a POST request to:
    POST /api/agent/replaceWidget
    with JSON body: {
      postId, key, agentName?, widgetId,
      replacement?: string,
      unifiedDiff?: string,
      mode?: "edit"|"suggest"
    }
Provide exactly one of replacement or unifiedDiff. In suggest mode, the
change is represented as widget-content suggestions.
`;

export function GET(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
  return new Response(markdownApiDocumentationMarkdown(hostname));
}
