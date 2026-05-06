import { NextRequest, NextResponse } from "next/server";
import { $getRoot } from "lexical";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { locateMarkdownQuoteSelectionInSubtree } from "../../../../agent/mapMarkdownToLexical";
import { $applyEditWithNarrowing } from "../../../../agent/replaceText/route";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { withResearchDocEditorSession } from "../../researchEditorSession";
import { replaceTextInResearchDocSchema } from "../../researchToolSchemas";

const ROUTE = "documents.replaceText";

interface ReplaceResult {
  replaced: boolean;
  quoteFoundInDocument: boolean;
  note: string;
}

async function replaceTextInResearchDoc({
  documentId,
  hocuspocusToken,
  quote,
  replacement,
}: {
  documentId: string;
  hocuspocusToken: string;
  quote: string;
  replacement: string;
}): Promise<ReplaceResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchReplaceText",
    callback: async ({ editor, provider }) => {
      let replaced = false;
      let quoteFoundInDocument = false;

      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            const root = $getRoot();
            const selectionResult = locateMarkdownQuoteSelectionInSubtree({
              rootNodeKey: root.getKey(),
              markdownQuote: quote,
            });
            quoteFoundInDocument = selectionResult.found;
            if (!selectionResult.found || !selectionResult.anchor || !selectionResult.focus) {
              return;
            }
            const editResult = $applyEditWithNarrowing({
              editor,
              anchor: selectionResult.anchor,
              focus: selectionResult.focus,
              quote,
              replacement,
            });
            replaced = editResult.replaced;
          },
          { onUpdate: resolve },
        );
      });

      if (replaced) {
        await waitForProviderFlush(provider);
      }

      if (replaced) {
        return { replaced: true, quoteFoundInDocument, note: "Replaced text directly." };
      }
      return {
        replaced: false,
        quoteFoundInDocument,
        note: quoteFoundInDocument
          ? "Quote was found in the document but spans multiple formatted regions (e.g. bold/italic/link boundaries), so the replacement could not be applied. Try quoting a smaller segment that falls within a single paragraph and formatting style."
          : "Quote not found in document.",
      };
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

  const parseResult = replaceTextInResearchDocSchema.safeParse(body);
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

  const { documentId, quote, replacement } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const result = await replaceTextInResearchDoc({
      documentId,
      hocuspocusToken,
      quote,
      replacement,
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: !result.quoteFoundInDocument
        ? "quote_not_found"
        : result.replaced
          ? "replaced"
          : "not_replaced",
    });

    return NextResponse.json({
      ok: true,
      documentId,
      replaced: result.replaced,
      quoteFoundInDocument: result.quoteFoundInDocument,
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
        error: "Failed to replace text in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
