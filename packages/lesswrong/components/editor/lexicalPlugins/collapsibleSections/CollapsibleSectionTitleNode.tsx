"use client";

import {
  ElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  RangeSelection,
} from 'lexical';

export type SerializedCollapsibleSectionTitleNode = SerializedElementNode;

const COLLAPSIBLE_TITLE_CLASS = 'detailsBlockTitle';

/**
 * CollapsibleSectionTitleNode represents the title/summary part of a collapsible section.
 * In the exported HTML, this becomes the <summary> element.
 */
export class CollapsibleSectionTitleNode extends ElementNode {
  static getType(): string {
    return 'collapsible-section-title';
  }

  static clone(node: CollapsibleSectionTitleNode): CollapsibleSectionTitleNode {
    return new CollapsibleSectionTitleNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = COLLAPSIBLE_TITLE_CLASS;
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    // In the data representation, the title is a <summary> element
    const summary = document.createElement('summary');
    summary.className = COLLAPSIBLE_TITLE_CLASS;
    return { element: summary };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      // Import from <summary> elements (data representation)
      summary: (domNode: HTMLElement) => {
        if (domNode.classList.contains(COLLAPSIBLE_TITLE_CLASS)) {
          return {
            conversion: convertCollapsibleTitleElement,
            priority: 2,
          };
        }
        return null;
      },
      // Import from <div> elements (editing representation)
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains(COLLAPSIBLE_TITLE_CLASS)) {
          // Check if parent is the edit wrapper (not content)
          const parent = domNode.parentElement;
          if (parent?.classList.contains('detailsBlock') || parent?.classList.contains('detailsBlockEdit')) {
            return {
              conversion: convertCollapsibleTitleElement,
              priority: 2,
            };
          }
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedCollapsibleSectionTitleNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-section-title',
      version: 1,
    };
  }

  static importJSON(): CollapsibleSectionTitleNode {
    return $createCollapsibleSectionTitleNode();
  }

  // The title should behave somewhat like a heading - can't be split
  collapseAtStart(selection: RangeSelection): boolean {
    return false;
  }

  // Title can be empty (user might clear it)
  canBeEmpty(): boolean {
    return true;
  }
}

function convertCollapsibleTitleElement(): DOMConversionOutput {
  const node = $createCollapsibleSectionTitleNode();
  return { node };
}

export function $createCollapsibleSectionTitleNode(): CollapsibleSectionTitleNode {
  return new CollapsibleSectionTitleNode();
}

export function $isCollapsibleSectionTitleNode(
  node: LexicalNode | null | undefined
): node is CollapsibleSectionTitleNode {
  return node instanceof CollapsibleSectionTitleNode;
}

