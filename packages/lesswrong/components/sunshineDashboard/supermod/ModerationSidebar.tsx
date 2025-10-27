import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import UserAutoRateLimitsDisplay from '../ModeratorUserInfo/UserAutoRateLimitsDisplay';
import ContentSummary from './ContentSummary';
import SunshineUserMessages from '../SunshineUserMessages';
import { getSignature } from '@/lib/collections/users/helpers';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
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
    height: '100%',
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
  scrollableSection: {
    marginBottom: 12,
    flexShrink: 1,
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 12,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
    overflow: 'auto',
  },
  bioContainer: {
    maxHeight: 300,
    overflow: 'auto',
    fontSize: 14,
    lineHeight: 1.5,
  },
  contentSummary: {
    maxHeight: 150,
    overflow: 'auto',
  },
  rateLimits: {
    maxHeight: 150,
    overflow: 'auto',
  },
  userMessages: {
    overflow: 'auto',
  },
  noSectionContent: {
    opacity: 0.5,
  },
}));

const ModerationSidebar = ({
  user,
  currentUser,
  inDetailView,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  inDetailView: boolean;
}) => {
  const classes = useStyles(styles);
  const [notes, setNotes] = useState(user.sunshineNotes);

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  useEffect(() => {
    if (user.sunshineNotes) {
      setNotes(user.sunshineNotes);
    }
  }, [user._id, user.sunshineNotes]);

  const { posts, comments } = useModeratedUserContents(user._id);

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

  const showContentSummary = posts.length > 0 || comments.length > 0;
  const showUserAutoRateLimits = (
    (user.smallUpvoteReceivedCount ?? 0) +
    (user.bigUpvoteReceivedCount ?? 0) +
    (user.smallDownvoteReceivedCount ?? 0) +
    (user.bigDownvoteReceivedCount ?? 0)
  ) > 0;

  const showBio = user.htmlBio && user.htmlBio.trim() !== '';

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

      {!inDetailView && (
        <div className={classNames(classes.section, !showContentSummary && classes.noSectionContent)}>
          <div className={classes.sectionTitle}>Content Summary</div>
          <div className={classes.contentSummary}>
          <ContentSummary user={user} posts={posts} comments={comments} />
          </div>
        </div>
      )}

      {!inDetailView && <div className={classNames(classes.section, !showUserAutoRateLimits && classes.noSectionContent)}>
        <div className={classes.sectionTitle}>Automod Rate Limits</div>
        <div className={classes.rateLimits}>
          <UserAutoRateLimitsDisplay user={user} showKarmaMeta hideIfNoVotes={false} />
        </div>
      </div>}

      <div className={classes.section}>
        <div className={classes.sectionTitle}>User Messages</div>
        <div className={classes.userMessages}>
          {/* TODO: maybe "expand" should actually open a model with the contents, since expanding a conversation inline is kind of annoying with the "no overflow" thing */}
          <SunshineUserMessages key={user._id} user={user} currentUser={currentUser} />
        </div>
      </div>
      
      {!inDetailView && (
        <div className={classNames(classes.scrollableSection, !showBio && classes.noSectionContent)}>
          <div className={classes.sectionTitle}>Bio</div>
          <div className={classes.bioContainer} dangerouslySetInnerHTML={{ __html: user.htmlBio }} />
        </div>
      )}
    </div>
  );
};

export default ModerationSidebar;
