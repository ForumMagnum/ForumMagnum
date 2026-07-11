import { NextRequest, NextResponse } from "next/server";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { insertBlockInResearchDocSchema } from "../../researchToolSchemas";
import { validateMentionsOrRespond } from "../../researchMentionValidation";
import { maybeCreateResearchSuggestionThread } from "../../researchSuggestionThreads";
import { insertMarkdownBlockInResearchDoc } from "./insertMarkdownBlockInResearchDoc";

const ROUTE = "documents.insertBlock";

export async function POST(req: NextRequest) {
  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = insertBlockInResearchDocSchema.safeParse(body);
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

  const { documentId, location, markdown, mode } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const mentionResult = await validateMentionsOrRespond({
      markdown, context, route: ROUTE, payload, documentId,
    });
    if (!mentionResult.ok) return mentionResult.response;

    const result = await insertMarkdownBlockInResearchDoc({
      documentId,
      hocuspocusToken,
      location,
      markdown: mentionResult.markdown,
      mode,
    });

    const { threadCreationFailed } = await maybeCreateResearchSuggestionThread({
      mode,
      documentId,
      hocuspocusToken,
      suggestionId: result.suggestionId,
      conversationId: payload.conversationId,
      summaryItems: [{
        type: "insert",
        content: mentionResult.markdown,
      }],
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
      insertionIndex: result.insertionIndex ?? null,
      note: threadCreationFailed
        ? `${result.note} Warning: the suggestion was applied, but its review thread could not be created. Do not retry this edit.`
        : result.note,
      mode,
      suggestionId: result.suggestionId ?? null,
      threadCreationFailed,
      warnings: result.warnings ?? [],
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
        error: "Failed to insert markdown block in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
