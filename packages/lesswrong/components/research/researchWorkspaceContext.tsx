'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * One-shot instructions from the workspace shell to the document editor.
 * Set when an action needs the editor to do something after (possibly)
 * switching documents — e.g. "focus conversation X's block once you can see
 * it" or "append a fresh /query block". Consumed by WorkspaceIntentPlugin,
 * which clears the intent (by nonce) once executed or timed out.
 */
export type ResearchEditorIntent =
  | { kind: 'insert-query'; nonce: number }
  | {
      kind: 'focus-conversation';
      conversationId: string;
      /**
       * When true and no AgentBlock bound to this conversation exists in the
       * document, append one at the end (used to surface legacy chat-kind
       * conversations inside the project's scratch document).
       */
      materializeIfMissing: boolean;
      nonce: number;
    };

/**
 * Block-level focus signal. AgentBlockComponents watch this; the one whose
 * conversationId matches scrolls itself into view, enters the focused
 * (expanded) state, and acks.
 */
export interface ConversationFocusRequest {
  conversationId: string;
  nonce: number;
}

export interface ResearchWorkspaceApi {
  editorIntent: ResearchEditorIntent | null;
  clearEditorIntent: (nonce: number) => void;
  conversationFocusRequest: ConversationFocusRequest | null;
  requestConversationFocus: (conversationId: string) => void;
  ackConversationFocus: (nonce: number) => void;
}

const ResearchWorkspaceContext = createContext<ResearchWorkspaceApi | null>(null);

export function ResearchWorkspaceProvider({
  value,
  children,
}: {
  value: ResearchWorkspaceApi;
  children: ReactNode;
}) {
  return (
    <ResearchWorkspaceContext.Provider value={value}>{children}</ResearchWorkspaceContext.Provider>
  );
}

/**
 * Optional accessor: AgentBlocks can render in editors that aren't hosted by
 * the research workspace shell (in principle), so a missing provider just
 * means "no workspace coordination available".
 */
export function useResearchWorkspaceApiOptional(): ResearchWorkspaceApi | null {
  return useContext(ResearchWorkspaceContext);
}
