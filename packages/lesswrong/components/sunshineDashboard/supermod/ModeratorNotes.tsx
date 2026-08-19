'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { hideScrollBars, prettyScrollbars } from '@/themes/styleUtils';
import { parseModeratorNotes, parseModeratorNoteTimestamp } from './parseModeratorNotes';
import { useCurrentTime } from '@/lib/utils/TimeProvider';
import FormatDate from '@/components/common/FormatDate';
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
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
  composerHint: {
    fontSize: 10,
    color: theme.palette.grey[500],
    textAlign: 'right',
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

const ModeratorNoteDate = ({ timestamp }: { timestamp: string | null }) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const date = useMemo(() => parseModeratorNoteTimestamp(timestamp, now), [timestamp, now]);

  // Entries with no recognizable date still need to occupy the column, to keep the grid aligned
  return <div className={classes.entryDate}>
    {date ? <FormatDate date={date} /> : timestamp}
  </div>;
};

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
  const [draft, setDraft] = useState('');

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  const entries = useMemo(() => parseModeratorNotes(user.sunshineNotes), [user.sunshineNotes]);

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
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      addNote();
    }
  }, [addNote]);

  return (
    <div className={classes.root}>
      <div className={classes.sectionTitle}>Moderator Notes</div>
      <div className={classes.composer}>
        <Input
          value={draft}
          fullWidth
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disableUnderline
          placeholder="Add a note for other moderators"
          multiline
        />
      </div>
      {!!draft.trim() && <div className={classes.composerHint}>⌘/ctrl + enter to save</div>}
      <div className={classes.entries}>
        {entries.map((entry, index) => (
          <React.Fragment key={index}>
            <div className={classes.entryBody}>{entry.body}</div>
            <div className={classes.entryAuthor}>{entry.author}</div>
            <ModeratorNoteDate timestamp={entry.timestamp} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ModeratorNotes;
