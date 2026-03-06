import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $isElementNode, type LexicalEditor } from "lexical";
import { $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { normalizeImportedTopLevelNodes } from "../../../app/api/(markdown)/editorMarkdownUtils";

export async function runEditorUpdate(editor: LexicalEditor, updater: () => void): Promise<void> {
  await new Promise<void>((resolve) => {
    editor.update(updater, { onUpdate: resolve });
  });
}

export async function setupEditorWithContent(markdownContent: string, label = "LexicalTestHelper"): Promise<LexicalEditor> {
  const editor = createHeadlessEditor(label);
  const html = markdownToHtml(markdownContent);

  await runEditorUpdate(editor, () => {
    const dom = new JSDOM(html);
    const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document);
    const root = $getRoot();
    root.clear();
    root.append(...normalizeImportedTopLevelNodes(lexicalNodes));
  });

  return editor;
}

export interface SuggestionInfo {
  type: string
  textContent: string
}

export function getAllSuggestions(editor: LexicalEditor): SuggestionInfo[] {
  const suggestions: SuggestionInfo[] = [];
  editor.getEditorState().read(() => {
    const root = $getRoot();
    for (const child of root.getChildren()) {
      if ($isElementNode(child)) {
        for (const descendant of child.getChildren()) {
          if ($isSuggestionNode(descendant)) {
            suggestions.push({
              type: descendant.getSuggestionTypeOrThrow(),
              textContent: descendant.getTextContent(),
            });
          }
        }
      }
    }
  });
  return suggestions;
}
