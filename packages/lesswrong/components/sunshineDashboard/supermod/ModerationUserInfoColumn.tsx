'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationUserIdentityColumn from './ModerationUserIdentityColumn';
import ModerationUserStatsColumn from './ModerationUserStatsColumn';
import ModerationUserBioColumn from './ModerationUserBioColumn';
import ModeratorNotes from './ModeratorNotes';
import { getPrimaryDisplayedModeratorAction, partitionModeratorActions } from './groupings';
import UserAutoRateLimitsDisplay from '../ModeratorUserInfo/UserAutoRateLimitsDisplay';

const styles = defineStyles('ModerationUserInfoColumn', (theme: ThemeType) => ({
  header: {
    padding: '12px 14px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flexGrow: 1,
    // Allow the bio section to shrink-and-scroll instead of stretching the
    // whole column past the viewport when the bio is long. If the sections
    // above the bio are themselves too tall to fit, scroll the whole header
    // rather than bleeding over the undo queue below it.
    minHeight: 0,
    overflow: 'auto',
    ...theme.typography.commentStyle,
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
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
      <UserAutoRateLimitsDisplay user={user} showKarmaMeta={true} />
      <ModerationUserBioColumn user={user} />
    </div>
  );
};

export default ModerationUserInfoColumn;
