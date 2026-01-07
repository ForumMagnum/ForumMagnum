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
import type { SuggestionMeta } from '../types';

export type SerializedSuggestionReplacementInlineNode = Spread<
  {
    suggestionId?: string;
    authorUserId?: string;
    authorName?: string;
    createdAtMs?: number;
    groupId?: string;
  },
  SerializedElementNode
>;

export class SuggestionReplacementInlineNode extends ElementNode {
  __suggestionId: string;
  __authorUserId: string;
  __authorName: string;
  __createdAtMs: number;
  __groupId?: string;

  static getType(): string {
    return 'suggestion-replacement-inline';
  }

  static clone(node: SuggestionReplacementInlineNode): SuggestionReplacementInlineNode {
    return new SuggestionReplacementInlineNode(
      {
        suggestionId: node.__suggestionId,
        suggestionType: 'replacement',
        authorUserId: node.__authorUserId,
        authorName: node.__authorName,
        createdAtMs: node.__createdAtMs,
        groupId: node.__groupId,
      },
      node.__key,
    );
  }

  constructor(meta: SuggestionMeta | undefined | null, key?: string) {
    super(key);
    const safeMeta: SuggestionMeta = meta ?? {
      suggestionId: createSuggestionId(),
      suggestionType: 'replacement',
      authorUserId: 'unknown',
      authorName: 'Unknown',
      createdAtMs: Date.now(),
    };
    this.__suggestionId = safeMeta.suggestionId;
    this.__authorUserId = safeMeta.authorUserId;
    this.__authorName = safeMeta.authorName;
    this.__createdAtMs = safeMeta.createdAtMs;
    this.__groupId = safeMeta.groupId;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'lwSuggestionReplacement';
    span.dataset.suggestionId = this.__suggestionId;
    span.dataset.suggestionType = 'replacement';
    return span;
  }

  updateDOM(prevNode: SuggestionReplacementInlineNode, dom: HTMLElement): boolean {
    if (
      prevNode.__suggestionId !== this.__suggestionId ||
      prevNode.__authorUserId !== this.__authorUserId ||
      prevNode.__authorName !== this.__authorName ||
      prevNode.__createdAtMs !== this.__createdAtMs ||
      prevNode.__groupId !== this.__groupId
    ) {
      dom.dataset.suggestionId = this.__suggestionId;
      dom.dataset.suggestionType = 'replacement';
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-lw-suggestion', '1');
    span.setAttribute('data-suggestion-type', 'replacement');
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
        if (el.getAttribute('data-suggestion-type') !== 'replacement') {
          return null;
        }
        return {
          conversion: () => {
            const suggestionId = el.getAttribute('data-suggestion-id') ?? '';
            const authorUserId = el.getAttribute('data-author-user-id') ?? '';
            const authorName = el.getAttribute('data-author-name') ?? '';
            const createdAtMs = Number(el.getAttribute('data-created-at-ms') ?? '0');
            const groupId = el.getAttribute('data-group-id') ?? undefined;
            const node = $createSuggestionReplacementInlineNode({
              suggestionId,
              suggestionType: 'replacement',
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

  exportJSON(): SerializedSuggestionReplacementInlineNode {
    return {
      ...super.exportJSON(),
      type: 'suggestion-replacement-inline',
      version: 1,
      suggestionId: this.__suggestionId,
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
      groupId: this.__groupId,
    };
  }

  static importJSON(serializedNode: SerializedSuggestionReplacementInlineNode): SuggestionReplacementInlineNode {
    const node = $createSuggestionReplacementInlineNode({
      suggestionId: serializedNode.suggestionId ?? createSuggestionId(),
      suggestionType: 'replacement',
      authorUserId: serializedNode.authorUserId ?? 'unknown',
      authorName: serializedNode.authorName ?? 'Unknown',
      createdAtMs: serializedNode.createdAtMs ?? Date.now(),
      groupId: serializedNode.groupId,
    });
    return node.updateFromJSON(serializedNode);
  }

  getSuggestionMeta(): SuggestionMeta {
    return {
      suggestionId: this.__suggestionId,
      suggestionType: 'replacement',
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
      groupId: this.__groupId,
    };
  }
}

export function $createSuggestionReplacementInlineNode(meta: SuggestionMeta): SuggestionReplacementInlineNode {
  return new SuggestionReplacementInlineNode(meta);
}

export function $isSuggestionReplacementInlineNode(
  node: LexicalNode | null | undefined,
): node is SuggestionReplacementInlineNode {
  return node instanceof SuggestionReplacementInlineNode;
}


