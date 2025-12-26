"use client";

import {
  ElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
} from 'lexical';

export type SerializedCollapsibleSectionContentNode = SerializedElementNode;

const COLLAPSIBLE_CONTENT_CLASS = 'detailsBlockContent';

/**
 * CollapsibleSectionContentNode represents the main content area of a collapsible section.
 * This can contain any block-level content (paragraphs, lists, etc.).
 */
export class CollapsibleSectionContentNode extends ElementNode {
  static getType(): string {
    return 'collapsible-section-content';
  }

  static clone(node: CollapsibleSectionContentNode): CollapsibleSectionContentNode {
    return new CollapsibleSectionContentNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = COLLAPSIBLE_CONTENT_CLASS;
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.className = COLLAPSIBLE_CONTENT_CLASS;
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains(COLLAPSIBLE_CONTENT_CLASS)) {
          return {
            conversion: convertCollapsibleContentElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedCollapsibleSectionContentNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-section-content',
      version: 1,
    };
  }

  static importJSON(): CollapsibleSectionContentNode {
    return $createCollapsibleSectionContentNode();
  }

  // Content area can contain block-level elements
  canBeEmpty(): boolean {
    return false;
  }
}

function convertCollapsibleContentElement(): DOMConversionOutput {
  const node = $createCollapsibleSectionContentNode();
  return { node };
}

export function $createCollapsibleSectionContentNode(): CollapsibleSectionContentNode {
  return new CollapsibleSectionContentNode();
}

export function $isCollapsibleSectionContentNode(
  node: LexicalNode | null | undefined
): node is CollapsibleSectionContentNode {
  return node instanceof CollapsibleSectionContentNode;
}

