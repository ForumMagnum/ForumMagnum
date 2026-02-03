"use client";

import React, { useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND } from 'lexical';
import type { SuggestionThreadController, SuggestionThreadInfo } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController';
import { type EditorUserModeType } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { TOGGLE_SUGGESTION_MODE_COMMAND } from './Commands';
import { SuggestionModePlugin } from './SuggestionModePlugin';
import { useCommentStoreContext } from '@/components/lexical/commenting/CommentStoreContext';
import { createComment, createThread, type Thread, type Comment, useCollabAuthorName } from '@/components/lexical/commenting';

const SUGGESTION_SUMMARY_KIND: Thread['comments'][number]['commentKind'] = 'suggestionSummary';

const hasChildComments = (thread: Thread): boolean => thread.comments.some((comment) => comment.commentKind !== SUGGESTION_SUMMARY_KIND);

const getSuggestionThreadInfo = (thread: Thread): SuggestionThreadInfo => ({
  id: thread.id,
  markID: thread.markID ?? thread.id,
  status: thread.status,
  hasChildComments: hasChildComments(thread),
});

const createSuggestionSummaryComment = (summary: string, author: string): Comment => {
  return createComment(summary, author, undefined, undefined, false, 'suggestionSummary');
};

export default function SuggestedEditsPlugin({
  isSuggestionMode,
  onUserModeChange,
}: {
  isSuggestionMode: boolean;
  onUserModeChange: (mode: EditorUserModeType) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const { commentStore } = useCommentStoreContext();
  const author = useCollabAuthorName();

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
        const summaryComment = createSuggestionSummaryComment(commentContent, author);
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
      setThreadStatus: async (threadId, status) => {
        commentStore.updateThreadStatus(threadId, status);
        return true;
      },
      deleteSuggestionThread: async (threadId) => {
        const thread = commentStore.getComments().find(
          (comment): comment is Thread => comment.type === 'thread' && comment.id === threadId,
        );
        if (!thread) {
          return false;
        }
        commentStore.deleteCommentOrThread(thread);
        return true;
      },
      updateSuggestionSummary: async (suggestionID, summaryContent) => {
        const thread = commentStore.getThreadByMarkID(suggestionID);
        if (!thread) {
          return false;
        }
        const firstComment = thread.comments[0];
        if (firstComment && firstComment.content === summaryContent) {
          return true;
        }
        commentStore.updateThread(thread.id, { firstCommentContent: summaryContent });
        return true;
      },
    };
  }, [commentStore, author]);

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
