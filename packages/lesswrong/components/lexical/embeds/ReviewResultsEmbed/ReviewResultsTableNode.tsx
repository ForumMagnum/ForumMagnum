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

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';

import {
  ReviewResultsTableDisplay,
  type ReviewResultsEntry,
} from '@/components/contents/ReviewResultsTableDisplay';

export type SerializedReviewResultsTableNode = Spread<
  {
    year: number;
    results: ReviewResultsEntry[];
  },
  SerializedDecoratorBlockNode
>;

interface ReviewResultsEditorComponentProps {
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  year: number;
  results: ReviewResultsEntry[];
}

function ReviewResultsEditorComponent({
  className,
  format,
  nodeKey,
  year,
  results,
}: ReviewResultsEditorComponentProps) {
  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <ReviewResultsTableDisplay results={results} context="editor" />
    </BlockWithAlignableContents>
  );
}

function $convertReviewResultsElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const dataAttr = domNode.getAttribute('data-review-results');
  if (!dataAttr) return null;
  try {
    const data = JSON.parse(dataAttr) as { year: number; results: ReviewResultsEntry[] };
    return { node: $createReviewResultsTableNode(data.year, data.results) };
  } catch {
    return null;
  }
}

export class ReviewResultsTableNode extends DecoratorBlockNode {
  __year: number;
  __results: ReviewResultsEntry[];

  static getType(): string {
    return 'review-results-table';
  }

  static clone(node: ReviewResultsTableNode): ReviewResultsTableNode {
    return new ReviewResultsTableNode(node.__year, node.__results, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedReviewResultsTableNode): ReviewResultsTableNode {
    return $createReviewResultsTableNode(
      serializedNode.year,
      serializedNode.results,
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedReviewResultsTableNode {
    return {
      ...super.exportJSON(),
      year: this.__year,
      results: this.__results,
    };
  }

  constructor(year: number, results: ReviewResultsEntry[], format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__year = year;
    this.__results = results;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'review-results-table';
    element.setAttribute(
      'data-review-results',
      JSON.stringify({ year: this.__year, results: this.__results }),
    );
    // Text fallback for contexts without React hydration (RSS, email, etc.)
    element.textContent = `[Annual Review Results ${this.__year}]`;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-review-results')) {
          return null;
        }
        return {
          conversion: $convertReviewResultsElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return `[Annual Review Results ${this.__year}]`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <ReviewResultsEditorComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        year={this.__year}
        results={this.__results}
      />
    );
  }
}

export function $createReviewResultsTableNode(
  year: number,
  results: ReviewResultsEntry[],
): ReviewResultsTableNode {
  return new ReviewResultsTableNode(year, results);
}

export function $isReviewResultsTableNode(
  node: LexicalNode | null | undefined,
): node is ReviewResultsTableNode {
  return node instanceof ReviewResultsTableNode;
}
