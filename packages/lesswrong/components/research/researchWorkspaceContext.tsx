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

/**
 * The workspace's standalone chat surface for one conversation: a resizable
 * right side panel, or (fullscreen) a full-viewport classic-LLM-chat overlay.
 * Complementary to the inline AgentBlock — the same conversation can be open
 * in both at once.
 */
export interface ResearchChatSurfaceState {
  conversationId: string;
  fullscreen: boolean;
}

/**
 * A sandbox text file open in the center pane's read-only viewer (opened from
 * a conversation's file browser). Cleared when the user closes the viewer.
 */
export interface SandboxFileView {
  conversationId: string;
  path: string;
}

export interface ResearchWorkspaceApi {
  editorIntent: ResearchEditorIntent | null;
  clearEditorIntent: (nonce: number) => void;
  conversationFocusRequest: ConversationFocusRequest | null;
  requestConversationFocus: (conversationId: string) => void;
  ackConversationFocus: (nonce: number) => void;
  /** Open a conversation in the right side panel (or fullscreen overlay). */
  openConversationChat: (conversationId: string, opts?: { fullscreen?: boolean }) => void;
  closeConversationChat: () => void;
  /** Open a sandbox text file in the center pane's read-only viewer. */
  sandboxFileView: SandboxFileView | null;
  openSandboxFile: (conversationId: string, path: string) => void;
  closeSandboxFile: () => void;
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
