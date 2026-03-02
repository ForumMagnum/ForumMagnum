import { markdownToHtml } from "@/server/editor/conversionUtils";
import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $createRangeSelection,
  $setSelection,
  $createTextNode,
  $isDecoratorNode,
  $isElementNode,
  $createParagraphNode,
  type LexicalNode,
} from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { $createIframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { deriveAgentAuthor, HOCUSPOCUS_FLUSH_WAIT_MS, paragraphMarkdownStartsWith, plainTextStartsWith, sleep, withMainDocEditorSession } from "../editorAgentUtil";
import { buildNodeMarkdownMapForSubtree } from "../mapMarkdownToLexical";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { insertBlockToolSchema, type InsertLocation, type ReplaceMode } from "../toolSchemas";
import { getHocuspocusToken } from "../getHocuspocusToken";
import { captureException } from "@/lib/sentryWrapper";

interface InsertBlockResult {
  inserted: boolean
  note: string
  insertionIndex?: number
  suggestionId?: string
}

function normalizeImportedTopLevelNodes(nodes: LexicalNode[]): LexicalNode[] {
  const normalized: LexicalNode[] = [];
  for (const node of nodes) {
    if ($isElementNode(node) || $isDecoratorNode(node)) {
      normalized.push(node);
    } else {
      const paragraph = $createParagraphNode();
      paragraph.append(node);
      normalized.push(paragraph);
    }
  }
  return normalized;
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
    callback: async ({ editor }) => {
      let result: InsertBlockResult = { inserted: false, note: "No insertion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const widgetFence = parseWholeWidgetFence(markdown);
          const nodesToInsert = widgetFence
            ? (() => {
              const widgetNode = $createIframeWidgetNode(widgetFence.widgetId);
              widgetNode.append($createTextNode(widgetFence.widgetMarkup));
              return [widgetNode];
            })()
            : (() => {
              const markdownWithWidgetIframes = transformWidgetFencesToInlineIframeHtml(markdown);
              const html = markdownToHtml(markdownWithWidgetIframes);
              const dom = new JSDOM(html);
              const importedNodes = $generateNodesFromDOM(editor, dom.window.document);
              return normalizeImportedTopLevelNodes(importedNodes);
            })();

          if (nodesToInsert.length === 0) {
            result = { inserted: false, note: "No insertable nodes were generated from markdown." };
            return;
          }

          const insertionTarget = getInsertionIndexByLocation(location);
          const rootChildren = root.getChildren();
          let insertionIndex: number | null = null;

          if (insertionTarget.mode === "fixed") {
            insertionIndex = insertionTarget.index === Number.MAX_SAFE_INTEGER ? rootChildren.length : insertionTarget.index;
          } else {
            const mapResult = buildNodeMarkdownMapForSubtree(root.getKey());
            for (let i = 0; i < rootChildren.length; i++) {
              const child = rootChildren[i];
              const childMarkdown = mapResult.byKey.get(child.getKey())?.markdown;
              if (!childMarkdown) {
                if (plainTextStartsWith(child.getTextContent(), insertionTarget.prefix)) {
                  insertionIndex = insertionTarget.relation === "before" ? i : i + 1;
                  break;
                }
                continue;
              }
              if (
                paragraphMarkdownStartsWith(childMarkdown, insertionTarget.prefix) ||
                plainTextStartsWith(child.getTextContent(), insertionTarget.prefix)
              ) {
                insertionIndex = insertionTarget.relation === "before" ? i : i + 1;
                break;
              }
            }
            if (insertionIndex === null) {
              result = {
                inserted: false,
                note: `No paragraph markdown starts with locator text: ${insertionTarget.prefix}`,
              };
              return;
            }
          }

          root.splice(insertionIndex, 0, nodesToInsert);
          let suggestionId: string | undefined = undefined;
          if (mode === "suggest") {
            const insertedCount = nodesToInsert.length;
            const selection = $createRangeSelection();
            selection.anchor.set(root.getKey(), insertionIndex, "element");
            selection.focus.set(root.getKey(), insertionIndex + insertedCount, "element");
            $setSelection(selection);
            suggestionId = randomId();
            $wrapSelectionInSuggestionNode(selection, false, suggestionId, "insert");
          }
          result = {
            inserted: true,
            note: mode === "suggest"
              ? "Inserted markdown block as suggestion."
              : "Inserted markdown block into collaborative draft.",
            insertionIndex,
            suggestionId,
          };
        }, { onUpdate: resolve });
      });

      if (result.inserted) {
        await sleep(HOCUSPOCUS_FLUSH_WAIT_MS);
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
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, mode, location, markdown } = parseResult.data;

  try {
    const token = await getHocuspocusToken(context, postId, key);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized to edit draft" }, { status: 403 });
    }
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
    return NextResponse.json(
      {
        error: "Failed to insert markdown block in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
