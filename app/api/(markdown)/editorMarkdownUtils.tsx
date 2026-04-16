import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { NextRequest, NextResponse } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { withMainDocEditorSession, waitForProviderSync } from "../agent/editorAgentUtil";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $generateHtmlFromNodes } from "@lexical/html";
import {
  $createParagraphNode,
  $isElementNode,
  $isDecoratorNode,
  type LexicalNode,
} from "lexical";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc, Array as YArray, Map as YMap } from "yjs";
import type { ThreadType, ThreadStatus } from "@/components/lexical/commenting";
import { captureException } from "@/lib/sentryWrapper";

export function normalizeImportedTopLevelNodes(nodes: LexicalNode[]): LexicalNode[] {
  const normalized: LexicalNode[] = [];
  for (const node of nodes) {
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

const HocuspocusAuthQuery = `
  query MarkdownDraftHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

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

export function unescapeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function convertWidgetIframesToMarkdownFences(markdown: string): string {
  return markdown.replace(/<iframe[\s\S]*?<\/iframe>/g, (iframeHtml) => {
    if (!iframeHtml.includes("data-lexical-iframe-widget")) {
      return iframeHtml;
    }
    const idMatch = iframeHtml.match(/data-widget-id="([^"]*)"/);
    const widgetId = idMatch?.[1] ?? "";

    const srcdocStart = iframeHtml.indexOf('srcdoc="');
    if (srcdocStart < 0) {
      return iframeHtml;
    }
    const srcdocValueStart = srcdocStart + 'srcdoc="'.length;
    const srcdocValueEnd = iframeHtml.lastIndexOf('"></iframe>');
    if (srcdocValueEnd <= srcdocValueStart) {
      return iframeHtml;
    }
    const rawSrcdoc = iframeHtml.slice(srcdocValueStart, srcdocValueEnd);
    const srcdoc = unescapeHtmlAttribute(rawSrcdoc);
    return `\n\n\`\`\`widget[${widgetId}]\n${srcdoc}\n\`\`\`\n\n`;
  });
}

interface SerializedComment {
  author: string
  content: string
  timeStamp: number
  commentKind?: string
  deleted: boolean
}

interface SerializedThread {
  id: string
  threadType: ThreadType
  quote: string
  status?: ThreadStatus
  comments: SerializedComment[]
}

function readThreadFromYMap(threadMap: YMap<unknown>): SerializedThread {
  const commentsArray = threadMap.get("comments") as YArray<unknown> | undefined;
  const serializedComments: SerializedComment[] = commentsArray?.toArray().map((comment: YMap<unknown>) => {
    return {
      author: (comment.get("author") as string) ?? "Unknown",
      content: (comment.get("content") as string) ?? "",
      timeStamp: (comment.get("timeStamp") as number) ?? 0,
      commentKind: comment.get("commentKind") as string | undefined,
      deleted: (comment.get("deleted") as boolean) ?? false,
    };
  }) ?? [];

  return {
    id: (threadMap.get("id") as string) ?? "",
    threadType: (threadMap.get("threadType") as ThreadType | undefined) ?? "comment",
    quote: (threadMap.get("quote") as string) ?? "",
    status: threadMap.get("status") as ThreadStatus | undefined,
    comments: serializedComments,
  };
}

async function readOpenCommentThreads({
  postId,
  token,
}: {
  postId: string
  token: string
}): Promise<SerializedThread[]> {
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) return [];

  const doc = new Doc();
  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: `post-${postId}/comments`,
    document: doc,
    token,
    connect: false,
  });

  try {
    await provider.connect();
    await waitForProviderSync(provider);

    const commentsArray = doc.get("comments", YArray);
    const threads: SerializedThread[] = [];

    for (let i = 0; i < commentsArray.length; i++) {
      const threadMap = commentsArray.get(i) as YMap<unknown>;
      if (threadMap.get("type") !== "thread") continue;
      // Only include open threads (status undefined or "open")
      const status = threadMap.get("status") as ThreadStatus | undefined;
      if (status && status !== "open") continue;
      const thread = readThreadFromYMap(threadMap);
      threads.push(thread);
    }

    return threads;
  } finally {
    provider.destroy();
    doc.destroy();
  }
}

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

function serializeThreadsToMarkdown(threads: SerializedThread[]): string {
  if (threads.length === 0) return "";

  const lines: string[] = [];
  lines.push(`## Comment Threads`);
  lines.push("");
  lines.push(
    `${threads.length} open thread${threads.length !== 1 ? "s" : ""}. To reply: POST /api/agent/replyToComment { postId, key, threadId, comment }`
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

async function getOpenCommentThreadsMarkdown({
  postId,
  token,
}: {
  postId: string
  token: string
}): Promise<string> {
  try {
    const threads = await readOpenCommentThreads({ postId, token });
    return serializeThreadsToMarkdown(threads);
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
  operationLabel
}: {
  postId: string
  token: string
  operationLabel?: string
}): Promise<string> {
  return withMainDocEditorSession({
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
      return convertWidgetIframesToMarkdownFences(htmlToMarkdown(html));
    },
  });
}

// Responses go out with status 200 because Claude's web_fetch tool doesn't
// surface response bodies for 4xx statuses, and we want the agent to be able
// to see the diagnostic so it can relay it to the user.
function markdownDraftAccessErrorResponse(postId: string, reason: string): Response {
  return new Response(
    `Unable to access shared draft for postId: ${postId}. ${reason}`,
    { status: 200 }
  );
}

const SHARING_PERMISSION_HINT = `If you are an AI agent, and a user has shared this link with you, please remind the user to set the permissions for "Anyone with the link can" to "Edit".`;

export async function renderLiveEditorDraftMarkdownRoute({
  req,
}: {
  req: NextRequest
}): Promise<Response> {
  const postId = req.nextUrl.searchParams.get("postId");
  const key = req.nextUrl.searchParams.get("key") ?? undefined;
  const version = req.nextUrl.searchParams.get("version") ?? "draft";

  if (!postId) {
    return new Response("No postId provided", { status: 400 });
  }

  const resolverContext = await getContextFromReqAndRes({ req });

  // Step 1: fetch a Hocuspocus auth token. Failure here means the viewer
  // doesn't have collaborative-edit access to the post, which is almost
  // always a sharing-settings problem.
  let token: string | null | undefined;
  try {
    const { data: authData } = await runQuery(
      HocuspocusAuthQuery,
      { postId, linkSharingKey: key ?? null },
      resolverContext
    );
    token = authData?.HocuspocusAuth?.token;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`renderLiveEditorDraftMarkdownRoute: HocuspocusAuth failed for postId=${postId}:`, error);
    captureException(error);
    return markdownDraftAccessErrorResponse(postId, SHARING_PERMISSION_HINT);
  }

  if (!token) {
    return markdownDraftAccessErrorResponse(postId, SHARING_PERMISSION_HINT);
  }

  // Step 2: render the document. Failures here are NOT permission problems --
  // the viewer has collab-edit access but something downstream broke (e.g.
  // Hocuspocus timeout, editor-type mismatch on a non-Lexical post, a
  // transient network issue). Return the underlying error rather than the
  // misleading "check your sharing settings" hint.
  try {
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
      getOpenCommentThreadsMarkdown({ postId, token }),
    ]);
    const resolvedPostId = post?._id ?? postId;
    const title = post?.title ?? "(untitled draft)";

    return renderEditorDraftMarkdown({
      title,
      postId: resolvedPostId,
      version,
      bodyMarkdown,
      commentThreadsMarkdown,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`renderLiveEditorDraftMarkdownRoute: draft rendering failed for postId=${postId} after auth succeeded:`, error);
    captureException(error);
    const detail = error instanceof Error ? error.message : String(error);
    return markdownDraftAccessErrorResponse(
      postId,
      `The user has granted access, but the draft could not be loaded. The underlying error was: ${detail}. This is likely a server-side issue -- if you are an AI agent, ask the user to try again in a moment or report the problem to the LessWrong team.`
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
