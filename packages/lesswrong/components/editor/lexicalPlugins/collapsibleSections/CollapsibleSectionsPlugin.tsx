"use client";

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  createCommand,
  LexicalCommand,
  TextNode,
  $isTextNode,
  LexicalNode,
  CLICK_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
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
  const container = $createCollapsibleSectionContainerNode(true);
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
            selection.insertNodes([collapsibleSection]);
            
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
          if (target.classList.contains('detailsBlockTitle')) {
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

      // Handle Enter key in title - move to content
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          
          // Check if we're in a collapsible title
          if ($isInCollapsibleTitle(anchorNode)) {
            const collapsible = $findCollapsibleParent(anchorNode);
            if (collapsible) {
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

      // Auto-format: "<details>" or "+++" at start of line creates collapsible section
      editor.registerNodeTransform(TextNode, (node) => {
        if (!$isTextNode(node)) return;

        const textContent = node.getTextContent();
        
        // Check for autoformat patterns
        const isDetailsTag = textContent === '<details>' || textContent === '<details> ';
        const isPlusPattern = textContent === '+++' || textContent === '+++ ';
        
        if (isDetailsTag || isPlusPattern) {
          const parent = node.getParent();
          if (!parent) return;

          // Don't transform if already in a collapsible section
          if ($findCollapsibleParent(node)) return;

          // Only transform if this is the first/only text in the paragraph
          const previousSibling = node.getPreviousSibling();
          if (previousSibling) return;

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
      })
    );
  }, [editor]);

  return null;
}

export default CollapsibleSectionsPlugin;

