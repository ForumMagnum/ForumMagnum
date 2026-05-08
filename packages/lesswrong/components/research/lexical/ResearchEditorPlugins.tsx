'use client';

import React from 'react';
import { ResearchAnchorProvider } from './ResearchAnchorContext';
import { ResearchAnchorPlugin } from './ResearchAnchorPlugin';
import { AgentBlockPlugin } from './AgentBlockPlugin';
import { ResearchSelectionToolbarPlugin } from './ResearchSelectionToolbarPlugin';
import { ResearchSlashMenuPlugin } from './ResearchSlashMenuPlugin';
import { QueryCommandPlugin } from './QueryCommandPlugin';

/**
 * One-stop bundle of every Lexical extension this team owns. Mount inside a
 * `<LexicalComposer>` (after the standard plugins). Order matters loosely:
 * - `ResearchAnchorProvider` must wrap any consumer of the anchor map.
 * - `ResearchEditorProvider` must wrap the whole editor so decorator nodes can
 *   read `useResearchEditorEnvironment`.
 *
 * Example:
 *   <ResearchEditorProvider environment={{ documentId, fireDocumentQuery }}>
 *     <LexicalEditor ...>
 *       <ResearchEditorPlugins />
 *     </LexicalEditor>
 *   </ResearchEditorProvider>
 */
export function ResearchEditorPlugins() {
  return (
    <ResearchAnchorProvider>
      <ResearchAnchorPlugin />
      <AgentBlockPlugin />
      <ResearchSelectionToolbarPlugin />
      <ResearchSlashMenuPlugin />
      <QueryCommandPlugin />
    </ResearchAnchorProvider>
  );
}
