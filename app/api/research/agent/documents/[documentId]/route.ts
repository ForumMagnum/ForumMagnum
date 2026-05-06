import { NextRequest, NextResponse } from "next/server";
import { $convertToMarkdownString } from "@lexical/markdown";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { PLAYGROUND_TRANSFORMERS } from "@/components/lexical/plugins/MarkdownTransformers";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { withResearchDocEditorSession } from "../../researchEditorSession";

const ROUTE = "documents.fetch";

/**
 * GET `/api/research/agent/documents/:documentId`
 *
 * Returns the live ResearchDocument's contents serialized as markdown.
 * Uses `withResearchDocEditorSession` to read the current Yjs state through a
 * headless Lexical editor — same path as the edit endpoints, so what the
 * agent reads exactly matches the substrate it can edit.
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

    const markdown = await withResearchDocEditorSession({
      documentId,
      token: hocuspocusToken,
      operationLabel: "ResearchFetchDocument",
      callback: async ({ editor }) => {
        let result = "";
        editor.getEditorState().read(() => {
          result = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
        });
        return result;
      },
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: `chars=${markdown.length}`,
    });

    return NextResponse.json({
      ok: true,
      documentId,
      title: document.title ?? null,
      markdown,
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
