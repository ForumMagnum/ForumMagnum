'use client';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import React, { type JSX } from 'react';

import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';

type StrawpollComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  pollId: string;
}>;

function StrawpollComponent({
  className,
  format,
  nodeKey,
  pollId,
}: StrawpollComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div
        className="strawpoll-embed"
        id={`strawpoll_${pollId}`}
        style={{
          height: 480,
          maxWidth: 640,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <iframe
          title="StrawPoll Embed"
          id={`strawpoll_iframe_${pollId}`}
          src={`https://strawpoll.com/embed/polls/${pollId}`}
          style={{
            position: 'static',
            visibility: 'visible',
            display: 'block',
            width: '100%',
            flexGrow: 1,
          }}
          frameBorder="0"
          allowFullScreen
          allowTransparency
        >
          Loading...
        </iframe>
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedStrawpollNode = Spread<
  {
    pollId: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertStrawpollElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const idAttr = domNode.getAttribute('id');
  if (idAttr) {
    const match = /^strawpoll_(.+)$/.exec(idAttr);
    if (match) {
      return {node: $createStrawpollNode(match[1])};
    }
  }
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match = /^https?:\/\/strawpoll\.com\/embed\/polls\/(.+)/.exec(src);
  if (!match) {
    return null;
  }
  return {node: $createStrawpollNode(match[1])};
}

export class StrawpollNode extends DecoratorBlockNode {
  __pollId: string;

  static getType(): string {
    return 'strawpoll';
  }

  static clone(node: StrawpollNode): StrawpollNode {
    return new StrawpollNode(node.__pollId, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedStrawpollNode): StrawpollNode {
    return $createStrawpollNode(serializedNode.pollId).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedStrawpollNode {
    return {
      ...super.exportJSON(),
      pollId: this.__pollId,
    };
  }

  constructor(pollId: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__pollId = pollId;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'strawpoll-embed';
    element.setAttribute('id', `strawpoll_${this.__pollId}`);
    element.setAttribute(
      'style',
      'height: 480px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column;',
    );

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'StrawPoll Embed');
    iframe.setAttribute('id', `strawpoll_iframe_${this.__pollId}`);
    iframe.setAttribute('src', `https://strawpoll.com/embed/polls/${this.__pollId}`);
    iframe.setAttribute(
      'style',
      'position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;',
    );
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.textContent = 'Loading...';
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('strawpoll-embed')) {
          return null;
        }
        return {
          conversion: $convertStrawpollElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getPollId(): string {
    return this.__pollId;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://strawpoll.com/polls/${this.__pollId}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <StrawpollComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        pollId={this.__pollId}
      />
    );
  }
}

export function $createStrawpollNode(pollId: string): StrawpollNode {
  return new StrawpollNode(pollId);
}

export function $isStrawpollNode(
  node: StrawpollNode | LexicalNode | null | undefined,
): node is StrawpollNode {
  return node instanceof StrawpollNode;
}
