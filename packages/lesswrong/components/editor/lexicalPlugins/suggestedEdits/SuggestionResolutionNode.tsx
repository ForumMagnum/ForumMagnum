import type { DOMExportOutput, EditorConfig, LexicalNode } from 'lexical';
import { DecoratorNode, $getRoot, $nodesOfType } from 'lexical';

export type SuggestionResolutionStatus = 'accepted' | 'rejected';

type SerializedSuggestionResolutionNode = {
  status: SuggestionResolutionStatus;
  suggestionId: string;
  type: 'suggestion-resolution';
  version: 1;
};

export class SuggestionResolutionNode extends DecoratorNode<null> {
  __status: SuggestionResolutionStatus;
  __suggestionId: string;

  static getType(): string {
    return 'suggestion-resolution';
  }

  static clone(node: SuggestionResolutionNode): SuggestionResolutionNode {
    return new SuggestionResolutionNode(node.__suggestionId, node.__status, node.__key);
  }

  constructor(suggestionId: string, status: SuggestionResolutionStatus, key?: string) {
    super(key);
    this.__suggestionId = suggestionId;
    this.__status = status;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('span');
    element.style.display = 'none';
    element.setAttribute('data-suggestion-resolution', this.__suggestionId);
    element.setAttribute('data-suggestion-status', this.__status);
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    return { element: null };
  }

  exportJSON(): SerializedSuggestionResolutionNode {
    return {
      status: this.__status,
      suggestionId: this.__suggestionId,
      type: 'suggestion-resolution',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedSuggestionResolutionNode): SuggestionResolutionNode {
    return new SuggestionResolutionNode(serializedNode.suggestionId, serializedNode.status);
  }

  getSuggestionId(): string {
    return this.__suggestionId;
  }

  getStatus(): SuggestionResolutionStatus {
    return this.__status;
  }
}

export function $isSuggestionResolutionNode(
  node: LexicalNode | null | undefined,
): node is SuggestionResolutionNode {
  return node instanceof SuggestionResolutionNode;
}

export function $createSuggestionResolutionNode(
  suggestionId: string,
  status: SuggestionResolutionStatus,
): SuggestionResolutionNode {
  return new SuggestionResolutionNode(suggestionId, status);
}

export function $setSuggestionResolutionMarker(
  suggestionId: string,
  status: SuggestionResolutionStatus,
) {
  const nodes = $nodesOfType(SuggestionResolutionNode).filter(
    (node) => node.getSuggestionId() === suggestionId,
  );
  for (const node of nodes) {
    node.remove();
  }
  $getRoot().append($createSuggestionResolutionNode(suggestionId, status));
}
