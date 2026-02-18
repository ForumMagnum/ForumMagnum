"use client";

import {
  ElementNode,
  LexicalNode,
  SerializedElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
} from 'lexical';
import { $isLLMContentBlockNode } from './LLMContentBlockNode';

export type SerializedLLMContentBlockContentNode = SerializedElementNode;

/**
 * Shadow-root ElementNode that holds the editable content inside an
 * LLMContentBlockNode. Sets contenteditable="true" so that editing works
 * despite the parent container being contenteditable="false" (same
 * pattern as ImageCaptionNode inside ImageNode).
 */
export class LLMContentBlockContentNode extends ElementNode {
  static getType(): string {
    return 'llm-content-block-content';
  }

  static clone(node: LLMContentBlockContentNode): LLMContentBlockContentNode {
    return new LLMContentBlockContentNode(node.__key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'llm-content-block-content';
    div.setAttribute('contenteditable', 'true');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.className = 'llm-content-block-content';
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('llm-content-block-content')) {
          return {
            conversion: convertLLMContentBlockContentElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedLLMContentBlockContentNode {
    return {
      ...super.exportJSON(),
      type: 'llm-content-block-content',
      version: 1,
    };
  }

  static importJSON(_serializedNode: SerializedLLMContentBlockContentNode): LLMContentBlockContentNode {
    return $createLLMContentBlockContentNode();
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  collapseAtStart(): true {
    const parent = this.getParent();
    if ($isLLMContentBlockNode(parent)) {
      const children = this.getChildren();
      for (const child of children) {
        parent.insertBefore(child);
      }
      parent.remove();
    }
    return true;
  }
}

function convertLLMContentBlockContentElement(_domNode: HTMLElement): DOMConversionOutput {
  return { node: $createLLMContentBlockContentNode() };
}

export function $createLLMContentBlockContentNode(): LLMContentBlockContentNode {
  return new LLMContentBlockContentNode();
}

export function $isLLMContentBlockContentNode(
  node: LexicalNode | null | undefined,
): node is LLMContentBlockContentNode {
  return node instanceof LLMContentBlockContentNode;
}
