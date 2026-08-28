import { $getRoot, LexicalNode, $isElementNode, $getNodeByKey, $getSelection, $createParagraphNode } from "lexical";
import { $unwrapMarkNode } from "@lexical/mark";
import { $createFootnoteBackLinkNode } from "./FootnoteBackLinkNode";
import { $createFootnoteContentNode, $isFootnoteContentNode } from "./FootnoteContentNode";
import { FootnoteItemNode, $createFootnoteItemNode, $isFootnoteItemNode } from "./FootnoteItemNode";
import { FootnoteReferenceNode, $isFootnoteReferenceNode } from "./FootnoteReferenceNode";
import { FootnoteSectionNode, $createFootnoteSectionNode, $isFootnoteSectionNode } from "./FootnoteSectionNode";
import { HovernoteNode, $isHovernoteNode } from "../hovernotes/HovernoteNode";

/**
 * The two kinds of inline anchor that can point at a footnote item: a
 * superscript [n] reference, or a hovernote (a highlighted stretch of text
 * whose footnote content shows on hover).
 */
export type FootnoteAnchorNode = FootnoteReferenceNode | HovernoteNode;

function $isFootnoteAnchorNode(node: LexicalNode | null | undefined): node is FootnoteAnchorNode {
  return $isFootnoteReferenceNode(node) || $isHovernoteNode(node);
}

/**
 * Find the footnote section in the document, or return null if it doesn't exist
 */
export function $getFootnoteSection(): FootnoteSectionNode | null {
  const root = $getRoot();
  const children = root.getChildren();
  
  for (const child of children) {
    if ($isFootnoteSectionNode(child)) {
      return child;
    }
  }
  
  return null;
}

/**
 * Get all footnote items in the document
 */
export function $getFootnoteItems(): FootnoteItemNode[] {
  const section = $getFootnoteSection();
  if (!section) {
    return [];
  }
  
  const items: FootnoteItemNode[] = [];
  const children = section.getChildren();
  
  for (const child of children) {
    if ($isFootnoteItemNode(child)) {
      items.push(child);
    }
  }
  
  return items;
}

/**
 * Get all footnote anchors (references and hovernotes) in the document, in
 * document order
 */
export function $getFootnoteAnchors(): FootnoteAnchorNode[] {
  const root = $getRoot();
  const anchors: FootnoteAnchorNode[] = [];

  function traverse(node: LexicalNode) {
    if ($isFootnoteAnchorNode(node)) {
      anchors.push(node);
    }
    if ($isElementNode(node) && !$isFootnoteSectionNode(node)) {
      const children = node.getChildren();
      for (const child of children) {
        traverse(child);
      }
    }
  }

  const children = root.getChildren();
  for (const child of children) {
    traverse(child);
  }

  return anchors;
}

/**
 * Get all footnote references in the document
 */
export function $getFootnoteReferences(): FootnoteReferenceNode[] {
  return $getFootnoteAnchors().filter((anchor) => $isFootnoteReferenceNode(anchor));
}

/**
 * Get the next available footnote index
 */
export function $getNextFootnoteIndex(): number {
  const items = $getFootnoteItems();
  return items.length + 1;
}

/**
 * Create a new footnote item (back-link + empty content) with the given id and
 * append it to the footnote section, creating the section if necessary.
 */
export function $appendNewFootnoteItem(footnoteId: string): FootnoteItemNode {
  let section = $getFootnoteSection();
  if (!section) {
    section = $createFootnoteSectionNode();
    $getRoot().append(section);
  }

  const footnoteItem = $createFootnoteItemNode(footnoteId, $getNextFootnoteIndex());
  const footnoteBackLink = $createFootnoteBackLinkNode(footnoteId);
  const footnoteContent = $createFootnoteContentNode();
  const paragraph = $createParagraphNode();

  footnoteContent.append(paragraph);
  footnoteItem.append(footnoteBackLink);
  footnoteItem.append(footnoteContent);
  section.append(footnoteItem);
  return footnoteItem;
}

/**
 * Remove all anchors pointing at a specific footnote. References are deleted
 * outright; hovernotes are unwrapped so the highlighted text survives.
 */
export function $removeReferencesById(footnoteId: string): void {
  const anchors = $getFootnoteAnchors();
  for (const anchor of anchors) {
    if (anchor.getFootnoteId() === footnoteId) {
      $removeFootnoteAnchor(anchor);
    }
  }
}

/**
 * Remove a single footnote anchor: delete a [n] reference, unwrap a hovernote
 * (keeping its text).
 */
export function $removeFootnoteAnchor(anchor: FootnoteAnchorNode): void {
  if ($isHovernoteNode(anchor)) {
    $unwrapMarkNode(anchor);
  } else {
    anchor.remove();
  }
}

/**
 * Update the indices of all references for a specific footnote
 */
export function $updateReferenceIndices(footnoteId: string, newIndex: number): void {
  const references = $getFootnoteReferences();
  for (const ref of references) {
    if (ref.getFootnoteId() === footnoteId) {
      ref.setFootnoteIndex(newIndex);
    }
  }
}

/**
 * Reindex all footnotes to ensure they are in order based on their references
 */
export function $reorderFootnotes(): void {
  const section = $getFootnoteSection();
  if (!section) {
    return;
  }

  const anchors = $getFootnoteAnchors();
  const seenIds = new Set<string>();
  const orderedIds: string[] = [];

  // Build ordered list of unique footnote IDs based on anchor order
  for (const ref of anchors) {
    const id = ref.getFootnoteId();
    if (!seenIds.has(id)) {
      seenIds.add(id);
      orderedIds.push(id);
    }
  }
  
  // Get footnote items and reorder them
  const items = $getFootnoteItems();
  const itemsById = new Map<string, FootnoteItemNode>();
  for (const item of items) {
    itemsById.set(item.getFootnoteId(), item);
  }
  
  // Reinsert items in correct order and update indices
  let index = 1;
  for (const id of orderedIds) {
    const item = itemsById.get(id);
    if (item) {
      item.setFootnoteIndex(index);
      $updateReferenceIndices(id, index);
      // Move item to end (this maintains order as we go through)
      section.append(item);
      index++;
    }
  }
  
  // Handle footnotes with no references (keep them at the end)
  for (const item of items) {
    const id = item.getFootnoteId();
    if (!seenIds.has(id)) {
      item.setFootnoteIndex(index);
      section.append(item);
      index++;
    }
  }
}

/**
 * Remove a footnote and its references, then reindex remaining footnotes
 */
export function $removeFootnote(footnoteItem: FootnoteItemNode): void {
  const section = $getFootnoteSection();
  const footnoteId = footnoteItem.getFootnoteId();
  
  $removeReferencesById(footnoteId);
  footnoteItem.remove();
  
  // If section is now empty, remove it
  if (section && section.getChildrenSize() === 0) {
    section.remove();
  } else {
    // Reindex remaining footnotes
    const items = $getFootnoteItems();
    items.forEach((item, index) => {
      const newIndex = index + 1;
      item.setFootnoteIndex(newIndex);
      $updateReferenceIndices(item.getFootnoteId(), newIndex);
    });
  }
}

/**
 * Check if a footnote item is empty (only contains empty paragraphs)
 */
export function $isFootnoteEmpty(footnoteItem: FootnoteItemNode): boolean {
  const children = footnoteItem.getChildren();
  
  for (const child of children) {
    if ($isFootnoteContentNode(child)) {
      const contentChildren = child.getChildren();
      for (const contentChild of contentChildren) {
        const textContent = contentChild.getTextContent();
        if (textContent.trim() !== '') {
          return false;
        }
      }
    }
  }
  
  return true;
}

export function $hasFootnoteReferenceInNode(node: LexicalNode): boolean {
  if ($isFootnoteAnchorNode(node)) {
    return true;
  }
  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      if ($hasFootnoteReferenceInNode(child)) {
        return true;
      }
    }
  }
  return false;
}

export function $shouldCheckForFootnoteReorder(
  dirtyElements: Map<string, boolean>,
  dirtyLeaves: Set<string>
): boolean {
  for (const key of dirtyLeaves) {
    const node = $getNodeByKey(key);
    if (node && $isFootnoteReferenceNode(node)) {
      return true;
    }
  }
  for (const key of dirtyElements.keys()) {
    const node = $getNodeByKey(key);
    if (node && $hasFootnoteReferenceInNode(node)) {
      return true;
    }
  }
  return false;
}

export function $getSelectedFootnoteItem(): FootnoteItemNode | null {
  const selection = $getSelection();
  if (!selection) {
    return null;
  }
  const nodes = selection.getNodes();
  for (const node of nodes) {
    if ($isFootnoteItemNode(node)) {
      return node;
    }
    let parent = node.getParent();
    while (parent) {
      if ($isFootnoteItemNode(parent)) {
        return parent;
      }
      parent = parent.getParent();
    }
  }
  return null;
}
