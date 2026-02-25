import { markdownToHtml } from "@/server/editor/conversionUtils";
import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $createRangeSelection,
  $setSelection,
  $isDecoratorNode,
  $isElementNode,
  $createParagraphNode,
  type LexicalNode,
} from "lexical";
import { $wrapSelectionInSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { sleep, withMainDocEditorSession } from "../editorAgentUtil";
import { buildNodeMarkdownMapForSubtree } from "../mapMarkdownToLexical";

const HocuspocusAuthQuery = `
  query AgentInsertBlockHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

const HOCUSPOCUS_FLUSH_WAIT_MS = 750;

const InsertLocationSchema = z.union([
  z.literal("start"),
  z.literal("end"),
  z.object({ after: z.string() }),
  z.object({ before: z.string() }),
]);

const InsertBlockRequestSchema = z.object({
  postId: z.string(),
  key: z.string().optional(),
  mode: z.enum(["edit", "suggest"]).default("edit"),
  location: InsertLocationSchema,
  markdown: z.string(),
});

type InsertLocation = z.infer<typeof InsertLocationSchema>;
type InsertMode = z.infer<typeof InsertBlockRequestSchema>["mode"];

interface InsertBlockResult {
  inserted: boolean
  note: string
  insertionIndex?: number
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

export async function insertMarkdownBlock({
  postId,
  token,
  mode,
  location,
  markdown,
}: {
  postId: string
  token: string
  mode: InsertMode
  location: InsertLocation
  markdown: string
}): Promise<InsertBlockResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "InsertBlock",
    callback: async ({ editor }) => {
      let result: InsertBlockResult = { inserted: false, note: "No insertion performed." };

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const html = markdownToHtml(markdown);
          const dom = new JSDOM(html);
          const importedNodes = $generateNodesFromDOM(editor, dom.window.document);
          const nodesToInsert = normalizeImportedTopLevelNodes(importedNodes);

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
          if (mode === "suggest") {
            const insertedCount = nodesToInsert.length;
            const selection = $createRangeSelection();
            selection.anchor.set(root.getKey(), insertionIndex, "element");
            selection.focus.set(root.getKey(), insertionIndex + insertedCount, "element");
            $setSelection(selection);
            const suggestionId = randomId();
            $wrapSelectionInSuggestionNode(selection, false, suggestionId, "insert");
          }
          result = {
            inserted: true,
            note: mode === "suggest"
              ? "Inserted markdown block as suggestion."
              : "Inserted markdown block into collaborative draft.",
            insertionIndex,
          };
        }, { onUpdate: resolve });
      });

      if (result.inserted) {
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

  const parseResult = InsertBlockRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, mode, location, markdown } = parseResult.data;

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

    const insertResult = await insertMarkdownBlock({
      postId,
      token,
      mode,
      location,
      markdown,
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
    return NextResponse.json(
      {
        error: "Failed to insert markdown block in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
