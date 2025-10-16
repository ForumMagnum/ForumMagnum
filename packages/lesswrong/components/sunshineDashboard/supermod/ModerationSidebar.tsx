import React, { useState, useEffect, useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import moment from 'moment';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { getNewSnoozeUntilContentCount } from '../ModeratorActions';
import UserAutoRateLimitsDisplay from '../ModeratorUserInfo/UserAutoRateLimitsDisplay';
import ContentSummaryRows from '../ModeratorUserInfo/ContentSummaryRows';
import { usePublishedPosts } from '@/components/hooks/usePublishedPosts';
import { useQuery } from '@/lib/crud/useQuery';
import { CONTENT_LIMIT } from '../UsersReviewInfoCard';
import { useDialog } from '@/components/common/withDialog';
import SnoozeAmountModal from './SnoozeAmountModal';
import RestrictAndNotifyModal from './RestrictAndNotifyModal';
import SunshineUserMessages from '../SunshineUserMessages';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModerationSidebar($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentModerationSidebarQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
  },
  empty: {
    color: theme.palette.grey[600],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 12,
    letterSpacing: '0.5px',
  },
  actionButton: {
    width: '100%',
    padding: '10px 16px',
    marginBottom: 8,
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
    '&:active': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  primaryAction: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
    },
  },
  dangerAction: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.light,
    '&:hover': {
      backgroundColor: theme.palette.error.light + '20',
      borderColor: theme.palette.error.main,
    },
  },
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
  },
  keystrokeHint: {
    float: 'right',
    fontSize: 11,
    color: theme.palette.grey[500],
    fontWeight: 400,
  },
}));

const ModerationSidebar = ({
  user,
  currentUser,
  onActionComplete,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  onActionComplete: () => void;
}) => {
  const classes = useStyles(styles);
  const [notes, setNotes] = useState(user.sunshineNotes);
  const { openDialog } = useDialog();

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  useEffect(() => {
    if (user.sunshineNotes) {
      setNotes(user.sunshineNotes);
    }
  }, [user._id, user.sunshineNotes]);

  const { posts = [] } = usePublishedPosts(user?._id, CONTENT_LIMIT);

  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId: user?._id ?? '' } },
      limit: CONTENT_LIMIT,
      enableTotal: false,
    },
    skip: !user,
  });

  const comments = data?.comments?.results ?? [];

  const handleNotes = useCallback(() => {
    if (notes !== user.sunshineNotes) {
      console.log({ notes, userSunshineNotes: user.sunshineNotes });
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

  useEffect(() => {
    return () => {
      handleNotes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getModSignatureWithNote = (note: string) => getSignatureWithNote(currentUser.displayName, note);

  const handleAction = async (actionFn: () => Promise<void>) => {
    await actionFn();
    onActionComplete();
  };

  const handleReview = () => {
    if (!user) return;
    const newNotes = getModSignatureWithNote('Approved') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser._id,
            reviewedAt: new Date(),
            needsReview: false,
            sunshineNotes: newNotes,
            snoozedUntilContentCount: null,
          },
        },
      });
      setNotes(newNotes);
    });
  };

  const handleSnooze = (contentCount: number) => {
    if (!user) return;
    const newNotes = getModSignatureWithNote(`Snooze ${contentCount}`) + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            needsReview: false,
            reviewedAt: new Date(),
            reviewedByUserId: currentUser._id,
            sunshineNotes: newNotes,
            snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, contentCount),
          },
        },
      });
      setNotes(newNotes);
    });
  };

  const handleSnoozeCustom = () => {
    if (!user) return;
    openDialog({
      name: 'SnoozeAmountModal',
      contents: ({ onClose }) => (
        <SnoozeAmountModal
          onConfirm={(amount) => {
            handleSnooze(amount);
            onClose();
          }}
          onClose={onClose}
        />
      ),
    });
  };

  const handleRemoveNeedsReview = () => {
    if (!user) return;
    const newNotes = getModSignatureWithNote('removed from review queue without snooze/approval') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            needsReview: false,
            reviewedByUserId: null,
            reviewedAt: user.reviewedAt ? new Date() : null,
            sunshineNotes: newNotes,
          },
        },
      });
      setNotes(newNotes);
    });
  };

  const handleBan = () => {
    if (!user) return;
    const banMonths = 3;
    if (!confirm(`Ban this user for ${banMonths} months?`)) return;

    const newNotes = getModSignatureWithNote('Ban') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser._id,
            needsReview: false,
            reviewedAt: new Date(),
            banned: moment().add(banMonths, 'months').toDate(),
            sunshineNotes: newNotes,
          },
        },
      });
      setNotes(newNotes);
    });
  };

  const handleFlag = () => {
    if (!user) return;
    const flagStatus = user.sunshineFlagged ? 'Unflag' : 'Flag';
    const newNotes = getModSignatureWithNote(flagStatus) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          sunshineFlagged: !user.sunshineFlagged,
          sunshineNotes: newNotes,
        },
      },
    });
    setNotes(newNotes);
  };

  const handleDisablePosting = () => {
    if (!user) return;
    const abled = user.postingDisabled ? 'enabled' : 'disabled';
    const newNotes = getModSignatureWithNote(`publishing posts ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          postingDisabled: !user.postingDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
    setNotes(newNotes);
  };

  const handleDisableCommentingOnOthers = () => {
    if (!user) return;
    const abled = user.commentingOnOtherUsersDisabled ? 'enabled' : 'disabled';
    const newNotes = getModSignatureWithNote(`commenting on others' content ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          commentingOnOtherUsersDisabled: !user.commentingOnOtherUsersDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
    setNotes(newNotes);
  };

  const handleRestrictAndNotify = () => {
    if (!user) return;
    openDialog({
      name: 'RestrictAndNotifyModal',
      contents: ({ onClose }) => (
        <RestrictAndNotifyModal
          user={user}
          currentUser={currentUser}
          onComplete={() => {
            onActionComplete();
            onClose();
          }}
          onClose={onClose}
        />
      ),
    });
  };

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
        <UserAutoRateLimitsDisplay user={user} showKarmaMeta />
        <ContentSummaryRows user={user} posts={posts} comments={comments} loading={false} />
        <SunshineUserMessages user={user} currentUser={currentUser} />
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>Moderator Notes</div>
        <div className={classes.notes}>
          <Input
            value={notes ?? ''}
            fullWidth
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotes}
            disableUnderline
            placeholder="Notes for other moderators"
            multiline
            rows={8}
          />
        </div>
      </div>
    </div>
  );
};

export default ModerationSidebar;
