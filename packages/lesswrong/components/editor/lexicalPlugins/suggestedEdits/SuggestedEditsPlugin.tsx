"use client";

import React, { useCallback, useEffect, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND } from 'lexical';
import type { SuggestionThreadController, SuggestionThreadInfo } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController';
import { EditorUserMode, type EditorUserModeType } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { SET_USER_MODE_COMMAND } from './Commands';
import { SuggestionModePlugin } from './SuggestionModePlugin';
import { useCommentStoreContext } from '@/components/lexical/commenting/CommentStoreContext';
import { createComment, createThread, type Thread, type Comment } from '@/components/lexical/commenting';
import { useCollaboratorIdentity } from '@/components/lexical/collaboration';
import { accessLevelCan } from '@/lib/collections/posts/collabEditingPermissions';
import { hasChildComments } from './Utils';

const getSuggestionThreadInfo = (thread: Thread): SuggestionThreadInfo => ({
  id: thread.id,
  markID: thread.markID ?? thread.id,
  status: thread.status,
  hasChildComments: hasChildComments(thread),
});

const createSuggestionSummaryComment = (summary: string, author: string, authorId: string): Comment => {
  return createComment(summary, author, authorId, undefined, undefined, false, 'suggestionSummary');
};

export default function SuggestedEditsPlugin({
  isSuggestionMode,
  userMode,
  onUserModeChange,
}: {
  isSuggestionMode: boolean;
  userMode: EditorUserModeType;
  onUserModeChange: (mode: EditorUserModeType) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const { commentStore } = useCommentStoreContext();
  const { id: authorId, name: authorName, accessLevel } = useCollaboratorIdentity();

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
        const summaryComment = createSuggestionSummaryComment(commentContent, authorName, authorId);
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
  }, [authorId, authorName, commentStore]);

  // Compute the toggle target for the keyboard shortcut (Ctrl/Cmd+Shift+S).
  // - Users with edit access: toggle between Editing and Suggesting
  // - Users with comment-only access: toggle between Viewing and Suggesting
  const getToggleTarget = useCallback((): EditorUserModeType => {
    const hasEditAccess = accessLevelCan(accessLevel, "edit");
    if (hasEditAccess) {
      return userMode === EditorUserMode.Suggest
        ? EditorUserMode.Edit
        : EditorUserMode.Suggest;
    }
    return userMode === EditorUserMode.Suggest
      ? EditorUserMode.View
      : EditorUserMode.Suggest;
  }, [accessLevel, userMode]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const isToggleShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's';
        if (!isToggleShortcut) {
          return false;
        }
        event.preventDefault();
        editor.dispatchCommand(SET_USER_MODE_COMMAND, getToggleTarget());
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, getToggleTarget]);

  return (
    <SuggestionModePlugin
      isSuggestionMode={isSuggestionMode}
      controller={controller}
      onUserModeChange={onUserModeChange}
    />
  );
}
