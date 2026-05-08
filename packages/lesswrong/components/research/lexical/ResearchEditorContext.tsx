'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * Result returned by the host workspace's `fireResearchConversation` mutation.
 * The callback returns the new conversationId so the editor can wire it into
 * the just-inserted AgentBlock.
 */
export interface FireQueryResult {
  conversationId: string;
}

/**
 * Document-level entrypoint payload produced by the editor when the user
 * fires a query from a selection or a slash command. T5 / T1 own the actual
 * mutation; the editor only knows how to construct the payload and call back.
 */
export interface FireDocumentQueryArgs {
  documentId: string;
  anchorId: string;
  prompt?: string;
}

export interface ResearchEditorEnvironment {
  /** Required. The ResearchDocument id this editor is bound to. */
  documentId: string;

  /**
   * Called when the user triggers "Fire as query" or inserts a fresh AgentBlock
   * from the slash menu. T5 wires this to T1's `fireResearchConversation`.
   * Should resolve with the new conversationId so the editor can patch the
   * placeholder AgentBlock.
   */
  fireDocumentQuery: (args: FireDocumentQueryArgs) => Promise<FireQueryResult>;

  /**
   * Surfaces the full conversation transcript for an AgentBlock in the
   * workspace's chat pane. AgentBlocks render an "open in chat" icon that
   * calls this with the block's conversationId.
   */
  openConversationInChat: (conversationId: string) => void;
}

const ResearchEditorContext = createContext<ResearchEditorEnvironment | null>(null);

export function ResearchEditorProvider({
  environment,
  children,
}: {
  environment: ResearchEditorEnvironment;
  children: ReactNode;
}) {
  return (
    <ResearchEditorContext.Provider value={environment}>{children}</ResearchEditorContext.Provider>
  );
}

export function useResearchEditorEnvironment(): ResearchEditorEnvironment {
  const ctx = useContext(ResearchEditorContext);
  if (!ctx) {
    throw new Error(
      'useResearchEditorEnvironment must be used inside <ResearchEditorProvider>',
    );
  }
  return ctx;
}

export function useOptionalResearchEditorEnvironment(): ResearchEditorEnvironment | null {
  return useContext(ResearchEditorContext);
}
