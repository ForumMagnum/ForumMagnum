import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModerationActionButtons from './ModerationActionButtons';
import CollapsibleSectionHeader from './CollapsibleSectionHeader';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { isAnyContentPermissionDisabled } from './helpers';
import type { InboxAction } from './inboxReducer';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';
import ModerationSidebarSection from './ModerationSidebarSection';

const styles = defineStyles('SupermodModeratorActions', (theme: ThemeType) => ({
  collapsedPermissions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingLeft: 4,
  },
  modActionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
    '&:empty': {
      display: 'none',
    },
  },
  modActionItem: {},
  rateLimitSection: {
    display: 'flex',
    flexDirection: 'column',
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

const SupermodModeratorActions = ({user, currentUser, expanded, showCollapsedActions, onToggle, addToUndoQueue, dispatch}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  expanded: boolean,
  // False while another section is expanded
  showCollapsedActions: boolean,
  onToggle: () => void,
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void,
  dispatch: React.ActionDispatch<[action: InboxAction]>,
}) => {
  const classes = useStyles(styles);
  const activeModeratorActions = user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)) ?? [];
  const [showRateLimitForm, setShowRateLimitForm] = useState(false);

  return (
    <ModerationSidebarSection
      fillsAvailableSpace={expanded}
      sharesAvailableSpace
      withDivider={false}
      header={<CollapsibleSectionHeader
        title="Moderator Actions"
        expanded={expanded}
        minimal
        onToggle={onToggle}
      />}
    >
      {(expanded || showCollapsedActions) && <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} />}
      {!expanded && showCollapsedActions && isAnyContentPermissionDisabled(user) && (
        <div className={classes.collapsedPermissions}>
          <ModerationPermissionButtons user={user} dispatch={dispatch} collapsed />
        </div>
      )}
      {expanded && <>
        <div className={classes.rateLimitSection}>
          <ModerationPermissionButtons user={user} dispatch={dispatch} />
          <div
            className={classes.rateLimitButton}
            onClick={() => setShowRateLimitForm(!showRateLimitForm)}
          >
            Limits
          </div>
        </div>
        <div className={classes.modActionsColumn}>
          {activeModeratorActions.map(action => (
            <div key={action._id} className={classes.modActionItem}>
              <ModeratorActionItem user={user} moderatorAction={action} comments={[]} posts={[]} />
            </div>
          ))}
        </div>
        {/* 
          TODO: rework rate limits into a nicer UI and/or get rid of them completely
        since we don't use them a ton. 

          For now, we're only showing the options for it when we've toggled the button here.
          (but, still rendering the list of existing rate limits whether you've expanded it or not)
        */}
        <div className={classNames({ [classes.rateLimitForm]: showRateLimitForm })}>
          <UserRateLimitItem
            userId={user._id}
            showForm={showRateLimitForm}
            showCustomForm
            onCustomFormClose={() => setShowRateLimitForm(false)}
          />
        </div>
      </>}
    </ModerationSidebarSection>
  );
}

export default SupermodModeratorActions;
