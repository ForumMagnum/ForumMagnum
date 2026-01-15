"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
  LexicalNode,
  $getNodeByKey,
  $isElementNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

import { generateFootnoteId } from './constants';
import {
  FootnoteReferenceNode,
  $createFootnoteReferenceNode,
  $isFootnoteReferenceNode,
} from './FootnoteReferenceNode';
import {
  FootnoteSectionNode,
  $createFootnoteSectionNode,
  $isFootnoteSectionNode,
} from './FootnoteSectionNode';
import {
  FootnoteItemNode,
  $createFootnoteItemNode,
  $isFootnoteItemNode,
} from './FootnoteItemNode';
import {
  FootnoteContentNode,
  $createFootnoteContentNode,
  $isFootnoteContentNode,
} from './FootnoteContentNode';
import {
  FootnoteBackLinkNode,
  $createFootnoteBackLinkNode,
  $isFootnoteBackLinkNode,
} from './FootnoteBackLinkNode';

// Command for inserting a new footnote
export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<{ footnoteIndex?: number }> = createCommand(
  'INSERT_FOOTNOTE_COMMAND'
);

/**
 * Find the footnote section in the document, or return null if it doesn't exist
 */
function $getFootnoteSection(): FootnoteSectionNode | null {
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
function $getFootnoteItems(): FootnoteItemNode[] {
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
 * Get all footnote references in the document
 */
function $getFootnoteReferences(): FootnoteReferenceNode[] {
  const root = $getRoot();
  const references: FootnoteReferenceNode[] = [];
  
  function traverse(node: LexicalNode) {
    if ($isFootnoteReferenceNode(node)) {
      references.push(node);
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
  
  return references;
}

/**
 * Find a footnote item by its ID
 */
function $getFootnoteItemById(footnoteId: string): FootnoteItemNode | null {
  const items = $getFootnoteItems();
  return items.find((item) => item.getFootnoteId() === footnoteId) || null;
}

/**
 * Get the next available footnote index
 */
function $getNextFootnoteIndex(): number {
  const items = $getFootnoteItems();
  return items.length + 1;
}

/**
 * Remove all references to a specific footnote
 */
function $removeReferencesById(footnoteId: string): void {
  const references = $getFootnoteReferences();
  for (const ref of references) {
    if (ref.getFootnoteId() === footnoteId) {
      ref.remove();
    }
  }
}

/**
 * Update the indices of all references for a specific footnote
 */
function $updateReferenceIndices(footnoteId: string, newIndex: number): void {
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
function $reorderFootnotes(): void {
  const section = $getFootnoteSection();
  if (!section) {
    return;
  }

  const references = $getFootnoteReferences();
  const seenIds = new Set<string>();
  const orderedIds: string[] = [];
  
  // Build ordered list of unique footnote IDs based on reference order
  for (const ref of references) {
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
      // Update the index on the item
      item.setFootnoteIndex(index);
      // Update references
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
function $removeFootnote(footnoteItem: FootnoteItemNode): void {
  const section = $getFootnoteSection();
  const footnoteId = footnoteItem.getFootnoteId();
  
  // Remove all references to this footnote
  $removeReferencesById(footnoteId);
  
  // Remove the footnote item
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
function $isFootnoteEmpty(footnoteItem: FootnoteItemNode): boolean {
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

function $getSelectedFootnoteItem(): FootnoteItemNode | null {
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

/**
 * FootnotesPlugin provides footnote functionality for the Lexical editor.
 * 
 * Features:
 * - Insert inline footnote references via command
 * - Auto-creates footnote section at the bottom of the document
 * - Manages footnote numbering and reordering
 * - Handles deletion of footnotes and their references
 * - Supports markdown syntax [^1] for creating footnotes (TODO)
 */
export function FootnotesPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const lastReferenceOrderRef = useRef<string | null>(null);

  // Register the INSERT_FOOTNOTE_COMMAND handler
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const references = $getFootnoteReferences();
          const referenceOrder = references.map((ref) => ref.getFootnoteId()).join('|');
          if (referenceOrder === lastReferenceOrderRef.current) {
            return;
          }
          lastReferenceOrderRef.current = referenceOrder;
          if (!referenceOrder) {
            return;
          }
          editor.update(() => {
            $reorderFootnotes();
          });
        });
      }),
      editor.registerCommand(
        INSERT_FOOTNOTE_COMMAND,
        (payload) => {
          const { footnoteIndex } = payload;
          
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              return false;
            }

            let id: string;
            let index: number;
            
            if (footnoteIndex && footnoteIndex > 0) {
              // Reference to an existing footnote
              const items = $getFootnoteItems();
              const existingItem = items.find(
                (item) => item.getFootnoteIndex() === footnoteIndex
              );
              
              if (existingItem) {
                id = existingItem.getFootnoteId();
                index = footnoteIndex;
              } else {
                // Invalid index, do nothing
                return false;
              }
            } else {
              // Create a new footnote
              id = generateFootnoteId();
              index = $getNextFootnoteIndex();
              
              // Create the footnote section if it doesn't exist
              let section = $getFootnoteSection();
              if (!section) {
                section = $createFootnoteSectionNode();
                const root = $getRoot();
                root.append(section);
              }
              
              // Create the footnote item
              const footnoteItem = $createFootnoteItemNode(id, index);
              const footnoteBackLink = $createFootnoteBackLinkNode(id);
              const footnoteContent = $createFootnoteContentNode();
              const paragraph = $createParagraphNode();
              
              footnoteContent.append(paragraph);
              footnoteItem.append(footnoteBackLink);
              footnoteItem.append(footnoteContent);
              section.append(footnoteItem);
            }
            
            // Insert the reference at the current cursor position
            const footnoteReference = $createFootnoteReferenceNode(id, index);
            selection.insertNodes([footnoteReference]);
            
            // Reorder footnotes if needed
            $reorderFootnotes();
          });
          
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      
      // Handle backspace in footnotes
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            const footnoteItem = $getSelectedFootnoteItem();
            if (footnoteItem) {
              event?.preventDefault();
              editor.update(() => {
                $removeFootnote(footnoteItem);
              });
              return true;
            }
            return false;
          }
          if (!$isRangeSelection(selection)) {
            return false;
          }
          
          // Check if we're in a footnote
          const anchorNode = selection.anchor.getNode();
          let footnoteItem: FootnoteItemNode | null = null;
          
          let parent: LexicalNode | null = anchorNode;
          while (parent) {
            if ($isFootnoteItemNode(parent)) {
              footnoteItem = parent;
              break;
            }
            parent = parent.getParent();
          }
          
          if (!footnoteItem) {
            return false;
          }
          
          // Check if the footnote is empty
          if ($isFootnoteEmpty(footnoteItem)) {
            event?.preventDefault();
            editor.update(() => {
              $removeFootnote(footnoteItem!);
            });
            return true;
          }
          
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      // Handle delete key for footnote section
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            const footnoteItem = $getSelectedFootnoteItem();
            if (footnoteItem) {
              event?.preventDefault();
              editor.update(() => {
                $removeFootnote(footnoteItem);
              });
              return true;
            }
          }
          if (!$isRangeSelection(selection)) {
            return false;
          }
          
          // Check if footnote section is selected
          const nodes = selection.getNodes();
          for (const node of nodes) {
            if ($isFootnoteSectionNode(node)) {
              editor.update(() => {
                // Remove all references when section is deleted
                const references = $getFootnoteReferences();
                for (const ref of references) {
                  ref.remove();
                }
                node.remove();
              });
              return true;
            }
          }
          
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      editor.registerMutationListener(FootnoteReferenceNode, (mutations) => {
        let shouldReorder = false;
        for (const mutation of mutations.values()) {
          if (mutation === 'created' || mutation === 'destroyed') {
            shouldReorder = true;
            break;
          }
        }
        if (shouldReorder) {
          editor.update(() => {
            $reorderFootnotes();
          });
        }
      })
    );
  }, [editor]);

  return null;
}

