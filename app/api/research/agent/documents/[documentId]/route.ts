import { NextRequest, NextResponse } from "next/server";
import { $nodesOfType, type LexicalEditor } from "lexical";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { AgentBlockNode } from "@/components/research/lexical/AgentBlockNode";
import { cheerioParse } from "@/server/utils/htmlUtil";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { getLiveLexicalMarkdown, getOpenCommentThreadsMarkdown } from "../../../../(markdown)/editorMarkdownUtils";

const ROUTE = "documents.fetch";

interface AgentBlockConversationMetadata {
  title: string | null;
  lastActivityAt: Date;
}

function collectAgentBlockConversationIds(editor: LexicalEditor): string[] {
  const ids = new Set<string>();
  editor.getEditorState().read(() => {
    for (const node of $nodesOfType(AgentBlockNode)) {
      const id = node.getConversationId();
      if (id) ids.add(id);
    }
  });
  return Array.from(ids);
}

async function fetchAgentBlockConversationMetadata(
  conversationIds: string[],
  projectId: string,
  context: ResolverContext,
): Promise<Map<string, AgentBlockConversationMetadata>> {
  if (conversationIds.length === 0) return new Map();
  // `projectId` filter is a defensive bound: a document should only
  // ever reference conversations from its own project, but we never
  // want a stray reference to leak metadata from another project.
  const conversations = await context.ResearchConversations.find(
    { _id: { $in: conversationIds }, projectId },
    {},
    { _id: 1, title: 1, lastActivityAt: 1 },
  ).fetch();
  return new Map(
    conversations.map((c) => [
      c._id,
      { title: c.title, lastActivityAt: c.lastActivityAt },
    ]),
  );
}

/**
 * Annotate `<div class="research-agent-block">` elements in the rendered HTML
 * with `data-conversation-title` / `data-conversation-last-activity-at`
 * attributes so the `research-agent-block` Turndown rule can fold them into
 * its placeholder line in a single pass — avoiding a second post-Turndown
 * regex sweep over the markdown.
 */
function annotateAgentBlocksInHtml(
  html: string,
  metadata: Map<string, AgentBlockConversationMetadata>,
): string {
  if (metadata.size === 0 || !html.includes("research-agent-block")) return html;
  const $ = cheerioParse(html);
  $("div.research-agent-block").each((_, el) => {
    const $el = $(el);
    const conversationId = $el.attr("data-conversation-id");
    if (!conversationId) return;
    const meta = metadata.get(conversationId);
    if (!meta) return;
    $el.attr("data-conversation-title", meta.title ?? "(untitled)");
    $el.attr("data-conversation-last-activity-at", meta.lastActivityAt.toISOString());
  });
  return $.html();
}

/**
 * GET `/api/research/agent/documents/:documentId`
 *
 * Returns the live ResearchDocument's contents serialized as markdown via the
 * same Lexical → HTML → Turndown pipeline that backs the post-draft agent API
 * (`getLiveLexicalMarkdown`). Reads through a headless Lexical editor over the
 * current Yjs state, so what the agent reads exactly matches the substrate it
 * can edit.
 *
 * AgentBlocks are emitted as `%%% agent-block conversationId="..." %%%`
 * placeholders by the Turndown rule, and then enriched in-place with the
 * conversation's `title` / `lastActivityAt` so the agent can decide whether
 * to fetch its content via the research-tool CLI.
 *
 * Why not read `ResearchDocuments.contents` (the persisted snapshot)?
 *   - It can lag the live Yjs state by one Hocuspocus debounce window.
 *   - Concurrent agent edits in the same turn would observe a stale view.
 * The cost is one extra Hocuspocus connection per fetch, same as a write.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  try {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { document, hocuspocusToken } = docAuth;

    const [markdown, commentThreadsMarkdown] = await Promise.all([
      getLiveLexicalMarkdown({
        collectionName: "ResearchDocuments",
        documentId,
        token: hocuspocusToken,
        operationLabel: "ResearchFetchDocument",
        transformHtml: async ({ html, editor }) => {
          const conversationIds = collectAgentBlockConversationIds(editor);
          const metadata = await fetchAgentBlockConversationMetadata(
            conversationIds,
            document.projectId,
            context,
          );
          return annotateAgentBlocksInHtml(html, metadata);
        },
      }),
      getOpenCommentThreadsMarkdown({
        collectionName: "ResearchDocuments",
        documentId,
        token: hocuspocusToken,
        replyInstructions: "To reply: `research-tool reply-comment <documentId> --thread-id <threadId> --comment <text>`",
      }),
    ]);

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      charCount: markdown.length,
    });

    return NextResponse.json({
      ok: true,
      documentId,
      title: document.title ?? null,
      markdown,
      // Open comment/suggestion threads, serialized as a markdown section
      // (empty string when there are none). Kept separate from `markdown` so
      // the thread list is never mistaken for document content.
      commentThreads: commentThreadsMarkdown,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
