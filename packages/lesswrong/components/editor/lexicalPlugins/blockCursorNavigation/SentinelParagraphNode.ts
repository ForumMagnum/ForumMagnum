/**
 * SentinelParagraphNode
 *
 * A zero-height paragraph node inserted between block-level elements (images,
 * horizontal rules, embeds, etc.) to provide native browser cursor positions.
 * This replaces Lexical's built-in "block cursor" overlay approach.
 *
 * Key properties:
 * - Renders as a zero-height <p> in the DOM (invisible, but cursor-focusable)
 * - Shows a blinking line indicator when focused (via CSS)
 * - Invisible to HTML export (exportDOM returns null)
 * - Excluded from clipboard copy
 * - When the user types into it, a node transform promotes it to a real
 *   ParagraphNode so the content is serialized normally
 * - Auto-inserted/removed by the sentinel maintenance plugin
 */

import {
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedParagraphNode,
  ParagraphNode,
} from 'lexical';

export type SerializedSentinelParagraphNode = SerializedParagraphNode;

const SENTINEL_PARAGRAPH_CSS_CLASS = 'sentinel-paragraph';

export class SentinelParagraphNode extends ParagraphNode {
  static getType(): string {
    return 'sentinel-paragraph';
  }

  static clone(node: SentinelParagraphNode): SentinelParagraphNode {
    return new SentinelParagraphNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('p');
    dom.classList.add(SENTINEL_PARAGRAPH_CSS_CLASS);
    return dom;
  }

  updateDOM(
    _prevNode: SentinelParagraphNode,
    _dom: HTMLElement,
    _config: EditorConfig,
  ): boolean {
    return false;
  }

  /**
   * Export as null — sentinels are invisible to HTML serialization.
   * This ensures they don't appear in saved content or onChange output.
   */
  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    return {element: null};
  }

  /**
   * Never import from HTML — sentinels are only created programmatically
   * by the maintenance plugin.
   */
  static importDOM(): null {
    return null;
  }

  /**
   * JSON serialization for Yjs collaboration sync. Uses the same shape
   * as ParagraphNode but with our custom type.
   */
  exportJSON(): SerializedSentinelParagraphNode {
    return {
      ...super.exportJSON(),
      type: 'sentinel-paragraph',
      version: 1,
    };
  }

  static importJSON(
    serializedNode: SerializedSentinelParagraphNode,
  ): SentinelParagraphNode {
    return $createSentinelParagraphNode().updateFromJSON(serializedNode);
  }

  /**
   * Exclude from clipboard copy — sentinels are structural, not content.
   */
  excludeFromCopy(): boolean {
    return true;
  }

  /**
   * Sentinels can be empty. This is important: it prevents Lexical from
   * trying to show its own block cursor overlay on this node.
   */
  canBeEmpty(): boolean {
    return true;
  }
}

export function $createSentinelParagraphNode(): SentinelParagraphNode {
  return new SentinelParagraphNode();
}

export function $isSentinelParagraphNode(
  node: LexicalNode | null | undefined,
): node is SentinelParagraphNode {
  return node instanceof SentinelParagraphNode;
}
