import React, { useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModerationActionButtons from './ModerationActionButtons';
import CollapsibleSectionHeader from './CollapsibleSectionHeader';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { getHighlightedModeratorActions, type HighlightedModeratorActions } from './highlightRules';
import type { InboxAction } from './inboxReducer';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';
import ModerationSidebarSection from './ModerationSidebarSection';

const styles = defineStyles('SupermodModeratorActions', (theme: ThemeType) => ({
  highlightedActionsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  // Equal widths so the right column's x doesn't depend on label lengths
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

const NO_HIGHLIGHTED_ACTIONS: HighlightedModeratorActions = new Map();

const SupermodModeratorActions = ({user, currentUser, posts, comments, contentsLoading, expanded, showCollapsedActions, onToggle, addToUndoQueue, dispatch}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[],
  contentsLoading: boolean,
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

  // Empty lists while loading would satisfy absence-based rules (e.g. Remove, Purge)
  const highlightedActions = useMemo(() => contentsLoading
    ? NO_HIGHLIGHTED_ACTIONS
    : getHighlightedModeratorActions({ user, posts, comments }), [user, posts, comments, contentsLoading]);

  return (
    <ModerationSidebarSection
      fillsAvailableSpace={expanded}
      withDivider={false}
      header={<CollapsibleSectionHeader
        title="Moderator Actions"
        expanded={expanded}
        minimal
        onToggle={onToggle}
      />}
    >
      {!expanded && showCollapsedActions && highlightedActions.size > 0 && (
        <div className={classes.highlightedActionsRow}>
          <div className={classes.highlightedActionsColumn}>
            <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlightedColumn="restrictive" />
            <ModerationPermissionButtons user={user} dispatch={dispatch} highlightedActions={highlightedActions} collapsed />
          </div>
          <div className={classes.highlightedActionsColumn}>
            <ModerationActionButtons user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} highlightedActions={highlightedActions} onlyHighlightedColumn="approve" />
          </div>
        </div>
      )}
      {expanded && <>
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
