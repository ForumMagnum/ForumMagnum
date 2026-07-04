import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import React from 'react';

// Lazy like ImageNode et al: the component's import tree reaches the base
// editor (via ChatComposer), which reaches this node's registry — a static
// import here would close that cycle and TDZ-crash at startup. The dynamic
// import defers the edge until the first render; headless editors never
// render decorators, so they never load it at all. (Lexical wraps decorators
// in <Suspense fallback={null}> itself.)
const AgentBlockComponent = React.lazy(
  () => import('./AgentBlockComponent').then((m) => ({ default: m.AgentBlockComponent })),
);

export interface AgentBlockProps {
  conversationId: string;
  producedByConversationId: string | null;
}

interface AgentBlockConstructorProps {
  conversationId?: string;
  producedByConversationId?: string | null;
}

export type SerializedAgentBlockNode = Spread<
  AgentBlockProps,
  SerializedLexicalNode
>;

const AGENT_BLOCK_TYPE = 'research-agent-block';
const AGENT_BLOCK_DOM_CLASS = 'research-agent-block';

export class AgentBlockNode extends DecoratorNode<React.ReactElement> {
  __conversationId: string;
  __producedByConversationId: string | null;

  static getType(): string {
    return AGENT_BLOCK_TYPE;
  }

  static clone(node: AgentBlockNode): AgentBlockNode {
    return new AgentBlockNode(
      { conversationId: node.__conversationId, producedByConversationId: node.__producedByConversationId },
      node.__key,
    );
  }

  constructor(
    { conversationId = '', producedByConversationId = null }: AgentBlockConstructorProps = {},
    key?: NodeKey,
  ) {
    super(key);
    this.__conversationId = conversationId;
    this.__producedByConversationId = producedByConversationId;
  }

  getConversationId(): string {
    return this.__conversationId;
  }

  setConversationId(conversationId: string): void {
    const writable = this.getWritable();
    writable.__conversationId = conversationId;
  }

  getProducedByConversationId(): string | null {
    return this.__producedByConversationId;
  }

  setProducedByConversationId(producedByConversationId: string | null): void {
    const writable = this.getWritable();
    writable.__producedByConversationId = producedByConversationId;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = AGENT_BLOCK_DOM_CLASS;
    div.setAttribute('data-conversation-id', this.__conversationId);
    if (this.__producedByConversationId) {
      div.setAttribute('data-produced-by-conversation-id', this.__producedByConversationId);
    }
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = AGENT_BLOCK_DOM_CLASS;
    wrapper.setAttribute('data-conversation-id', this.__conversationId);
    if (this.__producedByConversationId) {
      wrapper.setAttribute('data-produced-by-conversation-id', this.__producedByConversationId);
    }
    // Inline a human-readable placeholder so this element survives
    // round-trips through tools that elide empty divs (Turndown's
    // blank-replacement, plaintext converters, etc.) and so a copy/paste of
    // the rendered HTML still says something meaningful out of context.
    const label = document.createElement('span');
    label.textContent = `Research agent query (conversation: ${this.__conversationId || 'unassigned'})`;
    wrapper.appendChild(label);
    return { element: wrapper };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(AGENT_BLOCK_DOM_CLASS)) return null;
        return { conversion: convertAgentBlockElement, priority: 2 };
      },
    };
  }

  exportJSON(): SerializedAgentBlockNode {
    return {
      type: AGENT_BLOCK_TYPE,
      version: 1,
      conversationId: this.__conversationId,
      producedByConversationId: this.__producedByConversationId,
    };
  }

  static importJSON(serialized: SerializedAgentBlockNode): AgentBlockNode {
    return $createAgentBlockNode({
      conversationId: serialized.conversationId,
      producedByConversationId: serialized.producedByConversationId ?? null,
    });
  }

  isInline(): false {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  decorate(): React.ReactElement {
    return (
      <AgentBlockComponent
        nodeKey={this.__key}
        conversationId={this.__conversationId}
        producedByConversationId={this.__producedByConversationId}
      />
    );
  }
}

function convertAgentBlockElement(domNode: HTMLElement): DOMConversionOutput | null {
  const conversationId = domNode.getAttribute('data-conversation-id');
  if (!conversationId) return null;
  const producedByConversationId = domNode.getAttribute('data-produced-by-conversation-id');
  return {
    node: $createAgentBlockNode({
      conversationId,
      producedByConversationId: producedByConversationId ?? null,
    }),
  };
}

export function $createAgentBlockNode(props: AgentBlockProps): AgentBlockNode {
  return new AgentBlockNode(props);
}

export function $isAgentBlockNode(node: LexicalNode | null | undefined): node is AgentBlockNode {
  return node instanceof AgentBlockNode;
}
