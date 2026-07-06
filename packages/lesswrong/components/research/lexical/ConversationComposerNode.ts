import {
  ElementNode,
  $createParagraphNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';
import { $createQueryInputContentNode, QueryInputContentNode } from './QueryInputContentNode';

export const CONVERSATION_COMPOSER_NODE_TYPE = 'research-conversation-composer';
export const CONVERSATION_COMPOSER_DOM_CLASS = 'research-conversation-composer';
export const CONVERSATION_COMPOSER_CONVERSATION_ATTR = 'data-conversation-id';

/**
 * An in-document composer for continuing an existing research conversation.
 *
 * Unlike the (detached, non-collaborative) ChatComposer rendered inside a
 * focused AgentBlock, this is a real node in the main document's Lexical tree,
 * so the in-progress prompt lives in the Yjs doc: it's visible live to other
 * viewers and survives closing the tab / switching devices. The editable draft
 * lives in a child `QueryInputContentNode` (reused so the content region and
 * its content-style guards already behave like the `/query` composer). On
 * Cmd/Ctrl+Enter (see ConversationComposerPlugin) the draft fires
 * `continueResearchConversation` for `__conversationId` and is then cleared,
 * leaving the composer in place for the next message.
 */
export type SerializedConversationComposerNode = Spread<
  { conversationId: string },
  SerializedElementNode
>;

export class ConversationComposerNode extends ElementNode {
  __conversationId: string;

  static getType(): string {
    return CONVERSATION_COMPOSER_NODE_TYPE;
  }

  static clone(node: ConversationComposerNode): ConversationComposerNode {
    return new ConversationComposerNode(node.__conversationId, node.__key);
  }

  constructor(conversationId: string, key?: NodeKey) {
    super(key);
    this.__conversationId = conversationId;
  }

  getConversationId(): string {
    return this.__conversationId;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = CONVERSATION_COMPOSER_DOM_CLASS;
    // The shell is non-editable; the inner QueryInputContentNode opts back in
    // with contenteditable="true" so arrow-key navigation exits it naturally.
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = CONVERSATION_COMPOSER_DOM_CLASS;
    wrapper.setAttribute(CONVERSATION_COMPOSER_CONVERSATION_ATTR, this.__conversationId);
    return { element: wrapper };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(CONVERSATION_COMPOSER_DOM_CLASS)) return null;
        return { conversion: convertConversationComposerElement, priority: 2 };
      },
    };
  }

  exportJSON(): SerializedConversationComposerNode {
    return {
      ...super.exportJSON(),
      type: CONVERSATION_COMPOSER_NODE_TYPE,
      version: 1,
      conversationId: this.__conversationId,
    };
  }

  static importJSON(serialized: SerializedConversationComposerNode): ConversationComposerNode {
    return $createConversationComposerNode(serialized.conversationId ?? '').updateFromJSON(serialized);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

function convertConversationComposerElement(domNode: HTMLElement): DOMConversionOutput {
  const conversationId = domNode.getAttribute(CONVERSATION_COMPOSER_CONVERSATION_ATTR) ?? '';
  return { node: $createConversationComposerNode(conversationId) };
}

export function $createConversationComposerNode(conversationId: string): ConversationComposerNode {
  return new ConversationComposerNode(conversationId);
}

export function $isConversationComposerNode(
  node: LexicalNode | null | undefined,
): node is ConversationComposerNode {
  return node instanceof ConversationComposerNode;
}

/**
 * Build a composer with its canonical shape (`[Content[paragraph]]`). Returns
 * the content node too so callers don't have to walk children to find it.
 */
export function $createPopulatedConversationComposerNode(
  conversationId: string,
  contentChildren?: LexicalNode[],
): { node: ConversationComposerNode; content: QueryInputContentNode } {
  const node = $createConversationComposerNode(conversationId);
  const content = $createQueryInputContentNode();
  if (contentChildren && contentChildren.length > 0) {
    for (const child of contentChildren) content.append(child);
  } else {
    content.append($createParagraphNode());
  }
  node.append(content);
  return { node, content };
}
