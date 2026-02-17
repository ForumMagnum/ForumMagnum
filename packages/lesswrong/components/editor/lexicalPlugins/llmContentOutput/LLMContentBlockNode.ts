"use client";

import {
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
} from 'lexical';

const DEFAULT_MODEL_NAME = '';

type SerializedLLMContentBlockNode = Spread<
  { modelName: string },
  SerializedElementNode
>;

/**
 * Container node for LLM-generated content blocks. Holds a header
 * (DecoratorNode with model name combobox) and a content area
 * (ElementNode shadow root for block-level children).
 *
 * The container itself is contenteditable="false"; the content child
 * re-enables editing with contenteditable="true" (same pattern as
 * ImageNode / ImageCaptionNode).
 */
export class LLMContentBlockNode extends ElementNode {
  __modelName: string;

  static getType(): string {
    return 'llm-content-block';
  }

  static clone(node: LLMContentBlockNode): LLMContentBlockNode {
    return new LLMContentBlockNode(node.__modelName, node.__key);
  }

  constructor(modelName: string = DEFAULT_MODEL_NAME, key?: NodeKey) {
    super(key);
    this.__modelName = modelName;
  }

  getModelName(): string {
    return this.__modelName;
  }

  setModelName(modelName: string): void {
    const writable = this.getWritable();
    writable.__modelName = modelName;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'llm-content-block';
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = 'llm-content-block';
    wrapper.setAttribute('data-model-name', this.__modelName);
    return { element: wrapper };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('llm-content-block')) {
          return {
            conversion: convertLLMContentBlockElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedLLMContentBlockNode {
    return {
      ...super.exportJSON(),
      type: 'llm-content-block',
      version: 1,
      modelName: this.__modelName,
    };
  }

  static importJSON(serializedNode: SerializedLLMContentBlockNode): LLMContentBlockNode {
    return $createLLMContentBlockNode(serializedNode.modelName).updateFromJSON(serializedNode);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

function convertLLMContentBlockElement(domNode: HTMLElement): DOMConversionOutput {
  const modelName = domNode.getAttribute('data-model-name') ?? DEFAULT_MODEL_NAME;
  const node = $createLLMContentBlockNode(modelName);

  // Remove the header div so Lexical does not import it as content.
  // The ensure-structure transform in the plugin will add a header node.
  const headerDiv = domNode.querySelector('.llm-content-block-header');
  if (headerDiv) {
    headerDiv.remove();
  }

  return { node };
}

export function $createLLMContentBlockNode(modelName: string = DEFAULT_MODEL_NAME): LLMContentBlockNode {
  return new LLMContentBlockNode(modelName);
}

export function $isLLMContentBlockNode(
  node: LexicalNode | null | undefined,
): node is LLMContentBlockNode {
  return node instanceof LLMContentBlockNode;
}
