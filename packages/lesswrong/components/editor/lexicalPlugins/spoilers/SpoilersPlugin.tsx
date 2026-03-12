"use client";

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  createCommand,
  LexicalCommand,
  TextNode,
  $isTextNode,
  ElementNode,
  $getNodeByKey,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import { SpoilerNode, $createSpoilerNode, $isSpoilerNode } from './SpoilerNode';
import { useMessages } from '@/components/common/withMessages';

export const INSERT_SPOILER_COMMAND: LexicalCommand<void> = createCommand('INSERT_SPOILER_COMMAND');
export const TOGGLE_SPOILER_COMMAND: LexicalCommand<void> = createCommand('TOGGLE_SPOILER_COMMAND');

/**
 * Plugin for spoiler/collapsible content blocks.
 * 
 * Features:
 * - Toggle spoiler blocks on selected content
 * - Auto-format: type ">!" at start of line to create spoiler
 * - Press Enter in empty spoiler block to exit
 */
export function SpoilersPlugin({ isSuggestionMode }: { isSuggestionMode?: boolean }): null {
  const [editor] = useLexicalComposerContext();
  const { flash } = useMessages();

  useEffect(() => {
    // Register the SpoilerNode if not already registered
    if (!editor.hasNodes([SpoilerNode])) {
      throw new Error('SpoilersPlugin: SpoilerNode not registered on editor');
    }

    return mergeRegister(
      // Handle INSERT_SPOILER_COMMAND
      editor.registerCommand(
        INSERT_SPOILER_COMMAND,
        () => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Spoiler blocks are not supported in suggestion mode',
              type: 'error',
            });
            
            return true;
          }
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const spoilerNode = $createSpoilerNode();
            const paragraph = $createParagraphNode();
            spoilerNode.append(paragraph);
            
            selection.insertNodes([spoilerNode]);
            paragraph.selectStart();
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle TOGGLE_SPOILER_COMMAND
      editor.registerCommand(
        TOGGLE_SPOILER_COMMAND,
        () => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Spoiler blocks are not supported in suggestion mode',
              type: 'error',
            });
            return true;
          }
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const anchorNode = selection.anchor.getNode();
            const spoilerParent = findSpoilerParent(anchorNode);

            if (spoilerParent) {
              // Already in a spoiler - unwrap it
              unwrapSpoiler(spoilerParent);
            } else {
              // Wrap selection in a spoiler
              const spoilerNode = $createSpoilerNode();
              $setBlocksType(selection, () => spoilerNode);
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle Enter key to exit empty spoiler blocks
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const spoilerParent = findSpoilerParent(anchorNode);

          if (!spoilerParent) {
            return false;
          }

          // Check if current block is empty
          const topLevelElement = anchorNode.getTopLevelElementOrThrow();
          const isEmpty = topLevelElement.getTextContent().trim() === '';

          if (isEmpty) {
            event?.preventDefault();
            
            editor.update(() => {
              // Move the empty paragraph out of the spoiler
              const paragraph = $createParagraphNode();
              spoilerParent.insertAfter(paragraph);
              topLevelElement.remove();
              paragraph.selectStart();

              // If spoiler is now empty, remove it
              if (spoilerParent.getChildrenSize() === 0) {
                spoilerParent.remove();
              }
            });
            
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Auto-format: ">!" at start of line creates spoiler
      editor.registerUpdateListener(({dirtyLeaves, tags}) => {
        if (tags.has('collaboration')) {
          return;
        }
        editor.update(() => {
          for (const key of dirtyLeaves) {
            const node = $getNodeByKey(key);
            if (!$isTextNode(node)) continue;

            const textContent = node.getTextContent();
            
            // Check for ">!" pattern at start of text
            if (textContent === '>!' || textContent.startsWith('>! ')) {
              const parent = node.getParent();
              if (!parent) continue;

              // Don't transform if already in a spoiler
              if (findSpoilerParent(node)) continue;

              // Only transform if this is the first text in the paragraph
              const previousSibling = node.getPreviousSibling();
              if (previousSibling) continue;

              // Create spoiler and move content
              const spoilerNode = $createSpoilerNode();
              const paragraph = $createParagraphNode();
              
              // Get remaining text after ">!" or ">! "
              const remainingText = textContent.startsWith('>! ') 
                ? textContent.slice(3) 
                : textContent.slice(2);

              if (remainingText) {
                paragraph.append(node.splitText(textContent.startsWith('>! ') ? 3 : 2)[1]);
              }
              
              spoilerNode.append(paragraph);
              
              // Replace the parent paragraph with the spoiler
              if (parent.getChildrenSize() === 1 && textContent.length <= 3) {
                parent.replace(spoilerNode);
              } else {
                parent.insertBefore(spoilerNode);
                node.remove();
              }
              
              paragraph.selectStart();
            }
          }
        });
      })
    );
  }, [editor, isSuggestionMode, flash]);

  return null;
}

/**
 * Find the spoiler node that contains this node, if any
 */
function findSpoilerParent(node: ElementNode | TextNode): SpoilerNode | null {
  let current = node.getParent();
  while (current) {
    if ($isSpoilerNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}

/**
 * Unwrap a spoiler node, moving its children to its parent
 */
function unwrapSpoiler(spoilerNode: SpoilerNode): void {
  const children = spoilerNode.getChildren();
  const parent = spoilerNode.getParent();
  
  if (!parent) return;

  // Move all children out of the spoiler
  for (const child of children) {
    spoilerNode.insertBefore(child);
  }
  
  spoilerNode.remove();
}

export default SpoilersPlugin;

