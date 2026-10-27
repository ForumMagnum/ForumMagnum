import { sanitize } from "@/lib/utils/sanitize";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";
import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import { $appendImportedFootnotes, splitImportedFootnotes } from "../importFootnotes";
import { $getFootnoteSection } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import {
  $getRoot,
  $createRangeSelection,
  $createTextNode,
  $isElementNode,
  $isParagraphNode,
  $isRootNode,
  $isTextNode,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { $createIframeWidgetNode, type IframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { $isCollapsibleSectionContainerNode } from "@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionContainerNode";
import { $isCollapsibleSectionContentNode } from "@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionContentNode";
import { deriveAgentAuthor, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess, requiredAccessForMode } from "../editorAgentUtil";

import { normalizeImportedTopLevelNodes } from "../../(markdown)/editorMarkdownUtils";
import { $collectWidgetNodes, $locateBlockByPrefix, $locateCollapsibleSectionByTitle } from "../textIndexQuoteLocator";
import { tryCreateSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { insertBlockToolSchema, type InsertLocation, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface InsertBlockResult {
  inserted: boolean
  note: string
  insertionIndex?: number
  suggestionId?: string
  /** True when a suggestion was applied but its review thread couldn't be created. */
  threadCreationFailed?: boolean
}

interface WidgetFence {
  widgetId: string
  widgetMarkup: string
}

/** The nodes converted from agent markdown, or why it can't be inserted as written. */
export interface MarkdownConversion {
  nodes: LexicalNode[]
  /** Set when the markdown can't be inserted as written, in which case `nodes` is empty. */
  error?: string
}

/**
 * Swap each widget fence markdown-it parsed for a placeholder paragraph, so
 * the fence survives rendering wherever it appears (including inside
 * collapsible sections and blockquotes); the placeholders are turned into
 * widget nodes after import. Mutates the tokens.
 */
function replaceWidgetFencesWithPlaceholders(tokens: Token[]): Map<string, WidgetFence> {
  const widgetsByPlaceholder = new Map<string, WidgetFence>();
  for (const token of tokens) {
    const widgetFenceMatch = token.type === "fence" ? /^widget\[(.*)\]$/.exec(token.info.trim()) : null;
    if (!widgetFenceMatch) continue;
    const placeholder = `widgetplaceholder${randomId()}`;
    widgetsByPlaceholder.set(placeholder, {
      widgetId: widgetFenceMatch[1].trim() || randomId(),
      // A fence's content includes the newline ending its last line.
      widgetMarkup: token.content.replace(/\n$/, ""),
    });
    // An html_block token renders its content verbatim.
    token.type = "html_block";
    token.content = `<p>${placeholder}</p>\n`;
  }
  return widgetsByPlaceholder;
}

function $createWidgetNodeFromFence({ widgetId, widgetMarkup }: WidgetFence): IframeWidgetNode {
  const widgetNode = $createIframeWidgetNode(widgetId);
  widgetNode.append($createTextNode(widgetMarkup));
  return widgetNode;
}

/**
 * The widget a placeholder paragraph stands in for, if `node` is one. Each
 * widget is taken out of `pendingWidgets` as its placeholder is found.
 */
function $takePlaceholderWidget(node: LexicalNode, pendingWidgets: Map<string, WidgetFence>): WidgetFence | undefined {
  if (!$isParagraphNode(node)) return undefined;
  const placeholder = node.getTextContent().trim();
  const widget = pendingWidgets.get(placeholder);
  pendingWidgets.delete(placeholder);
  return widget;
}

function $replaceNestedWidgetPlaceholders(parent: ElementNode, pendingWidgets: Map<string, WidgetFence>): void {
  for (const child of parent.getChildren()) {
    const widget = $takePlaceholderWidget(child, pendingWidgets);
    if (widget) {
      child.replace($createWidgetNodeFromFence(widget));
    } else if ($isElementNode(child)) {
      $replaceNestedWidgetPlaceholders(child, pendingWidgets);
    }
  }
}

function $replaceWidgetPlaceholders(nodes: LexicalNode[], pendingWidgets: Map<string, WidgetFence>): LexicalNode[] {
  if (pendingWidgets.size === 0) return nodes;
  return nodes.map((node) => {
    const widget = $takePlaceholderWidget(node, pendingWidgets);
    if (widget) return $createWidgetNodeFromFence(widget);
    if ($isElementNode(node)) $replaceNestedWidgetPlaceholders(node, pendingWidgets);
    return node;
  });
}

/**
 * Why the widgets among some nodes about to be inserted can't be, if there
 * are any that can't. Widgets can't be inserted as suggestions, matching the
 * editor's suggestion mode (wrapping one would only mark its HTML source).
 * Each widget's ID must also be unused, because later edits address the
 * widget by it. Must be called inside a Lexical read/update context.
 */
export function $findWidgetInsertionProblem(nodesToInsert: LexicalNode[], mode: ReplaceMode): string | null {
  const insertedWidgetIds = nodesToInsert
    .flatMap((node) => $collectWidgetNodes(node))
    .map((widgetNode) => widgetNode.getWidgetId());
  if (insertedWidgetIds.length === 0) return null;
  if (mode === "suggest") {
    return "Widgets can't be inserted as suggestions. Retry with mode \"edit\" to insert them directly.";
  }
  const usedWidgetIds = new Set($collectWidgetNodes($getRoot()).map((widgetNode) => widgetNode.getWidgetId()));
  for (const widgetId of insertedWidgetIds) {
    if (usedWidgetIds.has(widgetId)) {
      return `Widget ID ${JSON.stringify(widgetId)} is already in use. Give each widget a unique ID.`;
    }
    usedWidgetIds.add(widgetId);
  }
  return null;
}

/**
 * Wraps already-inserted sibling nodes in suggestion markup. Must be called
 * inside a Lexical editor.update() callback, after the nodes have been spliced
 * into the parent at insertionIndex.
 */
function $wrapInsertedNodesAsSuggestion(nodesToInsert: LexicalNode[], parent: ElementNode, insertionIndex: number, suggestionId: string): void {
  if (nodesToInsert.length === 0) return;

  const firstInserted = nodesToInsert[0];
  const lastInserted = nodesToInsert[nodesToInsert.length - 1];

  const firstDescendant = $isElementNode(firstInserted)
    ? firstInserted.getFirstDescendant()
    : null;
  const lastDescendant = $isElementNode(lastInserted)
    ? lastInserted.getLastDescendant()
    : null;

  // Use text-level selection on the first/last text descendants when possible.
  // For non-element, non-text nodes (e.g. decorator nodes like horizontal
  // rules), fall back to element selection on the parent.
  const selection = $createRangeSelection();
  if (firstDescendant && $isTextNode(firstDescendant)) {
    selection.anchor.set(firstDescendant.getKey(), 0, "text");
  } else {
    selection.anchor.set(parent.getKey(), insertionIndex, "element");
  }
  if (lastDescendant && $isTextNode(lastDescendant)) {
    selection.focus.set(lastDescendant.getKey(), lastDescendant.getTextContentSize(), "text");
  } else {
    selection.focus.set(parent.getKey(), insertionIndex + nodesToInsert.length, "element");
  }
  $wrapSelectionInSuggestionNode(selection, false, suggestionId, "insert");
}

function $htmlToNodes(editor: LexicalEditor, html: string): LexicalNode[] {
  const dom = new JSDOM(sanitize(html));
  try {
    return normalizeImportedTopLevelNodes($generateNodesFromDOM(editor, dom.window.document));
  } finally {
    dom.window.close();
  }
}

export function $markdownToNodes(
  editor: LexicalEditor,
  markdown: string,
  options: { markdownIt: MarkdownIt },
): LexicalNode[] {
  return $htmlToNodes(editor, options.markdownIt.render(markdown, { docId: randomId() }));
}

export function $postMarkdownToNodes(editor: LexicalEditor, markdown: string): MarkdownConversion {
  const markdownIt = getMarkdownItForAgentPosts();
  const env = { docId: randomId() };
  const tokens = markdownIt.parse(markdown, env);
  const pendingWidgets = replaceWidgetFencesWithPlaceholders(tokens);
  const html = markdownIt.renderer.render(tokens, markdownIt.options, env);
  const nodes = $replaceWidgetPlaceholders($htmlToNodes(editor, html), pendingWidgets);
  // A placeholder that didn't import as a paragraph is somewhere a widget
  // can't go: a list item, which only holds inline content.
  const [misplacedWidget] = pendingWidgets.values();
  if (misplacedWidget) {
    return {
      nodes: [],
      error: `The widget[${misplacedWidget.widgetId}] fence is inside a list item, which can't contain widgets. Move it out of the list.`,
    };
  }
  return { nodes };
}

export interface InsertionPoint {
  parent: ElementNode
  index: number
}

export interface InsertionPointResult {
  point: InsertionPoint | null
  /** Why no insertion point could be resolved (e.g. an ambiguous prefix). */
  reason?: string
}

/**
 * The ancestor-or-self of a located block that new blocks are inserted next
 * to: its child of the root, or of the collapsible-section body it sits in.
 * The locator may descend into list items (at any nesting depth), but
 * insertion never splits a list open — it goes before/after the whole list.
 */
function $getInsertionSibling(node: LexicalNode): LexicalNode {
  let current = node;
  let parent = current.getParent();
  while (parent && !$isRootNode(parent) && !$isCollapsibleSectionContentNode(parent)) {
    current = parent;
    parent = current.getParent();
  }
  return current;
}

function $resolveInsidePoint(prefix: string, position: "start" | "end"): InsertionPointResult {
  const { node, reason } = $locateCollapsibleSectionByTitle(prefix);
  if (!$isCollapsibleSectionContainerNode(node)) return { point: null, reason };
  const content = node.getChildren().find($isCollapsibleSectionContentNode);
  if (!content) {
    return { point: null, reason: "The matched collapsible section has no body to insert into." };
  }
  return { point: { parent: content, index: position === "start" ? 0 : content.getChildrenSize() } };
}

/**
 * Resolve an insert location to a parent node and child index. A point at the
 * top level never comes after the footnote section, which stays at the end of
 * the document. Must be called inside a Lexical read/update context.
 */
export function $resolveInsertionPoint(location: InsertLocation): InsertionPointResult {
  const result = $resolveLocation(location);
  const section = $getFootnoteSection();
  if (!result.point || !section || !$isRootNode(result.point.parent)) return result;
  const index = Math.min(result.point.index, section.getIndexWithinParent());
  return { point: { parent: result.point.parent, index } };
}

function $resolveLocation(location: InsertLocation): InsertionPointResult {
  const root = $getRoot();
  if (location === "start") {
    return { point: { parent: root, index: 0 } };
  } else if (location === "end") {
    return { point: { parent: root, index: root.getChildrenSize() } };
  } else if ("inside" in location) {
    return $resolveInsidePoint(location.inside, location.position);
  }

  const relation = "before" in location ? "before" : "after";
  const { node, reason } = $locateBlockByPrefix("before" in location ? location.before : location.after);
  if (!node) return { point: null, reason };
  const sibling = $getInsertionSibling(node);
  const parent = sibling.getParent();
  if (!parent) {
    return { point: null, reason: "Matched block has no parent to insert into." };
  }
  const siblingIndex = sibling.getIndexWithinParent();
  return { point: { parent, index: relation === "before" ? siblingIndex : siblingIndex + 1 } };
}

/**
 * The core Lexical update logic for inserting a markdown block. Exported for
 * direct testing without requiring a hocuspocus session. Must be called inside
 * an editor.update() callback.
 */
export function $insertMarkdownBlockInEditor({
  editor,
  mode,
  location,
  markdown,
  markdownToNodes,
}: {
  editor: LexicalEditor
  mode: ReplaceMode
  location: InsertLocation
  markdown: string
  markdownToNodes: (editor: LexicalEditor, markdown: string) => MarkdownConversion
}): InsertBlockResult {
  const { nodes: importedNodes, error } = markdownToNodes(editor, markdown);
  if (error) {
    return { inserted: false, note: error };
  }
  const { contentNodes: nodesToInsert, footnoteSections } = splitImportedFootnotes(importedNodes);
  if (nodesToInsert.length === 0) {
    return { inserted: false, note: "No insertable nodes were generated from markdown." };
  }
  const widgetProblem = $findWidgetInsertionProblem(nodesToInsert, mode);
  if (widgetProblem) {
    return { inserted: false, note: widgetProblem };
  }

  const { point, reason } = $resolveInsertionPoint(location);
  if (!point) {
    return { inserted: false, note: reason ?? `No block starts with locator text: ${JSON.stringify(location)}` };
  }

  const { parent, index: insertionIndex } = point;
  parent.splice(insertionIndex, 0, nodesToInsert);
  let suggestionId: string | undefined = undefined;
  if (mode === "suggest") {
    suggestionId = randomId();
    $wrapInsertedNodesAsSuggestion(nodesToInsert, parent, insertionIndex, suggestionId);
  }
  $appendImportedFootnotes(footnoteSections);
  return {
    inserted: true,
    note: mode === "suggest"
      ? "Inserted markdown block as suggestion."
      : "Inserted markdown block into collaborative draft.",
    insertionIndex,
    suggestionId,
  };
}

export async function insertMarkdownBlock({
  postId,
  token,
  mode,
  location,
  markdown,
  authorName,
  authorId,
}: {
  postId: string
  token: string
  mode: ReplaceMode
  location: InsertLocation
  markdown: string
  authorName: string
  authorId: string
}): Promise<InsertBlockResult> {
  const result: InsertBlockResult = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "InsertBlock",
    callback: async ({ editor, provider }) => {
      let result: InsertBlockResult = { inserted: false, note: "No insertion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          result = $insertMarkdownBlockInEditor({
            editor, mode, location, markdown,
            markdownToNodes: $postMarkdownToNodes,
          });
        }, { onUpdate: resolve });
      });

      if (result.inserted) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });

  if (mode === "suggest" && result.inserted && result.suggestionId) {
    const threadCreated = await tryCreateSuggestionThreadInCommentsDoc({
      collectionName: "Posts",
      documentId: postId,
      token,
      suggestionId: result.suggestionId,
      authorName,
      authorId,
      summaryItems: [{
        type: "insert",
        content: markdown,
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

  const parseResult = insertBlockToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "insertBlock", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, mode, location, markdown } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "insertBlock", postId, context, linkSharingKey: key, agentName, requiredAccess: requiredAccessForMode(mode) });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;
    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const insertResult = await insertMarkdownBlock({
      postId,
      token,
      mode,
      location,
      markdown,
      authorName,
      authorId,
    });

    captureAgentApiEvent({ route: "insertBlock", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: insertResult.inserted ? "inserted" : "not_inserted" });
    return NextResponse.json({
      ok: true,
      postId,
      inserted: insertResult.inserted,
      insertionIndex: insertResult.insertionIndex ?? null,
      note: insertResult.note,
      insertionMode: mode,
      suggestionId: insertResult.suggestionId ?? null,
      threadCreationFailed: insertResult.threadCreationFailed ?? false,
      mode: "lexical-collaboration-insert-block",
      requestId: randomId(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("insertBlock", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to insert markdown block in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
