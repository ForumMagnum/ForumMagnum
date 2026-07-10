'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

export type ResearchEditorIntent =
  | { kind: 'insert-query'; nonce: number }
  | {
      // Insert a full v2 conversation block (transcript + reply composer) bound
      // to `conversationId` at the editor's current cursor — a second live view
      // of the conversation (double-clicking a sidebar chat).
      kind: 'insert-conversation-block';
      conversationId: string;
      nonce: number;
    }
  | {
      kind: 'focus-conversation';
      conversationId: string;
      nonce: number;
    };

export interface ConversationFocusRequest {
  conversationId: string;
  nonce: number;
}

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
  openConversationChat: (conversationId: string, opts?: { fullscreen?: boolean }) => void;
  closeConversationChat: (conversationId: string) => void;
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

export function useResearchWorkspaceApiOptional(): ResearchWorkspaceApi | null {
  return useContext(ResearchWorkspaceContext);
}
