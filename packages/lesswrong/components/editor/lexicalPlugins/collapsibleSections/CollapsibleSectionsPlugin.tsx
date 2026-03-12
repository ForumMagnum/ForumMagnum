"use client";

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  $createParagraphNode,
  $createNodeSelection,
  $setSelection,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  createCommand,
  LexicalCommand,
  TextNode,
  $isTextNode,
  LexicalNode,
  CLICK_COMMAND,
  ElementNode,
  $isParagraphNode,
} from 'lexical';
import { mergeRegister, $insertNodeToNearestRoot } from '@lexical/utils';
import {
  CollapsibleSectionContainerNode,
  $createCollapsibleSectionContainerNode,
  $isCollapsibleSectionContainerNode,
} from './CollapsibleSectionContainerNode';
import {
  CollapsibleSectionTitleNode,
  $createCollapsibleSectionTitleNode,
  $isCollapsibleSectionTitleNode,
} from './CollapsibleSectionTitleNode';
import {
  CollapsibleSectionContentNode,
  $createCollapsibleSectionContentNode,
  $isCollapsibleSectionContentNode,
} from './CollapsibleSectionContentNode';

export const INSERT_COLLAPSIBLE_SECTION_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_COLLAPSIBLE_SECTION_COMMAND'
);
export const TOGGLE_COLLAPSIBLE_SECTION_COMMAND: LexicalCommand<string> = createCommand(
  'TOGGLE_COLLAPSIBLE_SECTION_COMMAND'
);

/**
 * Creates a complete collapsible section structure with title and content nodes.
 */
function $createCollapsibleSection(): CollapsibleSectionContainerNode {
  const container = $createCollapsibleSectionContainerNode(true, false);
  const title = $createCollapsibleSectionTitleNode();
  const content = $createCollapsibleSectionContentNode();
  
  // Title contains editable text (as a paragraph for proper editing)
  const titleParagraph = $createParagraphNode();
  title.append(titleParagraph);
  
  // Content starts with an empty paragraph
  const contentParagraph = $createParagraphNode();
  content.append(contentParagraph);
  
  container.append(title);
  container.append(content);
  
  return container;
}

/**
 * Find the collapsible section container that contains this node, if any
 */
function $findCollapsibleParent(node: LexicalNode): CollapsibleSectionContainerNode | null {
  let current: LexicalNode | null = node.getParent();
  while (current) {
    if ($isCollapsibleSectionContainerNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}

/**
 * Find the title node within a collapsible section
 */
function $findTitleInCollapsible(container: CollapsibleSectionContainerNode): CollapsibleSectionTitleNode | null {
  for (const child of container.getChildren()) {
    if ($isCollapsibleSectionTitleNode(child)) {
      return child;
    }
  }
  return null;
}

/**
 * Find the content node within a collapsible section
 */
function $findContentInCollapsible(container: CollapsibleSectionContainerNode): CollapsibleSectionContentNode | null {
  for (const child of container.getChildren()) {
    if ($isCollapsibleSectionContentNode(child)) {
      return child;
    }
  }
  return null;
}

/**
 * Check if the current selection is within the title of a collapsible section
 */
function $isInCollapsibleTitle(node: LexicalNode): boolean {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isCollapsibleSectionTitleNode(current)) {
      return true;
    }
    current = current.getParent();
  }
  return false;
}

/**
 * Check if the current selection is within the content of a collapsible section
 */
function $isInCollapsibleContent(node: LexicalNode): boolean {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isCollapsibleSectionContentNode(current)) {
      return true;
    }
    current = current.getParent();
  }
  return false;
}

/**
 * Get the content node that directly contains this node (for shadow root traversal)
 */
function $getDirectCollapsibleContent(node: LexicalNode): CollapsibleSectionContentNode | null {
  let current: LexicalNode | null = node.getParent();
  while (current) {
    if ($isCollapsibleSectionContentNode(current)) {
      return current;
    }
    // Stop at container boundary
    if ($isCollapsibleSectionContainerNode(current)) {
      return null;
    }
    current = current.getParent();
  }
  return null;
}

/**
 * Check if cursor is at the very end of a node's content
 */
function $isAtEndOfNode(node: LexicalNode, offset: number): boolean {
  if ($isTextNode(node)) {
    return offset === node.getTextContentSize();
  }
  if ($isElementNode(node)) {
    return offset === node.getChildrenSize();
  }
  return false;
}

/**
 * Check if cursor is at the very start of a node's content
 */
function $isAtStartOfNode(node: LexicalNode, offset: number): boolean {
  return offset === 0;
}

/**
 * Delete the entire collapsible section and place cursor appropriately
 */
function $deleteCollapsibleSection(container: CollapsibleSectionContainerNode): void {
  const nextSibling = container.getNextSibling();
  const prevSibling = container.getPreviousSibling();
  
  container.remove();
  
  // Place cursor in next sibling if exists, otherwise previous, otherwise create paragraph
  if (nextSibling && $isElementNode(nextSibling)) {
    nextSibling.selectStart();
  } else if (prevSibling && $isElementNode(prevSibling)) {
    prevSibling.selectEnd();
  } else {
    const paragraph = $createParagraphNode();
    const parent = container.getParent();
    if (parent) {
      parent.append(paragraph);
    } else {
      $getRoot().append(paragraph);
    }
    paragraph.selectStart();
  }
}

/**
 * Select the entire collapsible section as a NodeSelection
 */
function $selectCollapsibleSection(container: CollapsibleSectionContainerNode): void {
  const nodeSelection = $createNodeSelection();
  nodeSelection.add(container.getKey());
  $setSelection(nodeSelection);
}

const SELECTED_CLASS = 'detailsBlockSelected';
const EMPTY_TITLE_CLASS = 'detailsBlockTitleEmpty';

/**
 * Plugin for collapsible sections (details/summary blocks).
 * 
 * Features:
 * - Insert collapsible sections via command or toolbar
 * - Auto-format: type "<details>" or "+++" at start of line to create section
 * - Tab key moves from title to content
 * - Enter in title moves to content
 * - Enter in empty content paragraph exits the section
 * - Click on title bar (not text) toggles collapsed state
 */
export function CollapsibleSectionsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Verify nodes are registered
    if (!editor.hasNodes([CollapsibleSectionContainerNode])) {
      throw new Error('CollapsibleSectionsPlugin: CollapsibleSectionContainerNode not registered on editor');
    }
    if (!editor.hasNodes([CollapsibleSectionTitleNode])) {
      throw new Error('CollapsibleSectionsPlugin: CollapsibleSectionTitleNode not registered on editor');
    }
    if (!editor.hasNodes([CollapsibleSectionContentNode])) {
      throw new Error('CollapsibleSectionsPlugin: CollapsibleSectionContentNode not registered on editor');
    }

    return mergeRegister(
      // Handle INSERT_COLLAPSIBLE_SECTION_COMMAND
      editor.registerCommand(
        INSERT_COLLAPSIBLE_SECTION_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const collapsibleSection = $createCollapsibleSection();
            $insertNodeToNearestRoot(collapsibleSection);
            
            // Place cursor in the title
            const title = $findTitleInCollapsible(collapsibleSection);
            if (title) {
              const firstChild = title.getFirstChild();
              if (firstChild) {
                firstChild.selectStart();
              }
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle TOGGLE_COLLAPSIBLE_SECTION_COMMAND
      editor.registerCommand(
        TOGGLE_COLLAPSIBLE_SECTION_COMMAND,
        (nodeKey: string) => {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isCollapsibleSectionContainerNode(node)) {
              node.toggleOpen();
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle click to toggle collapsible state
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          
          // Check if clicked on title bar (but not on text content)
          const titleElement = target.closest('.detailsBlockTitle');
          if (titleElement) {
            const clickedInText = !!target.closest('p');
            if (clickedInText) {
              return false;
            }
            const rect = titleElement.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            if (clickX > 24) {
              return false;
            }
            // Don't toggle if clicking on actual text content inside
            const windowSelection = window.getSelection();
            if (windowSelection && windowSelection.toString().length > 0) {
              return false;
            }
            
            // Find the container DOM element and get its Lexical node key
            const containerElement = target.closest('.detailsBlock');
            if (!containerElement) {
              return false;
            }
            
            // Get the node key we stored in createDOM
            const nodeKey = (containerElement as HTMLElement).getAttribute('data-collapsible-key');
            if (!nodeKey) {
              return false;
            }
            
            // Toggle the collapsible state using the node key
            editor.update(() => {
              const node = $getNodeByKey(nodeKey);
              if ($isCollapsibleSectionContainerNode(node)) {
                node.toggleOpen();
              }
            });
            return false;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle Enter in title - move to content (and open if needed)
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          if ($isInCollapsibleTitle(anchorNode)) {
            const collapsible = $findCollapsibleParent(anchorNode);
            if (collapsible) {
              if (!collapsible.getIsOpen()) {
                collapsible.toggleOpen();
              }
              const content = $findContentInCollapsible(collapsible);
              if (content) {
                const firstChild = content.getFirstChild();
                if (firstChild) {
                  firstChild.selectStart();
                }
              }
              return true;
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle Enter key in title - move to content
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          
          // Check if we're in collapsible content
          if ($isInCollapsibleContent(anchorNode)) {
            const collapsible = $findCollapsibleParent(anchorNode);
            if (collapsible) {
              // Check if current block is empty and at the end of content
              const topLevelElement = anchorNode.getTopLevelElementOrThrow();
              const isEmpty = topLevelElement.getTextContent().trim() === '';
              
              if (isEmpty) {
                const content = $findContentInCollapsible(collapsible);
                if (content) {
                  const lastChild = content.getLastChild();
                  
                  // If empty paragraph is the last child in content, exit the section
                  if (lastChild && lastChild.getKey() === topLevelElement.getKey()) {
                    event?.preventDefault();
                    
                    // Create a paragraph after the collapsible section
                    const paragraph = $createParagraphNode();
                    collapsible.insertAfter(paragraph);
                    topLevelElement.remove();
                    paragraph.selectStart();
                    
                    // If content is now empty, add a placeholder paragraph
                    if (content.getChildrenSize() === 0) {
                      const placeholderParagraph = $createParagraphNode();
                      content.append(placeholderParagraph);
                    }
                    
                    return true;
                  }
                }
              }
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle Tab key - move from title to content
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          
          // Check if we're in a collapsible title
          if ($isInCollapsibleTitle(anchorNode)) {
            const collapsible = $findCollapsibleParent(anchorNode);
            if (collapsible && !event?.shiftKey) {
              event?.preventDefault();
              
              // Move cursor to start of content
              const content = $findContentInCollapsible(collapsible);
              if (content) {
                const firstChild = content.getFirstChild();
                if (firstChild) {
                  firstChild.selectStart();
                }
              }
              return true;
            }
          }
          
          // Check if we're in collapsible content with Shift+Tab
          if ($isInCollapsibleContent(anchorNode) && event?.shiftKey) {
            const collapsible = $findCollapsibleParent(anchorNode);
            if (collapsible) {
              event?.preventDefault();
              
              // Move cursor to end of title
              const title = $findTitleInCollapsible(collapsible);
              if (title) {
                const lastChild = title.getLastChild();
                if (lastChild) {
                  lastChild.selectEnd();
                }
              }
              return true;
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle arrow right at end of content - select the collapsible section
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        (event) => {
          const selection = $getSelection();

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode();
            const container = $findCollapsibleParent(anchorNode);
            if (container) {
              const parent = container.getParent();
              if (parent && parent.getLastChild() === container) {
                const lastDescendant = container.getLastDescendant();
                if (
                  lastDescendant &&
                  selection.anchor.key === lastDescendant.getKey() &&
                  $isAtEndOfNode(anchorNode, selection.anchor.offset)
                ) {
                  event?.preventDefault();
                  container.insertAfter($createParagraphNode());
                  return true;
                }
              }
            }
          }
          
          // Handle when collapsible section is already selected (NodeSelection)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1 && $isCollapsibleSectionContainerNode(nodes[0])) {
              event?.preventDefault();
              const container = nodes[0];
              
              // Move to start of next element, or create one
              let nextSibling = container.getNextSibling();
              if (!nextSibling) {
                nextSibling = $createParagraphNode();
                container.insertAfter(nextSibling);
              }
              if ($isElementNode(nextSibling)) {
                nextSibling.selectStart();
              }
              return true;
            }
          }
          
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          // Check if we're at the end of a text node
          if (!$isAtEndOfNode(anchorNode, offset)) {
            return false;
          }
          
          // Check if we're in collapsible content
          const contentNode = $getDirectCollapsibleContent(anchorNode);
          if (!contentNode) {
            return false;
          }
          
          // Check if this is the last descendant in the content
          const lastDescendant = contentNode.getLastDescendant();
          if (anchorNode !== lastDescendant) {
            return false;
          }
          
          // We're at the end of the content - select the collapsible section
          const container = $findCollapsibleParent(anchorNode);
          if (!container) {
            return false;
          }
          
          event?.preventDefault();
          $selectCollapsibleSection(container);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle arrow left - select collapsible section when at start of next element
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        (event) => {
          const selection = $getSelection();

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode();
            try {
              const container = $findCollapsibleParent(anchorNode);
              if (container) {
                const parent = container.getParent();
                const firstDescendant = container.getFirstDescendant();
                if (
                  parent &&
                  parent.getFirstChild() === container &&
                  firstDescendant &&
                  selection.anchor.key === firstDescendant.getKey() &&
                  selection.anchor.offset === 0
                ) {
                  event?.preventDefault();
                  container.insertBefore($createParagraphNode());
                  return true;
                }
              }
            } catch {
              // Ignore invalid structure
            }
          }
          
          // Handle when collapsible section is already selected (NodeSelection)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1 && $isCollapsibleSectionContainerNode(nodes[0])) {
              event?.preventDefault();
              const container = nodes[0];
              
              // Move to end of content inside the collapsible
              const content = $findContentInCollapsible(container);
              if (content) {
                const lastDescendant = content.getLastDescendant();
                if (lastDescendant) {
                  lastDescendant.selectEnd();
                }
              }
              return true;
            }
          }
          
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          // Check if we're at the start of content
          if (!$isAtStartOfNode(anchorNode, offset)) {
            return false;
          }
          
          // Use getTopLevelElementOrThrow which handles shadow roots correctly
          try {
            const topLevelElement = anchorNode.getTopLevelElementOrThrow();
            
            // Check if cursor is at the very start of the top-level element
            // This is true if:
            // 1. anchorNode is the topLevelElement itself (empty paragraph), or
            // 2. anchorNode is the first descendant of topLevelElement
            const firstDescendant = topLevelElement.getFirstDescendant();
            const isAtVeryStart = anchorNode === topLevelElement || anchorNode === firstDescendant;
            
            if (isAtVeryStart) {
              const prevSibling = topLevelElement.getPreviousSibling();
              
              // If previous sibling is a collapsible section, select it
              if ($isCollapsibleSectionContainerNode(prevSibling)) {
                event?.preventDefault();
                $selectCollapsibleSection(prevSibling);
                return true;
              }
            }
          } catch {
            // getTopLevelElementOrThrow can throw if structure is unexpected
          }
          
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle arrow up - select collapsible section when in first block after it
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          const selection = $getSelection();

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode();
            try {
              const container = $findCollapsibleParent(anchorNode);
              if (container) {
                const parent = container.getParent();
                const firstDescendant = container.getFirstDescendant();
                if (
                  parent &&
                  parent.getFirstChild() === container &&
                  firstDescendant &&
                  selection.anchor.key === firstDescendant.getKey() &&
                  selection.anchor.offset === 0
                ) {
                  event?.preventDefault();
                  container.insertBefore($createParagraphNode());
                  return true;
                }
              }
            } catch {
              // Ignore invalid structure
            }
          }
          
          // Handle when collapsible section is already selected (NodeSelection)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1 && $isCollapsibleSectionContainerNode(nodes[0])) {
              event?.preventDefault();
              const container = nodes[0];
              
              // Move to end of content inside the collapsible
              const content = $findContentInCollapsible(container);
              if (content) {
                const lastDescendant = content.getLastDescendant();
                if (lastDescendant) {
                  lastDescendant.selectEnd();
                }
              }
              return true;
            }
          }
          
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          
          // Use getTopLevelElementOrThrow which handles shadow roots correctly
          try {
            const topLevelElement = anchorNode.getTopLevelElementOrThrow();
            const prevSibling = topLevelElement.getPreviousSibling();
            
            // If previous sibling is a collapsible section, select it
            if ($isCollapsibleSectionContainerNode(prevSibling)) {
              event?.preventDefault();
              $selectCollapsibleSection(prevSibling);
              return true;
            }
          } catch {
            // getTopLevelElementOrThrow can throw if structure is unexpected
          }
          
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle arrow down at end of content - select the collapsible section
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          const selection = $getSelection();

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode();
            const container = $findCollapsibleParent(anchorNode);
            if (container) {
              const parent = container.getParent();
              if (parent && parent.getLastChild() === container) {
                const lastDescendant = container.getLastDescendant();
                if (
                  lastDescendant &&
                  selection.anchor.key === lastDescendant.getKey() &&
                  $isAtEndOfNode(anchorNode, selection.anchor.offset)
                ) {
                  event?.preventDefault();
                  container.insertAfter($createParagraphNode());
                  return true;
                }
              }
            }
          }
          
          // Handle when collapsible section is already selected (NodeSelection)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1 && $isCollapsibleSectionContainerNode(nodes[0])) {
              event?.preventDefault();
              const container = nodes[0];
              
              // Move to start of next element, or create one
              let nextSibling = container.getNextSibling();
              if (!nextSibling) {
                nextSibling = $createParagraphNode();
                container.insertAfter(nextSibling);
              }
              if ($isElementNode(nextSibling)) {
                nextSibling.selectStart();
              }
              return true;
            }
          }
          
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          
          // Check if we're in collapsible content
          const contentNode = $getDirectCollapsibleContent(anchorNode);
          if (!contentNode) {
            return false;
          }
          
          // Check if we're in the last block of the content
          const topLevelElement = anchorNode.getTopLevelElementOrThrow();
          const lastContentChild = contentNode.getLastChild();
          if (topLevelElement !== lastContentChild) {
            return false;
          }
          
          // We're at the last block - select the collapsible section
          const container = $findCollapsibleParent(anchorNode);
          if (!container) {
            return false;
          }
          
          event?.preventDefault();
          $selectCollapsibleSection(container);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle backspace - delete selected collapsible section or prevent invalid structure
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const selection = $getSelection();
          
          // Handle when collapsible section is selected (NodeSelection)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1 && $isCollapsibleSectionContainerNode(nodes[0])) {
              event?.preventDefault();
              $deleteCollapsibleSection(nodes[0]);
              return true;
            }
          }
          
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          // Check if we're at the start of content in the title
          if ($isInCollapsibleTitle(anchorNode) && $isAtStartOfNode(anchorNode, offset)) {
            const container = $findCollapsibleParent(anchorNode);
            if (container) {
              const title = $findTitleInCollapsible(container);
              if (title) {
                // Check if cursor is at the very beginning of the title
                const firstDescendant = title.getFirstDescendant();
                if (anchorNode === firstDescendant || anchorNode === title.getFirstChild()) {
                  // If title is empty, delete the entire section
                  if (title.getTextContent().trim() === '') {
                    event?.preventDefault();
                    $deleteCollapsibleSection(container);
                    return true;
                  }
                }
              }
            }
          }
          
          // Check if we're at the start of content area
          if ($isInCollapsibleContent(anchorNode) && $isAtStartOfNode(anchorNode, offset)) {
            const container = $findCollapsibleParent(anchorNode);
            if (container) {
              const content = $findContentInCollapsible(container);
              if (content) {
                const firstDescendant = content.getFirstDescendant();
                if (anchorNode === firstDescendant || anchorNode === content.getFirstChild()) {
                  // If content is empty (just one empty paragraph), delete entire section
                  if (content.getTextContent().trim() === '' && content.getChildrenSize() <= 1) {
                    event?.preventDefault();
                    $deleteCollapsibleSection(container);
                    return true;
                  }
                }
              }
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle forward delete - delete selected collapsible or section after cursor
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          const selection = $getSelection();
          
          // Handle when collapsible section is selected (NodeSelection)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            if (nodes.length === 1 && $isCollapsibleSectionContainerNode(nodes[0])) {
              event?.preventDefault();
              $deleteCollapsibleSection(nodes[0]);
              return true;
            }
          }
          
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          // Check if cursor is at end of something before a collapsible section
          if ($isAtEndOfNode(anchorNode, offset)) {
            const topLevelElement = anchorNode.getTopLevelElementOrThrow();
            const nextSibling = topLevelElement.getNextSibling();
            
            if ($isCollapsibleSectionContainerNode(nextSibling)) {
              // Forward delete right before a collapsible section - select it
              event?.preventDefault();
              $selectCollapsibleSection(nextSibling);
              return true;
            }
          }
          
          // Check if in title at end and content is empty
          if ($isInCollapsibleTitle(anchorNode) && $isAtEndOfNode(anchorNode, offset)) {
            const container = $findCollapsibleParent(anchorNode);
            if (container) {
              const title = $findTitleInCollapsible(container);
              const content = $findContentInCollapsible(container);
              if (title && content) {
                const lastDescendant = title.getLastDescendant();
                if (anchorNode === lastDescendant) {
                  // If content is empty, delete entire section
                  if (content.getTextContent().trim() === '' && content.getChildrenSize() <= 1) {
                    event?.preventDefault();
                    $deleteCollapsibleSection(container);
                    return true;
                  }
                }
              }
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Auto-format: "<details>" or "+++" at start of line creates collapsible section
      editor.registerUpdateListener(({dirtyLeaves, dirtyElements, tags}) => {
        if (tags.has('collaboration')) {
          return;
        }
        editor.update(() => {
          // Handle TextNode transforms (auto-format)
          for (const key of dirtyLeaves) {
            const node = $getNodeByKey(key);
            if (!$isTextNode(node)) continue;

            const parent = node.getParent();
            if (!parent || !$isParagraphNode(parent)) continue;

            // Only transform if this paragraph contains just this text node
            if (parent.getChildrenSize() !== 1) continue;

            const textContent = parent.getTextContent();
            
            // Check for autoformat patterns
            const isDetailsTag = textContent === '<details>';
            const isPlusPattern = textContent === '+++';
            
            if (isDetailsTag || isPlusPattern) {
              // Don't transform if already in a collapsible section
              if ($findCollapsibleParent(node)) continue;

              // Create collapsible section
              const collapsibleSection = $createCollapsibleSection();
              
              // Replace the parent paragraph with the collapsible section
              parent.replace(collapsibleSection);
              
              // Place cursor in the title
              const title = $findTitleInCollapsible(collapsibleSection);
              if (title) {
                const firstChild = title.getFirstChild();
                if (firstChild) {
                  firstChild.selectStart();
                }
              }
            }
          }

          // Handle structural transforms
          for (const key of dirtyElements.keys()) {
            const node = $getNodeByKey(key);
            
            if (!node) continue;

            // Enforce structure: Title must be inside container
            if ($isCollapsibleSectionTitleNode(node)) {
              const parent = node.getParent();
              if (!$isCollapsibleSectionContainerNode(parent)) {
                node.replace($createParagraphNode().append(...node.getChildren()));
              }
            }
            // Enforce structure: Content must be inside container
            else if ($isCollapsibleSectionContentNode(node)) {
              const parent = node.getParent();
              if (!$isCollapsibleSectionContainerNode(parent)) {
                const children = node.getChildren();
                for (const child of children) {
                  node.insertBefore(child);
                }
                node.remove();
              }
            }
            // Node transform to fix invalid collapsible sections (missing title or content)
            else if ($isCollapsibleSectionContainerNode(node)) {
              const title = $findTitleInCollapsible(node);
              const content = $findContentInCollapsible(node);
              
              const children = node.getChildren();
              const hasValidStructure =
                children.length === 2 &&
                title === children[0] &&
                content === children[1];

              if (!title || !content || !hasValidStructure) {
                for (const child of children) {
                  node.insertBefore(child);
                }
                node.remove();
                continue;
              }
              
              // Ensure title has at least one child (paragraph)
              if (title.getChildrenSize() === 0) {
                const paragraph = $createParagraphNode();
                title.append(paragraph);
              }
              
              // Ensure content has at least one child (paragraph)
              if (content.getChildrenSize() === 0) {
                const paragraph = $createParagraphNode();
                content.append(paragraph);
              }

              // Post-fixer to ensure there's always a paragraph after a collapsible section at the end
              // Check if this is the last child in its parent
              const nextSibling = node.getNextSibling();
              if (!nextSibling) {
                const parent = node.getParent();
                // Only add paragraph if parent is root or another shadow root
                if (parent && ($getRoot() === parent || (parent as ElementNode).isShadowRoot?.())) {
                  const paragraph = $createParagraphNode();
                  node.insertAfter(paragraph);
                }
              }
            }
          }
        });
      }),

      // Update visual selection state when selection changes
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          
          // Get all collapsible section DOM elements
          const rootElement = editor.getRootElement();
          if (!rootElement) return;
          
          const collapsibleElements = rootElement.querySelectorAll('.detailsBlock');
          
          // Remove selected/empty classes from all
          collapsibleElements.forEach((el) => {
            el.classList.remove(SELECTED_CLASS);
            const titleElement = el.querySelector('.detailsBlockTitle');
            if (titleElement) {
              titleElement.classList.remove(EMPTY_TITLE_CLASS);
            }
          });
          
          // Add selected class to selected collapsible sections
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            for (const node of nodes) {
              if ($isCollapsibleSectionContainerNode(node)) {
                const element = editor.getElementByKey(node.getKey());
                if (element) {
                  element.classList.add(SELECTED_CLASS);
                }
              }
            }
          }

          // Add empty-title class to title elements with no visible text
          collapsibleElements.forEach((el) => {
            const titleElement = el.querySelector('.detailsBlockTitle');
            if (!titleElement) {
              return;
            }
            const titleText = titleElement.textContent?.trim() ?? '';
            if (titleText.length === 0) {
              titleElement.classList.add(EMPTY_TITLE_CLASS);
            }
          });
        });
      })
    );
  }, [editor]);

  return null;
}

export default CollapsibleSectionsPlugin;

