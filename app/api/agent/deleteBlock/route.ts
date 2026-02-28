import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest, NextResponse } from "next/server";
import { $createRangeSelection, $getRoot, $setSelection } from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { sleep, withMainDocEditorSession } from "../editorAgentUtil";
import { buildNodeMarkdownMapForSubtree } from "../mapMarkdownToLexical";
import { deleteBlockRouteSchema, type ReplaceMode } from "../toolSchemas";

const HocuspocusAuthQuery = `
  query AgentDeleteBlockHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

const HOCUSPOCUS_FLUSH_WAIT_MS = 750;


interface DeleteBlockResult {
  deleted: boolean
  note: string
  deletionIndex?: number
}

function paragraphMarkdownStartsWith(paragraphMarkdown: string, prefix: string): boolean {
  const normalizedParagraph = paragraphMarkdown.trimStart().replace(/\s+/g, " ").toLowerCase();
  const normalizedPrefix = prefix.trim().replace(/\s+/g, " ").toLowerCase();
  return normalizedParagraph.startsWith(normalizedPrefix);
}

function plainTextStartsWith(nodeTextContent: string, prefix: string): boolean {
  const prefixPlainText = prefix
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\([A-Za-z]+)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const normalizedTextContent = nodeTextContent
    .replace(/\s+/g, " ")
    .trimStart()
    .toLowerCase();
  return prefixPlainText.length > 0 && normalizedTextContent.startsWith(prefixPlainText);
}

export async function deleteMarkdownBlock({
  postId,
  token,
  mode,
  prefix,
}: {
  postId: string
  token: string
  mode: ReplaceMode
  prefix: string
}): Promise<DeleteBlockResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "DeleteBlock",
    callback: async ({ editor }) => {
      let result: DeleteBlockResult = { deleted: false, note: "No deletion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const rootChildren = root.getChildren();
          const mapResult = buildNodeMarkdownMapForSubtree(root.getKey());

          let deletionIndex: number | null = null;
          for (let i = 0; i < rootChildren.length; i++) {
            const child = rootChildren[i];
            const childMarkdown = mapResult.byKey.get(child.getKey())?.markdown;
            if (!childMarkdown) {
              if (plainTextStartsWith(child.getTextContent(), prefix)) {
                deletionIndex = i;
                break;
              }
              continue;
            }
            if (
              paragraphMarkdownStartsWith(childMarkdown, prefix) ||
              plainTextStartsWith(child.getTextContent(), prefix)
            ) {
              deletionIndex = i;
              break;
            }
          }

          if (deletionIndex === null) {
            result = {
              deleted: false,
              note: `No paragraph markdown starts with locator text: ${prefix}`,
            };
            return;
          }

          const nodeToDelete = rootChildren[deletionIndex];
          if (!nodeToDelete) {
            result = {
              deleted: false,
              note: `Matched block index ${deletionIndex} could not be resolved.`,
            };
            return;
          }

          if (mode === "edit") {
            nodeToDelete.remove();
            result = {
              deleted: true,
              note: "Deleted markdown block from collaborative draft.",
              deletionIndex,
            };
            return;
          }

          const selection = $createRangeSelection();
          selection.anchor.set(root.getKey(), deletionIndex, "element");
          selection.focus.set(root.getKey(), deletionIndex + 1, "element");
          $setSelection(selection);
          const suggestionId = randomId();
          $wrapSelectionInSuggestionNode(selection, false, suggestionId, "delete");
          result = {
            deleted: true,
            note: "Marked markdown block as a deletion suggestion.",
            deletionIndex,
          };
        }, { onUpdate: resolve });
      });

      if (result.deleted) {
        await sleep(HOCUSPOCUS_FLUSH_WAIT_MS);
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

  const parseResult = deleteBlockRouteSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, mode, prefix } = parseResult.data;

  try {
    const { data } = await runQuery(
      HocuspocusAuthQuery,
      { postId, linkSharingKey: key ?? null },
      context
    );
    const token = data?.HocuspocusAuth?.token;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized to edit draft" }, { status: 403 });
    }

    const deleteResult = await deleteMarkdownBlock({
      postId,
      token,
      mode,
      prefix,
    });

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
    return NextResponse.json(
      {
        error: "Failed to delete markdown block in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
