import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { applyPatch } from "diff";
import { $createTextNode, $getRoot, $isElementNode, type LexicalNode } from "lexical";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $isIframeWidgetNode, type IframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { deriveAgentAuthor, isSupportedEditorType, unsupportedEditorMessage, waitForProviderFlush, withMainDocEditorSession, checkEditorTypeAndGetToken, UNAUTHORIZED_DRAFT_MESSAGE } from "../editorAgentUtil";

import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { replaceWidgetRouteSchema, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

const WIDGET_SUMMARY_MAX_LENGTH = 300;

function truncateForSummary(value: string): string {
  if (value.length <= WIDGET_SUMMARY_MAX_LENGTH) {
    return value;
  }
  return value.slice(0, WIDGET_SUMMARY_MAX_LENGTH) + "... [truncated]";
}

interface ReplaceWidgetResult {
  replaced: boolean
  widgetFound: boolean
  note: string
  suggestionId?: string
  previousContent?: string
  nextContent?: string
}

function findWidgetNodeById(rootNode: LexicalNode, widgetId: string): IframeWidgetNode | null {
  if ($isIframeWidgetNode(rootNode) && rootNode.getWidgetId() === widgetId) {
    return rootNode;
  }
  if (!$isElementNode(rootNode)) {
    return null;
  }
  for (const child of rootNode.getChildren()) {
    const match = findWidgetNodeById(child, widgetId);
    if (match) {
      return match;
    }
  }
  return null;
}

function computeReplacementContent({
  currentContent,
  replacement,
  unifiedDiff,
}: {
  currentContent: string
  replacement?: string
  unifiedDiff?: string
}): { ok: true, content: string } | { ok: false, note: string } {
  if (replacement !== undefined) {
    return { ok: true, content: replacement };
  }
  if (!unifiedDiff) {
    return { ok: false, note: "No replacement or unifiedDiff provided." };
  }
  const patched = applyPatch(currentContent, unifiedDiff);
  if (patched === false) {
    return { ok: false, note: "Unified diff could not be applied to widget content." };
  }
  return { ok: true, content: patched };
}

function applySuggestionWidgetReplacement(widgetNode: IframeWidgetNode, oldContent: string, newContent: string): string {
  const children = widgetNode.getChildren();
  for (const child of children) {
    child.remove();
  }
  const suggestionId = randomId();
  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  deleteSuggestion.append($createTextNode(oldContent));
  widgetNode.append(deleteSuggestion);

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  if (newContent.length > 0) {
    insertSuggestion.append($createTextNode(newContent));
  }
  widgetNode.append(insertSuggestion);
  return suggestionId;
}

export async function replaceWidgetInMainDoc({
  postId,
  token,
  widgetId,
  replacement,
  unifiedDiff,
  mode,
  authorName,
  authorId,
}: {
  postId: string
  token: string
  widgetId: string
  replacement?: string
  unifiedDiff?: string
  mode: ReplaceMode
  authorName: string
  authorId: string
}): Promise<ReplaceWidgetResult> {
  const result = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceWidget",
    callback: async ({ editor, provider }) => {
      let result: ReplaceWidgetResult = {
        replaced: false,
        widgetFound: false,
        note: "No widget replacement performed.",
      };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const widgetNode = findWidgetNodeById(root, widgetId);
          if (!widgetNode) {
            result = {
              replaced: false,
              widgetFound: false,
              note: `Widget with id ${widgetId} was not found.`,
            };
            return;
          }
          result.widgetFound = true;
          const currentContent = widgetNode.getTextContent();
          const replacementResult = computeReplacementContent({
            currentContent,
            replacement,
            unifiedDiff,
          });

          if (!replacementResult.ok) {
            result = {
              replaced: false,
              widgetFound: true,
              note: replacementResult.note,
            };
            return;
          }

          if (mode === "edit") {
            for (const child of widgetNode.getChildren()) {
              child.remove();
            }
            if (replacementResult.content.length > 0) {
              widgetNode.append($createTextNode(replacementResult.content));
            }
            result = {
              replaced: true,
              widgetFound: true,
              note: "Replaced widget HTML/JS content directly.",
            };
            return;
          }

          const suggestionId = applySuggestionWidgetReplacement(widgetNode, currentContent, replacementResult.content);
          result = {
            replaced: true,
            widgetFound: true,
            note: "Created delete/insert suggestion nodes for widget content replacement.",
            suggestionId,
            previousContent: currentContent,
            nextContent: replacementResult.content,
          };
        }, { onUpdate: resolve });
      });

      if (result.replaced) {
        await waitForProviderFlush(provider);
      }
      return result;
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
        content: truncateForSummary(result.previousContent ?? ""),
        replaceWith: truncateForSummary(result.nextContent ?? ""),
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

  const parseResult = replaceWidgetRouteSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "replaceWidget", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, widgetId, replacement, unifiedDiff, mode } = parseResult.data;

  try {
    const checkResult = await checkEditorTypeAndGetToken({ postId, context, linkSharingKey: key });
    if (checkResult.kind === "unsupported_editor") {
      captureAgentApiEvent({ route: "replaceWidget", postId, userId: context.currentUser?._id, agentName, status: "unsupported_editor" });
      return NextResponse.json({ error: unsupportedEditorMessage(checkResult.editorType) }, { status: 400 });
    }
    if (checkResult.kind === "unauthorized") {
      captureAgentApiEvent({ route: "replaceWidget", postId, userId: context.currentUser?._id, agentName, status: "unauthorized" });
      return NextResponse.json({ error: UNAUTHORIZED_DRAFT_MESSAGE }, { status: 403 });
    }
    const token = checkResult.token;
    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const result = await replaceWidgetInMainDoc({
      postId,
      token,
      widgetId,
      replacement,
      unifiedDiff,
      mode,
      authorName,
      authorId,
    });

    captureAgentApiEvent({ route: "replaceWidget", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: !result.widgetFound ? "widget_not_found" : result.replaced ? "replaced" : "not_replaced" });
    return NextResponse.json({
      ok: true,
      postId,
      widgetId,
      mode,
      replaced: result.replaced,
      widgetFound: result.widgetFound,
      note: result.note,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("replaceWidget", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to replace widget content in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
