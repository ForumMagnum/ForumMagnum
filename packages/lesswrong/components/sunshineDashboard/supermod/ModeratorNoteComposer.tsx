'use client';

import React, { useState, useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { hideScrollBars } from '@/themes/styleUtils';
import { blurEditorOnEscape } from '@/components/editor/focusLexicalEditor';
import ComposerSubmitButton from './ComposerSubmitButton';
import type { InboxAction } from './inboxReducer';
import { getOptimisticNotes, useAddModeratorNote } from '../useAddModeratorNote';

const styles = defineStyles('ModeratorNoteComposer', (theme: ThemeType) => ({
  composer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
    backgroundColor: theme.palette.background.paper,
    '& textarea:not([aria-hidden])': {
      maxHeight: 150,
      ...hideScrollBars,
    },
  },
  input: {
    flex: 1,
    minWidth: 0,
  },
  submitButton: {
    flexShrink: 0,
  },
}));

const ModeratorNoteComposer = ({
  user,
  currentUser,
  dispatch,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const [draft, setDraft] = useState('');

  const addModeratorNote = useAddModeratorNote();

  const addNote = useCallback(() => {
    const noteText = draft.trim();
    if (!noteText) return;

    setDraft('');
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: getOptimisticNotes(user.sunshineNotes, currentUser.displayName, noteText) } });
    void addModeratorNote(user._id, noteText).then((updatedUser) => {
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: updatedUser.sunshineNotes } });
      }
    });
  }, [draft, currentUser.displayName, user._id, user.sunshineNotes, dispatch, addModeratorNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // A bare Escape blurs the composer, rather than closing the whole detail view and losing the draft
    if (blurEditorOnEscape(e)) return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      addNote();
    }
  }, [addNote]);

  return (
    <div className={classes.composer} onKeyDown={handleKeyDown}>
      <Input
        className={classes.input}
        value={draft}
        fullWidth
        onChange={(e) => setDraft(e.target.value)}
        disableUnderline
        placeholder="Add a note for other moderators"
        multiline
      />
      <div className={classes.submitButton}>
        <ComposerSubmitButton label="Add note" disabled={!draft.trim()} onClick={addNote} />
      </div>
    </div>
  );
};

export default ModeratorNoteComposer;
