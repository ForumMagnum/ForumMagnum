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
import {$createTextNode} from 'lexical';
import { randomId } from '@/lib/random';

import {CodeNode, type SerializedCodeNode} from '@/lib/vendor/lexical/CodeNode';

const DEFAULT_HEIGHT = 400;

export type SerializedIframeWidgetNode = Spread<
  {
    widgetId?: string | null
  },
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
  const widgetId = iframe.getAttribute('data-widget-id');
  const node = $createIframeWidgetNode(widgetId ?? randomId());
  node.append($createTextNode(htmlCode));
  return {node};
}

export class IframeWidgetNode extends CodeNode {
  __widgetId: string | null;

  static getType(): string {
    return 'iframe-widget';
  }

  static clone(node: IframeWidgetNode): IframeWidgetNode {
    return new IframeWidgetNode(node.__language, node.__key, node.__widgetId);
  }

  constructor(language?: string | null, key?: NodeKey, widgetId?: string | null) {
    super(language ?? 'html', key);
    this.__widgetId = widgetId ?? null;
  }

  collapseAtStart(): boolean {
    return false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.classList.add('iframe-widget-code');
    if (this.__widgetId) {
      element.setAttribute('data-widget-id', this.__widgetId);
    }
    return element;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-lexical-iframe-widget', 'true');
    if (this.__widgetId) {
      iframe.setAttribute('data-widget-id', this.__widgetId);
    }
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', 'Embedded widget');
    iframe.setAttribute('style', `width: 100%; height: ${DEFAULT_HEIGHT}px; border: 1px solid #ccc; border-radius: 4px;`);
    // Keep srcdoc as the last attribute to simplify markdown post-processing.
    iframe.setAttribute('srcdoc', this.getTextContent());
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
    const node = $createIframeWidgetNode(serializedNode.widgetId ?? null);
    return node.updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedIframeWidgetNode>): this {
    const updated = super.updateFromJSON(serializedNode);
    if (serializedNode.widgetId !== undefined) {
      updated.__widgetId = serializedNode.widgetId ?? null;
    }
    return updated;
  }

  exportJSON(): SerializedIframeWidgetNode {
    return {
      ...super.exportJSON(),
      widgetId: this.__widgetId,
    };
  }

  getWidgetId(): string | null {
    return this.__widgetId;
  }

  setWidgetId(widgetId: string): void {
    const writable = this.getWritable();
    writable.__widgetId = widgetId;
  }

  ensureWidgetId(): string {
    const writable = this.getWritable();
    if (!writable.__widgetId) {
      writable.__widgetId = randomId();
    }
    return writable.__widgetId;
  }
}

export function $createIframeWidgetNode(widgetId?: string | null): IframeWidgetNode {
  return new IframeWidgetNode('html', undefined, widgetId ?? null);
}

export function $isIframeWidgetNode(
  node: IframeWidgetNode | LexicalNode | null | undefined,
): node is IframeWidgetNode {
  return node instanceof IframeWidgetNode;
}
