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

import {CodeNode, SerializedCodeNode} from '@lexical/code';

const DEFAULT_HEIGHT = 400;

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

  collapseAtStart(): boolean {
    return false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.classList.add('iframe-widget-code');
    return element;
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
