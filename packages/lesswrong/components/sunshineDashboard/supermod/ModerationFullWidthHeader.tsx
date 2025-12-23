'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationUserIdentityColumn from './ModerationUserIdentityColumn';
import ModerationUserStatsColumn from './ModerationUserStatsColumn';
import ModerationUserBioColumn from './ModerationUserBioColumn';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModeratorNotes from './ModeratorNotes';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import UserRateLimitItem from '../UserRateLimitItem';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { getPrimaryDisplayedModeratorAction, partitionModeratorActions } from './groupings';
import type { InboxAction } from './inboxReducer';
import { useCurrentUser } from '@/components/common/withUser';

const styles = defineStyles('ModerationFullWidthHeader', (theme: ThemeType) => ({
  header: {
    padding: '12px 14px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    display: 'flex',
    flexDirection: 'column',
    gap: 60,
    flexShrink: 0,
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

const ModerationFullWidthHeader = ({
  user,
  posts,
  comments,
  dispatch,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  if (!currentUser) {
    return null;
  }
  const { fresh: freshModeratorActions } = partitionModeratorActions(user);
  const likelyReviewTrigger = [...new Set(freshModeratorActions.map(action => getPrimaryDisplayedModeratorAction(action.type)))].reverse().at(0);

  const activeModeratorActions = user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)) ?? [];

  return (
    <div className={classes.header}>
      <ModerationUserIdentityColumn user={user} likelyReviewTrigger={likelyReviewTrigger} />
      <ModerationUserStatsColumn user={user} posts={posts} comments={comments} />
      <ModerationPermissionButtons user={user} dispatch={dispatch} />
      <ModerationUserBioColumn user={user} />
      <ModeratorNotes user={user} currentUser={currentUser} />
      <div className={classes.modActionsRow}>
          {activeModeratorActions.map(action => (
            <div key={action._id} className={classes.modActionItem}>
              <ModeratorActionItem user={user} moderatorAction={action} comments={[]} posts={[]} />
            </div>
          ))}
          <div className={classes.rateLimitSection}>
            <UserRateLimitItem user={user} />
          </div>
        </div>
    </div>
  );
};

export default ModerationFullWidthHeader;
