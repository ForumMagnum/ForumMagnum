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
import React, { JSX } from 'react';
import { FOOTNOTE_ATTRIBUTES, FOOTNOTE_CLASSES } from './constants';

export type SerializedFootnoteBackLinkNode = Spread<
  {
    footnoteId: string;
  },
  SerializedLexicalNode
>;

/**
 * FootnoteBackLinkNode is the "^" link in a footnote that navigates
 * back to the inline reference in the text.
 */
export class FootnoteBackLinkNode extends DecoratorNode<JSX.Element> {
  __footnoteId: string;

  static getType(): string {
    return 'footnote-back-link';
  }

  static clone(node: FootnoteBackLinkNode): FootnoteBackLinkNode {
    return new FootnoteBackLinkNode(node.__footnoteId, node.__key);
  }

  constructor(footnoteId: string, key?: NodeKey) {
    super(key);
    this.__footnoteId = footnoteId;
  }

  getFootnoteId(): string {
    return this.__footnoteId;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = FOOTNOTE_CLASSES.footnoteBackLink;
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteBackLink, '');
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.className = FOOTNOTE_CLASSES.footnoteBackLink;
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteBackLink, '');
    span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);

    const sup = document.createElement('sup');
    const strong = document.createElement('strong');
    const anchor = document.createElement('a');
    anchor.href = `#fnref${this.__footnoteId}`;
    anchor.textContent = '^';

    strong.appendChild(anchor);
    sup.appendChild(strong);
    span.appendChild(sup);

    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteBackLink)) {
          return null;
        }
        return {
          conversion: convertFootnoteBackLinkElement,
          priority: 2,
        };
      },
    };
  }

  exportJSON(): SerializedFootnoteBackLinkNode {
    return {
      type: 'footnote-back-link',
      version: 1,
      footnoteId: this.__footnoteId,
    };
  }

  static importJSON(serializedNode: SerializedFootnoteBackLinkNode): FootnoteBackLinkNode {
    return $createFootnoteBackLinkNode(serializedNode.footnoteId);
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <FootnoteBackLinkComponent footnoteId={this.__footnoteId} />;
  }
}

function convertFootnoteBackLinkElement(domNode: HTMLElement): DOMConversionOutput | null {
  const footnoteId = domNode.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteId);
  
  if (!footnoteId) {
    return null;
  }

  const node = $createFootnoteBackLinkNode(footnoteId);
  return { node };
}

export function $createFootnoteBackLinkNode(footnoteId: string): FootnoteBackLinkNode {
  return new FootnoteBackLinkNode(footnoteId);
}

export function $isFootnoteBackLinkNode(
  node: LexicalNode | null | undefined
): node is FootnoteBackLinkNode {
  return node instanceof FootnoteBackLinkNode;
}

// React component for rendering the footnote back-link
interface FootnoteBackLinkComponentProps {
  footnoteId: string;
}

function FootnoteBackLinkComponent({ footnoteId }: FootnoteBackLinkComponentProps): JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const referenceElement = document.getElementById(`fnref${footnoteId}`);
    if (referenceElement) {
      referenceElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <sup>
      <strong>
        <a
          href={`#fnref${footnoteId}`}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          ^
        </a>
      </strong>
    </sup>
  );
}

