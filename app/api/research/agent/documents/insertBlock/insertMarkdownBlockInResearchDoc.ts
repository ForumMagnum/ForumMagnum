import type { LexicalEditor, LexicalNode } from "lexical";
import { getMarkdownItForResearch } from "@/lib/utils/markdownItPlugins";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { $insertMarkdownBlockInEditor, $markdownToNodes } from "../../../../agent/insertBlock/route";
import { withResearchDocEditorSession } from "../../researchEditorSession";
import type { InsertLocation, ReplaceMode } from "../../../../agent/toolSchemas";
import { getMarkdownImageWarnings, noteWithAgentEditWarnings, type AgentEditWarning } from "../../../../agent/imageValidation";

export function $researchMarkdownToNodes(editor: LexicalEditor, markdown: string): LexicalNode[] {
  return $markdownToNodes(editor, markdown, { markdownIt: getMarkdownItForResearch() });
}

export interface InsertBlockResult {
  inserted: boolean;
  note: string;
  insertionIndex?: number;
  suggestionId?: string;
  warnings?: AgentEditWarning[];
}

export async function insertMarkdownBlockInResearchDoc({
  documentId,
  hocuspocusToken,
  location,
  markdown,
  mode,
}: {
  documentId: string;
  hocuspocusToken: string;
  location: InsertLocation;
  markdown: string;
  mode: ReplaceMode;
}): Promise<InsertBlockResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchInsertBlock",
    callback: async ({ editor, provider }) => {
      let result: InsertBlockResult = { inserted: false, note: "No insertion performed." };
      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            const r = $insertMarkdownBlockInEditor({
              editor, mode, location, markdown,
              markdownToNodes: $researchMarkdownToNodes,
            });
            result = {
              inserted: r.inserted,
              note: r.note,
              insertionIndex: r.insertionIndex,
              suggestionId: r.suggestionId,
              warnings: r.warnings,
            };
          },
          { onUpdate: resolve },
        );
      });
      if (result.inserted) {
        await waitForProviderFlush(provider);
        result.warnings = await getMarkdownImageWarnings(markdown, getMarkdownItForResearch());
        result.note = noteWithAgentEditWarnings(result.note, result.warnings);
      }
      return result;
    },
  });
}
