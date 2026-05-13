import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createTextNode, $getNodeByKey, $getRoot, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { deriveAgentAuthor, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess } from "../editorAgentUtil";

import { locateMarkdownQuoteSelectionInSubtree, markdownQuoteToPlainText, type MarkdownSelectionPoint } from "../mapMarkdownToLexical";
import { replaceTextToolSchema, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import {
  $applyEditAtSelection,
  $computeFinalSelection,
  $computeNarrowing,
  $htmlToInlineNodes,
  $splitAndCollectSelectedNodes,
} from "../applyEditAtSelection";

interface ReplaceResult {
  replaced: boolean
  quoteFoundInDocument: boolean
  note: string
  suggestionId?: string
  /** The quote/replacement after narrowing, for use in suggestion summaries. */
  summaryQuote?: string
  summaryReplacement?: string
  /**
   * For mode `"edit"` only, when `replaced` is true: the live document's HTML
   * after the edit was applied, serialized from the post-edit Lexical state.
   * Callers that want to publish the live state as a new revision (rather than
   * computing the published HTML offline) read this field. Undefined for
   * `"suggest"` mode and for failed replacements.
   */
  postEditHtml?: string
}

interface SuggestionNarrowingResult {
  replaced: boolean
  /** The quote/replacement actually used after narrowing (for summaries). */
  narrowedQuote: string
  narrowedReplacement: string
}

/**
 * Convert a narrowed replacement string into Lexical nodes while preserving
 * edge whitespace. The standard markdown→HTML pipeline strips leading/trailing
 * whitespace; for narrowed replacements those spaces are meaningful content.
 * When the narrowed text is plain (no formatting), a TextNode is created
 * directly. Otherwise the markdown pipeline is used with whitespace patched.
 */
function $narrowedReplacementToNodes(
  editor: LexicalEditor,
  replacement: string,
  expectedPlainText?: string,
): LexicalNode[] {
  if (replacement.length === 0) return [];

  const plainText = expectedPlainText ?? markdownQuoteToPlainText(replacement);
  if (replacement === plainText) {
    return [$createTextNode(replacement)];
  }

  const nodes = $htmlToInlineNodes(editor, markdownToHtml(replacement));
  const nodesText = nodes.map(n => n.getTextContent()).join("");

  const leadingWs = plainText.match(/^(\s+)/)?.[1] ?? "";
  const nodesLeadingWs = nodesText.match(/^(\s+)/)?.[1] ?? "";
  if (leadingWs.length > nodesLeadingWs.length) {
    nodes.unshift($createTextNode(leadingWs.slice(0, leadingWs.length - nodesLeadingWs.length)));
  }

  const trailingWs = plainText.match(/(\s+)$/)?.[1] ?? "";
  const nodesTrailingWs = nodesText.match(/(\s+)$/)?.[1] ?? "";
  if (trailingWs.length > nodesTrailingWs.length) {
    nodes.push($createTextNode(trailingWs.slice(nodesTrailingWs.length)));
  }

  return nodes;
}

function $applySuggestionReplacement({
  editor,
  matchedNodeKey,
  startOffset,
  endOffset,
  replacement,
  replacementNodes,
  suggestionId,
}: {
  editor: LexicalEditor
  matchedNodeKey?: string
  startOffset?: number
  endOffset?: number
  replacement: string
  replacementNodes?: LexicalNode[]
  suggestionId: string
}): boolean {
  if (!matchedNodeKey || startOffset === undefined || endOffset === undefined) {
    return false;
  }

  const originalNode = $getNodeByKey(matchedNodeKey);
  if (!$isTextNode(originalNode)) {
    return false;
  }

  const splitNodes = originalNode.splitText(startOffset, endOffset);
  const matchNodeIndex = startOffset > 0 ? 1 : 0;
  const selectedNode = splitNodes[matchNodeIndex];
  if (!$isTextNode(selectedNode)) {
    return false;
  }

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  selectedNode.insertBefore(deleteSuggestion);
  deleteSuggestion.append(selectedNode);

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const nodes = replacementNodes ?? $narrowedReplacementToNodes(editor, replacement);
  for (const node of nodes) {
    insertSuggestion.append(node);
  }
  deleteSuggestion.insertAfter(insertSuggestion);

  return true;
}

/**
 * Some zero-width positions sit exactly on a text-node boundary, so Lexical can
 * represent the same insertion point as either "end of left node" or "start of
 * right node". Normalize those equivalent points to a single text position.
 */
function $getEquivalentInsertionPoint(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): MarkdownSelectionPoint | null {
  if (anchor.type !== "text" || focus.type !== "text") return null;

  if (anchor.key === focus.key && anchor.offset === focus.offset) {
    return anchor;
  }

  const anchorNode = $getNodeByKey(anchor.key);
  const focusNode = $getNodeByKey(focus.key);
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return null;

  const anchorAtEnd = anchor.offset === anchorNode.getTextContent().length;
  const focusAtStart = focus.offset === 0;
  if (anchorAtEnd && focusAtStart && anchorNode.getNextSibling()?.getKey() === focus.key) {
    return focus;
  }

  // Defensive: handle the reverse case where focus precedes anchor in sibling
  // order. This shouldn't arise from the narrowing logic but guards against
  // unexpected selection orientations.
  const anchorAtStart = anchor.offset === 0;
  const focusAtEnd = focus.offset === focusNode.getTextContent().length;
  if (anchorAtStart && focusAtEnd && focusNode.getNextSibling()?.getKey() === anchor.key) {
    return anchor;
  }

  return null;
}

/**
 * Handle the pure-insertion case: narrowing produced an empty delete range
 * (anchor and focus are at the same point), so we just need to insert
 * suggestion nodes at that position.
 */
function $applySuggestionInsertionAtPoint({
  editor,
  point,
  replacement,
  suggestionId,
  replacementNodes,
}: {
  editor: LexicalEditor
  point: MarkdownSelectionPoint
  replacement: string
  suggestionId: string
  replacementNodes?: LexicalNode[]
}): boolean {
  if (point.type !== "text") return false;

  const node = $getNodeByKey(point.key);
  if (!$isTextNode(node)) return false;

  // Determine the anchor node after which to place the suggestion pair.
  // For offset 0, we use insertBefore on the text node itself.
  const textLen = node.getTextContent().length;
  let anchorNode: LexicalNode;
  let useInsertBefore = false;
  if (point.offset <= 0) {
    anchorNode = node;
    useInsertBefore = true;
  } else if (point.offset >= textLen) {
    anchorNode = node;
  } else {
    anchorNode = node.splitText(point.offset)[0];
  }

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  if (useInsertBefore) {
    anchorNode.insertBefore(deleteSuggestion);
  } else {
    anchorNode.insertAfter(deleteSuggestion);
  }

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const nodes = replacementNodes ?? $narrowedReplacementToNodes(editor, replacement);
  for (const n of nodes) {
    insertSuggestion.append(n);
  }
  deleteSuggestion.insertAfter(insertSuggestion);
  return true;
}

/**
 * Apply a suggestion replacement, dispatching to the insertion, single-node,
 * or multi-node apply function as appropriate for the given selection.
 */
function $applySuggestionForSelection(
  editor: LexicalEditor,
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  replacement: string,
  suggestionId: string,
  replacementNodes?: LexicalNode[],
): boolean {
  const insertionPoint = $getEquivalentInsertionPoint(anchor, focus);
  if (insertionPoint) {
    return $applySuggestionInsertionAtPoint({
      editor, point: insertionPoint, replacement, suggestionId, replacementNodes,
    });
  }

  const sameTextNode = anchor.key === focus.key
    && anchor.type === "text" && focus.type === "text";

  if (sameTextNode) {
    return $applySuggestionReplacement({
      editor,
      matchedNodeKey: anchor.key,
      startOffset: anchor.offset,
      endOffset: focus.offset,
      replacement,
      replacementNodes,
      suggestionId,
    });
  }

  return $applySuggestionReplacementMultiNode({
    editor, anchor, focus, replacement, replacementNodes, suggestionId,
  });
}

/**
 * Apply a suggestion replacement with narrowing: strip the common
 * markdown prefix/suffix between the quote and replacement so that
 * delete/insert suggestion nodes only wrap the minimal diff.
 *
 * Must be called inside a Lexical update context.
 */
export function $applySuggestionWithNarrowing({
  editor,
  anchor,
  focus,
  quote,
  replacement,
  suggestionId,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
  suggestionId: string
}): SuggestionNarrowingResult {
  const narrowing = $computeNarrowing(anchor, focus, quote, replacement);

  if (!narrowing) {
    const replaced = $applySuggestionForSelection(editor, anchor, focus, replacement, suggestionId);
    return { replaced, narrowedQuote: quote, narrowedReplacement: replacement };
  }

  const narrowedPlainText = markdownQuoteToPlainText(narrowing.replacement);
  const replacementNodes = $narrowedReplacementToNodes(editor, narrowing.replacement, narrowedPlainText);
  const replaced = $applySuggestionForSelection(
    editor, narrowing.anchor, narrowing.focus, narrowing.replacement, suggestionId, replacementNodes,
  );
  return { replaced, narrowedQuote: narrowing.quote, narrowedReplacement: narrowing.replacement };
}

function $applySuggestionReplacementMultiNode({
  editor,
  anchor,
  focus,
  replacement,
  replacementNodes,
  suggestionId,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  replacement: string
  replacementNodes?: LexicalNode[]
  suggestionId: string
}): boolean {
  const selectedNodes = $splitAndCollectSelectedNodes(anchor, focus);
  if (!selectedNodes) return false;

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  selectedNodes[0].insertBefore(deleteSuggestion);
  for (const node of selectedNodes) {
    deleteSuggestion.append(node);
  }

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const nodes = replacementNodes ?? $narrowedReplacementToNodes(editor, replacement);
  for (const node of nodes) {
    insertSuggestion.append(node);
  }
  deleteSuggestion.insertAfter(insertSuggestion);

  return true;
}

export async function replaceTextInMainDoc({
  postId,
  token,
  quote,
  replacement,
  mode,
  authorName,
  authorId,
}: {
  postId: string
  token: string
  quote: string
  replacement: string
  mode: ReplaceMode
  authorName: string
  authorId: string
}): Promise<ReplaceResult> {
  const result = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceText",
    callback: async ({ editor, provider }) => {
      let replaced = false;
      let quoteFoundInDocument = false;
      let suggestionId: string | undefined = undefined;
      let summaryQuote = quote;
      let summaryReplacement = replacement;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const selectionResult = locateMarkdownQuoteSelectionInSubtree({
            rootNodeKey: root.getKey(),
            markdownQuote: quote,
          });
          quoteFoundInDocument = selectionResult.found;
          if (!selectionResult.found || !selectionResult.anchor || !selectionResult.focus) {
            return;
          }

          const { anchor, focus } = selectionResult;

          if (mode === "edit") {
            const sel = $computeFinalSelection(anchor, focus, quote, replacement);
            const inlineNodes = sel.narrowedReplacement.length > 0
              ? $htmlToInlineNodes(editor, markdownToHtml(sel.narrowedReplacement))
              : [];
            replaced = $applyEditAtSelection({
              editor, anchor: sel.anchor, focus: sel.focus, inlineNodes,
            });
            summaryQuote = sel.narrowedQuote;
            summaryReplacement = sel.narrowedReplacement;
            return;
          }

          suggestionId = randomId();
          const narrowingResult = $applySuggestionWithNarrowing({
            editor, anchor, focus, quote, replacement, suggestionId,
          });
          replaced = narrowingResult.replaced;
          summaryQuote = narrowingResult.narrowedQuote;
          summaryReplacement = narrowingResult.narrowedReplacement;
          if (!replaced) {
            suggestionId = undefined;
          }
        }, { onUpdate: resolve });
      });

      if (replaced) {
        await waitForProviderFlush(provider);
      }

      if (replaced) {
        // For "edit" mode, snapshot the post-edit HTML from the live Lexical
        // state. Callers that want to publish the live document (rather than
        // recompute the published HTML by replaying the edit offline) use this
        // field as their publish source. Suggestion mode doesn't need it —
        // the suggest path mutates Yjs but doesn't publish.
        let postEditHtml: string | undefined;
        if (mode === "edit") {
          postEditHtml = withDomGlobals(() => {
            let html = "";
            editor.getEditorState().read(() => {
              html = $generateHtmlFromNodes(editor, null);
            });
            return html;
          });
        }
        return {
          replaced: true,
          quoteFoundInDocument,
          note: mode === "suggest"
            ? "Created delete/insert suggestion nodes for replacement."
            : "Replaced text directly.",
          suggestionId,
          summaryQuote,
          summaryReplacement,
          postEditHtml,
        };
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

  if (mode === "suggest" && result.replaced && result.suggestionId) {
    await createSuggestionThreadInCommentsDoc({
      postId,
      token,
      suggestionId: result.suggestionId,
      authorName,
      authorId,
      summaryItems: [{
        type: "replace",
        content: result.summaryQuote ?? quote,
        replaceWith: result.summaryReplacement ?? replacement,
      }],
    });
  }

  return result;
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = replaceTextToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "replaceText", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, quote, replacement, mode } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "replaceText", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;
    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const result = await replaceTextInMainDoc({
      postId,
      token,
      quote,
      replacement,
      mode,
      authorName,
      authorId,
    });

    captureAgentApiEvent({ route: "replaceText", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: !result.quoteFoundInDocument ? "quote_not_found" : result.replaced ? "replaced" : "not_replaced" });
    return NextResponse.json({
      ok: true,
      postId,
      mode,
      replaced: result.replaced,
      quoteFoundInDocument: result.quoteFoundInDocument,
      note: result.note,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("replaceText", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to replace text in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
