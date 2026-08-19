import React, { useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModerationActionButtons from './ModerationActionButtons';
import ModerationSectionTitle from './ModerationSectionTitle';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import ForumIcon from '@/components/common/ForumIcon';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { getHighlightedModeratorActions, type HighlightableModeratorAction } from './actionHighlightRules';
import type { ModeratorActionHighlightLevel } from '@/lib/moderatorHighlights/highlightRuleTypes';
import { useHighlightRuleOverrides } from './useHighlightRuleOverrides';
import type { InboxAction } from './inboxReducer';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';
import ModerationSidebarSection from './ModerationSidebarSection';

const styles = defineStyles('SupermodModeratorActions', (theme: ThemeType) => ({
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseChevron: {
    fontSize: 16,
    color: theme.palette.grey[600],
  },
  collapseButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    background: 'none',
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  highlightedActionsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  // Equal-width columns, so the right-hand column starts at the same x whatever
  // the longest label in the left-hand one happens to be for this user
  highlightedActionsColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    '&:empty': {
      display: 'none',
    },
    '&:first-child': {
      paddingLeft: 4,
    },
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

const SupermodModeratorActions = ({user, currentUser, posts, comments, contentsLoading, expanded, showCollapsedActions, onToggle, addToUndoQueue, dispatch}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[],
  contentsLoading: boolean,
  expanded: boolean,
  // False while another sidebar section is expanded: the collapsed view drops
  // its highlighted action buttons, leaving just the header
  showCollapsedActions: boolean,
  onToggle: () => void,
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void,
  dispatch: React.ActionDispatch<[action: InboxAction]>,
}) => {
  const classes = useStyles(styles);
  const activeModeratorActions = user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)) ?? [];
  const [showRateLimitForm, setShowRateLimitForm] = useState(false);
  const isCollapsed = !expanded;

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
    <ModerationSidebarSection
      fillsAvailableSpace={expanded}
      hasHighlightedItems={highlightedActions.size > 0}
      withDivider={false}
    >
      <div className={classes.sectionTitleRow}>
        <ModerationSectionTitle>Moderator Actions</ModerationSectionTitle>
        <button
          type="button"
          className={classes.collapseButton}
          onClick={onToggle}
          title={expanded ? "Close Moderator Actions" : "Open Moderator Actions"}
          aria-label={expanded ? "Close Moderator Actions" : "Open Moderator Actions"}
          aria-expanded={expanded}
        >
          <ForumIcon
            icon={expanded ? "ThickChevronDown" : "ThickChevronRight"}
            className={classes.collapseChevron}
          />
        </button>
      </div>
      {isCollapsed && showCollapsedActions && highlightedActions.size > 0 && (
        <div className={classes.highlightedActionsRow}>
          <div className={classes.highlightedActionsColumn}>
            <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlighted column="restrictive" />
            <ModerationPermissionButtons user={user} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlighted />
          </div>
          <div className={classes.highlightedActionsColumn}>
            <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlighted column="approve" />
          </div>
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
    </ModerationSidebarSection>
  );
}

export default SupermodModeratorActions;
