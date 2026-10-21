'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationUserIdentityColumn from './ModerationUserIdentityColumn';
import ModerationActivityFeed from './ModerationActivityFeed';
import ModerationActiveRateLimits from './ModerationActiveRateLimits';
import { getPrimaryDisplayedModeratorAction, partitionModeratorActions } from './groupings';
import type { InboxAction } from './inboxReducer';
import ModerationKarmaSummary from './ModerationKarmaSummary';
import type { ModerationContentItem } from './helpers';

const styles = defineStyles('ModerationUserInfoColumn', (theme: ThemeType) => ({
  header: {
    padding: '12px 7px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flexGrow: 1,
    // Let a long bio shrink; scroll the header if the rest overflows
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
  items,
  currentUser,
  dispatch,
}: {
  user: SunshineUsersList;
  items: ModerationContentItem[];
  currentUser: UsersCurrent;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const { fresh: freshModeratorActions } = partitionModeratorActions(user);
  const likelyReviewTrigger = [...new Set(freshModeratorActions.map(action => getPrimaryDisplayedModeratorAction(action.type)))].reverse().at(0);

  return (
    <div className={classes.header}>
      <ModerationUserIdentityColumn user={user} likelyReviewTrigger={likelyReviewTrigger} />
      <ModerationKarmaSummary user={user} items={items} />
      <ModerationActiveRateLimits user={user} />
      <ModerationActivityFeed key={user._id} user={user} currentUser={currentUser} dispatch={dispatch} />
    </div>
  );
};

export default ModerationUserInfoColumn;
