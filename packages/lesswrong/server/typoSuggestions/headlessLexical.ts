import { $getRoot, $insertNodes, type LexicalEditor } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import { createHeadlessEditor } from "../../../../app/api/agent/editorAgentUtil";

/**
 * Open a headless Lexical editor and load the given HTML into it. Used by the
 * typo-suggestion comment-apply path (which then mutates and re-exports HTML)
 * and the tooltip-narrowing computation (which reads the parsed state).
 *
 * Caller is responsible for wrapping in `withDomGlobals` if any step needs
 * `document` (e.g. `$generateHtmlFromNodes` on export).
 */
export function loadHtmlIntoHeadlessEditor(html: string, label: string): LexicalEditor {
  const editor = createHeadlessEditor(label);
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      const dom = new JSDOM(html);
      const nodes = $generateNodesFromDOM(editor, dom.window.document);
      $insertNodes(nodes);
    },
    { discrete: true },
  );
  return editor;
}
