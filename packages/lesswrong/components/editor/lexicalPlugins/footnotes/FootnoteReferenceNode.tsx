import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { FOOTNOTE_ATTRIBUTES, FOOTNOTE_CLASSES } from './constants';
import React, { JSX } from 'react';

export interface SerializedFootnoteReferenceNode extends SerializedLexicalNode {
  footnoteId: string;
  footnoteIndex: number;
}

/**
 * FootnoteReferenceNode represents an inline footnote citation that appears
 * in the main text as a superscript link (e.g., [1]).
 * 
 * It links to the corresponding FootnoteItemNode at the bottom of the document.
 */
export class FootnoteReferenceNode extends DecoratorNode<JSX.Element> {
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
    super(key);
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
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = FOOTNOTE_CLASSES.footnoteReference;
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteReference, '');
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
    span.setAttribute('role', 'doc-noteref');
    span.id = `fnref${this.__footnoteId}`;
    return span;
  }

  updateDOM(prevNode: FootnoteReferenceNode, dom: HTMLElement): boolean {
    if (prevNode.__footnoteIndex !== this.__footnoteIndex) {
      dom.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
      // Update the text content
      const link = dom.querySelector('a');
      if (link) {
        link.textContent = `[${this.__footnoteIndex}]`;
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
      type: 'footnote-reference',
      version: 1,
      footnoteId: this.__footnoteId,
      footnoteIndex: this.__footnoteIndex,
    };
  }

  static importJSON(serializedNode: SerializedFootnoteReferenceNode): FootnoteReferenceNode {
    return $createFootnoteReferenceNode(
      serializedNode.footnoteId,
      serializedNode.footnoteIndex
    );
  }

  isInline(): boolean {
    return true;
  }

  decorate(): JSX.Element {
    return (
      <FootnoteReferenceComponent
        footnoteId={this.__footnoteId}
        footnoteIndex={this.__footnoteIndex}
        nodeKey={this.__key}
      />
    );
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
  return new FootnoteReferenceNode(footnoteId, footnoteIndex);
}

export function $isFootnoteReferenceNode(
  node: LexicalNode | null | undefined
): node is FootnoteReferenceNode {
  return node instanceof FootnoteReferenceNode;
}

interface FootnoteReferenceComponentProps {
  footnoteId: string;
  footnoteIndex: number;
  nodeKey: string;
}

function FootnoteReferenceComponent({
  footnoteId,
  footnoteIndex,
}: FootnoteReferenceComponentProps): JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const footnoteElement = document.getElementById(`fn${footnoteId}`);
    if (footnoteElement) {
      footnoteElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <sup>
      <a
        href={`#fn${footnoteId}`}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        [{footnoteIndex}]
      </a>
    </sup>
  );
}

