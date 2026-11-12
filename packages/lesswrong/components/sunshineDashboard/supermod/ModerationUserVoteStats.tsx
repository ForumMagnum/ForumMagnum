'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import ForumIcon from '@/components/common/ForumIcon';
import LWTooltip from '@/components/common/LWTooltip';

const sharedVoteStyles = {
  marginLeft: 4,
  marginRight: 4,
  borderRadius: "50%",
};

const styles = defineStyles('ModerationUserVoteStats', (theme: ThemeType) => ({
  contentCounts: {
    color: theme.palette.grey[600],
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
    fontSize: 12,
  },
  contentCountItem: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  deemphasizedContentCountItem: {
    opacity: 0.5,
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2
  },
  votesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
  },
  deemphasizedVotesRow: {
    opacity: 0.3,
  },
  votesLabel: {
    color: theme.palette.grey[600],
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    ...sharedVoteStyles,
    fontWeight: 600,
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    ...sharedVoteStyles,
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    ...sharedVoteStyles,
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    ...sharedVoteStyles,
    fontWeight: 600,
  },
}));

export const ModerationUserContactCounts = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.contentCounts}>
      <LWTooltip title="Users messaged before review">
        <span className={classNames(classes.contentCountItem, !user.usersContactedBeforeReview?.length && classes.deemphasizedContentCountItem)}>
          <ForumIcon icon="Email" className={classes.icon} />
          {user.usersContactedBeforeReview?.length ?? 0}
        </span>
      </LWTooltip>
      <LWTooltip title="Rejected posts and comments">
        <span className={classNames(classes.contentCountItem, !user.rejectedContentCount && classes.deemphasizedContentCountItem)}>
          <ForumIcon icon="NotInterested" className={classes.icon} />
          {user.rejectedContentCount}
        </span>
      </LWTooltip>
    </div>
  );
};

export const ModerationUserVotesCast = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);
  return (
    <LWTooltip title="Votes cast: strong upvotes, upvotes, downvotes, strong downvotes">
      <div className={classNames(classes.votesRow, !user.bigUpvoteCount && !user.smallUpvoteCount && !user.smallDownvoteCount && !user.bigDownvoteCount && classes.deemphasizedVotesRow)}>
        <span className={classes.votesLabel}>Votes cast</span>
        <span className={classes.bigUpvotes}>
          {user.bigUpvoteCount ?? 0}
        </span>
        <span className={classes.upvotes}>
          {user.smallUpvoteCount ?? 0}
        </span>
        <span className={classes.downvotes}>
          {user.smallDownvoteCount ?? 0}
        </span>
        <span className={classes.bigDownvotes}>
          {user.bigDownvoteCount ?? 0}
        </span>
      </div>
    </LWTooltip>
  );
};
