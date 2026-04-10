import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { NextRequest } from "next/server";

export const markdownApiDocumentationMarkdown = (urlPrefix: string) => `
---
name: lesswrong
version: 2.0.0
description: APIs for reading content on LessWrong, and helping users edit posts they share with an agent.
homepage: https://www.lesswrong.com
---
LessWrong: A site dedicated to improving the art of rationality
===============================================================

Most pages on LessWrong have an HTML version and a Markdown version. Routes
starting with /api/ are either Markdown or JSON. For routes not starting with
/api, you can control which version you get with the Accept header or with a
query parameter ?format=markdown, eg:

    curl -H "Accept: text/markdown" ${urlPrefix}
    curl ${urlPrefix}/?format=markdown

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
Testing network access:
 * /api/agent/ping (GET/POST/PUT/DELETE/PATCH/OPTIONS/HEAD)

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
at https://www.lesswrong.com/api/post/KXujJjnmP85u8eM6B [without the /api in the
path if providing a link to the user]. Before using our API to leave feedback,
you should check whether you have network access to our domain.  You can do this by
checking the "Allowed Domains" list in your network configuration's settings, or by
making an empty test POST via curl to https://www.lesswrong.com/api/agent/ping and
checking if you get a 403 with x-deny-reason: host_not_allowed. If so, see the
"Setup & Usage Instructions" section below for what the user needs to do to
add our domain to their list of allowed domains; the API will be unusable otherwise.)

## Default Review Structure
If the user asks for feedback on their post, you should think carefully about
the following by default, unless they explicitly request otherwise.  Skip
any items that seem obviously irrelevant to the post.
- Well-established premises.  Consider the likely target audience of my post,
within the broader LessWrong community.  Do any of my arguments depend on premises
that seem likely to be controversial or unfamiliar to that audience?
- Local validity.  Do I make any claims that don't validly follow from my premises?
- Missed considerations.  Take a broad-picture view of the post and the claims
that it's advancing.  Are there any important considerations that I've missed?
Think about this from the perspective of an incisive LessWrong reader - if one
were to leave a comment saying something like "This entire post is wrong/misguided/etc,
because you failed to consider [x]", what is [x], if anything?
- Accurate representation of my sources.  Wherever I cite a source or link to
another resource as part of an argument, fetch that resource and check that I've
accurately understood and represented it.
- Existing arguments.  Are there existing arguments/research/other writing on the
subject which are sufficiently relevant that not mentioning them would be a major oversight?
- Clarity.  Is my writing clear and easy to understand?  Look for explicit
mistakes, ambiguous references, and sentences that are long enough that
readers might have trouble keeping everything in their mental stack.
- Everything else.  This is not a comprehensive list of things to check,
merely the highest priority items.  If you find any mistakes, issues, or areas
for improvement that don't fit into the above categories, please point them out.

## Setup & Usage Instructions
If you are an AI agent operating in a harness that permits you to make POST
requests using standard tools (like curl), then you should be able to use the
following API endpoints without any special setup. This is likely to be the case
for harnesses like Claude Code, Codex, Cursor, etc.

If you are Claude, operating from a chat interface like claude.ai, you should have
access to your network configuration's Allowed Domains list. If that list doesn't
contain www.lesswrong.com, your user will need to add it to enable you to make
API requests to our domain by going to https://claude.ai/settings/capabilities
and adding www.lesswrong.com to "Additional allowed domains" in the "Code execution
and file creation" section, and then starting a new chat session (since the change
won't take effect until they do so).  If you are ChatGPT, operating from a chat interface
like chatgpt.com, you may not have a similar domain allowlist. (If this is false,
please report it to the LessWrong developers using the /api/agent/feedback endpoint
so that we can update this documentation.)  Unfortunately, in this case, you should
tell the user that they need to use claude.ai or a harness like Codex to use this feature.

When making POST requests to the API endpoints below, pipe the JSON body from a heredoc
to avoid shell escaping issues (some environments mangle characters like ! in
inline curl -d arguments):
    cat <<'EOF' | curl -X POST ${urlPrefix}/api/agent/commentOnDraft -H 'Content-Type: application/json' -d @-
    { "postId": "...", "key": "...", "comment": "..." }
    EOF


## API Documentation
The API can be used to edit and comment on post drafts, which will appear
in the post editor. This feature is only available for posts written using our
lexical editor, which is the default editor for new posts, but old posts might
still be using a different editor. To give an AI agent access, the user needs
to set the permissions for "Anyone with the link can" to "Edit", then copy the
edit-post URL for you. The URL will look like this:
    https://www.lesswrong.com/editPost?postId=XYZXYZ&key=XYZXYZ
The key in the URL is called the "link sharing key"; do not share this key with
anyone unless the user is asking you to give that person permission to edit
the post. Once you have the post URL, read the post at:
    GET /editPost?postId=[id]&key=[linkSharingKey]

The editPost response includes a "Comment Threads" section after the post body
if there are any open comment or suggestion threads on the draft. Each thread
shows its ID, type (comment or suggestion), the quoted anchor text (if any),
and the conversation. You can use the thread ID to reply to existing threads.

To add Google Docs-style comments to the draft, make a request to:
    POST /api/agent/commentOnDraft
    with JSON body: { postId, key, agentName?, quote?, comment }
If a quote is provided, the comment will be attached to matching quoted text. The
quote should be long enough to be unambiguous. If no quote is provided, the
comment will be top-level. Both the quote and your comment should be in markdown.

To reply to an existing comment thread on the draft:
    POST /api/agent/replyToComment
    with JSON body: { postId, key, agentName?, threadId, comment }
The threadId comes from the Comment Threads section of the editPost response.
This adds a reply to the specified thread, visible in the editor's comment panel.

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
This API is only for inserting new blocks of text that can be expressed in
traditional markdown.  It supports paragraphs, lists, blockquotes,
bold/italic/strikethrough (no underline), and code blocks.
Custom block-level elements like LLM content blocks and widgets have dedicated APIs (see below).

To delete an existing block from the draft, make a POST request to:
    POST /api/agent/deleteBlock
    with JSON body: { postId, key, prefix, mode?: "edit"|"suggest" }
The prefix should be a markdown string that matches the start of a paragraph
that already exists in the draft.
In edit mode, the matched block is removed immediately. In suggest mode, the
matched block is wrapped as a deletion suggestion.

To insert an LLM content block (a visually distinct block attributed to a
specific AI model) into the draft, make a POST request to:
    POST /api/agent/insertLLMBlock
    with JSON body: {
      postId, key,
      modelName?: string,
      markdown: string,
      location: "start"|"end"|{ before: string }|{ after: string }
    }
The modelName is displayed in the block header (e.g. "Claude Opus 4.6"). If
omitted, it defaults to "AI Agent". The markdown is the content
that will appear inside the block. The location works the same as insertBlock.
LLM content blocks are always inserted directly (no suggest mode) because they
are explicitly labeled as AI-generated content.

LLM content blocks (visually distinct blocks attributed to a specific AI model) are
represented in the markdown output as:
    %%% llm-output model="Claude Opus 4.6"

    The markdown content of the block...

    %%% /llm-output
Content inside these blocks was generated by the named model, not written by the
post author. You can modify text inside these blocks with replaceText, delete them
with deleteBlock, or insert new ones with the insertLLMBlock endpoint below.

When using insertBlock, deleteBlock, or the location parameter of insertLLMBlock,
prefix and location strings are matched against each block's markdown representation
as it appears in the editPost output. For plain paragraphs, use the paragraph text;
for structured blocks like LLM content blocks, use the %%% delimiter line. Examples:

Deleting a plain paragraph:
    { "postId": "...", "key": "...", "prefix": "After this paragraph", "mode": "edit" }

Deleting an LLM content block:
    { "postId": "...", "key": "...", "prefix": "%%% llm-output model=\\"GPT-4o\\"", "mode": "edit" }

Inserting a paragraph before an LLM content block:
    { "postId": "...", "key": "...", "location": { "before": "%%% llm-output model=\\"GPT-4o\\"" }, "markdown": "New paragraph text.", "mode": "edit" }

To insert a new custom widget (sandboxed HTML/JS) into the draft, make a POST
request to:
    POST /api/agent/insertWidget
    with JSON body: { postId, key, agentName?, content, location }
The content is raw HTML/JS — do not wrap it in markdown fences. The location
works the same as insertBlock. A unique widgetId is generated automatically
and returned in the response as { widgetId }, so you can later modify the
widget with replaceWidget.

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
  const urlPrefix = getSiteUrlFromReq(req);
  return new Response(markdownApiDocumentationMarkdown(urlPrefix));
}
