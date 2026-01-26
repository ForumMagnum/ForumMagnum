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

type EstimakerComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  embedUrl: string;
}>;

function EstimakerComponent({
  className,
  format,
  nodeKey,
  embedUrl,
}: EstimakerComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="estimaker-preview">
        <iframe src={embedUrl} title="Estimaker embed" frameBorder="0" />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedEstimakerNode = Spread<
  {
    embedUrl: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertEstimakerElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  return {node: $createEstimakerNode(src)};
}

export class EstimakerNode extends DecoratorBlockNode {
  __embedUrl: string;

  static getType(): string {
    return 'estimaker';
  }

  static clone(node: EstimakerNode): EstimakerNode {
    return new EstimakerNode(node.__embedUrl, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedEstimakerNode): EstimakerNode {
    return $createEstimakerNode(serializedNode.embedUrl).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedEstimakerNode {
    return {
      ...super.exportJSON(),
      embedUrl: this.__embedUrl,
    };
  }

  constructor(embedUrl: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__embedUrl = embedUrl;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'estimaker-preview';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', this.__embedUrl);
    iframe.setAttribute('title', 'Estimaker embed');
    iframe.setAttribute('frameborder', '0');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('estimaker-preview')) {
          return null;
        }
        return {
          conversion: $convertEstimakerElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getEmbedUrl(): string {
    return this.__embedUrl;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return this.__embedUrl;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <EstimakerComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        embedUrl={this.__embedUrl}
      />
    );
  }
}

export function $createEstimakerNode(embedUrl: string): EstimakerNode {
  return new EstimakerNode(embedUrl);
}

export function $isEstimakerNode(
  node: EstimakerNode | LexicalNode | null | undefined,
): node is EstimakerNode {
  return node instanceof EstimakerNode;
}
