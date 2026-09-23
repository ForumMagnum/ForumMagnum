import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, type LexicalEditor, type LexicalNode } from "lexical";
import { $isFootnoteSectionNode, type FootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { $getFootnoteSection, $reorderFootnotes } from "@/components/editor/lexicalPlugins/footnotes/helpers";

/** Markdown footnotes use CKEditor's HTML shape; Lexical needs a content container and backlink. */
export function $importAgentHtml(editor: LexicalEditor, document: Document): LexicalNode[] {
  for (const item of document.querySelectorAll("[data-footnote-item]")) {
    if (item.querySelector("[data-footnote-content]")) continue;
    const id = item.getAttribute("data-footnote-id");
    if (!id) continue;
    for (const backlink of item.querySelectorAll(".footnote-backref")) {
      backlink.remove();
    }
    const content = document.createElement("div");
    content.setAttribute("data-footnote-content", "");
    content.className = "footnote-content";
    content.append(...Array.from(item.childNodes));
    const backlink = document.createElement("span");
    backlink.setAttribute("data-footnote-back-link", "");
    backlink.setAttribute("data-footnote-id", id);
    item.append(backlink, content);
  }
  return $generateNodesFromDOM(editor, document);
}

export function splitImportedFootnotes(nodes: LexicalNode[]): {
  contentNodes: LexicalNode[]
  footnoteSections: FootnoteSectionNode[]
} {
  const contentNodes: LexicalNode[] = [];
  const footnoteSections: FootnoteSectionNode[] = [];
  for (const node of nodes) {
    if ($isFootnoteSectionNode(node)) footnoteSections.push(node);
    else contentNodes.push(node);
  }
  return { contentNodes, footnoteSections };
}

/** Call only after the associated body edit succeeds, so failed edits leave no definitions behind. */
export function $appendImportedFootnotes(footnoteSections: FootnoteSectionNode[]): void {
  if (!footnoteSections.length) return;
  let section = $getFootnoteSection();
  for (const importedSection of footnoteSections) {
    if (section) {
      section.append(...importedSection.getChildren());
    } else {
      section = importedSection;
    }
  }
  if (section) $getRoot().append(section);
  $reorderFootnotes();
}
