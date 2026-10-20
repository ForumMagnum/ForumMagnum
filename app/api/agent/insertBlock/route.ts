import { sanitize } from "@/lib/utils/sanitize";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import type MarkdownIt from "markdown-it";
import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
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
import { deriveAgentAuthor, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess } from "../editorAgentUtil";

import { normalizeImportedTopLevelNodes } from "../../(markdown)/editorMarkdownUtils";
import { $locateBlockByPrefix } from "../textIndexQuoteLocator";
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

/**
 * Swap each widget fence for a placeholder paragraph, so the fence survives
 * markdown rendering wherever it appears (including inside collapsible
 * sections); the placeholders are turned into widget nodes after import.
 */
function replaceWidgetFencesWithPlaceholders(markdown: string): { markdown: string, widgetsByPlaceholder: Map<string, WidgetFence> } {
  const widgetsByPlaceholder = new Map<string, WidgetFence>();
  const widgetFenceRegex = /```widget\[(.*?)\]\n([\s\S]*?)\n```/g;
  const replaced = markdown.replace(widgetFenceRegex, (_match, rawWidgetId: string, rawWidgetMarkup: string) => {
    const placeholder = `widgetplaceholder${randomId()}`;
    widgetsByPlaceholder.set(placeholder, {
      widgetId: (rawWidgetId ?? "").trim() || randomId(),
      widgetMarkup: rawWidgetMarkup ?? "",
    });
    return `\n\n${placeholder}\n\n`;
  });
  return { markdown: replaced, widgetsByPlaceholder };
}

function $createWidgetNodeFromFence({ widgetId, widgetMarkup }: WidgetFence): IframeWidgetNode {
  const widgetNode = $createIframeWidgetNode(widgetId);
  widgetNode.append($createTextNode(widgetMarkup));
  return widgetNode;
}

function $getPlaceholderWidget(node: LexicalNode, widgetsByPlaceholder: Map<string, WidgetFence>): WidgetFence | undefined {
  return $isParagraphNode(node) ? widgetsByPlaceholder.get(node.getTextContent().trim()) : undefined;
}

function $replaceNestedWidgetPlaceholders(parent: ElementNode, widgetsByPlaceholder: Map<string, WidgetFence>): void {
  for (const child of parent.getChildren()) {
    const widget = $getPlaceholderWidget(child, widgetsByPlaceholder);
    if (widget) {
      child.replace($createWidgetNodeFromFence(widget));
    } else if ($isElementNode(child)) {
      $replaceNestedWidgetPlaceholders(child, widgetsByPlaceholder);
    }
  }
}

function $replaceWidgetPlaceholders(nodes: LexicalNode[], widgetsByPlaceholder: Map<string, WidgetFence>): LexicalNode[] {
  if (widgetsByPlaceholder.size === 0) return nodes;
  return nodes.map((node) => {
    const widget = $getPlaceholderWidget(node, widgetsByPlaceholder);
    if (widget) return $createWidgetNodeFromFence(widget);
    if ($isElementNode(node)) $replaceNestedWidgetPlaceholders(node, widgetsByPlaceholder);
    return node;
  });
}

function parseWholeWidgetFence(markdown: string): { widgetId: string, widgetMarkup: string } | null {
  const trimmed = markdown.trim();
  const match = trimmed.match(/^```widget\[(.*?)\]\n([\s\S]*?)\n```$/);
  if (!match) {
    return null;
  }
  const widgetId = (match[1] ?? "").trim() || randomId();
  const widgetMarkup = match[2] ?? "";
  return { widgetId, widgetMarkup };
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

  // Use text-level selection on the first/last text descendants when possible,
  // which avoids a bug where root-level element selection clips the first
  // character. For non-element, non-text nodes (e.g. decorator nodes like
  // horizontal rules), fall back to element selection on the parent.
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

export function $markdownToNodes(
  editor: LexicalEditor,
  markdown: string,
  options: { markdownIt: MarkdownIt },
): LexicalNode[] {
  const id = randomId();
  const html = sanitize(options.markdownIt.render(markdown, { docId: id }));
  const dom = new JSDOM(html);
  const importedNodes = $generateNodesFromDOM(editor, dom.window.document);
  return normalizeImportedTopLevelNodes(importedNodes);
}

export function $postMarkdownToNodes(editor: LexicalEditor, markdown: string): LexicalNode[] {
  const wholeFence = parseWholeWidgetFence(markdown);
  if (wholeFence) {
    return [$createWidgetNodeFromFence(wholeFence)];
  }

  const { markdown: markdownWithPlaceholders, widgetsByPlaceholder } = replaceWidgetFencesWithPlaceholders(markdown);
  const nodes = $markdownToNodes(editor, markdownWithPlaceholders, { markdownIt: getMarkdownItForAgentPosts() });
  return $replaceWidgetPlaceholders(nodes, widgetsByPlaceholder);
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
  const { node, reason } = $locateBlockByPrefix(prefix);
  if (!node) return { point: null, reason };
  if (!$isCollapsibleSectionContainerNode(node)) {
    return { point: null, reason: "The \"inside\" locator must match a collapsible section's \"+++ Title\" line." };
  }
  const content = node.getChildren().find($isCollapsibleSectionContentNode);
  if (!content) {
    return { point: null, reason: "The matched collapsible section has no body to insert into." };
  }
  return { point: { parent: content, index: position === "start" ? 0 : content.getChildrenSize() } };
}

/**
 * Resolve an insert location to a parent node and child index. Must be called
 * inside a Lexical read/update context.
 */
export function $resolveInsertionPoint(location: InsertLocation): InsertionPointResult {
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
  markdownToNodes: (editor: LexicalEditor, markdown: string) => LexicalNode[]
}): InsertBlockResult {
  const nodesToInsert = markdownToNodes(editor, markdown);
  if (nodesToInsert.length === 0) {
    return { inserted: false, note: "No insertable nodes were generated from markdown." };
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
    const auth = await authorizeAgentDraftAccess({ route: "insertBlock", postId, context, linkSharingKey: key, agentName });
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
