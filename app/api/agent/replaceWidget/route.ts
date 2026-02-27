import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { applyPatch } from "diff";
import { $createTextNode, $getRoot, $isElementNode, type LexicalNode } from "lexical";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $isIframeWidgetNode, type IframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { sleep, withMainDocEditorSession } from "../editorAgentUtil";

const HocuspocusAuthQuery = `
  query AgentReplaceWidgetHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

const HOCUSPOCUS_FLUSH_WAIT_MS = 750;

const ReplaceWidgetRequestSchema = z.object({
  postId: z.string(),
  key: z.string().optional(),
  widgetId: z.string(),
  replacement: z.string().optional(),
  unifiedDiff: z.string().optional(),
  mode: z.enum(["edit", "suggest"]).default("edit"),
}).refine(
  (value) => (value.replacement ? 1 : 0) + (value.unifiedDiff ? 1 : 0) === 1,
  {
    message: "Provide exactly one of replacement or unifiedDiff",
    path: ["replacement"],
  }
);

type ReplaceMode = z.infer<typeof ReplaceWidgetRequestSchema>["mode"];

interface ReplaceWidgetResult {
  replaced: boolean
  widgetFound: boolean
  note: string
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

function applySuggestionWidgetReplacement(widgetNode: IframeWidgetNode, oldContent: string, newContent: string): void {
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
}

export async function replaceWidgetInMainDoc({
  postId,
  token,
  widgetId,
  replacement,
  unifiedDiff,
  mode,
}: {
  postId: string
  token: string
  widgetId: string
  replacement?: string
  unifiedDiff?: string
  mode: ReplaceMode
}): Promise<ReplaceWidgetResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceWidget",
    callback: async ({ editor }) => {
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

          applySuggestionWidgetReplacement(widgetNode, currentContent, replacementResult.content);
          result = {
            replaced: true,
            widgetFound: true,
            note: "Created delete/insert suggestion nodes for widget content replacement.",
          };
        }, { onUpdate: resolve });
      });

      if (result.replaced) {
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

  const parseResult = ReplaceWidgetRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, widgetId, replacement, unifiedDiff, mode } = parseResult.data;

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

    const result = await replaceWidgetInMainDoc({
      postId,
      token,
      widgetId,
      replacement,
      unifiedDiff,
      mode,
    });

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
    return NextResponse.json(
      {
        error: "Failed to replace widget content in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
