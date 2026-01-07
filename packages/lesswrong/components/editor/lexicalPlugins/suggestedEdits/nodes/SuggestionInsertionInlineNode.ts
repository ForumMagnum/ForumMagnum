import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  SerializedElementNode,
  Spread,
} from 'lexical';

import { ElementNode } from 'lexical';

import { createSuggestionId } from '../types';
import type { SuggestionMeta, SuggestionThreadComment } from '../types';

export type SerializedSuggestionInsertionInlineNode = Spread<
  {
    suggestionId?: string;
    authorUserId?: string;
    authorName?: string;
    createdAtMs?: number;
    groupId?: string;
    thread?: SuggestionThreadComment[];
  },
  SerializedElementNode
>;

export class SuggestionInsertionInlineNode extends ElementNode {
  __suggestionId: string;
  __authorUserId: string;
  __authorName: string;
  __createdAtMs: number;
  __groupId?: string;
  __thread?: SuggestionThreadComment[];

  static getType(): string {
    return 'suggestion-insertion-inline';
  }

  static clone(node: SuggestionInsertionInlineNode): SuggestionInsertionInlineNode {
    return new SuggestionInsertionInlineNode(
      {
        suggestionId: node.__suggestionId,
        suggestionType: 'insertion',
        authorUserId: node.__authorUserId,
        authorName: node.__authorName,
        createdAtMs: node.__createdAtMs,
        groupId: node.__groupId,
        thread: node.__thread,
      },
      node.__key,
    );
  }

  constructor(meta: SuggestionMeta | undefined | null, key?: string) {
    super(key);
    const safeMeta: SuggestionMeta = meta ?? {
      suggestionId: createSuggestionId(),
      suggestionType: 'insertion',
      authorUserId: 'unknown',
      authorName: 'Unknown',
      createdAtMs: Date.now(),
    };
    this.__suggestionId = safeMeta.suggestionId;
    this.__authorUserId = safeMeta.authorUserId;
    this.__authorName = safeMeta.authorName;
    this.__createdAtMs = safeMeta.createdAtMs;
    this.__groupId = safeMeta.groupId;
    this.__thread = safeMeta.thread;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'lwSuggestionInsertion';
    span.dataset.suggestionId = this.__suggestionId;
    span.dataset.suggestionType = 'insertion';
    return span;
  }

  updateDOM(prevNode: SuggestionInsertionInlineNode, dom: HTMLElement): boolean {
    if (
      prevNode.__suggestionId !== this.__suggestionId ||
      prevNode.__authorUserId !== this.__authorUserId ||
      prevNode.__authorName !== this.__authorName ||
      prevNode.__createdAtMs !== this.__createdAtMs ||
      prevNode.__groupId !== this.__groupId
    ) {
      dom.dataset.suggestionId = this.__suggestionId;
      dom.dataset.suggestionType = 'insertion';
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-lw-suggestion', '1');
    span.setAttribute('data-suggestion-type', 'insertion');
    span.setAttribute('data-suggestion-id', this.__suggestionId);
    span.setAttribute('data-author-user-id', this.__authorUserId);
    span.setAttribute('data-author-name', this.__authorName);
    span.setAttribute('data-created-at-ms', String(this.__createdAtMs));
    if (this.__groupId) {
      span.setAttribute('data-group-id', this.__groupId);
    }
    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: Node) => {
        const el = domNode as HTMLElement;
        if (el.getAttribute('data-lw-suggestion') !== '1') {
          return null;
        }
        if (el.getAttribute('data-suggestion-type') !== 'insertion') {
          return null;
        }
        return {
          conversion: () => {
            const suggestionId = el.getAttribute('data-suggestion-id') ?? '';
            const authorUserId = el.getAttribute('data-author-user-id') ?? '';
            const authorName = el.getAttribute('data-author-name') ?? '';
            const createdAtMs = Number(el.getAttribute('data-created-at-ms') ?? '0');
            const groupId = el.getAttribute('data-group-id') ?? undefined;
            const node = $createSuggestionInsertionInlineNode({
              suggestionId,
              suggestionType: 'insertion',
              authorUserId,
              authorName,
              createdAtMs,
              groupId,
            });
            return { node };
          },
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedSuggestionInsertionInlineNode {
    return {
      ...super.exportJSON(),
      type: 'suggestion-insertion-inline',
      version: 1,
      suggestionId: this.__suggestionId,
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
      groupId: this.__groupId,
      thread: this.__thread,
    };
  }

  static importJSON(serializedNode: SerializedSuggestionInsertionInlineNode): SuggestionInsertionInlineNode {
    const node = $createSuggestionInsertionInlineNode({
      suggestionId: serializedNode.suggestionId ?? createSuggestionId(),
      suggestionType: 'insertion',
      authorUserId: serializedNode.authorUserId ?? 'unknown',
      authorName: serializedNode.authorName ?? 'Unknown',
      createdAtMs: serializedNode.createdAtMs ?? Date.now(),
      groupId: serializedNode.groupId,
      thread: serializedNode.thread,
    });
    return node.updateFromJSON(serializedNode);
  }

  getSuggestionMeta(): SuggestionMeta {
    return {
      suggestionId: this.__suggestionId,
      suggestionType: 'insertion',
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
      groupId: this.__groupId,
      thread: this.__thread,
    };
  }

  setThread(thread: SuggestionThreadComment[] | undefined): void {
    const writable = this.getWritable();
    writable.__thread = thread;
  }
}

export function $createSuggestionInsertionInlineNode(meta: SuggestionMeta): SuggestionInsertionInlineNode {
  return new SuggestionInsertionInlineNode(meta);
}

export function $isSuggestionInsertionInlineNode(
  node: LexicalNode | null | undefined,
): node is SuggestionInsertionInlineNode {
  return node instanceof SuggestionInsertionInlineNode;
}


