'use client';

import React from 'react';
import { AgentBlockPlugin } from './AgentBlockPlugin';
import { ResearchSlashMenuPlugin } from './ResearchSlashMenuPlugin';
import { QueryCommandPlugin } from './QueryCommandPlugin';

/**
 * One-stop bundle of every Lexical extension this team owns. Mount inside a
 * `<LexicalComposer>` (after the standard plugins). `ResearchEditorProvider`
 * must wrap the whole editor so decorator nodes can read
 * `useResearchEditorEnvironment`.
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
    <>
      <AgentBlockPlugin />
      <ResearchSlashMenuPlugin />
      <QueryCommandPlugin />
    </>
  );
}
