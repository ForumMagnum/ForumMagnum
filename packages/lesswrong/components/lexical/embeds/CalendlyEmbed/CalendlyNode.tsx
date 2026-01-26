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

type CalendlyComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  embedUrl: string;
}>;

function CalendlyComponent({
  className,
  format,
  nodeKey,
  embedUrl,
}: CalendlyComponentProps) {
  const iframeUrl = getCalendlyEmbedUrl(embedUrl);
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="calendly-preview">
        <iframe
          sandbox="allow-scripts allow-same-origin allow-forms"
          src={iframeUrl}
          title="Calendly"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedCalendlyNode = Spread<
  {
    embedUrl: string;
  },
  SerializedDecoratorBlockNode
>;

function getCalendlyEmbedUrl(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    if (!url.hostname.endsWith('calendly.com')) {
      return embedUrl;
    }
    if (!url.searchParams.has('embed_type')) {
      url.searchParams.set('embed_type', 'Inline');
    }
    if (!url.searchParams.has('embed_domain') && typeof window !== 'undefined') {
      url.searchParams.set('embed_domain', window.location.hostname);
    }
    return url.toString();
  } catch {
    return embedUrl;
  }
}

function $convertCalendlyElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  return {node: $createCalendlyNode(src)};
}

export class CalendlyNode extends DecoratorBlockNode {
  __embedUrl: string;

  static getType(): string {
    return 'calendly';
  }

  static clone(node: CalendlyNode): CalendlyNode {
    return new CalendlyNode(node.__embedUrl, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedCalendlyNode): CalendlyNode {
    return $createCalendlyNode(serializedNode.embedUrl).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedCalendlyNode {
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
    element.className = 'calendly-preview';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    iframe.setAttribute('src', this.__embedUrl);
    iframe.setAttribute('title', 'Calendly');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('calendly-preview')) {
          return null;
        }
        return {
          conversion: $convertCalendlyElement,
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
      <CalendlyComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        embedUrl={this.__embedUrl}
      />
    );
  }
}

export function $createCalendlyNode(embedUrl: string): CalendlyNode {
  return new CalendlyNode(embedUrl);
}

export function $isCalendlyNode(
  node: CalendlyNode | LexicalNode | null | undefined,
): node is CalendlyNode {
  return node instanceof CalendlyNode;
}
