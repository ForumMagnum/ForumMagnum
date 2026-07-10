import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import { $createParagraphNode, $createTextNode, $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $createMathNode, $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
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

/** Depth-first visit of a Lexical node and all of its descendants. */
export function walkLexicalNodes(node: LexicalNode, visit: (node: LexicalNode) => void): void {
  visit(node);
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      walkLexicalNodes(child, visit);
    }
  }
}

/** Collect the equation string of every MathNode in the document, in order. */
export function findMathEquations(editor: LexicalEditor): string[] {
  const equations: string[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if ($isMathNode(node)) {
        equations.push(node.getEquation());
      }
    });
  });
  return equations;
}

/**
 * The node type of the parent of the first display (non-inline) MathNode in
 * the document — `"root"` when the equation sits at the top level. Returns
 * `"(not found)"` if the document has no display MathNode.
 */
export function firstDisplayMathParentType(editor: LexicalEditor): string {
  let result = "(not found)";
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if (result === "(not found)" && $isMathNode(node) && !node.isInline()) {
        result = node.getParent()?.getType() ?? "(no parent)";
      }
    });
  });
  return result;
}

export type MathParagraphSegment = { text: string } | { equation: string, display?: boolean };

/**
 * Build an editor whose document is the given paragraphs, each a run of
 * TextNodes and real MathNodes (inline by default; `display: true` for a
 * display equation). This is the canonical representation the agent edit code
 * operates on — in production the headless editor is synced from a Yjs
 * document whose equations are MathNodes — so constructing the nodes directly
 * avoids depending on any markdown/HTML conversion behavior to set up a fixture.
 */
export async function setupEditorWithMathParagraphs(
  ...paragraphs: ReadonlyArray<MathParagraphSegment>[]
): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("LexicalTestHelper");
  await runEditorUpdate(editor, () => {
    const root = $getRoot();
    root.clear();
    for (const segments of paragraphs) {
      const paragraph = $createParagraphNode();
      for (const segment of segments) {
        paragraph.append(
          "equation" in segment
            ? $createMathNode(segment.equation, !segment.display)
            : $createTextNode(segment.text),
        );
      }
      root.append(paragraph);
    }
  });
  return editor;
}
