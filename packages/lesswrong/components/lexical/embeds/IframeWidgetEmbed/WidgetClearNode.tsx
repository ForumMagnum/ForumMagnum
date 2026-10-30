// EXPERIMENT (experiment/iframe-layout-ronny-exp3): "Start below widget" (Oct 30 2026, after the #lesswrong-2026
// thread: Oliver, "give the elements a clear float setting"). An empty block that makes what follows it start
// below any widget the text wraps around before it, at every window width (and does nothing where widgets show
// full width). The editor adds one from the chip beside a block next to a widget (IframeWidgetPlugin); its ✕,
// or Backspace at the start of the block after it, removes it. In the post it is an empty div that clears both
// sides (widgetNeighbours). Like Word's text wrapping break or Wikipedia's {{clear}}: nothing is guessed from
// blank lines.
import React, { type JSX } from 'react';
import {
  COMMAND_PRIORITY_HIGH,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type SerializedLexicalNode,
} from 'lexical';
import { WIDGET_CLEAR_CLASS } from './widgetClearClass';
import { WidgetClearMarker } from './WidgetClearMarker';

export class WidgetClearNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'widget-clear';
  }

  static clone(node: WidgetClearNode): WidgetClearNode {
    return new WidgetClearNode(node.__key);
  }

  static importJSON(serializedNode: SerializedLexicalNode): WidgetClearNode {
    return $createWidgetClearNode().updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => domNode.classList.contains(WIDGET_CLEAR_CLASS)
        ? { conversion: () => ({ node: $createWidgetClearNode() }), priority: COMMAND_PRIORITY_HIGH }
        : null,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = WIDGET_CLEAR_CLASS;
    div.contentEditable = 'false';
    return div;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.className = WIDGET_CLEAR_CLASS;
    return { element: div };
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): false {
    return false;
  }

  getTextContent(): string {
    return '';
  }

  decorate(): JSX.Element {
    return <WidgetClearMarker nodeKey={this.__key} />;
  }
}

export function $createWidgetClearNode(): WidgetClearNode {
  return new WidgetClearNode();
}

export function $isWidgetClearNode(node: LexicalNode | null | undefined): node is WidgetClearNode {
  return node instanceof WidgetClearNode;
}
