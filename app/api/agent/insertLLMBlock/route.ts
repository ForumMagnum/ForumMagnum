import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import {
  $getRoot,
  $createParagraphNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $createLLMContentBlockNode } from "@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockNode";
import { $createLLMContentBlockContentNode } from "@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockContentNode";
import { $createLLMContentBlockHeaderNode } from "@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockHeaderNode";
import { isSupportedEditorType, unsupportedEditorMessage, waitForProviderFlush, withMainDocEditorSession, checkEditorTypeAndGetToken, UNAUTHORIZED_DRAFT_MESSAGE } from "../editorAgentUtil";

import { $markdownToNodes, resolveInsertionIndex } from "../insertBlock/route";
import { insertLLMBlockToolSchema, type InsertLocation } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface InsertLLMBlockResult {
  inserted: boolean
  note: string
  insertionIndex?: number
}

/**
 * Build a complete LLM content block node tree from markdown content.
 * Must be called inside an editor.update() callback.
 *
 * Structure:
 *   LLMContentBlockNode (container, shadow root, holds modelName)
 *     LLMContentBlockHeaderNode (decorator, renders model name UI)
 *     LLMContentBlockContentNode (shadow root, holds editable content)
 *       ...content nodes from markdown...
 */
function $createLLMContentBlockFromMarkdown(
  editor: LexicalEditor,
  modelName: string,
  markdown: string,
): LexicalNode {
  const containerNode = $createLLMContentBlockNode(modelName);
  const headerNode = $createLLMContentBlockHeaderNode();
  const contentNode = $createLLMContentBlockContentNode();

  const contentChildren = $markdownToNodes(editor, markdown);
  if (contentChildren.length === 0) {
    contentNode.append($createParagraphNode());
  } else {
    for (const child of contentChildren) {
      contentNode.append(child);
    }
  }

  containerNode.append(headerNode);
  containerNode.append(contentNode);
  return containerNode;
}

function $insertLLMBlockInEditor({
  editor,
  modelName,
  location,
  markdown,
}: {
  editor: LexicalEditor
  modelName: string
  location: InsertLocation
  markdown: string
}): InsertLLMBlockResult {
  const blockNode = $createLLMContentBlockFromMarkdown(editor, modelName, markdown);

  const root = $getRoot();
  const insertionIndex = resolveInsertionIndex(location, root.getChildren());
  if (insertionIndex === null) {
    return { inserted: false, note: `No paragraph markdown starts with locator text: ${JSON.stringify(location)}` };
  }

  root.splice(insertionIndex, 0, [blockNode]);
  return {
    inserted: true,
    note: `Inserted LLM content block (model: ${modelName}) at index ${insertionIndex}.`,
    insertionIndex,
  };
}

async function insertLLMBlock({
  postId,
  token,
  modelName,
  location,
  markdown,
}: {
  postId: string
  token: string
  modelName: string
  location: InsertLocation
  markdown: string
}): Promise<InsertLLMBlockResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "InsertLLMBlock",
    callback: async ({ editor, provider }) => {
      let result: InsertLLMBlockResult = { inserted: false, note: "No insertion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          result = $insertLLMBlockInEditor({ editor, modelName, location, markdown });
        }, { onUpdate: resolve });
      });

      if (result.inserted) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = insertLLMBlockToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "insertLLMBlock", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.modelName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, modelName, location, markdown } = parseResult.data;

  try {
    const checkResult = await checkEditorTypeAndGetToken({ postId, context, linkSharingKey: key });
    if (checkResult.kind === "unsupported_editor") {
      captureAgentApiEvent({ route: "insertLLMBlock", postId, userId: context.currentUser?._id, agentName: modelName, status: "unsupported_editor" });
      return NextResponse.json({ error: unsupportedEditorMessage(checkResult.editorType) }, { status: 400 });
    }
    if (checkResult.kind === "unauthorized") {
      captureAgentApiEvent({ route: "insertLLMBlock", postId, userId: context.currentUser?._id, agentName: modelName, status: "unauthorized" });
      return NextResponse.json({ error: UNAUTHORIZED_DRAFT_MESSAGE }, { status: 403 });
    }
    const token = checkResult.token;

    const result = await insertLLMBlock({
      postId,
      token,
      modelName,
      location,
      markdown,
    });

    captureAgentApiEvent({ route: "insertLLMBlock", postId, userId: context.currentUser?._id, agentName: modelName, status: "success", operationResult: result.inserted ? "inserted" : "not_inserted" });
    return NextResponse.json({
      ok: true,
      postId,
      inserted: result.inserted,
      insertionIndex: result.insertionIndex ?? null,
      note: result.note,
      modelName,
      mode: "lexical-collaboration-insert-llm-block",
      requestId: randomId(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("insertLLMBlock", error, { postId, userId: context.currentUser?._id, agentName: modelName });
    return NextResponse.json(
      {
        error: "Failed to insert LLM content block in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
