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
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  type ParagraphNode,
  type RangeSelection,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { ContainerQuoteNode, $isContainerQuoteNode } from './ContainerQuoteNode';

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
function $normalizeQuoteChildren(quoteNode: ContainerQuoteNode): void {
  const children = quoteNode.getChildren();

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

function $getSelectedParagraph(selection: RangeSelection): ParagraphNode | null {
  const anchorNode = selection.anchor.getNode();
  if ($isParagraphNode(anchorNode)) {
    return anchorNode;
  }

  const parent = anchorNode.getParent();
  return parent && $isParagraphNode(parent) ? parent : null;
}

function $isEmptyParagraph(paragraph: ParagraphNode): boolean {
  return paragraph.getTextContent().trim().length === 0;
}

export function $handleContainerQuoteEnter(event?: KeyboardEvent | null): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }

  const block = $getSelectedParagraph(selection);
  if (!block) {
    return false;
  }

  const quoteParent = block.getParent();
  if (!$isContainerQuoteNode(quoteParent)) {
    return false;
  }

  // Exit only from an empty trailing paragraph inside a quote.
  if (!$isEmptyParagraph(block) || block.getNextSibling() !== null) {
    return false;
  }

  if (block.getPreviousSibling() === null) {
    const quoteGrandparent = quoteParent.getParent();
    if (!$isContainerQuoteNode(quoteGrandparent)) {
      return false;
    }

    // A pasted nested empty quote should collapse to a normal empty paragraph
    // in the enclosing quote, not stay as an unexitable nested blockquote.
    quoteParent.insertBefore(block);
    quoteParent.remove();
  } else {
    quoteParent.insertAfter(block);
  }

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
 * - Enter on an empty trailing paragraph inside a quote: moves the paragraph
 *   out after the quote (exit behavior, like collapsible sections).
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

      // Handle Enter key: exit quote when pressing Enter on an empty
      // trailing paragraph
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        $handleContainerQuoteEnter,
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}
