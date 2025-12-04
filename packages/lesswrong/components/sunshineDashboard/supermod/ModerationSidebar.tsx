import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import SunshineUserMessages from '../SunshineUserMessages';
import { getSignature } from '@/lib/collections/users/helpers';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModerationSidebar($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  empty: {
    color: theme.palette.grey[600],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    marginBottom: 12,
    flexShrink: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 8,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  noBottomMargin: {
    marginBottom: 'unset',
  },
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
    overflow: 'auto',
  },
  userModActions: {
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  modActionItem: {},
  userMessages: {
    overflow: 'auto',
  },
}));

const ModerationSidebar = ({
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

  if (!user) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a user to review
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.section}>
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
            rows={6}
          />
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>Outstanding Moderator Actions</div>
        <div className={classes.userModActions}>
          {user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)).map(action => (
            <div key={action._id} className={classes.modActionItem}>
              <ModeratorActionItem user={user} moderatorAction={action} comments={[]} posts={[]} />
            </div>
          ))}
        </div>
      </div>

      <div className={classes.section}>
        <div className={classNames(classes.sectionTitle, classes.noBottomMargin)}>Rate Limits</div>
        <div className={classes.userModActions}>
          <UserRateLimitItem user={user} />
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>User Messages</div>
        <div className={classes.userMessages}>
          {/* TODO: maybe "expand" should actually open a model with the contents, since expanding a conversation inline is kind of annoying with the "no overflow" thing */}
          <SunshineUserMessages key={user._id} user={user} currentUser={currentUser} showExpandablePreview />
        </div>
      </div>
    </div>
  );
};

export default ModerationSidebar;
