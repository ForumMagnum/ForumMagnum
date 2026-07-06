'use client';

import React from 'react';
import { QueryInputPlugin } from './QueryInputPlugin';
import { ConversationComposerPlugin } from './ConversationComposerPlugin';
import { MentionTypeaheadPlugin } from './MentionTypeaheadPlugin';
import { WorkspaceIntentPlugin } from './WorkspaceIntentPlugin';

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
      <QueryInputPlugin />
      <ConversationComposerPlugin />
      <MentionTypeaheadPlugin projectId={projectId} />
      <WorkspaceIntentPlugin />
    </>
  );
}
