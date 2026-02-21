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
import {
  $createTextNode,
  $getNodeByKey,
  ElementDOMSlot,
  getNearestEditorFromDOMNode,
} from 'lexical';

import {CodeNode, SerializedCodeNode} from '@lexical/code';
import {injectResizeScript} from './iframeResizeScript';

const MIN_HEIGHT = 50;
const MAX_HEIGHT = 5000;
const DEFAULT_HEIGHT = 400;

function clampHeight(h: number): number {
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(h)));
}

// SVG icon elements for the toggle button. Both are always in the DOM;
// CSS shows/hides the correct one based on the container's data-view attribute.
// Using innerHTML at toggle time would trigger Lexical's MutationObserver
// (childList + subtree) and get reverted, so we avoid DOM mutations entirely.
function createEyeIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.classList.add('iframe-widget-icon-eye');
  svg.innerHTML = '<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>';
  return svg;
}

function createCodeIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.classList.add('iframe-widget-icon-code');
  svg.innerHTML = '<path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>';
  return svg;
}

export type SerializedIframeWidgetNode = Spread<
  {},
  SerializedCodeNode
>;

function $convertIframeWidgetElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const iframe = domNode.tagName === 'IFRAME' ? domNode : domNode.querySelector('iframe');
  if (!iframe) {
    return null;
  }
  const htmlCode = iframe.getAttribute('srcdoc');
  if (!htmlCode) {
    return null;
  }
  if (!iframe.hasAttribute('data-lexical-iframe-widget')) {
    return null;
  }
  const node = $createIframeWidgetNode();
  node.append($createTextNode(htmlCode));
  return {node};
}

function getTextContentFromLexical(container: HTMLElement): string | null {
  const editor = getNearestEditorFromDOMNode(container);
  if (!editor) {
    return null;
  }
  const nodeKey = container.getAttribute('data-node-key');
  if (!nodeKey) {
    return null;
  }
  let text: string | null = null;
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    if (node) {
      text = node.getTextContent();
    }
  });
  return text;
}

function setViewMode(wrapper: HTMLElement, container: HTMLElement, mode: 'code' | 'preview') {
  wrapper.dataset.view = mode;
  container.dataset.view = mode;
}

function handleToggleClick(wrapper: HTMLElement) {
  const container = wrapper.querySelector('.iframe-widget-container') as HTMLElement | null;
  const toggle = wrapper.querySelector('.iframe-widget-toggle') as HTMLButtonElement | null;
  const iframe = wrapper.querySelector('iframe');

  if (!container || !toggle || !iframe) {
    return;
  }

  const isCodeView = container.dataset.view === 'code';

  if (isCodeView) {
    // Read code content from Lexical's node model (authoritative source)
    // rather than from DOM innerText (which can vary by browser/layout).
    const htmlCode = getTextContentFromLexical(container) ?? '';

    // Switch to preview mode BEFORE setting srcdoc. In code view, the
    // preview div is display:none — browsers may not reliably load srcdoc
    // on a hidden iframe. Making it visible first, then forcing a reflow,
    // ensures the iframe is in the layout tree when we assign srcdoc.
    setViewMode(wrapper, container, 'preview');
    toggle.title = 'Switch to code';
    void iframe.offsetHeight; // force reflow so display:none is removed

    if (htmlCode.trim()) {
      iframe.srcdoc = injectResizeScript(htmlCode);
    } else {
      iframe.srcdoc = '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#888;font-style:italic;font-family:sans-serif">No HTML content</body></html>';
      iframe.style.height = '60px';
    }
  } else {
    setViewMode(wrapper, container, 'code');
    toggle.title = 'Switch to preview';
  }
}

function setupResizeHandler(iframe: HTMLIFrameElement) {
  // Track whether the iframe was ever attached to the DOM, so we can
  // distinguish "not yet connected" (during createDOM, before Lexical inserts
  // the element) from "was connected but has since been removed" (cleanup).
  let wasConnected = false;
  function handler(event: MessageEvent) {
    if (!iframe.isConnected) {
      if (wasConnected) {
        window.removeEventListener('message', handler);
      }
      return;
    }
    wasConnected = true;
    if (event.source !== iframe.contentWindow) {
      return;
    }
    if (event.data?.type !== 'iframe-widget-resize') {
      return;
    }
    const newHeight = clampHeight(event.data.height);
    iframe.style.height = `${newHeight}px`;
  }
  window.addEventListener('message', handler);
}

export class IframeWidgetNode extends CodeNode {
  static getType(): string {
    return 'iframe-widget';
  }

  static clone(node: IframeWidgetNode): IframeWidgetNode {
    return new IframeWidgetNode(node.__language, node.__key);
  }

  constructor(language?: string | null, key?: NodeKey) {
    super(language ?? 'html', key);
  }

  // Prevent Backspace at start from converting to paragraph
  collapseAtStart(): boolean {
    return false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    // Outer wrapper — provides a positioning context for the toggle button,
    // which sits outside the container's left edge (and would otherwise be
    // clipped by the container's overflow).
    const wrapper = document.createElement('div');
    wrapper.classList.add('iframe-widget-wrapper');

    // Inner container — Lexical renders children directly into this element.
    // Non-Lexical elements (preview div) are placed AFTER the Lexical
    // children in DOM order and excluded via getDOMSlot's withBefore.
    const container = document.createElement('div');
    container.classList.add('iframe-widget-container');
    container.setAttribute('spellcheck', 'false');
    container.setAttribute('data-language', 'html');
    container.setAttribute('data-highlight-language', 'html');
    container.setAttribute('data-node-key', this.__key);

    // Preview div — placed at end, after Lexical-managed children.
    // getDOMSlot's withBefore excludes it from Lexical's child management.
    const previewDiv = document.createElement('div');
    previewDiv.classList.add('iframe-widget-preview');
    previewDiv.setAttribute('contenteditable', 'false');

    const hasContent = this.getTextContent().trim().length > 0;

    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    iframe.title = 'Embedded widget';
    iframe.style.display = 'block';
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.height = `${hasContent ? DEFAULT_HEIGHT : 60}px`;
    previewDiv.appendChild(iframe);
    container.appendChild(previewDiv);

    // Toggle button — child of wrapper (not container), absolutely positioned
    // to the left of the container's top-left corner via CSS.
    // Both SVG icons are always present; CSS shows/hides based on data-view.
    const toggle = document.createElement('button');
    toggle.classList.add('iframe-widget-toggle');
    toggle.type = 'button';
    toggle.setAttribute('contenteditable', 'false');
    toggle.tabIndex = -1;
    toggle.appendChild(createEyeIcon());
    toggle.appendChild(createCodeIcon());
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleToggleClick(wrapper);
    });

    wrapper.appendChild(toggle);
    wrapper.appendChild(container);

    setupResizeHandler(iframe);

    // Default view: code if empty, preview if has content.
    // data-view is set on both wrapper (for icon visibility CSS) and
    // container (for code view / gutter CSS).
    if (hasContent) {
      setViewMode(wrapper, container, 'preview');
      toggle.title = 'Switch to code';
      iframe.srcdoc = injectResizeScript(this.getTextContent());
    } else {
      setViewMode(wrapper, container, 'code');
      toggle.title = 'Switch to preview';
    }

    return wrapper;
  }

  getDOMSlot(element: HTMLElement): ElementDOMSlot {
    // element is the wrapper; children go into the inner container.
    // They are placed before the preview div, which is excluded from
    // Lexical's child reconciliation.
    const container = element.querySelector('.iframe-widget-container') as HTMLElement;
    const previewDiv = container.querySelector('.iframe-widget-preview');
    return super.getDOMSlot(container).withBefore(previewDiv!);
  }

  updateDOM(prevNode: IframeWidgetNode, dom: HTMLElement, config: EditorConfig): boolean {
    // Don't recreate DOM — code content is managed via child reconciliation,
    // and view mode is local DOM state.
    return false;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-lexical-iframe-widget', 'true');
    iframe.setAttribute('srcdoc', this.getTextContent());
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', 'Embedded widget');
    iframe.setAttribute('style', `width: 100%; height: ${DEFAULT_HEIGHT}px; border: 1px solid #ccc; border-radius: 4px;`);
    return {element: iframe};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-iframe-widget')) {
          return null;
        }
        return {
          conversion: $convertIframeWidgetElement,
          priority: 2,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedIframeWidgetNode): IframeWidgetNode {
    const node = $createIframeWidgetNode();
    return node.updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedIframeWidgetNode>): this {
    return super.updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedIframeWidgetNode {
    return {
      ...super.exportJSON(),
    };
  }

}

export function $createIframeWidgetNode(): IframeWidgetNode {
  return new IframeWidgetNode();
}

export function $isIframeWidgetNode(
  node: IframeWidgetNode | LexicalNode | null | undefined,
): node is IframeWidgetNode {
  return node instanceof IframeWidgetNode;
}
