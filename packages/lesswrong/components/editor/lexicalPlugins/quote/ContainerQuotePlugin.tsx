"use client";

import { useEffect } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $isContainerQuoteNode } from './ContainerQuoteNode';

/**
 * ContainerQuotePlugin handles keyboard interactions for the shadow-root
 * ContainerQuoteNode:
 *
 * - Enter on an empty trailing paragraph inside a quote: moves the paragraph
 *   out after the quote (exit behavior, like collapsible sections).
 */
export default function ContainerQuotePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      // Handle Enter key: exit quote when pressing Enter on an empty
      // trailing paragraph
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          // Walk up to find the paragraph (or direct element) inside the quote
          let block = anchorNode;
          if (!$isParagraphNode(block)) {
            const parent = block.getParent();
            if (parent && $isParagraphNode(parent)) {
              block = parent;
            } else {
              return false;
            }
          }

          const quoteParent = block.getParent();
          if (!$isContainerQuoteNode(quoteParent)) {
            return false;
          }

          // Only exit if the paragraph is empty and is the last child
          const isEmpty = block.getTextContent().length === 0
            && block.getChildrenSize() === 0;
          const isLastChild = block.getNextSibling() === null;

          if (!isEmpty || !isLastChild) {
            return false;
          }

          // If this is the only child, don't exit (keep at least one paragraph
          // inside the quote; the user can press Backspace to unwrap instead)
          if (block.getPreviousSibling() === null) {
            return false;
          }

          // Move the empty paragraph out after the quote
          quoteParent.insertAfter(block);
          block.selectStart();

          event?.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
