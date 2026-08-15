import React, { useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModerationActionButtons from './ModerationActionButtons';
import ModerationSectionTitle from './ModerationSectionTitle';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import ForumIcon from '@/components/common/ForumIcon';
import { useLocalStorageState } from '@/components/hooks/useLocalStorageState';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { getHighlightedModeratorActions, type HighlightableModeratorAction } from './actionHighlightRules';
import type { ModeratorActionHighlightLevel } from '@/lib/moderatorHighlights/highlightRuleTypes';
import { useHighlightRuleOverrides } from './useHighlightRuleOverrides';
import type { InboxAction } from './inboxReducer';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';

const styles = defineStyles('SupermodModeratorActions', (theme: ThemeType) => ({
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseChevron: {
    fontSize: 16,
    color: theme.palette.grey[600],
    cursor: 'pointer',
  },
  highlightedActionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
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

const SupermodModeratorActions = ({user, currentUser, posts, comments, contentsLoading, addToUndoQueue, dispatch}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[],
  contentsLoading: boolean,
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void,
  dispatch: React.ActionDispatch<[action: InboxAction]>,
}) => {
  const classes = useStyles(styles);
  const activeModeratorActions = user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)) ?? [];
  const [showRateLimitForm, setShowRateLimitForm] = useState(false);

  const { moderatorActionsCollapsed, setModeratorActionsCollapsed } = useLocalStorageState(
    'moderatorActionsCollapsed',
    (key) => `supermod_${key}`,
    'true'
  );
  const isCollapsed = moderatorActionsCollapsed === 'true';

  // While the user's contents are still loading, the empty posts/comments lists would
  // spuriously satisfy the absence-based rules (e.g. Remove, Purge), so highlight nothing.
  const { overrides: ruleOverrides } = useHighlightRuleOverrides();
  const highlightedActions = useMemo(() => contentsLoading
    ? new Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>()
    : getHighlightedModeratorActions({
      user,
      moderatorActions: user.moderatorActions ?? [],
      posts,
      comments,
      ruleOverrides,
    }), [user, posts, comments, contentsLoading, ruleOverrides]);

  return (
    <div>
      <div className={classes.sectionTitleRow}>
        <ModerationSectionTitle>Moderator Actions</ModerationSectionTitle>
        <ForumIcon
          icon={isCollapsed ? "ThickChevronRight" : "ThickChevronDown"}
          className={classes.collapseChevron}
          onClick={() => setModeratorActionsCollapsed(isCollapsed ? 'false' : 'true')}
        />
      </div>
      {isCollapsed && highlightedActions.size > 0 && (
        <div className={classes.highlightedActionsRow}>
          <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlighted />
          <ModerationPermissionButtons user={user} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlighted />
        </div>
      )}
      {!isCollapsed && <>
        <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} highlightedActions={highlightedActions} />
        <div className={classes.rateLimitSection}>
          <ModerationPermissionButtons user={user} dispatch={dispatch} highlightedActions={highlightedActions} />
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
          <UserRateLimitItem userId={user._id} showForm={showRateLimitForm} />
        </div>
      </>}
    </div>
  );
}

export default SupermodModeratorActions;
