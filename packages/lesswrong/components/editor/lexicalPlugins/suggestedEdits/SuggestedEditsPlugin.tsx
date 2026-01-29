"use client";

import React, { useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND } from 'lexical';
import type { SuggestionThreadController, SuggestionThreadInfo } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController';
import { EditorUserMode } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { TOGGLE_SUGGESTION_MODE_COMMAND } from './Commands';
import { SuggestionModePlugin } from './SuggestionModePlugin';
import { useCommentStoreContext } from '@/components/lexical/commenting/CommentStoreContext';
import { createComment, createThread, type Thread } from '@/components/lexical/commenting';

const getSuggestionThreadInfo = (thread: Thread): SuggestionThreadInfo => ({
  id: thread.id,
  markID: thread.markID ?? thread.id,
});

const createSuggestionSummaryComment = (summary: string): ReturnType<typeof createComment> => {
  return createComment(summary, 'System', undefined, undefined, false, 'suggestionSummary');
};

export default function SuggestedEditsPlugin({
  isSuggestionMode,
  onUserModeChange,
}: {
  isSuggestionMode: boolean;
  onUserModeChange: (mode: EditorUserMode) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const { commentStore } = useCommentStoreContext();

  const controller = useMemo<SuggestionThreadController>(() => {
    return {
      getAllThreads: async () => {
        return commentStore
          .getThreadsByType('suggestion')
          .map(getSuggestionThreadInfo);
      },
      createSuggestionThread: async (suggestionID, commentContent, _suggestionType) => {
        const existing = commentStore.getThreadByMarkID(suggestionID);
        if (existing) {
          return getSuggestionThreadInfo(existing);
        }
        const summaryComment = createSuggestionSummaryComment(commentContent);
        const thread = createThread('', [summaryComment], undefined, {
          markID: suggestionID,
          status: 'open',
          threadType: 'suggestion',
        });
        commentStore.addComment(thread);
        return getSuggestionThreadInfo(thread);
      },
      reopenSuggestion: async (threadId) => {
        commentStore.updateThreadStatus(threadId, 'open');
        return true;
      },
      rejectSuggestion: async (threadId) => {
        commentStore.updateThreadStatus(threadId, 'rejected');
        return true;
      },
    };
  }, [commentStore]);

  React.useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const isToggleShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's';
        if (!isToggleShortcut) {
          return false;
        }
        event.preventDefault();
        editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, undefined);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  React.useEffect(() => {
    // ContentEditable handles DOM event interception for suggestion mode.
    return undefined;
  }, []);

  return (
    <SuggestionModePlugin
      isSuggestionMode={isSuggestionMode}
      controller={controller}
      onUserModeChange={onUserModeChange}
    />
  );
}
