import { $getRoot, type LexicalNode } from "lexical";
import { $isFootnoteSectionNode, type FootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { $getFootnoteSection, $reorderFootnotes } from "@/components/editor/lexicalPlugins/footnotes/helpers";

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
