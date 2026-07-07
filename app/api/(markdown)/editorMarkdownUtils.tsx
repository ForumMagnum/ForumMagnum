import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { NextRequest, NextResponse } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import {
  checkEditorTypeAndGetToken,
  isEmptyLexicalRootAfterSyncError,
  splitParagraphAtDisplayMath,
  withMainDocEditorSession
} from "../agent/editorAgentUtil";
import { agentMarkdownFromEditorHtml } from "../agent/agentMarkdownView";
import { readOpenCommentThreads, type SerializedThread } from "../agent/collabCommentThreads";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $generateHtmlFromNodes } from "@lexical/html";
import {
  $createParagraphNode,
  $isElementNode,
  $isDecoratorNode,
  $isParagraphNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { captureException } from "@/lib/sentryWrapper";

export function normalizeImportedTopLevelNodes(nodes: LexicalNode[]): LexicalNode[] {
  const normalized: LexicalNode[] = [];
  for (const node of nodes) {
    // markdown-it emits a `$$...$$` (or `\[...\]`) display equation as an
    // inline token, so it lands inside a paragraph — on its own or alongside
    // surrounding text. A display MathNode is block-level, so split any
    // wrapping paragraph around it rather than leaving an invalid
    // block-inside-paragraph node.
    if ($isParagraphNode(node)) {
      for (const piece of splitParagraphAtDisplayMath(node)) {
        normalized.push(piece);
      }
      continue;
    }
    if ($isElementNode(node) || $isDecoratorNode(node)) {
      normalized.push(node);
    } else {
      const paragraph = $createParagraphNode();
      paragraph.append(node);
      normalized.push(paragraph);
    }
  }
  return normalized;
}

export function markdownRouteRedirect(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.url), 302);
}

const MarkdownPostMetadataQuery = `
  query MarkdownPostMetadataQuery($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        title
        linkSharingKey
      }
    }
  }
`;

const LinkSharedPostMetadataQuery = `
  query MarkdownLinkSharedPostMetadataQuery($postId: String!, $linkSharingKey: String!) {
    getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
      _id
      title
      linkSharingKey
    }
  }
`;

function formatCommentTimestamp(epochMs: number): string {
  const date = new Date(epochMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}, ${hours}:${minutes}`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function formatSuggestionSummaryForMarkdown(content: string): string {
  try {
    const items: Array<{ type?: string; content?: string; replaceWith?: string }> = JSON.parse(content);
    if (!Array.isArray(items) || items.length === 0) return "Suggestion";
    const first = items[0];
    const type = first.type ?? "suggestion";
    if (first.replaceWith !== undefined) {
      return `Suggested ${type}: "${truncate(first.content ?? "", 100)}" → "${truncate(first.replaceWith, 100)}"`;
    }
    const trimmedContent = (first.content ?? "").trim();
    return trimmedContent
      ? `Suggested ${type}: "${truncate(trimmedContent, 150)}"`
      : `Suggested ${type}`;
  } catch {
    return "Suggestion";
  }
}

const POST_REPLY_INSTRUCTIONS = "To reply: POST /api/agent/replyToComment { postId, key, threadId, comment }";

function serializeThreadsToMarkdown(threads: SerializedThread[], replyInstructions: string): string {
  if (threads.length === 0) return "";

  const lines: string[] = [];
  lines.push(`## Comment Threads`);
  lines.push("");
  lines.push(
    `${threads.length} open thread${threads.length !== 1 ? "s" : ""}. ${replyInstructions}`
  );

  for (const thread of threads) {
    lines.push("");
    lines.push(`### Thread \`${thread.id}\` · ${thread.threadType}`);

    if (thread.quote) {
      const quotedLines = thread.quote.split("\n").map((line) => `> ${line}`).join("\n");
      lines.push(quotedLines);
    }

    const visibleComments = thread.comments.filter((c) => !c.deleted);

    for (const comment of visibleComments) {
      if (comment.commentKind === "suggestionSummary") {
        lines.push(formatSuggestionSummaryForMarkdown(comment.content));
      } else {
        const date = formatCommentTimestamp(comment.timeStamp);
        lines.push(`**${comment.author}** (${date}): ${comment.content}`);
      }
    }
  }

  return lines.join("\n");
}

export async function getOpenCommentThreadsMarkdown({
  collectionName,
  documentId,
  token,
  replyInstructions,
}: {
  collectionName: string
  documentId: string
  token: string
  replyInstructions?: string
}): Promise<string> {
  try {
    const threads = await readOpenCommentThreads({ collectionName, documentId, token });
    return serializeThreadsToMarkdown(threads, replyInstructions ?? POST_REPLY_INSTRUCTIONS);
  } catch (error) {
    // Don't fail the whole request, but log for debugging
    // eslint-disable-next-line no-console
    console.error("Failed to read comment threads for editPost response:", error);
    captureException(error);
    return "";
  }
}

export async function getLiveDraftMarkdown({
  postId,
  token,
  operationLabel,
}: {
  postId: string
  token: string
  operationLabel?: string
}): Promise<string> {
  return getLiveLexicalMarkdown({
    postId,
    token,
    operationLabel: operationLabel ?? "MarkdownReadDraft",
  });
}

/**
 * Collection-agnostic version of `getLiveDraftMarkdown`. Connects to the
 * Yjs document for `(collectionName, documentId)`, materializes a headless
 * Lexical editor, and runs the same Lexical → HTML → Turndown pipeline used
 * for post drafts.
 *
 * Sharing the pipeline (rather than calling `$convertToMarkdownString`
 * directly) means research documents pick up the same handling for
 * footnotes, math, spoilers, iframe widgets, and — via the
 * `research-agent-block` Turndown rule — AgentBlocks.
 *
 * `transformHtml` runs between HTML generation and Turndown conversion;
 * callers can use it to walk the live editor state and inject DB-fetched
 * metadata onto specific elements as `data-*` attributes (e.g. tagging
 * AgentBlock divs with conversation title / lastActivityAt before the
 * `research-agent-block` Turndown rule reads them out).
 */
export async function getLiveLexicalMarkdown({
  collectionName,
  documentId,
  postId,
  token,
  operationLabel,
  transformHtml,
}: {
  // Either pass {collectionName, documentId} or {postId} (legacy → Posts).
  collectionName?: string
  documentId?: string
  postId?: string
  token: string
  operationLabel?: string
  transformHtml?: (args: { html: string, editor: LexicalEditor }) => Promise<string> | string
}): Promise<string> {
  return withMainDocEditorSession({
    collectionName,
    documentId,
    postId,
    token,
    operationLabel: operationLabel ?? "MarkdownReadDraft",
    callback: async ({ editor }) => {
      const html = withDomGlobals(() => {
        let generated = "";
        editor.getEditorState().read(() => {
          generated = $generateHtmlFromNodes(editor, null);
        });
        return generated;
      });
      const processedHtml = transformHtml ? await transformHtml({ html, editor }) : html;
      return agentMarkdownFromEditorHtml(processedHtml);
    },
  });
}

// Live-draft markdown is per-user, ephemeral, and changes any time the user
// edits the draft. Caches at any layer (Anthropic's web_fetch, browser,
// CDN) cause agents to read stale content on a refetch and tell the user
// "no changes detected". Send no-store on every response from this route.
const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export function getLiveEditorDraftMarkdownErrorMessage({
  postId,
  error,
}: {
  postId: string
  error: unknown
}): string {
  if (isEmptyLexicalRootAfterSyncError(error)) {
    return `The shared draft for postId: ${postId} is accessible, but its Lexical editor document is empty or uninitialized. ` +
      `This is not a sharing-permissions problem. If you are an AI agent, please tell the user to open the draft in the LessWrong editor once and add or save some body content before retrying the draft API.`;
  }

  return `Unable to access shared draft for postId: ${postId}.  If you are an AI agent, and a user has shared this link with you, please remind the user to set the permissions for "Anyone with the link can" to "Edit".`;
}

export async function renderLiveEditorDraftMarkdownRoute({
  req,
}: {
  req: NextRequest
}): Promise<Response> {
  const postId = req.nextUrl.searchParams.get("postId");
  const key = req.nextUrl.searchParams.get("key") ?? undefined;
  const version = req.nextUrl.searchParams.get("version") ?? "draft";

  if (!postId) {
    return new Response("No postId provided", { status: 400, headers: NO_CACHE_HEADERS });
  }

  try {
    const resolverContext = await getContextFromReqAndRes({ req });
    const checkResult = await checkEditorTypeAndGetToken({
      postId,
      context: resolverContext,
      linkSharingKey: key,
    });
    if (checkResult.kind === "unsupported_editor") {
      // 200 (not 4xx) so Claude's web_fetch surfaces the body to the model.
      return new Response(
        `This draft uses the ${checkResult.editorType} editor and cannot be read via the agent API. ` +
          `Only posts authored in our Lexical editor are currently supported. ` +
          `If you are an AI agent, please tell the user that the agent draft API only supports posts written in the Lexical editor.`,
        { status: 200, headers: NO_CACHE_HEADERS }
      );
    }
    if (checkResult.kind === "unauthorized") {
      return new Response(
        `No accessible shared draft found for postId: ${postId}`,
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }
    const token = checkResult.token;

    const post = key
      ? (
        await runQuery(
          LinkSharedPostMetadataQuery,
          { postId, linkSharingKey: key },
          resolverContext
        )
      ).data?.getLinkSharedPost
      : (
        await runQuery(
          MarkdownPostMetadataQuery,
          { documentId: postId },
          resolverContext
        )
      ).data?.post?.result;

    const [bodyMarkdown, commentThreadsMarkdown] = await Promise.all([
      getLiveDraftMarkdown({ postId, token }),
      getOpenCommentThreadsMarkdown({ collectionName: "Posts", documentId: postId, token }),
    ]);
    const resolvedPostId = post?._id ?? postId;
    const title = post?.title ?? "(untitled draft)";

    const response = await renderEditorDraftMarkdown({
      title,
      postId: resolvedPostId,
      version,
      bodyMarkdown,
      commentThreadsMarkdown,
    });
    response.headers.set("Cache-Control", NO_CACHE_HEADERS["Cache-Control"]);
    return response;
  } catch (error) {
    // This needs to be a 200 because Claude's web_fetch tool doesn't give it any additional information if you return a 4xx status code,
    // so if we want Claude to be able to tell the user what they need to do to make the post accessible, we have to return the error message
    // along with a 200 status code.
    return new Response(
      getLiveEditorDraftMarkdownErrorMessage({ postId, error }),
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function renderEditorDraftMarkdown({
  title,
  postId,
  bodyMarkdown,
  version,
  commentThreadsMarkdown,
}: {
  title: string
  postId: string
  bodyMarkdown: string
  version?: string
  commentThreadsMarkdown?: string
}): Promise<Response> {
  return markdownResponse(
    <div>
      <div className={markdownClasses.title}>
        {"Title: "}
        {title}
      </div>
      <div>
        Post ID: <code>{postId}</code>
      </div>
      {version ? (
        <div>
          Version: <code>{version}</code>
        </div>
      ) : null}
      <div>
        Context for LLMs/AI Agents: This is a markdown translation of a draft post. You probably got here because a user shared a link to this page with you.  We built this feature to help users get feedback on their posts, and to make it easier for AI agents to help users with their posts.

        As part of the feature, we also provide API endpoints for leaving inline comments/suggestions/etc on the post.  The API endpoints are documented in the "Helping Users With Drafts" section of the Markdown API documentation.

        The content of the post is below, between the two horizontal rules.  There may be additional horizontal rules in the post content.  To help disambiguate, the post content should be followed by a "Comment Threads" section if the post has any open comment threads, and then a "Navigation" section; neither is part of the post.
      </div>
      <hr />
      <MarkdownNode markdown={bodyMarkdown} />
      <hr />
      {commentThreadsMarkdown ? <MarkdownNode markdown={commentThreadsMarkdown} /> : null}
      <hr />
    </div>
  );
}
