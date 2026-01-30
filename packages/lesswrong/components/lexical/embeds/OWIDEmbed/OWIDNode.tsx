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

type OWIDComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  grapherSlug: string;
}>;

function OWIDComponent({
  className,
  format,
  nodeKey,
  grapherSlug,
}: OWIDComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="owid-preview" data-owid-slug={grapherSlug}>
        <iframe
          src={`https://ourworldindata.org/grapher/${grapherSlug}`}
          title={`OWID ${grapherSlug}`}
          frameBorder="0"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedOWIDNode = Spread<
  {
    grapherSlug: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertOWIDElement(domNode: HTMLElement): DOMConversionOutput | null {
  const grapherSlug = domNode.getAttribute('data-owid-slug');
  if (grapherSlug) {
    return {node: $createOWIDNode(grapherSlug)};
  }
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match =
    /^https?:\/\/ourworldindata\.org\/grapher\/([^?#]+)/.exec(src);
  if (!match) {
    return null;
  }
  return {node: $createOWIDNode(match[1])};
}

export class OWIDNode extends DecoratorBlockNode {
  __grapherSlug: string;

  static getType(): string {
    return 'owid';
  }

  static clone(node: OWIDNode): OWIDNode {
    return new OWIDNode(node.__grapherSlug, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedOWIDNode): OWIDNode {
    return $createOWIDNode(serializedNode.grapherSlug).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedOWIDNode {
    return {
      ...super.exportJSON(),
      grapherSlug: this.__grapherSlug,
    };
  }

  constructor(grapherSlug: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__grapherSlug = grapherSlug;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'owid-preview';
    element.setAttribute('data-owid-slug', this.__grapherSlug);

    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'src',
      `https://ourworldindata.org/grapher/${this.__grapherSlug}`,
    );
    iframe.setAttribute('title', `OWID ${this.__grapherSlug}`);
    iframe.setAttribute('frameborder', '0');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('owid-preview')) {
          return null;
        }
        return {
          conversion: $convertOWIDElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getGrapherSlug(): string {
    return this.__grapherSlug;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://ourworldindata.org/grapher/${this.__grapherSlug}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <OWIDComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        grapherSlug={this.__grapherSlug}
      />
    );
  }
}

export function $createOWIDNode(grapherSlug: string): OWIDNode {
  return new OWIDNode(grapherSlug);
}

export function $isOWIDNode(
  node: OWIDNode | LexicalNode | null | undefined,
): node is OWIDNode {
  return node instanceof OWIDNode;
}
