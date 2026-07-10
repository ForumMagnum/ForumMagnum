import { NextRequest, NextResponse } from "next/server";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { $replaceWidgetInEditor, truncateForSummary, type ReplaceWidgetResult } from "../../../../agent/replaceWidget/route";
import type { ReplaceMode } from "../../../../agent/toolSchemas";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { withResearchDocEditorSession } from "../../researchEditorSession";
import { replaceWidgetInResearchDocSchema } from "../../researchToolSchemas";
import { maybeCreateResearchSuggestionThread } from "../../researchSuggestionThreads";

const ROUTE = "documents.replaceWidget";

async function replaceWidgetInResearchDoc({
  documentId,
  hocuspocusToken,
  widgetId,
  replacement,
  unifiedDiff,
  mode,
}: {
  documentId: string;
  hocuspocusToken: string;
  widgetId: string;
  replacement?: string;
  unifiedDiff?: string;
  mode: ReplaceMode;
}): Promise<ReplaceWidgetResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchReplaceWidget",
    callback: async ({ editor, provider }) => {
      let result: ReplaceWidgetResult = {
        replaced: false,
        widgetFound: false,
        note: "No widget replacement performed.",
      };
      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            result = $replaceWidgetInEditor({ widgetId, replacement, unifiedDiff, mode });
          },
          { onUpdate: resolve },
        );
      });
      if (result.replaced) {
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

  const parseResult = replaceWidgetInResearchDocSchema.safeParse(body);
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

  const { documentId, widgetId, replacement, unifiedDiff, mode } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const result = await replaceWidgetInResearchDoc({
      documentId,
      hocuspocusToken,
      widgetId,
      replacement,
      unifiedDiff,
      mode,
    });

    const { threadCreationFailed } = await maybeCreateResearchSuggestionThread({
      mode,
      documentId,
      hocuspocusToken,
      suggestionId: result.suggestionId,
      conversationId: payload.conversationId,
      summaryItems: [{
        type: "replace",
        content: truncateForSummary(result.previousContent ?? ""),
        replaceWith: truncateForSummary(result.nextContent ?? ""),
      }],
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: !result.widgetFound
        ? "widget_not_found"
        : result.replaced
          ? "replaced"
          : "not_replaced",
    });

    return NextResponse.json({
      ok: true,
      documentId,
      widgetId,
      replaced: result.replaced,
      widgetFound: result.widgetFound,
      note: threadCreationFailed
        ? `${result.note} Warning: the suggestion was applied, but its review thread could not be created. Do not retry this edit.`
        : result.note,
      mode,
      suggestionId: result.suggestionId ?? null,
      threadCreationFailed,
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
        error: "Failed to replace widget content in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
