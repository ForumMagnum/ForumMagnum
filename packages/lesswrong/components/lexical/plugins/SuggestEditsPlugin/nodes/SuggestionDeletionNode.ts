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

export type SerializedSuggestionDeletionNode = Spread<
  {
    suggestionId: string;
    authorId: string;
    authorName: string;
    timestamp: number;
  },
  SerializedElementNode
>;

/**
 * Lexical node for suggested deletions.
 * Wraps content that is proposed to be removed from the document.
 * The content remains visible but is styled with strikethrough and is not editable.
 * Renders as <span class="suggestion-deletion" data-suggestion-id="...">
 */
export class SuggestionDeletionNode extends ElementNode {
  __suggestionId: string;
  __authorId: string;
  __authorName: string;
  __timestamp: number;

  static getType(): string {
    return 'suggestion-deletion';
  }

  static clone(node: SuggestionDeletionNode): SuggestionDeletionNode {
    return new SuggestionDeletionNode(
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
    element.className = 'suggestion-deletion';
    element.setAttribute('data-suggestion-id', this.__suggestionId);
    element.setAttribute('data-author-id', this.__authorId);
    element.setAttribute('data-author-name', this.__authorName);
    element.setAttribute('data-timestamp', String(this.__timestamp));
    // Make content non-editable at DOM level as additional protection
    element.setAttribute('contenteditable', 'false');
    return element;
  }

  updateDOM(
    prevNode: SuggestionDeletionNode,
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
        if (node.classList.contains('suggestion-deletion')) {
          return {
            conversion: convertSuggestionDeletionElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('span');
    element.className = 'suggestion-deletion';
    element.setAttribute('data-suggestion-id', this.__suggestionId);
    element.setAttribute('data-author-id', this.__authorId);
    element.setAttribute('data-author-name', this.__authorName);
    element.setAttribute('data-timestamp', String(this.__timestamp));
    return { element };
  }

  static importJSON(
    serializedNode: SerializedSuggestionDeletionNode
  ): SuggestionDeletionNode {
    return $createSuggestionDeletionNode(
      serializedNode.suggestionId,
      serializedNode.authorId,
      serializedNode.authorName,
      serializedNode.timestamp
    );
  }

  exportJSON(): SerializedSuggestionDeletionNode {
    return {
      ...super.exportJSON(),
      type: 'suggestion-deletion',
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

  // Deletion content should not be editable
  // This prevents users from modifying content marked for deletion
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  // Prevent any text insertion into this node
  canInsertTab(): boolean {
    return false;
  }

  // The node can be empty (if all content is removed during accept)
  canBeEmpty(): boolean {
    return true;
  }
}

function convertSuggestionDeletionElement(
  element: HTMLElement
): DOMConversionOutput {
  const suggestionId = element.getAttribute('data-suggestion-id') || '';
  const authorId = element.getAttribute('data-author-id') || '';
  const authorName = element.getAttribute('data-author-name') || '';
  const timestamp = parseInt(element.getAttribute('data-timestamp') || '0', 10);

  return {
    node: $createSuggestionDeletionNode(
      suggestionId,
      authorId,
      authorName,
      timestamp
    ),
  };
}

export function $createSuggestionDeletionNode(
  suggestionId: string,
  authorId: string,
  authorName: string,
  timestamp: number
): SuggestionDeletionNode {
  return $applyNodeReplacement(
    new SuggestionDeletionNode(suggestionId, authorId, authorName, timestamp)
  );
}

export function $isSuggestionDeletionNode(
  node: LexicalNode | null | undefined
): node is SuggestionDeletionNode {
  return node instanceof SuggestionDeletionNode;
}
