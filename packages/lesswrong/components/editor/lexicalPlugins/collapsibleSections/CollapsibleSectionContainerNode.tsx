"use client";

import {
  ElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
  RangeSelection,
} from 'lexical';

export type SerializedCollapsibleSectionContainerNode = Spread<
  {
    isOpen: boolean;
  },
  SerializedElementNode
>;

const COLLAPSIBLE_CONTAINER_CLASS = 'detailsBlock';
const COLLAPSIBLE_EDIT_CLASS = 'detailsBlockEdit';
const COLLAPSIBLE_CLOSED_CLASS = 'detailsBlockClosed';

/**
 * CollapsibleSectionContainerNode is the root container for a collapsible section.
 * It contains a title node and a content node.
 * 
 * In the data representation (exported HTML), this becomes:
 *   <details class="detailsBlock">
 *     <summary class="detailsBlockTitle">...</summary>
 *     <div class="detailsBlockContent">...</div>
 *   </details>
 * 
 * In the editing representation, it renders as a div to allow click handling
 * without the native details collapse behavior interfering with editing.
 */
export class CollapsibleSectionContainerNode extends ElementNode {
  __isOpen: boolean;

  static getType(): string {
    return 'collapsible-section-container';
  }

  static clone(node: CollapsibleSectionContainerNode): CollapsibleSectionContainerNode {
    return new CollapsibleSectionContainerNode(node.__isOpen, node.__key);
  }

  constructor(isOpen: boolean = true, key?: NodeKey) {
    super(key);
    this.__isOpen = isOpen;
  }

  getIsOpen(): boolean {
    return this.__isOpen;
  }

  setIsOpen(isOpen: boolean): void {
    const writable = this.getWritable();
    writable.__isOpen = isOpen;
  }

  toggleOpen(): void {
    const writable = this.getWritable();
    writable.__isOpen = !writable.__isOpen;
  }

  createDOM(): HTMLElement {
    // In the editor, we use a div with special classes for collapse state
    const div = document.createElement('div');
    div.className = `${COLLAPSIBLE_CONTAINER_CLASS} ${COLLAPSIBLE_EDIT_CLASS}`;
    if (!this.__isOpen) {
      div.classList.add(COLLAPSIBLE_CLOSED_CLASS);
    }
    // Store the node key so we can find this node from click events
    div.setAttribute('data-collapsible-key', this.__key);
    return div;
  }

  updateDOM(prevNode: CollapsibleSectionContainerNode, dom: HTMLElement): boolean {
    if (prevNode.__isOpen !== this.__isOpen) {
      if (this.__isOpen) {
        dom.classList.remove(COLLAPSIBLE_CLOSED_CLASS);
      } else {
        dom.classList.add(COLLAPSIBLE_CLOSED_CLASS);
      }
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    // Export as <details> element for the data representation
    const details = document.createElement('details');
    details.className = COLLAPSIBLE_CONTAINER_CLASS;
    // Default to open so readers can see content
    details.setAttribute('open', '');
    return { element: details };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      // Import from <details> elements (data representation)
      details: (domNode: HTMLElement) => {
        if (domNode.classList.contains(COLLAPSIBLE_CONTAINER_CLASS)) {
          return {
            conversion: convertCollapsibleContainerElement,
            priority: 2,
          };
        }
        return null;
      },
      // Import from <div> elements (editing representation)
      div: (domNode: HTMLElement) => {
        if (
          domNode.classList.contains(COLLAPSIBLE_CONTAINER_CLASS) &&
          (domNode.classList.contains(COLLAPSIBLE_EDIT_CLASS) || 
           domNode.tagName.toLowerCase() === 'div')
        ) {
          // Make sure it's the container, not the content div
          if (!domNode.classList.contains('detailsBlockContent') &&
              !domNode.classList.contains('detailsBlockTitle')) {
            return {
              conversion: convertCollapsibleContainerElement,
              priority: 2,
            };
          }
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedCollapsibleSectionContainerNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-section-container',
      version: 1,
      isOpen: this.__isOpen,
    };
  }

  static importJSON(serializedNode: SerializedCollapsibleSectionContainerNode): CollapsibleSectionContainerNode {
    return $createCollapsibleSectionContainerNode(serializedNode.isOpen);
  }

  // Collapsible sections can contain any block-level content
  canBeEmpty(): boolean {
    return false;
  }

  // Handle backspace at start - unwrap the collapsible if at start of title
  collapseAtStart(selection: RangeSelection): boolean {
    const children = this.getChildren();
    
    // Move all content children out of the collapsible section
    for (const child of children) {
      this.insertBefore(child);
    }
    
    this.remove();
    return true;
  }
}

function convertCollapsibleContainerElement(domNode: HTMLElement): DOMConversionOutput {
  const isOpen = domNode.hasAttribute('open') || !domNode.classList.contains(COLLAPSIBLE_CLOSED_CLASS);
  const node = $createCollapsibleSectionContainerNode(isOpen);
  return { node };
}

export function $createCollapsibleSectionContainerNode(isOpen: boolean = true): CollapsibleSectionContainerNode {
  return new CollapsibleSectionContainerNode(isOpen);
}

export function $isCollapsibleSectionContainerNode(
  node: LexicalNode | null | undefined
): node is CollapsibleSectionContainerNode {
  return node instanceof CollapsibleSectionContainerNode;
}

