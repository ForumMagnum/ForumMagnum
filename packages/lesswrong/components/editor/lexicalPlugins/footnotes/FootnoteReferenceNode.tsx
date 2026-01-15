import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode,
} from 'lexical';
import { FOOTNOTE_ATTRIBUTES, FOOTNOTE_CLASSES } from './constants';

export type SerializedFootnoteReferenceNode = Spread<
  {
    footnoteId: string;
    footnoteIndex: number;
  },
  SerializedTextNode
>;

/**
 * FootnoteReferenceNode represents an inline footnote citation that appears
 * in the main text as a superscript link (e.g., [1]).
 * 
 * It links to the corresponding FootnoteItemNode at the bottom of the document.
 */
export class FootnoteReferenceNode extends TextNode {
  __footnoteId: string;
  __footnoteIndex: number;

  static getType(): string {
    return 'footnote-reference';
  }

  static clone(node: FootnoteReferenceNode): FootnoteReferenceNode {
    return new FootnoteReferenceNode(
      node.__footnoteId,
      node.__footnoteIndex,
      node.__key
    );
  }

  constructor(footnoteId: string, footnoteIndex: number, key?: NodeKey) {
    super(`[${footnoteIndex}]`, key);
    this.__footnoteId = footnoteId;
    this.__footnoteIndex = footnoteIndex;
  }

  getFootnoteId(): string {
    return this.__footnoteId;
  }

  getFootnoteIndex(): number {
    return this.__footnoteIndex;
  }

  setFootnoteIndex(index: number): void {
    const writable = this.getWritable();
    writable.__footnoteIndex = index;
    writable.__text = `[${index}]`;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = FOOTNOTE_CLASSES.footnoteReference;
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteReference, '');
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
    span.setAttribute('role', 'doc-noteref');
    span.id = `fnref${this.__footnoteId}`;
    span.spellcheck = false;

    const sup = document.createElement('sup');
    const anchor = document.createElement('a');
    anchor.href = `#fn${this.__footnoteId}`;
    anchor.textContent = this.getTextContent();
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const footnoteElement = document.getElementById(`fn${this.__footnoteId}`);
      if (footnoteElement) {
        footnoteElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
    sup.appendChild(anchor);
    span.appendChild(sup);
    return span;
  }

  updateDOM(prevNode: FootnoteReferenceNode, dom: HTMLElement, _config: EditorConfig): boolean {
    if (prevNode.__footnoteIndex !== this.__footnoteIndex) {
      dom.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
      const link = dom.querySelector('a');
      if (link) {
        link.textContent = `[${this.__footnoteIndex}]`;
      }
    }
    if (prevNode.__footnoteId !== this.__footnoteId) {
      dom.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
      dom.id = `fnref${this.__footnoteId}`;
      const link = dom.querySelector('a');
      if (link) {
        link.setAttribute('href', `#fn${this.__footnoteId}`);
      }
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.className = FOOTNOTE_CLASSES.footnoteReference;
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteReference, '');
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
    span.setAttribute('role', 'doc-noteref');
    span.id = `fnref${this.__footnoteId}`;

    const sup = document.createElement('sup');
    const anchor = document.createElement('a');
    anchor.href = `#fn${this.__footnoteId}`;
    anchor.textContent = `[${this.__footnoteIndex}]`;
    
    sup.appendChild(anchor);
    span.appendChild(sup);

    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteReference)) {
          return null;
        }
        return {
          conversion: convertFootnoteReferenceElement,
          priority: 2,
        };
      },
    };
  }

  exportJSON(): SerializedFootnoteReferenceNode {
    return {
      ...super.exportJSON(),
      footnoteId: this.__footnoteId,
      footnoteIndex: this.__footnoteIndex,
    };
  }

  static importJSON(serializedNode: SerializedFootnoteReferenceNode): FootnoteReferenceNode {
    return $createFootnoteReferenceNode(
      serializedNode.footnoteId,
      serializedNode.footnoteIndex
    ).updateFromJSON(serializedNode);
  }

  isInline(): boolean {
    return true;
  }
  
  isTextEntity(): true {
    return true;
  }
}

function convertFootnoteReferenceElement(domNode: HTMLElement): DOMConversionOutput | null {
  const footnoteId = domNode.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteId);
  const footnoteIndexStr = domNode.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex);
  
  if (!footnoteId || !footnoteIndexStr) {
    return null;
  }

  const footnoteIndex = parseInt(footnoteIndexStr, 10);
  if (isNaN(footnoteIndex)) {
    return null;
  }

  const node = $createFootnoteReferenceNode(footnoteId, footnoteIndex);
  return { node };
}

export function $createFootnoteReferenceNode(
  footnoteId: string,
  footnoteIndex: number
): FootnoteReferenceNode {
  return $applyNodeReplacement(new FootnoteReferenceNode(footnoteId, footnoteIndex));
}

export function $isFootnoteReferenceNode(
  node: LexicalNode | null | undefined
): node is FootnoteReferenceNode {
  return node instanceof FootnoteReferenceNode;
}

