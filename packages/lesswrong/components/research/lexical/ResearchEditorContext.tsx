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

export interface FireDocumentQueryArgs {
  /** Client-generated id for the new conversation; written into the placeholder AgentBlock so the doc binds to the conversation before the mutation returns. */
  conversationId: string;
  documentId: string;
  promptHtml: string;
  baseEnvironmentId: string | null;
  runtime: string | null;
  /** Per-turn model alias + reasoning effort from the /query header picker. */
  model?: string;
  effort?: string;
}

/**
 * Document-editor-only environment. Provided by `DocumentPane` because the
 * fields are meaningful only inside a Lexical editor that's bound to a
 * specific ResearchDocument (e.g. firing AgentBlocks against it).
 */
export interface ResearchEditorEnvironment {
  /** Required. The ResearchDocument id this editor is bound to. */
  documentId: string;

  projectId: string;

  /**
   * Called when the user inserts a fresh AgentBlock from the slash menu.
   * Should resolve with the new conversationId so the editor can patch the
   * placeholder AgentBlock.
   */
  fireDocumentQuery: (args: FireDocumentQueryArgs) => Promise<FireQueryResult>;
}

/**
 * Identifies the editor instance this navigation context wraps. Lets nav-aware
 * components (mention chips, etc.) suppress self-referential actions like
 * "open conversation X" when the host already *is* conversation X.
 *
 * Optional: a brand-new chat composer (no conversation yet) has no host, and
 * code in that state should just behave as if all targets are external.
 */
type ResearchEditorHost =
  | { kind: 'document'; documentId: string }
  | { kind: 'conversation'; conversationId: string };

/**
 * Workspace-level navigation surface available to any editor that mounts mention
 * chips — both the document editor and the chat composer. Kept separate from
 * `ResearchEditorEnvironment` so the chat composer can opt into navigation
 * without pretending to be a document editor.
 */
export interface ResearchNavigationContextValue {
  /** Switch the workspace's active document. */
  navigateToDocument: (documentId: string) => void;
  openConversation: (conversationId: string) => void;
  /** Identifies this editor instance, when available. */
  host?: ResearchEditorHost;
}

const ResearchEditorContext = createContext<ResearchEditorEnvironment | null>(null);
const ResearchNavigationContext = createContext<ResearchNavigationContextValue | null>(null);

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

export function ResearchNavigationProvider({
  value,
  children,
}: {
  value: ResearchNavigationContextValue;
  children: ReactNode;
}) {
  return (
    <ResearchNavigationContext.Provider value={value}>{children}</ResearchNavigationContext.Provider>
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

export function useResearchEditorEnvironmentOptional(): ResearchEditorEnvironment | null {
  return useContext(ResearchEditorContext);
}

export function useResearchNavigationContext(): ResearchNavigationContextValue {
  const ctx = useContext(ResearchNavigationContext);
  if (!ctx) {
    throw new Error(
      'useResearchNavigationContext must be used inside <ResearchNavigationProvider>',
    );
  }
  return ctx;
}

export interface PendingConversation {
  promptHtml: string;
}

const PendingConversationsContext = createContext<ReadonlyMap<string, PendingConversation>>(new Map<string, PendingConversation>());

export function PendingConversationsProvider({
  value,
  children,
}: {
  value: ReadonlyMap<string, PendingConversation>;
  children: ReactNode;
}) {
  return (
    <PendingConversationsContext.Provider value={value}>{children}</PendingConversationsContext.Provider>
  );
}

export function usePendingConversation(conversationId: string): PendingConversation | null {
  return useContext(PendingConversationsContext).get(conversationId) ?? null;
}
