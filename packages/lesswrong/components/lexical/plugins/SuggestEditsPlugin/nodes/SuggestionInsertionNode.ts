"use client";

import {
  ElementNode,
  LexicalNode,
  SerializedElementNode,
  EditorConfig,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
  Spread,
  NodeKey,
  $applyNodeReplacement,
} from 'lexical';

export type SerializedSuggestionInsertionNode = Spread<
  {
    suggestionId: string;
    authorId: string;
    authorName: string;
    timestamp: number;
  },
  SerializedElementNode
>;

/**
 * Lexical node for suggested insertions.
 * Wraps content that is proposed to be added to the document.
 * Renders as <span class="suggestion-insertion" data-suggestion-id="...">
 */
export class SuggestionInsertionNode extends ElementNode {
  __suggestionId: string;
  __authorId: string;
  __authorName: string;
  __timestamp: number;

  static getType(): string {
    return 'suggestion-insertion';
  }

  static clone(node: SuggestionInsertionNode): SuggestionInsertionNode {
    return new SuggestionInsertionNode(
      node.__suggestionId,
      node.__authorId,
      node.__authorName,
      node.__timestamp,
      node.__key
    );
  }

  constructor(
    suggestionId: string,
    authorId: string,
    authorName: string,
    timestamp: number,
    key?: NodeKey
  ) {
    super(key);
    this.__suggestionId = suggestionId;
    this.__authorId = authorId;
    this.__authorName = authorName;
    this.__timestamp = timestamp;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('span');
    element.className = 'suggestion-insertion';
    element.setAttribute('data-suggestion-id', this.__suggestionId);
    element.setAttribute('data-author-id', this.__authorId);
    element.setAttribute('data-author-name', this.__authorName);
    element.setAttribute('data-timestamp', String(this.__timestamp));
    return element;
  }

  updateDOM(
    prevNode: SuggestionInsertionNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    // If any metadata changed, update the DOM attributes
    if (prevNode.__suggestionId !== this.__suggestionId) {
      dom.setAttribute('data-suggestion-id', this.__suggestionId);
    }
    if (prevNode.__authorId !== this.__authorId) {
      dom.setAttribute('data-author-id', this.__authorId);
    }
    if (prevNode.__authorName !== this.__authorName) {
      dom.setAttribute('data-author-name', this.__authorName);
    }
    if (prevNode.__timestamp !== this.__timestamp) {
      dom.setAttribute('data-timestamp', String(this.__timestamp));
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: HTMLElement) => {
        if (node.classList.contains('suggestion-insertion')) {
          return {
            conversion: convertSuggestionInsertionElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('span');
    element.className = 'suggestion-insertion';
    element.setAttribute('data-suggestion-id', this.__suggestionId);
    element.setAttribute('data-author-id', this.__authorId);
    element.setAttribute('data-author-name', this.__authorName);
    element.setAttribute('data-timestamp', String(this.__timestamp));
    return { element };
  }

  static importJSON(
    serializedNode: SerializedSuggestionInsertionNode
  ): SuggestionInsertionNode {
    return $createSuggestionInsertionNode(
      serializedNode.suggestionId,
      serializedNode.authorId,
      serializedNode.authorName,
      serializedNode.timestamp
    );
  }

  exportJSON(): SerializedSuggestionInsertionNode {
    return {
      ...super.exportJSON(),
      type: 'suggestion-insertion',
      version: 1,
      suggestionId: this.__suggestionId,
      authorId: this.__authorId,
      authorName: this.__authorName,
      timestamp: this.__timestamp,
    };
  }

  // Getters for metadata
  getSuggestionId(): string {
    return this.__suggestionId;
  }

  getAuthorId(): string {
    return this.__authorId;
  }

  getAuthorName(): string {
    return this.__authorName;
  }

  getTimestamp(): number {
    return this.__timestamp;
  }

  // This is an inline node (for text content)
  isInline(): boolean {
    return true;
  }

  // Allow the node to be empty (will be removed if empty)
  canBeEmpty(): boolean {
    return true;
  }

  // Insertions can contain any inline content
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

function convertSuggestionInsertionElement(
  element: HTMLElement
): DOMConversionOutput {
  const suggestionId = element.getAttribute('data-suggestion-id') || '';
  const authorId = element.getAttribute('data-author-id') || '';
  const authorName = element.getAttribute('data-author-name') || '';
  const timestamp = parseInt(element.getAttribute('data-timestamp') || '0', 10);

  return {
    node: $createSuggestionInsertionNode(
      suggestionId,
      authorId,
      authorName,
      timestamp
    ),
  };
}

export function $createSuggestionInsertionNode(
  suggestionId: string,
  authorId: string,
  authorName: string,
  timestamp: number
): SuggestionInsertionNode {
  return $applyNodeReplacement(
    new SuggestionInsertionNode(suggestionId, authorId, authorName, timestamp)
  );
}

export function $isSuggestionInsertionNode(
  node: LexicalNode | null | undefined
): node is SuggestionInsertionNode {
  return node instanceof SuggestionInsertionNode;
}
