"use client";

import {
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type ParagraphNode,
  type RangeSelection,
  type SerializedElementNode,
  $createParagraphNode,
} from 'lexical';
import { QuoteNode, type SerializedQuoteNode } from '@lexical/rich-text';
import { addClassNamesToElement, isHTMLElement } from '@lexical/utils';
import { TupleSet } from '@/lib/utils/typeGuardUtils';

const validElementFormats = new TupleSet(['left', 'center', 'right', 'justify', 'start', 'end'] as const);

/**
 * ContainerQuoteNode is a shadow root version of QuoteNode that supports
 * nested block-level content (paragraphs, lists, collapsible sections, etc.).
 *
 * By returning true from isShadowRoot(), all Lexical utilities that respect
 * root/shadow-root boundaries ($insertNodeToNearestRoot, $insertList,
 * selection.insertNodes, etc.) will operate *inside* the quote rather than
 * breaking out of it.
 *
 * This is the same pattern used by CollapsibleSectionContentNode.
 */
export class ContainerQuoteNode extends QuoteNode {
  static getType(): string {
    return 'quote';
  }

  static clone(node: ContainerQuoteNode): ContainerQuoteNode {
    return new ContainerQuoteNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(config: { theme: { quote?: string } }): HTMLElement {
    const element = document.createElement('blockquote');
    if (config.theme.quote) {
      addClassNamesToElement(element, config.theme.quote);
    }
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      blockquote: () => ({
        conversion: convertBlockquoteElement,
        // Higher priority than the built-in QuoteNode converter (priority 0)
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedQuoteNode): ContainerQuoteNode {
    return $createContainerQuoteNode().updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
      type: 'quote',
      version: 1,
    };
  }

  // Shadow root: this node can contain block-level children
  isShadowRoot(): boolean {
    return true;
  }

  // Allow the blockquote to be empty. This matches the original QuoteNode
  // default and prevents the sentinel paragraph plugin from placing sentinels
  // around blockquotes (sentinels are placed around nodes with canBeEmpty()
  // === false, but blockquotes are text containers that users can navigate
  // in and out of normally — unlike opaque blocks like images).
  canBeEmpty(): boolean {
    return true;
  }

  // Override the base QuoteNode's insertNewAfter which creates a paragraph
  // *after* the quote. As a shadow root, we want new paragraphs to be created
  // *inside* the quote. The ContainerQuotePlugin handles exiting the quote
  // on Enter at an empty trailing paragraph.
  insertNewAfter(_: RangeSelection, restoreSelection?: boolean): ParagraphNode {
    const newBlock = $createParagraphNode();
    const direction = this.getDirection();
    newBlock.setDirection(direction);
    this.append(newBlock);
    if (restoreSelection) {
      newBlock.selectStart();
    }
    return newBlock;
  }

  // Override collapseAtStart: when the user presses backspace at the very
  // start of the first child inside the quote, unwrap the quote's children
  // out of the quote and remove the (now empty) quote.
  collapseAtStart(): true {
    $unwrapQuote(this);
    return true;
  }

  canMergeWhenEmpty(): true {
    return true;
  }
}

const blockTags = new Set([
  'P', 'DIV', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'PRE', 'TABLE', 'DETAILS', 'HR', 'FIGURE',
]);

/**
 * DOM converter for <blockquote> elements. If the blockquote contains
 * only inline content (text, <strong>, <em>, etc.) with no block-level
 * children, wraps the inline content in a <p> so the shadow root
 * QuoteNode has a proper block child.
 */
function convertBlockquoteElement(domNode: HTMLElement): DOMConversionOutput {
  const node = $createContainerQuoteNode();

  // Check if this blockquote has any block-level children
  let hasBlockChildren = false;
  for (let i = 0; i < domNode.childNodes.length; i++) {
    const child = domNode.childNodes[i];
    if (child.nodeType === 1 && blockTags.has((child as HTMLElement).tagName)) {
      hasBlockChildren = true;
      break;
    }
  }

  if (!hasBlockChildren && domNode.childNodes.length > 0) {
    // Wrap inline content in a <p> element so Lexical's HTML importer
    // creates a ParagraphNode child for our shadow root
    const wrapper = document.createElement('p');
    while (domNode.firstChild) {
      wrapper.appendChild(domNode.firstChild);
    }
    domNode.appendChild(wrapper);
  }

  if (isHTMLElement(domNode)) {
    const format = domNode.style.textAlign;
    if (validElementFormats.has(format)) {
      node.setFormat(format);
    }
  }

  return { node };
}

export function $createContainerQuoteNode(): ContainerQuoteNode {
  return new ContainerQuoteNode();
}

export function $isContainerQuoteNode(
  node: LexicalNode | null | undefined,
): node is ContainerQuoteNode {
  return node instanceof ContainerQuoteNode;
}

/**
 * Wraps the given block node(s) in a new ContainerQuoteNode. The quote is
 * inserted before the first block, and all blocks are appended into it.
 *
 * @param blocks - One or more nodes to wrap. Must be in document order.
 * @returns The newly created ContainerQuoteNode.
 */
export function $wrapInQuote(blocks: LexicalNode[]): ContainerQuoteNode {
  const quoteNode = $createContainerQuoteNode();
  blocks[0].insertBefore(quoteNode);
  for (const block of blocks) {
    quoteNode.append(block);
  }
  return quoteNode;
}

/**
 * Unwraps a ContainerQuoteNode by moving all its children out before it,
 * then removing the (now empty) quote.
 */
export function $unwrapQuote(quoteNode: ContainerQuoteNode): void {
  const children = quoteNode.getChildren();
  for (const child of children) {
    quoteNode.insertBefore(child);
  }
  quoteNode.remove();
}
