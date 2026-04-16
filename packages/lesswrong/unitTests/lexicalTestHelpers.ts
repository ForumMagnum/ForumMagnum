import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { normalizeImportedTopLevelNodes } from "../../../app/api/(markdown)/editorMarkdownUtils";

export async function runEditorUpdate(editor: LexicalEditor, updater: () => void): Promise<void> {
  await new Promise<void>((resolve) => {
    editor.update(updater, { onUpdate: resolve });
  });
}

export async function setupEditorWithHtml(html: string, label = "LexicalTestHelper"): Promise<LexicalEditor> {
  const editor = createHeadlessEditor(label);

  await runEditorUpdate(editor, () => {
    const dom = new JSDOM(html);
    const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document);
    const root = $getRoot();
    root.clear();
    root.append(...normalizeImportedTopLevelNodes(lexicalNodes));
  });

  return editor;
}

export async function setupEditorWithContent(markdownContent: string, label = "LexicalTestHelper"): Promise<LexicalEditor> {
  const html = markdownToHtml(markdownContent);
  return setupEditorWithHtml(html, label);
}

export interface SuggestionInfo {
  type: string
  textContent: string
}

export function getAllSuggestions(editor: LexicalEditor): SuggestionInfo[] {
  const suggestions: SuggestionInfo[] = [];
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isSuggestionNode(node)) {
        suggestions.push({
          type: node.getSuggestionTypeOrThrow(),
          textContent: node.getTextContent(),
        });
        return;
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          walk(child);
        }
      }
    }
    walk($getRoot());
  });
  return suggestions;
}
