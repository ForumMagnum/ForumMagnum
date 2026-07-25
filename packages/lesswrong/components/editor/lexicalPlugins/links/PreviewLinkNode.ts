import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  Spread,
} from 'lexical';
import { LinkNode, type LinkAttributes, type SerializedLinkNode } from '@lexical/link';

/**
 * The attribute a link's custom hover preview is stored in, as escaped HTML. Read on the
 * rendering side by HoverPreviewLink, which shows this instead of the destination's own
 * preview when it is present.
 */
export const HOVER_PREVIEW_ATTRIBUTE = 'data-hover-preview';

/** Marks the anchor in the editor so it can be styled as carrying a preview. */
export const HOVER_PREVIEW_CLASS = 'hasHoverPreview';

export type SerializedPreviewLinkNode = Spread<
  { previewHtml: string },
  SerializedLinkNode
>;

/**
 * A link that can carry a custom hover preview alongside its URL.
 *
 * Registered as a replacement for the built-in LinkNode rather than under the same type
 * (the ContainerQuoteNode approach), because $createLinkNode builds a LinkNode directly and
 * $applyNodeReplacement only swaps the class when an explicit replacement is configured.
 * See PlaygroundNodes.ts for the registration.
 */
export class PreviewLinkNode extends LinkNode {
  __previewHtml: string;

  static getType(): string {
    return 'preview-link';
  }

  static clone(node: PreviewLinkNode): PreviewLinkNode {
    return new PreviewLinkNode(
      node.__url,
      { rel: node.__rel, target: node.__target, title: node.__title },
      node.__previewHtml,
      node.__key,
    );
  }

  constructor(
    url: string = '',
    attributes: LinkAttributes = {},
    previewHtml: string = '',
    key?: NodeKey,
  ) {
    super(url, attributes, key);
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

  createDOM(config: EditorConfig): HTMLAnchorElement | HTMLSpanElement {
    const element = super.createDOM(config);
    applyPreviewAttribute(element, this.__previewHtml);
    return element;
  }

  updateDOM(
    prevNode: this,
    anchor: HTMLAnchorElement | HTMLSpanElement,
    config: EditorConfig,
  ): boolean {
    const needsReplace = super.updateDOM(prevNode, anchor, config);
    if (prevNode.__previewHtml !== this.__previewHtml) {
      applyPreviewAttribute(anchor, this.__previewHtml);
    }
    return needsReplace;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element, ...rest } = super.exportDOM(editor);
    if (element instanceof HTMLElement) {
      applyPreviewAttribute(element, this.__previewHtml);
    }
    return { element, ...rest };
  }

  /**
   * Only claims anchors that actually carry a preview; a plain <a> falls through to the
   * built-in converter, which builds its node with $createLinkNode and therefore still ends
   * up as a PreviewLinkNode via the registered replacement.
   */
  static importDOM(): DOMConversionMap | null {
    return {
      a: (domNode: HTMLElement) =>
        domNode.hasAttribute(HOVER_PREVIEW_ATTRIBUTE)
          ? { conversion: convertPreviewLinkElement, priority: 2 }
          : null,
    };
  }

  static importJSON(serializedNode: SerializedPreviewLinkNode): PreviewLinkNode {
    return $createPreviewLinkNode('').updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedPreviewLinkNode>): this {
    return super
      .updateFromJSON(serializedNode)
      .setPreviewHtml(serializedNode.previewHtml ?? '');
  }

  exportJSON(): SerializedPreviewLinkNode {
    return {
      ...super.exportJSON(),
      type: 'preview-link',
      version: 1,
      previewHtml: this.__previewHtml,
    };
  }
}

function applyPreviewAttribute(element: HTMLElement, previewHtml: string): void {
  if (previewHtml) {
    element.setAttribute(HOVER_PREVIEW_ATTRIBUTE, previewHtml);
    element.classList.add(HOVER_PREVIEW_CLASS);
  } else {
    element.removeAttribute(HOVER_PREVIEW_ATTRIBUTE);
    element.classList.remove(HOVER_PREVIEW_CLASS);
  }
}

function convertPreviewLinkElement(domNode: HTMLElement): DOMConversionOutput {
  const url = domNode.getAttribute('href') ?? '';
  const node = $createPreviewLinkNode(url, {
    rel: domNode.getAttribute('rel'),
    target: domNode.getAttribute('target'),
    title: domNode.getAttribute('title'),
  });
  node.setPreviewHtml(domNode.getAttribute(HOVER_PREVIEW_ATTRIBUTE) ?? '');
  return { node };
}

export function $createPreviewLinkNode(
  url: string = '',
  attributes: LinkAttributes = {},
  previewHtml: string = '',
): PreviewLinkNode {
  return new PreviewLinkNode(url, attributes, previewHtml);
}

export function $isPreviewLinkNode(
  node: LexicalNode | null | undefined,
): node is PreviewLinkNode {
  return node instanceof PreviewLinkNode;
}

/**
 * Builds the replacement PreviewLinkNode for a LinkNode that some other code created. Kept
 * next to the node so the registration in PlaygroundNodes.ts stays a one-liner.
 */
export function $replaceLinkNodeWithPreviewLink(node: LinkNode): PreviewLinkNode {
  return $createPreviewLinkNode(node.getURL(), {
    rel: node.getRel(),
    target: node.getTarget(),
    title: node.getTitle(),
  });
}
