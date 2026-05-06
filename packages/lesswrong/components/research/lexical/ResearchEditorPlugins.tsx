'use client';

import React from 'react';
import { ResearchAnchorProvider } from './ResearchAnchorContext';
import { ResearchAnchorPlugin } from './ResearchAnchorPlugin';
import { AgentBlockPlugin } from './AgentBlockPlugin';
import { ResearchSelectionToolbarPlugin } from './ResearchSelectionToolbarPlugin';
import { ResearchSlashMenuPlugin } from './ResearchSlashMenuPlugin';
import { ResearchEditorProvider, type ResearchEditorEnvironment } from './ResearchEditorContext';

interface ResearchEditorPluginsProps {
  environment: ResearchEditorEnvironment;
}

/**
 * One-stop bundle of every Lexical extension this team owns. Mount inside a
 * `<LexicalComposer>` (after the standard plugins). Order matters loosely:
 * - `ResearchAnchorProvider` must wrap any consumer of the anchor map.
 * - `ResearchEditorProvider` must wrap consumers of `useResearchEditorEnvironment`.
 *
 * Example:
 *   <ResearchEditorPlugins environment={{ documentId, fireDocumentQuery }} />
 */
export function ResearchEditorPlugins({ environment }: ResearchEditorPluginsProps) {
  return (
    <ResearchEditorProvider environment={environment}>
      <ResearchAnchorProvider>
        <ResearchAnchorPlugin />
        <AgentBlockPlugin />
        <ResearchSelectionToolbarPlugin />
        <ResearchSlashMenuPlugin />
      </ResearchAnchorProvider>
    </ResearchEditorProvider>
  );
}
