import { NextRequest, NextResponse } from "next/server";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { getMarkdownItForResearch } from "@/lib/utils/markdownItPlugins";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { $locateQuoteWithTextIndex } from "../../../../agent/textIndexQuoteLocator";
import {
  $applyEditModeReplacement,
  $selectionSpansTableCellBoundary,
  CROSS_TABLE_CELL_REPLACEMENT_ERROR,
} from "../../../../agent/applyEditAtSelection";
import { $applySuggestionWithNarrowing } from "../../../../agent/replaceText/route";
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
import { replaceTextInResearchDocSchema } from "../../researchToolSchemas";
import { validateAndCanonicalizeMentionsInMarkdown } from "../../researchMentionValidation";
import { maybeCreateResearchSuggestionThread } from "../../researchSuggestionThreads";

const ROUTE = "documents.replaceText";

interface ReplaceResult {
  replaced: boolean;
  quoteFoundInDocument: boolean;
  note: string;
  suggestionId?: string;
  /** The quote/replacement after narrowing, for use in suggestion summaries. */
  summaryQuote?: string;
  summaryReplacement?: string;
}

async function replaceTextInResearchDoc({
  documentId,
  hocuspocusToken,
  quote,
  replacement,
  mode,
}: {
  documentId: string;
  hocuspocusToken: string;
  quote: string;
  replacement: string;
  mode: ReplaceMode;
}): Promise<ReplaceResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchReplaceText",
    callback: async ({ editor, provider }) => {
      let replaced = false;
      let quoteFoundInDocument = false;
      let locateFailureReason: string | undefined;
      let suggestionId: string | undefined;
      let summaryQuote = quote;
      let summaryReplacement = replacement;

      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            const selectionResult = $locateQuoteWithTextIndex(quote);
            quoteFoundInDocument = selectionResult.found;
            if (!selectionResult.found || !selectionResult.anchor || !selectionResult.focus) {
              locateFailureReason = selectionResult.reason;
              return;
            }

            const { anchor, focus } = selectionResult;
            if ($selectionSpansTableCellBoundary(anchor, focus)) {
              locateFailureReason = CROSS_TABLE_CELL_REPLACEMENT_ERROR;
              return;
            }

            if (mode === "edit") {
              // The research markdown-it instance is mention-aware, so
              // `@[doc:<id> "..."]` tokens in the replacement become MentionNode
              // chips (and `$...$` becomes a MathNode).
              const editResult = $applyEditModeReplacement({
                editor, anchor, focus, quote, replacement,
                range: selectionResult.range,
                markdownIt: getMarkdownItForResearch(),
              });
              replaced = editResult.replaced;
              summaryQuote = editResult.narrowedQuote;
              summaryReplacement = editResult.narrowedReplacement;
              return;
            }

            suggestionId = randomId();
            const narrowingResult = $applySuggestionWithNarrowing({
              editor, anchor, focus, quote, replacement,
              range: selectionResult.range,
              suggestionId,
              markdownIt: getMarkdownItForResearch(),
            });
            replaced = narrowingResult.replaced;
            summaryQuote = narrowingResult.narrowedQuote;
            summaryReplacement = narrowingResult.narrowedReplacement;
            if (!replaced) {
              suggestionId = undefined;
            }
          },
          { onUpdate: resolve },
        );
      });

      if (replaced) {
        await waitForProviderFlush(provider);
      }

      if (replaced) {
        return {
          replaced: true,
          quoteFoundInDocument,
          note: mode === "suggest"
            ? "Created delete/insert suggestion nodes for replacement."
            : "Replaced text directly.",
          suggestionId,
          summaryQuote,
          summaryReplacement,
        };
      }
      return {
        replaced: false,
        quoteFoundInDocument,
        note: quoteFoundInDocument
          ? locateFailureReason
            ?? "Quote was found in the document, but the replacement could not be applied to its range. Try quoting a smaller segment."
          : locateFailureReason ?? "Quote not found in document.",
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

  const { documentId, quote, replacement, mode } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { document, hocuspocusToken } = docAuth;

    // `quote` matches verbatim against `fetch-doc` output and isn't
    // validated — only the replacement needs canonicalization.
    const mentionResult = await validateAndCanonicalizeMentionsInMarkdown({
      markdown: replacement,
      projectId: document.projectId,
      context,
    });
    if (!mentionResult.ok) {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "validation_error",
        conversationId: payload.conversationId,
        projectId: payload.projectId,
        documentId,
        reason: "mention_validation_failed",
      });
      return NextResponse.json({ error: mentionResult.error }, { status: 400 });
    }

    const result = await replaceTextInResearchDoc({
      documentId,
      hocuspocusToken,
      quote,
      replacement: mentionResult.markdown,
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
        content: result.summaryQuote ?? quote,
        replaceWith: result.summaryReplacement ?? mentionResult.markdown,
      }],
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
        error: "Failed to replace text in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
