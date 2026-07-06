import React from 'react';
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

// Lazy, mirroring AgentBlockNode: the component's import tree reaches the base
// editor (via ChatComposer), which reaches this node — a static import here
// would close that cycle and TDZ-crash at startup. The dynamic import defers
// the edge until first render; headless editors never render decorators.
// (Lexical wraps decorators in <Suspense fallback={null}> itself.)
const AgentBlockComponent = React.lazy(
  () => import('./AgentBlockComponent').then((m) => ({ default: m.AgentBlockComponent })),
);

export const CONVERSATION_TRANSCRIPT_TYPE = 'research-conversation-transcript';
const CONVERSATION_TRANSCRIPT_DOM_CLASS = 'research-conversation-transcript';

/**
 * The transcript half of a v2 ResearchConversationNode: renders the same
 * AgentBlockComponent as the standalone AgentBlock, but with `hideComposer`
 * set — the reply composer is the sibling ConversationComposerNode, whose draft
 * lives in Yjs. The standalone AgentBlockNode is intentionally left untouched.
 */
export interface ConversationTranscriptProps {
  conversationId: string;
  producedByConversationId: string | null;
}

interface ConversationTranscriptConstructorProps {
  conversationId?: string;
  producedByConversationId?: string | null;
}

export type SerializedConversationTranscriptNode = Spread<ConversationTranscriptProps, SerializedLexicalNode>;

export class ConversationTranscriptNode extends DecoratorNode<React.ReactElement> {
  __conversationId: string;
  __producedByConversationId: string | null;

  static getType(): string {
    return CONVERSATION_TRANSCRIPT_TYPE;
  }

  static clone(node: ConversationTranscriptNode): ConversationTranscriptNode {
    return new ConversationTranscriptNode(
      { conversationId: node.__conversationId, producedByConversationId: node.__producedByConversationId },
      node.__key,
    );
  }

  constructor(
    { conversationId = '', producedByConversationId = null }: ConversationTranscriptConstructorProps = {},
    key?: NodeKey,
  ) {
    super(key);
    this.__conversationId = conversationId;
    this.__producedByConversationId = producedByConversationId;
  }

  getConversationId(): string {
    return this.__conversationId;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    // Also carry `research-agent-block` so the content-style exemptions
    // (`:not(.research-agent-block *)`, which keep the document's serif reading
    // column off chat content) apply to the v2 transcript exactly as they do to
    // the standalone AgentBlock — otherwise agent lists/prose fall back to the
    // document serif at 18px. (Kept off exportDOM to avoid import ambiguity.)
    div.className = `${CONVERSATION_TRANSCRIPT_DOM_CLASS} research-agent-block`;
    div.setAttribute('data-conversation-id', this.__conversationId);
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = CONVERSATION_TRANSCRIPT_DOM_CLASS;
    wrapper.setAttribute('data-conversation-id', this.__conversationId);
    return { element: wrapper };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(CONVERSATION_TRANSCRIPT_DOM_CLASS)) return null;
        return { conversion: convertConversationTranscriptElement, priority: 2 };
      },
    };
  }

  exportJSON(): SerializedConversationTranscriptNode {
    return {
      type: CONVERSATION_TRANSCRIPT_TYPE,
      version: 1,
      conversationId: this.__conversationId,
      producedByConversationId: this.__producedByConversationId,
    };
  }

  static importJSON(serialized: SerializedConversationTranscriptNode): ConversationTranscriptNode {
    return $createConversationTranscriptNode({
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
        hideComposer
      />
    );
  }
}

function convertConversationTranscriptElement(domNode: HTMLElement): DOMConversionOutput | null {
  const conversationId = domNode.getAttribute('data-conversation-id');
  if (!conversationId) return null;
  return { node: $createConversationTranscriptNode({ conversationId, producedByConversationId: null }) };
}

export function $createConversationTranscriptNode(
  props: ConversationTranscriptConstructorProps = {},
): ConversationTranscriptNode {
  return new ConversationTranscriptNode(props);
}

export function $isConversationTranscriptNode(
  node: LexicalNode | null | undefined,
): node is ConversationTranscriptNode {
  return node instanceof ConversationTranscriptNode;
}
