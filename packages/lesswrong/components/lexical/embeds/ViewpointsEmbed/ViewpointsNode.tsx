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

type ViewpointsComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  slug: string;
}>;

function ViewpointsComponent({
  className,
  format,
  nodeKey,
  slug,
}: ViewpointsComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="viewpoints-preview" data-viewpoints-slug={slug}>
        <iframe
          src={`https://viewpoints.xyz/embed/polls/${slug}`}
          title={`Viewpoints poll ${slug}`}
          frameBorder="0"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedViewpointsNode = Spread<
  {
    slug: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertViewpointsElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const slug = domNode.getAttribute('data-viewpoints-slug');
  if (slug) {
    return {node: $createViewpointsNode(slug)};
  }
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match = /^https?:\/\/viewpoints\.xyz\/embed\/polls\/(.+)/.exec(src);
  if (!match) {
    return null;
  }
  return {node: $createViewpointsNode(match[1])};
}

export class ViewpointsNode extends DecoratorBlockNode {
  __slug: string;

  static getType(): string {
    return 'viewpoints';
  }

  static clone(node: ViewpointsNode): ViewpointsNode {
    return new ViewpointsNode(node.__slug, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedViewpointsNode): ViewpointsNode {
    return $createViewpointsNode(serializedNode.slug).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedViewpointsNode {
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
    element.className = 'viewpoints-preview';
    element.setAttribute('data-viewpoints-slug', this.__slug);

    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'src',
      `https://viewpoints.xyz/embed/polls/${this.__slug}`,
    );
    iframe.setAttribute('title', `Viewpoints poll ${this.__slug}`);
    iframe.setAttribute('frameborder', '0');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('viewpoints-preview')) {
          return null;
        }
        return {
          conversion: $convertViewpointsElement,
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
    return `https://viewpoints.xyz/polls/${this.__slug}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <ViewpointsComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        slug={this.__slug}
      />
    );
  }
}

export function $createViewpointsNode(slug: string): ViewpointsNode {
  return new ViewpointsNode(slug);
}

export function $isViewpointsNode(
  node: ViewpointsNode | LexicalNode | null | undefined,
): node is ViewpointsNode {
  return node instanceof ViewpointsNode;
}
