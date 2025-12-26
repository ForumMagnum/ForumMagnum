import {
  ElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
} from 'lexical';
import { FOOTNOTE_ATTRIBUTES, FOOTNOTE_CLASSES } from './constants';

export type SerializedFootnoteSectionNode = SerializedElementNode;

/**
 * FootnoteSectionNode is a container element that lives at the bottom of the document
 * and holds all FootnoteItemNodes.
 */
export class FootnoteSectionNode extends ElementNode {
  static getType(): string {
    return 'footnote-section';
  }

  static clone(node: FootnoteSectionNode): FootnoteSectionNode {
    return new FootnoteSectionNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const ol = document.createElement('ol');
    ol.className = `${FOOTNOTE_CLASSES.footnoteSection} ${FOOTNOTE_CLASSES.footnotes}`;
    ol.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteSection, '');
    ol.setAttribute('role', 'doc-endnotes');
    return ol;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const ol = document.createElement('ol');
    ol.className = `${FOOTNOTE_CLASSES.footnoteSection} ${FOOTNOTE_CLASSES.footnotes}`;
    ol.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteSection, '');
    ol.setAttribute('role', 'doc-endnotes');
    return { element: ol };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      ol: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteSection)) {
          return null;
        }
        return {
          conversion: convertFootnoteSectionElement,
          priority: 2,
        };
      },
      // Also handle div elements (used in editing view)
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteSection)) {
          return null;
        }
        return {
          conversion: convertFootnoteSectionElement,
          priority: 2,
        };
      },
    };
  }

  exportJSON(): SerializedFootnoteSectionNode {
    return {
      ...super.exportJSON(),
      type: 'footnote-section',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedFootnoteSectionNode): FootnoteSectionNode {
    return $createFootnoteSectionNode();
  }

  isShadowRoot(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

function convertFootnoteSectionElement(): DOMConversionOutput {
  const node = $createFootnoteSectionNode();
  return { node };
}

export function $createFootnoteSectionNode(): FootnoteSectionNode {
  return new FootnoteSectionNode();
}

export function $isFootnoteSectionNode(
  node: LexicalNode | null | undefined
): node is FootnoteSectionNode {
  return node instanceof FootnoteSectionNode;
}

