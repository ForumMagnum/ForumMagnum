'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationUserIdentityColumn from './ModerationUserIdentityColumn';
import ModerationUserStatsColumn from './ModerationUserStatsColumn';
import ModerationUserBioColumn from './ModerationUserBioColumn';
import ModeratorNotes from './ModeratorNotes';
import { getPrimaryDisplayedModeratorAction, partitionModeratorActions } from './groupings';

const styles = defineStyles('ModerationUserInfoColumn', (theme: ThemeType) => ({
  header: {
    padding: '12px 14px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    flexGrow: 1,
    ...theme.typography.commentStyle,
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  modActionsRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  modActionItem: {},
  rateLimitSection: {},
}));

const ModerationUserInfoColumn = ({
  user,
  posts,
  comments,
  currentUser,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const { fresh: freshModeratorActions } = partitionModeratorActions(user);
  const likelyReviewTrigger = [...new Set(freshModeratorActions.map(action => getPrimaryDisplayedModeratorAction(action.type)))].reverse().at(0);

  return (
    <div className={classes.header}>
      <ModerationUserIdentityColumn user={user} likelyReviewTrigger={likelyReviewTrigger} />
      <ModeratorNotes user={user} currentUser={currentUser} />

      <ModerationUserStatsColumn user={user} posts={posts} comments={comments} />
      <ModerationUserBioColumn user={user} />
    </div>
  );
};

export default ModerationUserInfoColumn;
