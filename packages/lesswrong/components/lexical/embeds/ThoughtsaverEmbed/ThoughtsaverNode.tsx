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

type ThoughtsaverComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  embedPath: string;
}>;

function ThoughtsaverComponent({
  className,
  format,
  nodeKey,
  embedPath,
}: ThoughtsaverComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="thoughtSaverFrameWrapper">
        <iframe
          className="thoughtSaverFrame"
          title="Thought Saver flashcard quiz"
          src={`https://app.thoughtsaver.com/embed/${embedPath}`}
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedThoughtsaverNode = Spread<
  {
    embedPath: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertThoughtsaverElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match = /^https?:\/\/app\.thoughtsaver\.com\/embed\/(.+)/.exec(src);
  if (!match) {
    return null;
  }
  const node = $createThoughtsaverNode(match[1]);
  return {node};
}

export class ThoughtsaverNode extends DecoratorBlockNode {
  __embedPath: string;

  static getType(): string {
    return 'thoughtsaver';
  }

  static clone(node: ThoughtsaverNode): ThoughtsaverNode {
    return new ThoughtsaverNode(node.__embedPath, node.__format, node.__key);
  }

  static importJSON(
    serializedNode: SerializedThoughtsaverNode,
  ): ThoughtsaverNode {
    return $createThoughtsaverNode(serializedNode.embedPath).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedThoughtsaverNode {
    return {
      ...super.exportJSON(),
      embedPath: this.__embedPath,
    };
  }

  constructor(embedPath: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__embedPath = embedPath;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'thoughtSaverFrameWrapper';

    const iframe = document.createElement('iframe');
    iframe.className = 'thoughtSaverFrame';
    iframe.setAttribute('title', 'Thought Saver flashcard quiz');
    iframe.setAttribute(
      'src',
      `https://app.thoughtsaver.com/embed/${this.__embedPath}`,
    );
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('thoughtSaverFrameWrapper')) {
          return null;
        }
        return {
          conversion: $convertThoughtsaverElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getEmbedPath(): string {
    return this.__embedPath;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://app.thoughtsaver.com/embed/${this.__embedPath}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <ThoughtsaverComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        embedPath={this.__embedPath}
      />
    );
  }
}

export function $createThoughtsaverNode(embedPath: string): ThoughtsaverNode {
  return new ThoughtsaverNode(embedPath);
}

export function $isThoughtsaverNode(
  node: ThoughtsaverNode | LexicalNode | null | undefined,
): node is ThoughtsaverNode {
  return node instanceof ThoughtsaverNode;
}
