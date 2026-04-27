import { markdownToHtml } from "@/server/editor/conversionUtils";
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
import { deriveAgentAuthor, isSupportedEditorType, normalizeText, paragraphMarkdownStartsWith, plainTextStartsWith, unsupportedEditorMessage, waitForProviderFlush, withMainDocEditorSession, checkEditorTypeAndGetToken, UNAUTHORIZED_DRAFT_MESSAGE } from "../editorAgentUtil";

import { normalizeImportedTopLevelNodes } from "../../(markdown)/editorMarkdownUtils";
import { buildNodeMarkdownMapForSubtree, toPlainTextFilter } from "../mapMarkdownToLexical";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { insertBlockToolSchema, type InsertLocation, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface InsertBlockResult {
  inserted: boolean
  note: string
  insertionIndex?: number
  suggestionId?: string
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

export function $markdownToNodes(editor: LexicalEditor, markdown: string): LexicalNode[] {
  const widgetFence = parseWholeWidgetFence(markdown);
  if (widgetFence) {
    const widgetNode = $createIframeWidgetNode(widgetFence.widgetId);
    widgetNode.append($createTextNode(widgetFence.widgetMarkup));
    return [widgetNode];
  }

  const markdownWithWidgetIframes = transformWidgetFencesToInlineIframeHtml(markdown);
  const html = markdownToHtml(markdownWithWidgetIframes);
  const dom = new JSDOM(html);
  const importedNodes = $generateNodesFromDOM(editor, dom.window.document);
  return normalizeImportedTopLevelNodes(importedNodes);
}

function findInsertionIndexByPrefix(
  rootChildren: LexicalNode[],
  prefix: string,
  relation: "before" | "after",
): number | null {
  const textFilter = toPlainTextFilter(prefix);
  const mapResult = buildNodeMarkdownMapForSubtree($getRoot().getKey(), textFilter);
  for (let i = 0; i < rootChildren.length; i++) {
    const child = rootChildren[i];
    const childMarkdown = mapResult.byKey.get(child.getKey())?.markdown;
    const textContent = child.getTextContent();
    if (!childMarkdown) {
      if (
        plainTextStartsWith(textContent, prefix) ||
        (textFilter && normalizeText(textContent).startsWith(textFilter))
      ) {
        return relation === "before" ? i : i + 1;
      }
      continue;
    }
    if (
      paragraphMarkdownStartsWith(childMarkdown, prefix) ||
      plainTextStartsWith(textContent, prefix) ||
      (textFilter && normalizeText(textContent).startsWith(textFilter))
    ) {
      return relation === "before" ? i : i + 1;
    }
  }
  return null;
}

export function resolveInsertionIndex(location: InsertLocation, rootChildren: LexicalNode[]): number | null {
  const target = getInsertionIndexByLocation(location);
  if (target.mode === "fixed") {
    return target.index === Number.MAX_SAFE_INTEGER ? rootChildren.length : target.index;
  }
  return findInsertionIndexByPrefix(rootChildren, target.prefix, target.relation);
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
}: {
  editor: LexicalEditor
  mode: ReplaceMode
  location: InsertLocation
  markdown: string
}): InsertBlockResult {
  const nodesToInsert = $markdownToNodes(editor, markdown);
  if (nodesToInsert.length === 0) {
    return { inserted: false, note: "No insertable nodes were generated from markdown." };
  }

  const root = $getRoot();
  const insertionIndex = resolveInsertionIndex(location, root.getChildren());
  if (insertionIndex === null) {
    return { inserted: false, note: `No paragraph markdown starts with locator text: ${JSON.stringify(location)}` };
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
  const result = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "InsertBlock",
    callback: async ({ editor, provider }) => {
      let result: InsertBlockResult = { inserted: false, note: "No insertion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          result = $insertMarkdownBlockInEditor({ editor, mode, location, markdown });
        }, { onUpdate: resolve });
      });

      if (result.inserted) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });

  if (mode === "suggest" && result.inserted && result.suggestionId) {
    await createSuggestionThreadInCommentsDoc({
      postId,
      token,
      suggestionId: result.suggestionId,
      authorName,
      authorId,
      summaryItems: [{
        type: "insert",
        content: markdown,
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

  const parseResult = insertBlockToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "insertBlock", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, mode, location, markdown } = parseResult.data;

  try {
    const checkResult = await checkEditorTypeAndGetToken({ postId, context, linkSharingKey: key });
    if (checkResult.kind === "unsupported_editor") {
      captureAgentApiEvent({ route: "insertBlock", postId, userId: context.currentUser?._id, agentName, status: "unsupported_editor" });
      return NextResponse.json({ error: unsupportedEditorMessage(checkResult.editorType) }, { status: 400 });
    }
    if (checkResult.kind === "unauthorized") {
      captureAgentApiEvent({ route: "insertBlock", postId, userId: context.currentUser?._id, agentName, status: "unauthorized" });
      return NextResponse.json({ error: UNAUTHORIZED_DRAFT_MESSAGE }, { status: 403 });
    }
    const token = checkResult.token;
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
