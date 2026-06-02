import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalNode,
  type SerializedLexicalNode,
} from 'lexical';
import React from 'react';
import { $isQueryInputNode } from './QueryInputNode';
import { QueryInputHeaderComponent } from './QueryInputHeaderComponent';

export type SerializedQueryInputHeaderNode = SerializedLexicalNode;

/**
 * The header carries no state of its own; the selected environment/runtime
 * lives on the parent QueryInputNode. Header is stripped during container
 * import and re-added by the ensure-structure transform.
 */
export const QUERY_INPUT_HEADER_NODE_TYPE = 'research-query-input-header';
export const QUERY_INPUT_HEADER_DOM_CLASS = 'research-query-input-header';

export class QueryInputHeaderNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return QUERY_INPUT_HEADER_NODE_TYPE;
  }

  static clone(node: QueryInputHeaderNode): QueryInputHeaderNode {
    return new QueryInputHeaderNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedQueryInputHeaderNode): QueryInputHeaderNode {
    return $createQueryInputHeaderNode();
  }

  exportJSON(): SerializedQueryInputHeaderNode {
    return {
      ...super.exportJSON(),
      type: QueryInputHeaderNode.getType(),
      version: 1,
    };
  }

  static importDOM(): null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    // The selected environment/runtime is stored on the container's
    // data-base-environment-id / data-runtime attributes; the ensure-structure
    // transform re-creates this header on import, so we don't emit it.
    return { element: null };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = QUERY_INPUT_HEADER_DOM_CLASS;
    return div;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): false {
    return false;
  }

  // Don't contribute to the parent's text content — the submit handler
  // grabs the container's text for the prompt and shouldn't see a repo name.
  getTextContent(): string {
    return '';
  }

  decorate(): React.ReactElement {
    const parent = this.getParent();
    if (!$isQueryInputNode(parent)) {
      return <></>;
    }
    return (
      <QueryInputHeaderComponent
        containerNodeKey={parent.getKey()}
        selection={parent.getSelection()}
      />
    );
  }
}

export function $createQueryInputHeaderNode(): QueryInputHeaderNode {
  return new QueryInputHeaderNode();
}

export function $isQueryInputHeaderNode(
  node: LexicalNode | null | undefined,
): node is QueryInputHeaderNode {
  return node instanceof QueryInputHeaderNode;
}
