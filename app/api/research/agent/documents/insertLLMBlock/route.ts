import { NextRequest, NextResponse } from "next/server";
import {
  $getRoot,
  $createParagraphNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { $createLLMContentBlockNode } from "@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockNode";
import { $createLLMContentBlockContentNode } from "@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockContentNode";
import { $createLLMContentBlockHeaderNode } from "@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockHeaderNode";
import { $markdownToNodes, resolveInsertionIndex } from "../../../../agent/insertBlock/route";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { withResearchDocEditorSession } from "../../researchEditorSession";
import { insertLLMBlockInResearchDocSchema } from "../../researchToolSchemas";
import type { InsertLocation } from "../../../../agent/toolSchemas";

const ROUTE = "documents.insertLLMBlock";

interface InsertLLMBlockResult {
  inserted: boolean;
  note: string;
  insertionIndex?: number;
}

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

async function insertLLMBlockInResearchDoc({
  documentId,
  hocuspocusToken,
  modelName,
  location,
  markdown,
}: {
  documentId: string;
  hocuspocusToken: string;
  modelName: string;
  location: InsertLocation;
  markdown: string;
}): Promise<InsertLLMBlockResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchInsertLLMBlock",
    callback: async ({ editor, provider }) => {
      let result: InsertLLMBlockResult = { inserted: false, note: "No insertion performed." };
      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            const blockNode = $createLLMContentBlockFromMarkdown(editor, modelName, markdown);
            const root = $getRoot();
            const insertionIndex = resolveInsertionIndex(location, root.getChildren());
            if (insertionIndex === null) {
              result = {
                inserted: false,
                note: `No paragraph markdown starts with locator text: ${JSON.stringify(location)}`,
              };
              return;
            }
            root.splice(insertionIndex, 0, [blockNode]);
            result = {
              inserted: true,
              note: `Inserted LLM content block (model: ${modelName}) at index ${insertionIndex}.`,
              insertionIndex,
            };
          },
          { onUpdate: resolve },
        );
      });
      if (result.inserted) {
        await waitForProviderFlush(provider);
      }
      return result;
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

  const parseResult = insertLLMBlockInResearchDocSchema.safeParse(body);
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

  const { documentId, modelName, location, markdown } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const result = await insertLLMBlockInResearchDoc({
      documentId,
      hocuspocusToken,
      modelName,
      location,
      markdown,
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: result.inserted ? "inserted" : "not_inserted",
    });

    return NextResponse.json({
      ok: true,
      documentId,
      inserted: result.inserted,
      insertionIndex: result.insertionIndex ?? null,
      note: result.note,
      modelName,
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
        error: "Failed to insert LLM content block in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
