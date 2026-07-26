import { $findMatchingParent } from '@lexical/utils';
import { $isLinkNode } from '@lexical/link';
import { getSelectedNode } from '@/components/lexical/utils/getSelectedNode';
import {
  $getSelection,
  $isRangeSelection,
  ElementNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type LexicalUpdateJSON,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';

/** Holds the preview body as escaped HTML. */
export const HOVER_PREVIEW_ATTRIBUTE = 'data-hover-preview';

/** Styling hook for the dashed underline; see stylePiping. */
const HOVER_PREVIEW_CLASS = 'hoverPreview';

export type SerializedHoverPreviewNode = Spread<
  { previewHtml: string },
  SerializedElementNode
>;

/**
 * An inline span carrying an author-written hover preview.
 *
 * Wraps the link rather than nesting inside it, so the renderer can
 * suppress the link's own preview via context, which only flows down.
 */
export class HoverPreviewNode extends ElementNode {
  __previewHtml: string;

  static getType(): string {
    return 'hover-preview';
  }

  static clone(node: HoverPreviewNode): HoverPreviewNode {
    return new HoverPreviewNode(node.__previewHtml, node.__key);
  }

  constructor(previewHtml: string = '', key?: NodeKey) {
    super(key);
    this.__previewHtml = previewHtml;
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__previewHtml = prevNode.__previewHtml;
  }

  getPreviewHtml(): string {
    return this.__previewHtml;
  }

  setPreviewHtml(previewHtml: string): this {
    const writable = this.getWritable();
    writable.__previewHtml = previewHtml;
    return writable;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return createHoverPreviewElement(this.__previewHtml);
  }

  updateDOM(prevNode: this, element: HTMLElement): boolean {
    if (prevNode.__previewHtml !== this.__previewHtml) {
      element.setAttribute(HOVER_PREVIEW_ATTRIBUTE, this.__previewHtml);
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    return { element: createHoverPreviewElement(this.__previewHtml) };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) =>
        domNode.hasAttribute(HOVER_PREVIEW_ATTRIBUTE)
          ? { conversion: convertHoverPreviewElement, priority: 2 }
          : null,
    };
  }

  static importJSON(serializedNode: SerializedHoverPreviewNode): HoverPreviewNode {
    return $createHoverPreviewNode().updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedHoverPreviewNode>): this {
    return super.updateFromJSON(serializedNode).setPreviewHtml(serializedNode.previewHtml ?? '');
  }

  exportJSON(): SerializedHoverPreviewNode {
    return {
      ...super.exportJSON(),
      type: 'hover-preview',
      version: 1,
      previewHtml: this.__previewHtml,
    };
  }

  isInline(): true {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  /** Typing at the edges lands outside, as it does for links. */
  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  extractWithChild(): boolean {
    return true;
  }
}

function createHoverPreviewElement(previewHtml: string): HTMLElement {
  const element = document.createElement('span');
  element.className = HOVER_PREVIEW_CLASS;
  element.setAttribute(HOVER_PREVIEW_ATTRIBUTE, previewHtml);
  return element;
}

function convertHoverPreviewElement(domNode: HTMLElement): DOMConversionOutput {
  return { node: $createHoverPreviewNode(domNode.getAttribute(HOVER_PREVIEW_ATTRIBUTE) ?? '') };
}

export function $createHoverPreviewNode(previewHtml: string = ''): HoverPreviewNode {
  return new HoverPreviewNode(previewHtml);
}

export function $isHoverPreviewNode(
  node: LexicalNode | null | undefined,
): node is HoverPreviewNode {
  return node instanceof HoverPreviewNode;
}

export function $getSelectedHoverPreviewNode(): HoverPreviewNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  const matched = $findMatchingParent(getSelectedNode(selection), $isHoverPreviewNode);
  return $isHoverPreviewNode(matched) ? matched : null;
}

function $unwrapHoverPreview(node: HoverPreviewNode): void {
  for (const child of node.getChildren()) {
    node.insertBefore(child);
  }
  node.remove();
}

/** An empty previewHtml removes the preview. */
export function $setHoverPreviewOnSelection(previewHtml: string): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }

  const existing = $getSelectedHoverPreviewNode();
  if (existing) {
    if (previewHtml) {
      existing.setPreviewHtml(previewHtml);
    } else {
      $unwrapHoverPreview(existing);
    }
    return;
  }
  if (!previewHtml || selection.isCollapsed()) {
    return;
  }

  const nodes = selection.extract();
  if (!nodes.length) {
    return;
  }

  // Wrap an enclosing link so either creation order gives one shape.
  const linkParent = $findMatchingParent(nodes[0], $isLinkNode);
  const wrapTarget = linkParent && nodes.every(node => linkParent.isParentOf(node))
    ? linkParent
    : null;

  const previewNode = $createHoverPreviewNode(previewHtml);
  if (wrapTarget) {
    wrapTarget.insertBefore(previewNode);
    previewNode.append(wrapTarget);
    return;
  }

  nodes[0].insertBefore(previewNode);
  for (const node of nodes) {
    previewNode.append(node);
  }
}
