import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import React from 'react';
import { MentionComponent } from './MentionComponent';
import {
  formatMentionToken,
  isMentionKind,
  MENTION_DOM_CLASS,
  type MentionKind,
  type MentionProps,
} from './mentionFormat';

interface MentionConstructorProps {
  kind?: MentionKind;
  id?: string;
  title?: string;
}

export type SerializedMentionNode = Spread<MentionProps, SerializedLexicalNode>;

const MENTION_NODE_TYPE = 'research-mention';

export class MentionNode extends DecoratorNode<React.ReactElement> {
  __kind: MentionKind;
  __id: string;
  __title: string;

  static getType(): string {
    return MENTION_NODE_TYPE;
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      { kind: node.__kind, id: node.__id, title: node.__title },
      node.__key,
    );
  }

  constructor(
    { kind = 'doc', id = '', title = '' }: MentionConstructorProps = {},
    key?: NodeKey,
  ) {
    super(key);
    this.__kind = kind;
    this.__id = id;
    this.__title = title;
  }

  getKindValue(): MentionKind { return this.__kind; }
  getId(): string { return this.__id; }
  getTitle(): string { return this.__title; }

  setTitle(title: string): void {
    const writable = this.getWritable();
    writable.__title = title;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = MENTION_DOM_CLASS;
    span.setAttribute('data-mention-kind', this.__kind);
    span.setAttribute('data-mention-id', this.__id);
    span.setAttribute('data-mention-title', this.__title);
    span.setAttribute('contenteditable', 'false');
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const span = document.createElement('span');
    span.className = MENTION_DOM_CLASS;
    span.setAttribute('data-mention-kind', this.__kind);
    span.setAttribute('data-mention-id', this.__id);
    span.setAttribute('data-mention-title', this.__title);
    span.textContent = this.__title;
    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(MENTION_DOM_CLASS)) return null;
        return { conversion: convertMentionElement, priority: 2 };
      },
    };
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: MENTION_NODE_TYPE,
      version: 1,
      kind: this.__kind,
      id: this.__id,
      title: this.__title,
    };
  }

  static importJSON(serialized: SerializedMentionNode): MentionNode {
    return $createMentionNode({
      kind: serialized.kind,
      id: serialized.id,
      title: serialized.title,
    });
  }

  isInline(): true {
    return true;
  }

  // Makes the chip a keyboard stop: arrow keys land on it as a NodeSelection
  // before stepping past, and backspace from that state deletes the whole chip.
  isKeyboardSelectable(): boolean {
    return true;
  }

  getTextContent(): string {
    return formatMentionToken({ kind: this.__kind, id: this.__id, title: this.__title });
  }

  decorate(): React.ReactElement {
    return (
      <MentionComponent
        nodeKey={this.__key}
        kind={this.__kind}
        id={this.__id}
        title={this.__title}
      />
    );
  }
}

function convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
  const kind = domNode.getAttribute('data-mention-kind');
  const id = domNode.getAttribute('data-mention-id');
  const title = domNode.getAttribute('data-mention-title');
  if (!isMentionKind(kind) || !id) return null;
  return {
    node: $createMentionNode({ kind, id, title: title ?? '' }),
  };
}

export function $createMentionNode(props: MentionProps): MentionNode {
  return new MentionNode(props);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
