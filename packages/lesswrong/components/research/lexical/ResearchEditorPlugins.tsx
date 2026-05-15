'use client';

import React from 'react';
import { AgentBlockPlugin } from './AgentBlockPlugin';
import { QueryCommandPlugin } from './QueryCommandPlugin';
import { MentionTypeaheadPlugin } from './MentionTypeaheadPlugin';

interface ResearchEditorPluginsProps {
  projectId: string;
}

/**
 * `ResearchEditorProvider` must wrap the whole editor — the decorator nodes
 * mounted by these plugins read `useResearchEditorEnvironment` at render time.
 */
export function ResearchEditorPlugins({ projectId }: ResearchEditorPluginsProps) {
  return (
    <>
      <AgentBlockPlugin />
      <QueryCommandPlugin />
      <MentionTypeaheadPlugin projectId={projectId} />
    </>
  );
}
