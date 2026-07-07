'use client';

import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { QueryInputPlugin } from './QueryInputPlugin';
import { ConversationComposerPlugin } from './ConversationComposerPlugin';
import { MentionTypeaheadPlugin } from './MentionTypeaheadPlugin';
import { WorkspaceIntentPlugin } from './WorkspaceIntentPlugin';

interface ResearchEditorPluginsProps {
  projectId: string;
  /**
   * Fired once when the editor has loaded its initial state — either it has
   * painted content, or the collaborative document has completed its first sync
   * (so a synced-but-empty document counts as ready too). Used by DocumentPane
   * to hold the previous document on screen until the incoming one is ready,
   * instead of flashing an empty editor on navigation.
   */
  onReady?: () => void;
}

/**
 * Reports editor readiness (see `onReady` above) by watching the editor state
 * directly, rather than scraping the rendered DOM: content via
 * `getTextContentSize`, and first collaboration sync via the `collaboration`
 * update tag (the same signal WorkspaceIntentPlugin uses for write-readiness).
 */
function DocumentReadyPlugin({ onReady }: { onReady: () => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      onReady();
    };
    // Already populated (e.g. bootstrapped from the persisted HTML snapshot)?
    if (editor.getEditorState().read(() => $getRoot().getTextContentSize() > 0)) {
      fire();
      return;
    }
    return editor.registerUpdateListener(({ editorState, tags }) => {
      const hasContent = editorState.read(() => $getRoot().getTextContentSize() > 0);
      if (hasContent || tags.has('collaboration')) fire();
    });
  }, [editor, onReady]);
  return null;
}

/**
 * `ResearchEditorProvider` must wrap the whole editor — the decorator nodes
 * mounted by these plugins read `useResearchEditorEnvironment` at render time.
 */
export function ResearchEditorPlugins({ projectId, onReady }: ResearchEditorPluginsProps) {
  return (
    <>
      <QueryInputPlugin />
      <ConversationComposerPlugin />
      <MentionTypeaheadPlugin projectId={projectId} />
      <WorkspaceIntentPlugin />
      {onReady && <DocumentReadyPlugin onReady={onReady} />}
    </>
  );
}
