import {
  ElementNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type SerializedElementNode,
} from 'lexical';

export const QUERY_INPUT_CONTENT_NODE_TYPE = 'research-query-input-content';
export const QUERY_INPUT_CONTENT_DOM_CLASS = 'research-query-input-content';

/**
 * Editable inner content node for a QueryInputNode. The outer container sets
 * `contenteditable="false"`; this child opts back in with
 * `contenteditable="true"` so the cursor lives inside this region and arrow-key
 * navigation past the top/bottom edge naturally exits the entire container
 * (mirrors the LLMContentBlockNode / LLMContentBlockContentNode pattern).
 */
export class QueryInputContentNode extends ElementNode {
  static getType(): string {
    return QUERY_INPUT_CONTENT_NODE_TYPE;
  }

  static clone(node: QueryInputContentNode): QueryInputContentNode {
    return new QueryInputContentNode(node.__key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = QUERY_INPUT_CONTENT_DOM_CLASS;
    div.setAttribute('contenteditable', 'true');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.className = QUERY_INPUT_CONTENT_DOM_CLASS;
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains(QUERY_INPUT_CONTENT_DOM_CLASS)) {
          return { conversion: convertQueryInputContentElement, priority: 2 };
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
      type: QUERY_INPUT_CONTENT_NODE_TYPE,
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedElementNode): QueryInputContentNode {
    return $createQueryInputContentNode().updateFromJSON(serializedNode);
  }

  canBeEmpty(): boolean {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }
}

function convertQueryInputContentElement(_domNode: HTMLElement): DOMConversionOutput {
  return { node: $createQueryInputContentNode() };
}

export function $createQueryInputContentNode(): QueryInputContentNode {
  return new QueryInputContentNode();
}

export function $isQueryInputContentNode(
  node: LexicalNode | null | undefined,
): node is QueryInputContentNode {
  return node instanceof QueryInputContentNode;
}
