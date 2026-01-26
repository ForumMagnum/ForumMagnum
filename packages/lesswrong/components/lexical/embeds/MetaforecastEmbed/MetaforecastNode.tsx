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

type MetaforecastComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  slug: string;
}>;

function MetaforecastComponent({
  className,
  format,
  nodeKey,
  slug,
}: MetaforecastComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="metaforecast-preview" data-metaforecast-id={slug}>
        <iframe
          src={`https://metaforecast.org/questions/embed/${slug}`}
          title={`Metaforecast question ${slug}`}
          frameBorder="0"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedMetaforecastNode = Spread<
  {
    slug: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertMetaforecastElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const slug = domNode.getAttribute('data-metaforecast-id');
  if (slug) {
    return {node: $createMetaforecastNode(slug)};
  }
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match =
    /^https?:\/\/metaforecast\.org\/questions\/embed\/(.+)/.exec(src);
  if (!match) {
    return null;
  }
  return {node: $createMetaforecastNode(match[1])};
}

export class MetaforecastNode extends DecoratorBlockNode {
  __slug: string;

  static getType(): string {
    return 'metaforecast';
  }

  static clone(node: MetaforecastNode): MetaforecastNode {
    return new MetaforecastNode(node.__slug, node.__format, node.__key);
  }

  static importJSON(
    serializedNode: SerializedMetaforecastNode,
  ): MetaforecastNode {
    return $createMetaforecastNode(serializedNode.slug).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedMetaforecastNode {
    return {
      ...super.exportJSON(),
      slug: this.__slug,
    };
  }

  constructor(slug: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__slug = slug;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'metaforecast-preview';
    element.setAttribute('data-metaforecast-id', this.__slug);

    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'src',
      `https://metaforecast.org/questions/embed/${this.__slug}`,
    );
    iframe.setAttribute('title', `Metaforecast question ${this.__slug}`);
    iframe.setAttribute('frameborder', '0');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('metaforecast-preview')) {
          return null;
        }
        return {
          conversion: $convertMetaforecastElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getSlug(): string {
    return this.__slug;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://metaforecast.org/questions/${this.__slug}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <MetaforecastComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        slug={this.__slug}
      />
    );
  }
}

export function $createMetaforecastNode(slug: string): MetaforecastNode {
  return new MetaforecastNode(slug);
}

export function $isMetaforecastNode(
  node: MetaforecastNode | LexicalNode | null | undefined,
): node is MetaforecastNode {
  return node instanceof MetaforecastNode;
}
