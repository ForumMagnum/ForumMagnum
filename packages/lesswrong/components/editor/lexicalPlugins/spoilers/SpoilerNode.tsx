"use client";

import {
  ElementNode,
  LexicalNode,
  SerializedElementNode,
  $createParagraphNode,
  $isElementNode,
  RangeSelection,
  EditorConfig,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
} from 'lexical';

export type SerializedSpoilerNode = SerializedElementNode;

/**
 * Lexical node for spoiler/collapsible content blocks.
 * Renders as <div class="spoilers"> in HTML.
 */
export class SpoilerNode extends ElementNode {
  static getType(): string {
    return 'spoiler';
  }

  static clone(node: SpoilerNode): SpoilerNode {
    return new SpoilerNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.className = 'spoilers';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node: HTMLElement) => {
        if (node.classList.contains('spoilers')) {
          return {
            conversion: convertSpoilerElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'spoilers';
    return { element };
  }

  static importJSON(serializedNode: SerializedSpoilerNode): SpoilerNode {
    return $createSpoilerNode();
  }

  exportJSON(): SerializedSpoilerNode {
    return {
      ...super.exportJSON(),
      type: 'spoiler',
      version: 1,
    };
  }

  // Spoiler blocks can contain any block-level content
  canBeEmpty(): boolean {
    return false;
  }

  // Insert paragraph if empty
  collapseAtStart(selection: RangeSelection): boolean {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }
}

function convertSpoilerElement(): DOMConversionOutput {
  return { node: $createSpoilerNode() };
}

export function $createSpoilerNode(): SpoilerNode {
  return new SpoilerNode();
}

export function $isSpoilerNode(node: LexicalNode | null | undefined): node is SpoilerNode {
  return node instanceof SpoilerNode;
}

