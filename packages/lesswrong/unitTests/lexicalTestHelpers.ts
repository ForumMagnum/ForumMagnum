import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, type LexicalEditor } from "lexical";
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
