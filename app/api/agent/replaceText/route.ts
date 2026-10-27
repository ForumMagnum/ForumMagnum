import { $reorderFootnotes } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import type { FootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { $appendImportedFootnotes, splitImportedFootnotes } from "../importFootnotes";
import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createRangeSelection, $getNodeByKey, $getRoot, $isBlockElementNode, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import type MarkdownIt from "markdown-it";
import { tryCreateSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { deriveAgentAuthor, renderAgentMarkdownToHtml, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess, requiredAccessForMode } from "../editorAgentUtil";

import type { MarkdownSelectionPoint } from "../mapMarkdownToLexical";
import { $locateQuoteWithTextIndex, type LocatedQuoteRange } from "../textIndexQuoteLocator";
import { replaceTextToolSchema, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import {
  $addTextFormat,
  $applyEditModeReplacement,
  $computeNarrowing,
  $getInheritedTextFormat,
  $htmlToInlineNodes,
  $inlineMarkdownToNodes,
} from "../applyEditAtSelection";

interface ReplaceResult {
  replaced: boolean
  quoteFoundInDocument: boolean
  note: string
  suggestionId?: string
  /** True when a suggestion was applied but its review thread couldn't be created. */
  threadCreationFailed?: boolean
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
  inheritedFormat,
  suggestionId,
  markdownIt,
}: {
  editor: LexicalEditor
  point: MarkdownSelectionPoint
  replacement: string
  inheritedFormat: number
  suggestionId: string
  markdownIt: MarkdownIt
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

  const insertSuggestion = $buildInsertSuggestion({ editor, replacement, inheritedFormat, suggestionId, markdownIt });
  deleteSuggestion.insertAfter(insertSuggestion);
  return true;
}

/**
 * Apply a suggestion replacement: a collapsed range becomes a pure
 * insertion; any non-empty range goes through the selection wrapper.
 */
function $applySuggestionForSelection(
  editor: LexicalEditor,
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  replacement: string,
  inheritedFormat: number,
  suggestionId: string,
  markdownIt: MarkdownIt,
): boolean {
  const insertionPoint = $getEquivalentInsertionPoint(anchor, focus);
  if (insertionPoint) {
    return $applySuggestionInsertionAtPoint({
      editor, point: insertionPoint, replacement, inheritedFormat, suggestionId, markdownIt,
    });
  }

  return $applySuggestionForRange({
    editor, anchor, focus, replacement, inheritedFormat, suggestionId, markdownIt,
  });
}

/**
 * Apply a non-empty-range suggestion via the editor's own selection wrapper
 * (`$wrapSelectionInSuggestionNode`, the same code the client suggestion UI
 * uses): it splits boundary text nodes and wraps each block's covered inline
 * run in its own delete-suggestion node sharing one suggestionId, never
 * wrapping block nodes themselves. The replacement is inserted as a single
 * insert-suggestion after the first delete run. For a range spanning block
 * boundaries, accepting removes the covered text from every block and keeps
 * the replacement; the block boundaries themselves are not part of the
 * suggestion (a paragraph merge cannot be represented as a text suggestion),
 * so the blocks remain separate.
 */
function $applySuggestionForRange({
  editor,
  anchor,
  focus,
  replacement,
  inheritedFormat,
  suggestionId,
  markdownIt,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  replacement: string
  inheritedFormat: number
  suggestionId: string
  markdownIt: MarkdownIt
}): boolean {
  const selection = $createRangeSelection();
  selection.anchor.set(anchor.key, anchor.offset, anchor.type);
  selection.focus.set(focus.key, focus.offset, focus.type);
  const deleteSuggestions = $wrapSelectionInSuggestionNode(selection, false, suggestionId, "delete");
  if (deleteSuggestions.length === 0) return false;

  const insertSuggestion = $buildInsertSuggestion({ editor, replacement, inheritedFormat, suggestionId, markdownIt });
  deleteSuggestions[0].insertAfter(insertSuggestion);
  return true;
}

/**
 * Render a suggested replacement as inline content: an insert suggestion is
 * an inline node, so markdown that would start a block on a line of its own
 * stays inline. Reference-style footnote definitions (`[^id]: …`) are the
 * exception, since inline parsing leaves them as literal text. A replacement
 * that renders as one block of inline content plus definitions is rendered as
 * blocks. Footnote sections, from these or from inline footnotes (see
 * `$inlineMarkdownToNodes`), are returned separately to attach to the
 * document's footnote section.
 */
function $suggestionReplacementToNodes(
  editor: LexicalEditor,
  replacement: string,
  markdownIt: MarkdownIt,
): { contentNodes: LexicalNode[], footnoteSections: FootnoteSectionNode[] } {
  if (replacement.includes("[^")) {
    const imported = splitImportedFootnotes(
      $htmlToInlineNodes(editor, renderAgentMarkdownToHtml(markdownIt, replacement)),
    );
    if (imported.footnoteSections.length > 0 && !imported.contentNodes.some($isBlockElementNode)) {
      return imported;
    }
  }
  return splitImportedFootnotes($inlineMarkdownToNodes(editor, replacement, markdownIt));
}

/**
 * An insert suggestion is an inline node, so the replacement is always
 * rendered as inline content (see `$suggestionReplacementToNodes`). Its text
 * also gets `inheritedFormat` (see `$getInheritedTextFormat`).
 */
function $buildInsertSuggestion({
  editor,
  replacement,
  inheritedFormat,
  suggestionId,
  markdownIt,
}: {
  editor: LexicalEditor
  replacement: string
  inheritedFormat: number
  suggestionId: string
  markdownIt: MarkdownIt
}): LexicalNode {
  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const { contentNodes, footnoteSections } = $suggestionReplacementToNodes(editor, replacement, markdownIt);
  for (const node of contentNodes) {
    $addTextFormat(node, inheritedFormat);
    insertSuggestion.append(node);
  }
  $appendImportedFootnotes(footnoteSections);
  return insertSuggestion;
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
  range,
  suggestionId,
  markdownIt,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
  range: LocatedQuoteRange | undefined
  suggestionId: string
  markdownIt: MarkdownIt
}): SuggestionNarrowingResult {
  const narrowing = $computeNarrowing(anchor, focus, quote, replacement, range, markdownIt);

  if (!narrowing) {
    const inheritedFormat = $getInheritedTextFormat(anchor, focus, quote);
    const replaced = $applySuggestionForSelection(
      editor, anchor, focus, replacement, inheritedFormat, suggestionId, markdownIt,
    );
    if (replaced) $reorderFootnotes();
    return { replaced, narrowedQuote: quote, narrowedReplacement: replacement };
  }

  const inheritedFormat = $getInheritedTextFormat(narrowing.anchor, narrowing.focus, narrowing.quote);
  const replaced = $applySuggestionForSelection(
    editor, narrowing.anchor, narrowing.focus, narrowing.replacement, inheritedFormat, suggestionId, markdownIt,
  );
  if (replaced) $reorderFootnotes();
  return { replaced, narrowedQuote: narrowing.quote, narrowedReplacement: narrowing.replacement };
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
  const result: ReplaceResult = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceText",
    callback: async ({ editor, provider }) => {
      let replaced = false;
      let quoteFoundInDocument = false;
      let locateFailureReason: string | undefined;
      let suggestionId: string | undefined = undefined;
      let summaryQuote = quote;
      let summaryReplacement = replacement;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const selectionResult = $locateQuoteWithTextIndex(quote);
          quoteFoundInDocument = selectionResult.found;
          if (!selectionResult.found || !selectionResult.anchor || !selectionResult.focus) {
            locateFailureReason = selectionResult.reason;
            return;
          }

          const { anchor, focus } = selectionResult;

          if (mode === "edit") {
            const editResult = $applyEditModeReplacement({
              editor, anchor, focus, quote, replacement,
              range: selectionResult.range,
              markdownIt: getMarkdownItForAgentPosts(),
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
            markdownIt: getMarkdownItForAgentPosts(),
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
          ? locateFailureReason
            ?? "Quote was found in the document, but the replacement could not be applied to its range. Try quoting a smaller segment."
          : locateFailureReason ?? "Quote not found in document.",
      };
    },
  });

  if (mode === "suggest" && result.replaced && result.suggestionId) {
    const threadCreated = await tryCreateSuggestionThreadInCommentsDoc({
      collectionName: "Posts",
      documentId: postId,
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
    if (!threadCreated) {
      result.threadCreationFailed = true;
      result.note += " Warning: the suggestion was applied, but its review thread could not be created. Do not retry this edit.";
    }
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
    const auth = await authorizeAgentDraftAccess({ route: "replaceText", postId, context, linkSharingKey: key, agentName, requiredAccess: requiredAccessForMode(mode) });
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
      suggestionId: result.suggestionId ?? null,
      threadCreationFailed: result.threadCreationFailed ?? false,
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
