import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import {
  $getRoot,
  $createTextNode,
} from "lexical";
import { $createIframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess } from "../editorAgentUtil";

import { resolveInsertionIndex } from "../insertBlock/route";
import { insertWidgetToolSchema, type InsertLocation } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface InsertWidgetResult {
  inserted: boolean
  note: string
  widgetId?: string
  insertionIndex?: number
}

function $insertWidgetInEditor({
  content,
  location,
}: {
  content: string
  location: InsertLocation
}): InsertWidgetResult {
  const root = $getRoot();
  const insertionIndex = resolveInsertionIndex(location, root.getChildren());
  if (insertionIndex === null) {
    return { inserted: false, note: `No paragraph markdown starts with locator text: ${JSON.stringify(location)}` };
  }

  const widgetId = randomId();
  const widgetNode = $createIframeWidgetNode(widgetId);
  widgetNode.append($createTextNode(content));

  root.splice(insertionIndex, 0, [widgetNode]);
  return {
    inserted: true,
    note: `Inserted widget (id: ${widgetId}) at index ${insertionIndex}.`,
    widgetId,
    insertionIndex,
  };
}

async function insertWidget({
  postId,
  token,
  content,
  location,
}: {
  postId: string
  token: string
  content: string
  location: InsertLocation
}): Promise<InsertWidgetResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "InsertWidget",
    callback: async ({ editor, provider }) => {
      let result: InsertWidgetResult = { inserted: false, note: "No insertion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          result = $insertWidgetInEditor({ content, location });
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

  const parseResult = insertWidgetToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "insertWidget", postId: body?.postId, userId: context.currentUser?._id, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, content, location } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "insertWidget", postId, context, linkSharingKey: key });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;

    const result = await insertWidget({
      postId,
      token,
      content,
      location,
    });

    captureAgentApiEvent({ route: "insertWidget", postId, userId: context.currentUser?._id, status: "success", operationResult: result.inserted ? "inserted" : "not_inserted" });
    return NextResponse.json({
      ok: true,
      postId,
      inserted: result.inserted,
      widgetId: result.widgetId ?? null,
      insertionIndex: result.insertionIndex ?? null,
      note: result.note,
      mode: "lexical-collaboration-insert-widget",
      requestId: randomId(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("insertWidget", error, { postId, userId: context.currentUser?._id });
    return NextResponse.json(
      {
        error: "Failed to insert widget in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
