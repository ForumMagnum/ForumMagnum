"use client";

import { useEffect } from 'react';
import {
  type LexicalNode,
  $createParagraphNode,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isRangeSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { ContainerQuoteNode, $isContainerQuoteNode, $moveChildOutOfQuote } from './ContainerQuoteNode';

/**
 * Returns true if the node is inline (i.e. not a block-level element or
 * block-level decorator). TextNode, LineBreakNode, inline ElementNodes
 * (e.g. LinkNode), and inline DecoratorNodes are all considered inline.
 */
function $isInlineNode(node: LexicalNode): boolean {
  if ($isElementNode(node)) {
    return node.isInline();
  }
  if ($isDecoratorNode(node)) {
    return node.isInline();
  }
  // TextNode, LineBreakNode, etc. are always inline
  return true;
}

/**
 * Wraps a consecutive run of inline nodes in a ParagraphNode, inserting the
 * paragraph where the first inline node currently sits.
 */
function $wrapRunInParagraph(nodes: LexicalNode[]): void {
  const paragraph = $createParagraphNode();
  nodes[0].insertBefore(paragraph);
  for (const node of nodes) {
    paragraph.append(node);
  }
}

/**
 * Normalizes a ContainerQuoteNode's children so that all direct children are
 * block-level. Any consecutive runs of inline nodes (text, inline elements,
 * etc.) are wrapped in a ParagraphNode.
 *
 * This handles backwards-compatibility with documents created using the old
 * flat QuoteNode, which stored inline children (TextNode, etc.) directly
 * inside the quote. Since ContainerQuoteNode is a shadow root, it needs
 * block-level children for editing operations (Enter, Backspace, block-type
 * changes) to work correctly.
 */
export function $normalizeQuoteChildren(quoteNode: ContainerQuoteNode): void {
  const children = quoteNode.getChildren();

  // A childless quote breaks editing operations (Enter inside it crashes
  // Lexical's block-splitting logic), so give it an empty paragraph.
  if (children.length === 0) {
    quoteNode.append($createParagraphNode());
    return;
  }

  // Early return: if all children are already block-level, no mutation needed.
  if (!children.some((child) => $isInlineNode(child))) {
    return;
  }

  let runStart = -1;
  for (let i = 0; i <= children.length; i++) {
    const isInline = i < children.length && $isInlineNode(children[i]);
    if (isInline && runStart === -1) {
      runStart = i;
    } else if (!isInline && runStart !== -1) {
      $wrapRunInParagraph(children.slice(runStart, i));
      runStart = -1;
    }
  }
}

export function $handleEnterInQuote(event: KeyboardEvent | null): boolean {
  if (event?.shiftKey) {
    return false;
  }

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

  const isEmpty = block.getTextContent().length === 0
    && block.getChildrenSize() === 0;
  if (!isEmpty) {
    return false;
  }

  // If this is the only child, don't exit (keep at least one paragraph
  // inside the quote; the user can press Backspace to unwrap instead)
  if (quoteParent.getChildrenSize() === 1) {
    return false;
  }

  $moveChildOutOfQuote(quoteParent, block);
  block.selectStart();

  event?.preventDefault();
  return true;
}

/**
 * ContainerQuotePlugin handles keyboard interactions and structural
 * normalization for the shadow-root ContainerQuoteNode:
 *
 * - Node transform: wraps any inline children in a ParagraphNode, ensuring
 *   backwards-compatibility with documents created using the old flat QuoteNode
 *   (including collaborative Yjs documents).
 *
 * - Enter on an empty paragraph inside a quote: moves the paragraph out of the
 *   quote, splitting the quote in two if the paragraph has siblings on both
 *   sides.
 */
export default function ContainerQuotePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      // Normalize structure: wrap any inline children in a ParagraphNode.
      // This fires whenever a ContainerQuoteNode is created or modified,
      // handling old documents (including Yjs state) that have inline
      // children directly inside the quote.
      editor.registerNodeTransform(ContainerQuoteNode, $normalizeQuoteChildren),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        $handleEnterInQuote,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
