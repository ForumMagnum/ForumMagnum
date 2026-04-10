import { DecoratorNode, DOMExportOutput, LexicalNode, SerializedLexicalNode } from 'lexical';
import { $isLLMContentBlockNode, } from './LLMContentBlockNode';
import { LLMContentBlockHeaderComponent } from './LLMContentBlockHeaderComponent';

export type SerializedLLMContentBlockHeaderNode = SerializedLexicalNode;

/**
 * The model-name combobox must live inside the LLMContentBlockNode's
 * contenteditable="false" container, but a raw DOM <input> there would be
 * invisible to Lexical's React reconciliation and would lose its state on
 * any editor update. Using a DecoratorNode lets us render a full React
 * component (via decorate()) whose lifecycle is managed by Lexical,
 * giving us a persistent, interactive input inside a non-editable zone.
 */
export class LLMContentBlockHeaderNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return 'llm-content-block-header';
  }

  static clone(node: LLMContentBlockHeaderNode): LLMContentBlockHeaderNode {
    return new LLMContentBlockHeaderNode(node.__key);
  }

  static importJSON(
    _serializedNode: SerializedLLMContentBlockHeaderNode,
  ): LLMContentBlockHeaderNode {
    return $createLLMContentBlockHeaderNode();
  }

  exportJSON(): SerializedLLMContentBlockHeaderNode {
    return {
      ...super.exportJSON(),
      type: LLMContentBlockHeaderNode.getType(),
      version: 1,
    };
  }

  static importDOM(): null {
    // Header is stripped during container import and re-added by the
    // ensure-structure transform, so no importDOM is needed.
    return null;
  }

  exportDOM(): DOMExportOutput {
    // The model name is stored as data-model-name on the container.
    // ContentItemBody hydrates the header at render time, so we don't
    // emit a header element in the exported HTML.
    return { element: null };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'llm-content-block-header';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): false {
    return false;
  }

  decorate(): React.ReactElement {
    const parent = this.getParent();
    if (!$isLLMContentBlockNode(parent)) {
      return <></>;
    }

    return (
      <LLMContentBlockHeaderComponent
        modelName={parent.getModelName()}
        containerNodeKey={parent.getKey()}
      />
    );
  }
}

export function $createLLMContentBlockHeaderNode(): LLMContentBlockHeaderNode {
  return new LLMContentBlockHeaderNode();
}

export function $isLLMContentBlockHeaderNode(
  node: LexicalNode | null | undefined,
): node is LLMContentBlockHeaderNode {
  return node instanceof LLMContentBlockHeaderNode;
}
