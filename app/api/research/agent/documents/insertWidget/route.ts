import { NextRequest, NextResponse } from "next/server";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { $insertWidgetInEditor, type InsertWidgetResult } from "../../../../agent/insertWidget/route";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { withResearchDocEditorSession } from "../../researchEditorSession";
import { insertWidgetInResearchDocSchema } from "../../researchToolSchemas";
import type { InsertLocation } from "../../../../agent/toolSchemas";

const ROUTE = "documents.insertWidget";

async function insertWidgetInResearchDoc({
  documentId,
  hocuspocusToken,
  content,
  location,
}: {
  documentId: string;
  hocuspocusToken: string;
  content: string;
  location: InsertLocation;
}): Promise<InsertWidgetResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchInsertWidget",
    callback: async ({ editor, provider }) => {
      let result: InsertWidgetResult = { inserted: false, note: "No insertion performed." };
      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            result = $insertWidgetInEditor({ content, location });
          },
          { onUpdate: resolve },
        );
      });
      if (result.inserted) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = insertWidgetInResearchDocSchema.safeParse(body);
  if (!parseResult.success) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "validation_error",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { documentId, content, location } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const result = await insertWidgetInResearchDoc({
      documentId,
      hocuspocusToken,
      content,
      location,
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: result.inserted ? "inserted" : "not_inserted",
    });

    return NextResponse.json({
      ok: true,
      documentId,
      inserted: result.inserted,
      widgetId: result.widgetId ?? null,
      insertionIndex: result.insertionIndex ?? null,
      note: result.note,
      requestId: randomId(),
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
        error: "Failed to insert widget in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
