"use client";

import React, { useCallback, useEffect, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND } from 'lexical';
import type { SuggestionThreadController } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController';
import { EditorUserMode, type EditorUserModeType } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { SET_USER_MODE_COMMAND } from './Commands';
import { SuggestionModePlugin } from './SuggestionModePlugin';
import { useCommentStoreContext } from '@/components/lexical/commenting/CommentStoreContext';
import { useCollaboratorIdentity } from '@/components/lexical/collaboration';
import { accessLevelCan } from '@/lib/collections/posts/collabEditingPermissions';
import { createSuggestionThreadController } from '@/components/editor/lexicalPlugins/suggestions/createSuggestionThreadController';

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
    return createSuggestionThreadController({ commentStore, authorId, authorName });
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
