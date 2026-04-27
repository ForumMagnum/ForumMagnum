import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createRangeSelection, $getRoot, $setSelection } from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { deriveAgentAuthor, unsupportedEditorMessage, waitForProviderFlush, withMainDocEditorSession, checkEditorTypeAndGetToken, UNAUTHORIZED_DRAFT_MESSAGE } from "../editorAgentUtil";

import { buildNodeMarkdownMapForSubtree, findBlockToOperateOnByPrefix, toPlainTextFilter } from "../mapMarkdownToLexical";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { deleteBlockToolSchema, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface DeleteBlockResult {
  deleted: boolean
  note: string
  deletionIndex?: number
  suggestionId?: string
}

export async function deleteMarkdownBlock({
  postId,
  token,
  mode,
  prefix,
  authorName,
  authorId,
}: {
  postId: string
  token: string
  mode: ReplaceMode
  prefix: string
  authorName: string
  authorId: string
}): Promise<DeleteBlockResult> {
  const result = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "DeleteBlock",
    callback: async ({ editor, provider }) => {
      let result: DeleteBlockResult = { deleted: false, note: "No deletion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const rootChildren = root.getChildren();
          const textFilter = toPlainTextFilter(prefix);
          const mapResult = buildNodeMarkdownMapForSubtree(root.getKey(), textFilter);

          const nodeToDelete = findBlockToOperateOnByPrefix({
            rootChildren,
            prefix,
            mapResult,
            textFilter,
          });

          if (!nodeToDelete) {
            result = {
              deleted: false,
              note: `No paragraph or list item markdown starts with locator text: ${prefix}`,
            };
            return;
          }

          const parent = nodeToDelete.getParent();
          if (!parent) {
            result = {
              deleted: false,
              note: "Matched block has no parent and cannot be deleted.",
            };
            return;
          }
          const indexInParent = nodeToDelete.getIndexWithinParent();

          if (mode === "edit") {
            nodeToDelete.remove();
            // If we just removed the last list item from a list, drop the
            // (now-empty) list too — leaving an empty list behind looks like
            // a rendering glitch in the editor.
            if (parent !== root && parent.getChildrenSize() === 0) {
              parent.remove();
            }
            result = {
              deleted: true,
              note: "Deleted markdown block from collaborative draft.",
              deletionIndex: indexInParent,
            };
            return;
          }

          const selection = $createRangeSelection();
          selection.anchor.set(parent.getKey(), indexInParent, "element");
          selection.focus.set(parent.getKey(), indexInParent + 1, "element");
          $setSelection(selection);
          const suggestionId = randomId();
          $wrapSelectionInSuggestionNode(selection, false, suggestionId, "delete");
          result = {
            deleted: true,
            note: "Marked markdown block as a deletion suggestion.",
            deletionIndex: indexInParent,
            suggestionId,
          };
        }, { onUpdate: resolve });
      });

      if (result.deleted) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });

  if (mode === "suggest" && result.deleted && result.suggestionId) {
    await createSuggestionThreadInCommentsDoc({
      postId,
      token,
      suggestionId: result.suggestionId,
      authorName,
      authorId,
      summaryItems: [{
        type: "delete",
        content: prefix,
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

  const parseResult = deleteBlockToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "deleteBlock", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, mode, prefix } = parseResult.data;

  try {
    const checkResult = await checkEditorTypeAndGetToken({ postId, context, linkSharingKey: key });
    if (checkResult.kind === "unsupported_editor") {
      captureAgentApiEvent({ route: "deleteBlock", postId, userId: context.currentUser?._id, agentName, status: "unsupported_editor" });
      return NextResponse.json({ error: unsupportedEditorMessage(checkResult.editorType) }, { status: 400 });
    }
    if (checkResult.kind === "unauthorized") {
      captureAgentApiEvent({ route: "deleteBlock", postId, userId: context.currentUser?._id, agentName, status: "unauthorized" });
      return NextResponse.json({ error: UNAUTHORIZED_DRAFT_MESSAGE }, { status: 403 });
    }
    const token = checkResult.token;
    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const deleteResult = await deleteMarkdownBlock({
      postId,
      token,
      mode,
      prefix,
      authorName,
      authorId,
    });

    captureAgentApiEvent({ route: "deleteBlock", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: deleteResult.deleted ? "deleted" : "block_not_found" });
    return NextResponse.json({
      ok: true,
      postId,
      deleted: deleteResult.deleted,
      deletionIndex: deleteResult.deletionIndex ?? null,
      note: deleteResult.note,
      deletionMode: mode,
      mode: "lexical-collaboration-delete-block",
      requestId: randomId(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("deleteBlock", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to delete markdown block in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
