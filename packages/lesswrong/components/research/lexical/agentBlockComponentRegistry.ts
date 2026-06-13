import type { ComponentType } from 'react';
import type { NodeKey } from 'lexical';

export interface AgentBlockComponentProps {
  nodeKey: NodeKey;
  conversationId: string;
  producedByConversationId: string | null;
}

/**
 * Late-bound registry for the AgentBlock's React component.
 *
 * `AgentBlockNode` (reachable from the universal `allLexicalNodes` registry,
 * which the base editor imports) must not statically import
 * `AgentBlockComponent`: the component hosts a nested `ChatComposer`, which
 * imports the base editor — a module cycle that throws a TDZ ReferenceError
 * at startup. Instead the document-editor surface (DocumentPane, via
 * `registerAgentBlockComponent`) installs the component at module-eval time,
 * and the node's `decorate()` looks it up at render time. Headless editors
 * never render decorators, so they safely skip registration.
 */
let registeredComponent: ComponentType<AgentBlockComponentProps> | null = null;

export function setAgentBlockComponent(component: ComponentType<AgentBlockComponentProps>): void {
  registeredComponent = component;
}

export function getAgentBlockComponent(): ComponentType<AgentBlockComponentProps> | null {
  return registeredComponent;
}
