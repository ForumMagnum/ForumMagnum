import {
  $findMatchingParent,
} from '@lexical/utils';
import { $isLinkNode } from '@lexical/link';
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

/**
 * The attribute a custom hover preview is stored in, as escaped HTML. Read on the rendering
 * side by ContentItemBody, which turns the span into a CustomHoverPreview.
 */
export const HOVER_PREVIEW_ATTRIBUTE = 'data-hover-preview';

/** Marks the span so it can be styled with the faint dashed underline. */
export const HOVER_PREVIEW_CLASS = 'hoverPreview';

export type SerializedHoverPreviewNode = Spread<
  { previewHtml: string },
  SerializedElementNode
>;

/**
 * An inline span carrying an author-written hover preview.
 *
 * Deliberately a node of its own rather than an attribute on the link: a preview does not
 * require a link, and text with a preview but no destination has to be representable. When
 * there is also a link, this node wraps it (`<span><a>text</a></span>`) rather than nesting
 * inside it, so the rendering side can suppress the link's own preview via React context —
 * context flows down, so the preview has to be the outer element.
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
    const element = document.createElement('span');
    element.className = HOVER_PREVIEW_CLASS;
    element.setAttribute(HOVER_PREVIEW_ATTRIBUTE, this.__previewHtml);
    return element;
  }

  updateDOM(prevNode: this, element: HTMLElement): boolean {
    if (prevNode.__previewHtml !== this.__previewHtml) {
      element.setAttribute(HOVER_PREVIEW_ATTRIBUTE, this.__previewHtml);
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.className = HOVER_PREVIEW_CLASS;
    element.setAttribute(HOVER_PREVIEW_ATTRIBUTE, this.__previewHtml);
    return { element };
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

  /** Typing at either edge should land outside the preview, as it does for links. */
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

/** The hover preview covering the current selection, if there is one. */
export function $getSelectedHoverPreviewNode(): HoverPreviewNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  const [node] = selection.getNodes();
  if (!node) {
    return null;
  }
  const matched = $findMatchingParent(node, $isHoverPreviewNode);
  return $isHoverPreviewNode(matched) ? matched : null;
}

function $unwrapHoverPreview(node: HoverPreviewNode): void {
  for (const child of node.getChildren()) {
    node.insertBefore(child);
  }
  node.remove();
}

/**
 * Adds, updates, or (with an empty string) removes the hover preview on the current selection.
 *
 * When the selection sits inside a link, the whole link is wrapped rather than its text, so the
 * preview stays the outer element even if the link was created first.
 */
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

  // Prefer wrapping an enclosing link over its text, so link-then-preview and
  // preview-then-link produce the same structure.
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
