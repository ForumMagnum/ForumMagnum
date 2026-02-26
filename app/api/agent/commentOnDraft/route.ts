import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest, NextResponse } from "next/server";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Map as YMap, Array as YArray, Doc } from "yjs";
import z from "zod";
import { randomId } from "@/lib/random";
import { gql } from "@/lib/generated/gql-codegen";
import { $setSelection, $getSelection, $isRangeSelection } from "lexical";
import { $wrapSelectionInMarkNode } from "@lexical/mark";
import {
  normalizeText,
  waitForProviderSync,
  sleep,
  withMainDocEditorSession,
  selectQuotedTextInEditor,
} from "../editorAgentUtil";

const HocuspocusAuthQuery = gql(`
  query AgentHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`);

const HOCUSPOCUS_FLUSH_WAIT_MS = 750;

const CommentOnDraftRequestSchema = z.object({
  postId: z.string(),
  key: z.string().optional(),
  agentName: z.string().optional(),
  paragraphId: z.string().optional(),
  quote: z.string().optional(),
  comment: z.string(),
});

function createCollabComment({
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

interface MainDocQuoteMatchResult {
  quoteFoundInDocument: boolean
  createdMarkId: string | null
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
}): Promise<MainDocQuoteMatchResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "CommentOnDraftQuoteMatch",
    callback: async ({ editor }) => {
      let quoteFoundInDocument = false;
      let createdMarkId: string | null = null;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const selectionResult = selectQuotedTextInEditor(quote);
          quoteFoundInDocument = selectionResult.quoteFoundInDocument;
          if (selectionResult.selectionCreated) {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setSelection(selection);
              $wrapSelectionInMarkNode(selection, false, markId);
              createdMarkId = markId;
            }
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
    provider.connect();
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

  const parseResult = CommentOnDraftRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, paragraphId, quote, comment } = parseResult.data;

  try {
    const { data } = await runQuery(
      HocuspocusAuthQuery,
      { postId, linkSharingKey: key ?? null },
      context
    );

    const token = data?.HocuspocusAuth?.token;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized to comment on draft" }, { status: 403 });
    }

    const authorId = context.currentUser?._id ?? context.clientId ?? `agent-${randomId()}`;
    const authorName = agentName ?? context.currentUser?.displayName ?? "AI Agent";
    const threadQuote = quote ?? paragraphId ?? "(No quote provided)";

    console.log(`Attempting to insert a draft comment thread: comment=${comment}, quote=${quote}, paragraphId=${paragraphId}, author=${authorName}, authorId=${authorId}`);

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
    return NextResponse.json(
      {
        error: "Failed to write comment to collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
