import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import type { InboxAction } from './inboxReducer';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';

const styles = defineStyles('SupermodModeratorActions', (theme: ThemeType) => ({
  modActionsRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modActionItem: {},
  rateLimitSection: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  rateLimitButton: {
    border: theme.palette.border.slightlyFaint,
    borderRadius: 3,
    padding: '4px 8px',
    minHeight: 'unset',
    lineHeight: 'inherit',
    cursor: 'pointer',
  },
  rateLimitForm: {
    padding: 10
  }
}));

const SupermodModeratorActions = ({user, dispatch}: {user: SunshineUsersList, dispatch: React.ActionDispatch<[action: InboxAction]>}) => {
  const classes = useStyles(styles);
  const activeModeratorActions = user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)) ?? [];
  const [showRateLimitForm, setShowRateLimitForm] = useState(false);

  return (
    <div>
      <div className={classes.modActionsRow}>
          {activeModeratorActions.map(action => (
            <div key={action._id} className={classes.modActionItem}>
              <ModeratorActionItem user={user} moderatorAction={action} comments={[]} posts={[]} />
            </div>
          ))}
        </div>
      <div className={classes.rateLimitSection}>
        <ModerationPermissionButtons user={user} dispatch={dispatch} />
        <div
          className={classes.rateLimitButton}
          onClick={() => setShowRateLimitForm(!showRateLimitForm)}
        >
          Limits
        </div>
      </div>
      {/* 
        TODO: rework rate limits into a nicer UI and/or get rid of them completely
      since we don't use them a ton. 

        For now, we're only showing the options for it when we've toggled the button here.
        (but, still rendering the list of existing rate limits whether you've expanded it or not)
      */}
      <div className={classNames({ [classes.rateLimitForm]: showRateLimitForm })}>
        <UserRateLimitItem userId={user._id} showForm={showRateLimitForm} />
      </div>
    </div>
  );
}

export default SupermodModeratorActions;
