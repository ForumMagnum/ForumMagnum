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

type ManifoldComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  marketSlug: string;
}>;

function ManifoldComponent({
  className,
  format,
  nodeKey,
  marketSlug,
}: ManifoldComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="manifold-preview" data-manifold-id={marketSlug}>
        <iframe
          src={`https://manifold.markets/embed/${marketSlug}`}
          title={`Manifold market ${marketSlug}`}
          frameBorder="0"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedManifoldNode = Spread<
  {
    marketSlug: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertManifoldElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const marketSlug = domNode.getAttribute('data-manifold-id');
  if (marketSlug) {
    const node = $createManifoldNode(marketSlug);
    return {node};
  }
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match = /^https?:\/\/manifold\.markets\/embed\/(.+)/.exec(src);
  if (!match) {
    return null;
  }
  return {node: $createManifoldNode(match[1])};
}

export class ManifoldNode extends DecoratorBlockNode {
  __marketSlug: string;

  static getType(): string {
    return 'manifold';
  }

  static clone(node: ManifoldNode): ManifoldNode {
    return new ManifoldNode(node.__marketSlug, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedManifoldNode): ManifoldNode {
    return $createManifoldNode(serializedNode.marketSlug).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedManifoldNode {
    return {
      ...super.exportJSON(),
      marketSlug: this.__marketSlug,
    };
  }

  constructor(marketSlug: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__marketSlug = marketSlug;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'manifold-preview';
    element.setAttribute('data-manifold-id', this.__marketSlug);

    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'src',
      `https://manifold.markets/embed/${this.__marketSlug}`,
    );
    iframe.setAttribute('title', `Manifold market ${this.__marketSlug}`);
    iframe.setAttribute('frameborder', '0');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('manifold-preview')) {
          return null;
        }
        return {
          conversion: $convertManifoldElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getMarketSlug(): string {
    return this.__marketSlug;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://manifold.markets/${this.__marketSlug}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <ManifoldComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        marketSlug={this.__marketSlug}
      />
    );
  }
}

export function $createManifoldNode(marketSlug: string): ManifoldNode {
  return new ManifoldNode(marketSlug);
}

export function $isManifoldNode(
  node: ManifoldNode | LexicalNode | null | undefined,
): node is ManifoldNode {
  return node instanceof ManifoldNode;
}
