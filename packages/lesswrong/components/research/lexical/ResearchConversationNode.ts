import {
  ElementNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';
import { $createConversationTranscriptNode, ConversationTranscriptNode } from './ConversationTranscriptNode';
import { $createPopulatedConversationComposerNode, ConversationComposerNode } from './ConversationComposerNode';

export const RESEARCH_CONVERSATION_NODE_TYPE = 'research-conversation';
export const RESEARCH_CONVERSATION_DOM_CLASS = 'research-conversation';
const RESEARCH_CONVERSATION_CONVERSATION_ATTR = 'data-conversation-id';
const RESEARCH_CONVERSATION_PRODUCED_BY_ATTR = 'data-produced-by-conversation-id';

/**
 * The v2 conversation block: a single in-document node that owns both the
 * conversation transcript and its reply composer — `[ConversationTranscriptNode
 * (decorator), ConversationComposerNode (editable)]`, mirroring the `/query`
 * block's `[Header, Content]` shape. Because the composer is a real node in the
 * main Lexical tree, the in-progress reply lives in Yjs (live to other viewers,
 * persistent across tabs/devices), while the transcript renders instantly-echoed
 * sends via the shared optimistic store (see useConversationStream). The old
 * standalone AgentBlockNode is left untouched, so existing documents are
 * unaffected.
 */
export type SerializedResearchConversationNode = Spread<
  { conversationId: string; producedByConversationId: string | null },
  SerializedElementNode
>;

export class ResearchConversationNode extends ElementNode {
  __conversationId: string;
  __producedByConversationId: string | null;

  static getType(): string {
    return RESEARCH_CONVERSATION_NODE_TYPE;
  }

  static clone(node: ResearchConversationNode): ResearchConversationNode {
    return new ResearchConversationNode(node.__conversationId, node.__producedByConversationId, node.__key);
  }

  constructor(conversationId: string, producedByConversationId: string | null = null, key?: NodeKey) {
    super(key);
    this.__conversationId = conversationId;
    this.__producedByConversationId = producedByConversationId;
  }

  getConversationId(): string {
    return this.__conversationId;
  }

  getProducedByConversationId(): string | null {
    return this.__producedByConversationId;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = RESEARCH_CONVERSATION_DOM_CLASS;
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = RESEARCH_CONVERSATION_DOM_CLASS;
    wrapper.setAttribute(RESEARCH_CONVERSATION_CONVERSATION_ATTR, this.__conversationId);
    if (this.__producedByConversationId) {
      wrapper.setAttribute(RESEARCH_CONVERSATION_PRODUCED_BY_ATTR, this.__producedByConversationId);
    }
    return { element: wrapper };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(RESEARCH_CONVERSATION_DOM_CLASS)) return null;
        return { conversion: convertResearchConversationElement, priority: 3 };
      },
    };
  }

  exportJSON(): SerializedResearchConversationNode {
    return {
      ...super.exportJSON(),
      type: RESEARCH_CONVERSATION_NODE_TYPE,
      version: 1,
      conversationId: this.__conversationId,
      producedByConversationId: this.__producedByConversationId,
    };
  }

  static importJSON(serialized: SerializedResearchConversationNode): ResearchConversationNode {
    return new ResearchConversationNode(
      serialized.conversationId ?? '',
      serialized.producedByConversationId ?? null,
    ).updateFromJSON(serialized);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

function convertResearchConversationElement(domNode: HTMLElement): DOMConversionOutput | null {
  const conversationId = domNode.getAttribute(RESEARCH_CONVERSATION_CONVERSATION_ATTR);
  if (!conversationId) return null;
  const producedByConversationId = domNode.getAttribute(RESEARCH_CONVERSATION_PRODUCED_BY_ATTR);
  return { node: $createResearchConversationNode(conversationId, producedByConversationId ?? null) };
}

export function $createResearchConversationNode(
  conversationId: string,
  producedByConversationId: string | null = null,
): ResearchConversationNode {
  return new ResearchConversationNode(conversationId, producedByConversationId);
}

export function $isResearchConversationNode(
  node: LexicalNode | null | undefined,
): node is ResearchConversationNode {
  return node instanceof ResearchConversationNode;
}

/**
 * Build a v2 conversation block with its canonical shape:
 * `[ConversationTranscriptNode, ConversationComposerNode]`, both bound to the
 * same conversation. Returns the children so callers don't walk the tree.
 */
export function $createPopulatedResearchConversationNode(
  conversationId: string,
  producedByConversationId: string | null = null,
): { node: ResearchConversationNode; transcript: ConversationTranscriptNode; composer: ConversationComposerNode } {
  const node = $createResearchConversationNode(conversationId, producedByConversationId);
  const transcript = $createConversationTranscriptNode({ conversationId, producedByConversationId });
  const { node: composer } = $createPopulatedConversationComposerNode(conversationId);
  node.append(transcript);
  node.append(composer);
  return { node, transcript, composer };
}
