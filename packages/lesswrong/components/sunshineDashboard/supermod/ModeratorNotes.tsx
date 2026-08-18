'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { hideScrollBars, prettyScrollbars } from '@/themes/styleUtils';
import { parseModeratorNotes } from './parseModeratorNotes';
import { blurEditorOnEscape } from '@/components/editor/focusLexicalEditor';
import { useCurrentTime } from '@/lib/utils/TimeProvider';
import FormatDate from '@/components/common/FormatDate';
import ModerationSectionTitle from './ModerationSectionTitle';
import ComposerSubmitButton from './ComposerSubmitButton';
import type { InboxAction } from './inboxReducer';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModeratorNotes($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const styles = defineStyles('ModeratorNotes', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxWidth: 400,
    width: '100%',
  },
  composer: {
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
    backgroundColor: theme.palette.background.paper,
    '& textarea:not([aria-hidden])': {
      maxHeight: 150,
      ...hideScrollBars,
    },
  },
  submitButton: {
    alignSelf: 'flex-end',
  },
  entries: {
    display: 'grid',
    gridTemplateColumns: '1fr minmax(0, max-content) minmax(0, max-content)',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: 8,
    maxHeight: 300,
    overflowY: 'auto',
    ...prettyScrollbars(theme),
  },
  entryDate: {
    fontSize: 10,
    lineHeight: 1.4,
    color: theme.palette.grey[500],
    textAlign: 'right',
  },
  entryAuthor: {
    fontSize: 10,
    lineHeight: 1.4,
    color: theme.palette.grey[900],
    maxWidth: 80,
    textAlign: 'right',
  },
  entryBody: {
    fontSize: 13,
    lineHeight: 1.2,
    color: theme.palette.grey[800],
    whiteSpace: 'pre-wrap',
  },
}));

const ModeratorNotes = ({
  user,
  currentUser,
  dispatch,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const [draft, setDraft] = useState('');

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  const entries = useMemo(() => parseModeratorNotes(user.sunshineNotes, now), [user.sunshineNotes, now]);

  const addNote = useCallback(() => {
    const noteText = draft.trim();
    if (!noteText) return;

    const newNotes = getSignatureWithNote(currentUser.displayName, noteText) + (user.sunshineNotes ?? '');
    setDraft('');
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: newNotes } });
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: { sunshineNotes: newNotes },
      },
    });
  }, [draft, currentUser.displayName, user._id, user.sunshineNotes, dispatch, updateUser]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape blurs the composer instead of closing the detail view and losing the draft
    if (blurEditorOnEscape(e)) return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      addNote();
    }
  }, [addNote]);

  return (
    <div className={classes.root}>
      <ModerationSectionTitle>Moderator Notes</ModerationSectionTitle>
      <div className={classes.composer} onKeyDown={handleKeyDown}>
        <Input
          value={draft}
          fullWidth
          onChange={(e) => setDraft(e.target.value)}
          disableUnderline
          placeholder="Add a note for other moderators"
          multiline
        />
      </div>
      <div className={classes.submitButton}>
        <ComposerSubmitButton label="Add note" disabled={!draft.trim()} onClick={addNote} />
      </div>
      {entries.length > 0 && <div className={classes.entries}>
        {entries.map((entry, index) => (
          <React.Fragment key={index}>
            <div className={classes.entryBody}>{entry.body}</div>
            <div className={classes.entryAuthor}>{entry.author}</div>
            {/* Rendered even when empty, to keep the grid columns aligned */}
            <div className={classes.entryDate}>
              {entry.date ? <FormatDate date={entry.date} /> : entry.timestamp}
            </div>
          </React.Fragment>
        ))}
      </div>}
    </div>
  );
};

export default ModeratorNotes;
