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

type NeuronpediaComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  embedUrl: string;
}>;

function NeuronpediaComponent({
  className,
  format,
  nodeKey,
  embedUrl,
}: NeuronpediaComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="neuronpedia-preview">
        <iframe
          src={embedUrl}
          title="Neuronpedia embed"
          scrolling="no"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedNeuronpediaNode = Spread<
  {
    embedUrl: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertNeuronpediaElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  return {node: $createNeuronpediaNode(src)};
}

export class NeuronpediaNode extends DecoratorBlockNode {
  __embedUrl: string;

  static getType(): string {
    return 'neuronpedia';
  }

  static clone(node: NeuronpediaNode): NeuronpediaNode {
    return new NeuronpediaNode(node.__embedUrl, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedNeuronpediaNode): NeuronpediaNode {
    return $createNeuronpediaNode(serializedNode.embedUrl).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedNeuronpediaNode {
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
    element.className = 'neuronpedia-preview';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', this.__embedUrl);
    iframe.setAttribute('title', 'Neuronpedia embed');
    iframe.setAttribute('scrolling', 'no');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('neuronpedia-preview')) {
          return null;
        }
        return {
          conversion: $convertNeuronpediaElement,
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
      <NeuronpediaComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        embedUrl={this.__embedUrl}
      />
    );
  }
}

export function $createNeuronpediaNode(embedUrl: string): NeuronpediaNode {
  return new NeuronpediaNode(embedUrl);
}

export function $isNeuronpediaNode(
  node: NeuronpediaNode | LexicalNode | null | undefined,
): node is NeuronpediaNode {
  return node instanceof NeuronpediaNode;
}
