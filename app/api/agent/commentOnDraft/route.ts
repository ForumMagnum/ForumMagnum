import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Map as YMap, Array as YArray, Doc } from "yjs";
import { randomId } from "@/lib/random";
import { $createRangeSelection, $getRoot, $setSelection } from "lexical";
import { $wrapSelectionInMarkNode } from "@lexical/mark";
import {
  deriveAgentAuthor,
  HOCUSPOCUS_FLUSH_WAIT_MS,
  normalizeText,
  waitForProviderSync,
  withMainDocEditorSession,
} from "../editorAgentUtil";
import { locateMarkdownQuoteSelectionInSubtree } from "../mapMarkdownToLexical";
import { sleep } from "@/lib/utils/asyncUtils";
import { commentOnDraftToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { getHocuspocusToken } from "../getHocuspocusToken";

export function createCollabComment({
  content,
  author,
  authorId,
  id,
}: {
  content: string
  author: string
  authorId: string
  id: string
}): YMap<unknown> {
  const commentMap = new YMap<unknown>();
  commentMap.set("type", "comment");
  commentMap.set("id", id);
  commentMap.set("author", author);
  commentMap.set("authorId", authorId);
  commentMap.set("content", content);
  commentMap.set("deleted", false);
  commentMap.set("timeStamp", Date.now());
  return commentMap;
}

function createCollabThread({
  quote,
  firstComment,
  threadId,
}: {
  quote: string
  firstComment: YMap<unknown>
  threadId: string
}): YMap<unknown> {
  const commentsArray = new YArray<unknown>();
  commentsArray.insert(0, [firstComment]);

  const threadMap = new YMap<unknown>();
  threadMap.set("type", "thread");
  threadMap.set("id", threadId);
  threadMap.set("quote", quote);
  threadMap.set("threadType", "comment");
  threadMap.set("comments", commentsArray);
  return threadMap;
}

export interface QuoteMarkResult {
  quoteFoundInDocument: boolean
  markCreated: boolean
}

/**
 * Locate a markdown quote in the current editor state and wrap the matched
 * range in a MarkNode. Must be called inside a Lexical update context.
 */
export function $attachMarkToQuote(quote: string, markId: string): QuoteMarkResult {
  const root = $getRoot();
  const result = locateMarkdownQuoteSelectionInSubtree({
    rootNodeKey: root.getKey(),
    markdownQuote: quote,
  });
  if (!result.found || !result.anchor || !result.focus) {
    return { quoteFoundInDocument: result.found, markCreated: false };
  }

  const selection = $createRangeSelection();
  selection.anchor.set(result.anchor.key, result.anchor.offset, result.anchor.type);
  selection.focus.set(result.focus.key, result.focus.offset, result.focus.type);
  $setSelection(selection);
  $wrapSelectionInMarkNode(selection, false, markId);
  return { quoteFoundInDocument: true, markCreated: true };
}

async function getMainDocQuoteMatchResult({
  postId,
  token,
  quote,
  markId,
}: {
  postId: string
  token: string
  quote: string
  markId: string
}): Promise<{ quoteFoundInDocument: boolean, createdMarkId: string | null }> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "CommentOnDraftQuoteMatch",
    callback: async ({ editor }) => {
      let quoteFoundInDocument = false;
      let createdMarkId: string | null = null;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const markResult = $attachMarkToQuote(quote, markId);
          quoteFoundInDocument = markResult.quoteFoundInDocument;
          if (markResult.markCreated) {
            createdMarkId = markId;
          }
        }, { onUpdate: resolve });
      });

      if (createdMarkId) {
        await sleep(HOCUSPOCUS_FLUSH_WAIT_MS);
      }

      return { quoteFoundInDocument, createdMarkId };
    },
  });
}

export async function insertDraftCommentThread({
  postId,
  token,
  comment,
  quote,
  author,
  authorId,
}: {
  postId: string
  token: string
  comment: string
  quote: string
  author: string
  authorId: string
}): Promise<{
  threadId: string
  commentId: string
  anchorStatus: "attached_by_quote_match" | "top_level_no_match" | "top_level_no_quote"
  anchorNote: string
}> {
  const documentName = `post-${postId}/comments`;
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) {
    throw new Error("HOCUSPOCUS_URL is not configured");
  }

  const doc = new Doc();
  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: documentName,
    document: doc,
    token,
    connect: false,
  });

  try {
    await provider.connect();
    await waitForProviderSync(provider);

    const commentId = randomId();
    const threadId = randomId();
    const comments = doc.get("comments", YArray<unknown>);
    const hasQuote = !!normalizeText(quote);

    let anchorStatus: "attached_by_quote_match" | "top_level_no_match" | "top_level_no_quote";
    let anchorNote: string;

    if (!hasQuote) {
      anchorStatus = "top_level_no_quote";
      anchorNote = "No quote provided; created top-level comment thread.";
    } else {
      const { quoteFoundInDocument, createdMarkId } = await getMainDocQuoteMatchResult({
        postId,
        token,
        quote,
        markId: threadId,
      });

      if (createdMarkId) {
        anchorStatus = "attached_by_quote_match";
        anchorNote = "Inserted a new text-range mark around quote text and attached the thread.";
      } else {
        anchorStatus = "top_level_no_match";
        anchorNote = quoteFoundInDocument
          ? "Quote text found in the document, but could not create a simple text-node anchor; created top-level comment thread."
          : "Quote text was not found in the document; created top-level comment thread.";
      }
    }

    const commentMap = createCollabComment({ content: comment, author, authorId, id: commentId });
    const threadMap = createCollabThread({ quote, firstComment: commentMap, threadId });

    doc.transact(() => {
      comments.insert(comments.length, [threadMap]);
    }, "agent-comment-on-draft");

    // Give the provider a moment to flush the update over websocket.
    await sleep(HOCUSPOCUS_FLUSH_WAIT_MS);
    return { threadId, commentId, anchorStatus, anchorNote };
  } finally {
    provider.destroy();
    doc.destroy();
  }
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false })
  ]);

  const parseResult = commentOnDraftToolSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, quote, comment } = parseResult.data;

  try {
    const token = await getHocuspocusToken(context, postId, key);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized to comment on draft" }, { status: 403 });
    }

    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });
    const threadQuote = quote ?? "";

    const { threadId, commentId, anchorStatus, anchorNote } = await insertDraftCommentThread({
      postId,
      token,
      comment,
      quote: threadQuote,
      author: authorName,
      authorId,
    });

    return NextResponse.json({
      ok: true,
      postId,
      threadId,
      commentId,
      anchorStatus,
      anchorNote,
      mode: "lexical-collaboration-comment-thread",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    return NextResponse.json(
      {
        error: "Failed to write comment to collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
