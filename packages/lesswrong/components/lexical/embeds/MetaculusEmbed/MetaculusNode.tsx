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

type MetaculusComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  questionId: string;
}>;

function MetaculusComponent({
  className,
  format,
  nodeKey,
  questionId,
}: MetaculusComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <div className="metaculus-preview" data-metaculus-id={questionId}>
        <iframe
          src={`https://www.metaculus.com/questions/embed/${questionId}`}
          title={`Metaculus question ${questionId}`}
          frameBorder="0"
        />
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedMetaculusNode = Spread<
  {
    questionId: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertMetaculusElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const questionId = domNode.getAttribute('data-metaculus-id');
  if (questionId) {
    const node = $createMetaculusNode(questionId);
    return {node};
  }
  return null;
}

export class MetaculusNode extends DecoratorBlockNode {
  __questionId: string;

  static getType(): string {
    return 'metaculus';
  }

  static clone(node: MetaculusNode): MetaculusNode {
    return new MetaculusNode(node.__questionId, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedMetaculusNode): MetaculusNode {
    return $createMetaculusNode(serializedNode.questionId).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedMetaculusNode {
    return {
      ...super.exportJSON(),
      questionId: this.__questionId,
    };
  }

  constructor(questionId: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__questionId = questionId;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'metaculus-preview';
    element.setAttribute('data-metaculus-id', this.__questionId);

    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'src',
      `https://www.metaculus.com/questions/embed/${this.__questionId}`,
    );
    iframe.setAttribute('title', `Metaculus question ${this.__questionId}`);
    iframe.setAttribute('frameborder', '0');
    element.appendChild(iframe);
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('metaculus-preview')) {
          return null;
        }
        return {
          conversion: $convertMetaculusElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getQuestionId(): string {
    return this.__questionId;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://www.metaculus.com/questions/${this.__questionId}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <MetaculusComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        questionId={this.__questionId}
      />
    );
  }
}

export function $createMetaculusNode(questionId: string): MetaculusNode {
  return new MetaculusNode(questionId);
}

export function $isMetaculusNode(
  node: MetaculusNode | LexicalNode | null | undefined,
): node is MetaculusNode {
  return node instanceof MetaculusNode;
}
