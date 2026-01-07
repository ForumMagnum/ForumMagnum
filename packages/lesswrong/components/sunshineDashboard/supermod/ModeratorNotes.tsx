'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { getSignature } from '@/lib/collections/users/helpers';

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
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
    overflow: 'auto',
    backgroundColor: theme.palette.background.paper,
  },
}));

const ModeratorNotes = ({
  user,
  currentUser,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const [notes, setNotes] = useState(user.sunshineNotes);

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  useEffect(() => {
    if (user.sunshineNotes) {
      setNotes(user.sunshineNotes);
    }
  }, [user._id, user.sunshineNotes]);

  const handleNotes = useCallback(() => {
    if (notes !== user.sunshineNotes) {
      void updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineNotes: notes,
          },
        },
      });
    }
  }, [user._id, user.sunshineNotes, notes, updateUser]);

  const modNoteSignature = useMemo(() => getSignature(currentUser.displayName), [currentUser.displayName]);

  const signAndDate = useCallback((sunshineNotes: string) => {
    if (!sunshineNotes.match(modNoteSignature)) {
      const padding = !sunshineNotes ? ": " : ": \n\n"
      return modNoteSignature + padding + sunshineNotes
    }
    return sunshineNotes
  }, [modNoteSignature]);

  const addSignature = useCallback(() => {
    const signedNotes = signAndDate(notes ?? '');
    if (signedNotes !== notes) {
      setNotes(signedNotes);
    }
  }, [notes, signAndDate]);

  useEffect(() => {
    return () => {
      handleNotes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.sectionTitle}>Moderator Notes</div>
      <div className={classes.notes}>
        <Input
          value={notes ?? ''}
          fullWidth
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotes}
          onClick={addSignature}
          disableUnderline
          placeholder="Notes for other moderators"
          multiline
          rows={4}
        />
      </div>
    </div>
  );
};

export default ModeratorNotes;
