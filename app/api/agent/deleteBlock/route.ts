import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createRangeSelection, $getRoot, $nodesOfType, $setSelection, type LexicalNode } from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { ProtonNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { deriveAgentAuthor, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess } from "../editorAgentUtil";

import { $locateBlockByPrefix } from "../textIndexQuoteLocator";
import { tryCreateSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { deleteBlockToolSchema, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface DeleteBlockResult {
  deleted: boolean
  note: string
  deletionIndex?: number
  suggestionId?: string
  /** True when a suggestion was applied but its review thread couldn't be created. */
  threadCreationFailed?: boolean
}

/**
 * Wrap a matched block as a deletion suggestion, reporting whether any
 * suggestion was actually created. `$wrapSelectionInSuggestionNode` has no
 * case for block-level decorators (e.g. a top-level display MathNode) and
 * silently creates nothing for them; its return value can't be checked
 * directly because the table case creates per-cell suggestion nodes without
 * reporting them — so success is verified by inspecting the tree for nodes
 * carrying this call's suggestionId. Exported for testing. Must be called
 * inside a Lexical update context.
 */
export function $wrapBlockAsDeletionSuggestion(blockNode: LexicalNode, suggestionId: string): boolean {
  const parent = blockNode.getParent();
  if (!parent) return false;
  const indexInParent = blockNode.getIndexWithinParent();
  const selection = $createRangeSelection();
  selection.anchor.set(parent.getKey(), indexInParent, "element");
  selection.focus.set(parent.getKey(), indexInParent + 1, "element");
  $setSelection(selection);
  $wrapSelectionInSuggestionNode(selection, false, suggestionId, "delete");
  return $nodesOfType(ProtonNode).some((node) => node.getSuggestionIdOrThrow() === suggestionId);
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
  const result: DeleteBlockResult = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "DeleteBlock",
    callback: async ({ editor, provider }) => {
      let result: DeleteBlockResult = { deleted: false, note: "No deletion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const blockResult = $locateBlockByPrefix(prefix);
          const nodeToDelete = blockResult.node;

          if (!nodeToDelete) {
            result = {
              deleted: false,
              note: blockResult.reason ?? `No block starts with locator text: ${prefix}`,
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

          const suggestionId = randomId();
          if (!$wrapBlockAsDeletionSuggestion(nodeToDelete, suggestionId)) {
            result = {
              deleted: false,
              note: "This block type cannot be wrapped as a deletion suggestion. Retry with mode \"edit\" to delete it directly.",
            };
            return;
          }
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
    const threadCreated = await tryCreateSuggestionThreadInCommentsDoc({
      collectionName: "Posts",
      documentId: postId,
      token,
      suggestionId: result.suggestionId,
      authorName,
      authorId,
      summaryItems: [{
        type: "delete",
        content: prefix,
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

  const parseResult = deleteBlockToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "deleteBlock", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, mode, prefix } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "deleteBlock", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;
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
      suggestionId: deleteResult.suggestionId ?? null,
      threadCreationFailed: deleteResult.threadCreationFailed ?? false,
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
