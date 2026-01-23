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

export type SerializedFootnoteContentNode = SerializedElementNode;

/**
 * FootnoteContentNode is the editable container within a footnote item
 * that holds the actual footnote text content.
 */
export class FootnoteContentNode extends ElementNode {
  static getType(): string {
    return 'footnote-content';
  }

  static clone(node: FootnoteContentNode): FootnoteContentNode {
    return new FootnoteContentNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = FOOTNOTE_CLASSES.footnoteContent;
    div.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteContent, '');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.className = FOOTNOTE_CLASSES.footnoteContent;
    div.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteContent, '');
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteContent)) {
          return null;
        }
        return {
          conversion: convertFootnoteContentElement,
          priority: 2,
        };
      },
    };
  }

  exportJSON(): SerializedFootnoteContentNode {
    return {
      ...super.exportJSON(),
      type: 'footnote-content',
      version: 1,
    };
  }

  static importJSON(): FootnoteContentNode {
    return $createFootnoteContentNode();
  }

  isShadowRoot(): boolean {
    return false;
  }
}

function convertFootnoteContentElement(): DOMConversionOutput {
  const node = $createFootnoteContentNode();
  return { node };
}

export function $createFootnoteContentNode(): FootnoteContentNode {
  return new FootnoteContentNode();
}

export function $isFootnoteContentNode(
  node: LexicalNode | null | undefined
): node is FootnoteContentNode {
  return node instanceof FootnoteContentNode;
}

