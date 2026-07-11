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
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { $createIframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { deriveAgentAuthor, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess } from "../editorAgentUtil";

import { normalizeImportedTopLevelNodes } from "../../(markdown)/editorMarkdownUtils";
import { $locateBlockByPrefix } from "../textIndexQuoteLocator";
import { tryCreateSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { insertBlockToolSchema, type InsertLocation, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import { getMarkdownImageWarnings, noteWithAgentEditWarnings, type AgentEditWarning } from "../imageValidation";

interface InsertBlockResult {
  inserted: boolean
  note: string
  insertionIndex?: number
  suggestionId?: string
  warnings?: AgentEditWarning[]
  /** True when a suggestion was applied but its review thread couldn't be created. */
  threadCreationFailed?: boolean
}

function getInsertionIndexByLocation(location: InsertLocation): { mode: "fixed", index: number } | { mode: "prefix", relation: "before" | "after", prefix: string } {
  if (location === "start") {
    return { mode: "fixed", index: 0 };
  } else if (location === "end") {
    return { mode: "fixed", index: Number.MAX_SAFE_INTEGER };
  } else if ("before" in location) {
    return { mode: "prefix", relation: "before", prefix: location.before };
  } else if ("after" in location) {
    return { mode: "prefix", relation: "after", prefix: location.after };
  } else {
    throw new Error(`Invalid location: ${JSON.stringify(location)}`);
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function transformWidgetFencesToInlineIframeHtml(markdown: string): string {
  const widgetFenceRegex = /```widget\[(.*?)\]\n([\s\S]*?)\n```/g;
  return markdown.replace(widgetFenceRegex, (_match, rawWidgetId: string, rawWidgetMarkup: string) => {
    const widgetId = (rawWidgetId ?? "").trim() || randomId();
    const widgetMarkup = rawWidgetMarkup ?? "";
    return `<iframe data-lexical-iframe-widget="true" data-widget-id="${escapeHtmlAttribute(widgetId)}" srcdoc="${escapeHtmlAttribute(widgetMarkup)}"></iframe>`;
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
 * Wraps already-inserted top-level nodes in suggestion markup. Must be called
 * inside a Lexical editor.update() callback, after the nodes have been spliced
 * into the root at insertionIndex.
 */
function $wrapInsertedNodesAsSuggestion(nodesToInsert: LexicalNode[], insertionIndex: number, suggestionId: string): void {
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
  // horizontal rules), fall back to root-level element selection.
  const root = $getRoot();
  const selection = $createRangeSelection();
  if (firstDescendant && $isTextNode(firstDescendant)) {
    selection.anchor.set(firstDescendant.getKey(), 0, "text");
  } else {
    selection.anchor.set(root.getKey(), insertionIndex, "element");
  }
  if (lastDescendant && $isTextNode(lastDescendant)) {
    selection.focus.set(lastDescendant.getKey(), lastDescendant.getTextContentSize(), "text");
  } else {
    selection.focus.set(root.getKey(), insertionIndex + nodesToInsert.length, "element");
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
    const widgetNode = $createIframeWidgetNode(wholeFence.widgetId);
    widgetNode.append($createTextNode(wholeFence.widgetMarkup));
    return [widgetNode];
  }

  const markdownWithWidgetIframes = transformWidgetFencesToInlineIframeHtml(markdown);
  return $markdownToNodes(editor, markdownWithWidgetIframes, { markdownIt: getMarkdownItForAgentPosts() });
}

export interface InsertionIndexResult {
  index: number | null
  /** Why no index could be resolved (e.g. an ambiguous prefix). */
  reason?: string
}

function findInsertionIndexByPrefix(
  prefix: string,
  relation: "before" | "after",
): InsertionIndexResult {
  const blockResult = $locateBlockByPrefix(prefix);
  const matched = blockResult.node;
  if (!matched) return { index: null, reason: blockResult.reason };
  // The locator may descend into list items (at any nesting depth), but
  // insertion always happens at the top level — translate the match back to
  // its top-level ancestor's index, so the caller inserts before/after the
  // whole list rather than splitting the list open.
  const topLevel = matched.getTopLevelElement() ?? matched;
  const topLevelIndex = topLevel.getIndexWithinParent();
  return { index: relation === "before" ? topLevelIndex : topLevelIndex + 1 };
}

export function resolveInsertionIndex(location: InsertLocation, rootChildren: LexicalNode[]): InsertionIndexResult {
  const target = getInsertionIndexByLocation(location);
  if (target.mode === "fixed") {
    return { index: target.index === Number.MAX_SAFE_INTEGER ? rootChildren.length : target.index };
  }
  return findInsertionIndexByPrefix(target.prefix, target.relation);
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

  const root = $getRoot();
  const { index: insertionIndex, reason } = resolveInsertionIndex(location, root.getChildren());
  if (insertionIndex === null) {
    return { inserted: false, note: reason ?? `No block starts with locator text: ${JSON.stringify(location)}` };
  }

  root.splice(insertionIndex, 0, nodesToInsert);
  let suggestionId: string | undefined = undefined;
  if (mode === "suggest") {
    suggestionId = randomId();
    $wrapInsertedNodesAsSuggestion(nodesToInsert, insertionIndex, suggestionId);
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

  if (result.inserted) {
    result.warnings = await getMarkdownImageWarnings(markdown, getMarkdownItForAgentPosts());
    result.note = noteWithAgentEditWarnings(result.note, result.warnings);
  }

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
      warnings: insertResult.warnings ?? [],
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
