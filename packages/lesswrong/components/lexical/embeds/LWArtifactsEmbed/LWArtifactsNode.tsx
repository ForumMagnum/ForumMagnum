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

type LWArtifactsComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  artifactPath: string;
}>;

function LWArtifactsComponent({
  className,
  format,
  nodeKey,
  artifactPath,
}: LWArtifactsComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="lwartifacts-preview" data-lwartifacts-id={artifactPath}>
        <iframe
          src={`https://${artifactPath}`}
          title={`LW Artifacts ${artifactPath}`}
          frameBorder="0"
          style={{height: 500, width: '100%', border: 'none'}}
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedLWArtifactsNode = Spread<
  {
    artifactPath: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertLWArtifactsElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const artifactPath = domNode.getAttribute('data-lwartifacts-id');
  if (artifactPath) {
    return {node: $createLWArtifactsNode(artifactPath)};
  }
  const oembedUrl = domNode.getAttribute('data-oembed-url');
  if (oembedUrl) {
    const match =
      /^https?:\/\/lwartifacts\.vercel\.app\/(.+)/.exec(oembedUrl);
    if (match) {
      return {node: $createLWArtifactsNode(`lwartifacts.vercel.app/${match[1]}`)};
    }
  }
  const iframe = domNode.querySelector('iframe');
  const src = iframe?.getAttribute('src');
  if (!src) {
    return null;
  }
  const match = /^https?:\/\/lwartifacts\.vercel\.app\/(.+)/.exec(src);
  if (!match) {
    return null;
  }
  return {node: $createLWArtifactsNode(`lwartifacts.vercel.app/${match[1]}`)};
}

export class LWArtifactsNode extends DecoratorBlockNode {
  __artifactPath: string;

  static getType(): string {
    return 'lwartifacts';
  }

  static clone(node: LWArtifactsNode): LWArtifactsNode {
    return new LWArtifactsNode(node.__artifactPath, node.__format, node.__key);
  }

  static importJSON(
    serializedNode: SerializedLWArtifactsNode,
  ): LWArtifactsNode {
    return $createLWArtifactsNode(serializedNode.artifactPath).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedLWArtifactsNode {
    return {
      ...super.exportJSON(),
      artifactPath: this.__artifactPath,
    };
  }

  constructor(artifactPath: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__artifactPath = artifactPath;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'lwartifacts-preview';
    element.setAttribute('data-lwartifacts-id', this.__artifactPath);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://${this.__artifactPath}`);
    iframe.setAttribute('title', `LW Artifacts ${this.__artifactPath}`);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('style', 'height: 500px; width: 100%; border: none;');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (
          !domNode.classList.contains('lwartifacts-preview') &&
          !domNode.hasAttribute('data-oembed-url')
        ) {
          return null;
        }
        return {
          conversion: $convertLWArtifactsElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getArtifactPath(): string {
    return this.__artifactPath;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://${this.__artifactPath}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <LWArtifactsComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        artifactPath={this.__artifactPath}
      />
    );
  }
}

export function $createLWArtifactsNode(artifactPath: string): LWArtifactsNode {
  return new LWArtifactsNode(artifactPath);
}

export function $isLWArtifactsNode(
  node: LWArtifactsNode | LexicalNode | null | undefined,
): node is LWArtifactsNode {
  return node instanceof LWArtifactsNode;
}
