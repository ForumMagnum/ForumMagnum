import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModeratorMessageComposer from '../ModeratorMessageComposer';
import RejectContentPanel from './RejectContentPanel';
import KeystrokeDisplay from './KeystrokeDisplay';
import { canRejectContent, getContentTitle, type ContentItem } from './helpers';
import type { SelectedSidebarTab } from './sidebarTabs';
import type { InboxAction } from './inboxReducer';

const styles = defineStyles('ModerationSidebarComposers', (theme: ThemeType) => ({
  tabs: {
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: 8,
  },
  tab: {
    ...theme.typography.commentStyle,
    minWidth: 0,
    padding: '6px 8px',
    fontSize: 13,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  // Underlines the label only, not the tab's full-width click target
  tabLabel: {
    borderBottom: '2px solid transparent',
    paddingBottom: 2,
  },
  // KeystrokeDisplay's root is display:flex, so the label needs to be a flex
  // container for the badge to sit inline with the text
  keystrokeTabLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
  },
  rejectTabTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dmTab: {
    flexShrink: 0,
  },
  rejectTab: {
    flexShrink: 1,
    // Pushed to the right edge so the tabs read as separate choices
    marginLeft: 'auto',
  },
  activeTab: {
    color: theme.palette.grey[900],
    fontWeight: 600,
    borderBottomColor: theme.palette.primary.main,
  },
  disabledTab: {
    opacity: 0.4,
    cursor: 'default',
    '&:hover': {
      color: theme.palette.grey[600],
    },
  },
  // Deselected composers stay mounted (so drafts survive), just hidden
  hiddenTabContent: {
    display: 'none',
  },
}));

/**
 * The sidebar's "Send DM" and "Reject" composers. The reject panel shows by
 * default for rejectable content, but only takes keyboard input once its tab
 * is picked, so the moderation shortcuts keep working.
 */
const ModerationSidebarComposers = ({ user, currentUser, posts, comments, focusedContent, sidebarTab, rejectComposerFocusToken, setSidebarTab, dispatch }: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  focusedContent: ContentItem | null;
  sidebarTab: SelectedSidebarTab;
  rejectComposerFocusToken: number;
  setSidebarTab: (tab: SelectedSidebarTab) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const rejectPanelRef = useRef<HTMLDivElement>(null);

  const canReject = canRejectContent(focusedContent);
  const dmTabActive = sidebarTab === 'dm';
  const rejectTabActive = sidebarTab === 'reject' && canReject;
  const rejectPanelVisible = rejectTabActive || (sidebarTab === null && canReject);

  // The reject panel stays visible after losing its tab, so release its focus or its search box swallows the shortcuts
  useEffect(() => {
    const focused = document.activeElement;
    if (!rejectTabActive && focused instanceof HTMLElement && rejectPanelRef.current?.contains(focused)) {
      focused.blur();
    }
  }, [rejectTabActive]);

  const closeTab = () => setSidebarTab(null);

  return <div>
    <div className={classes.tabs}>
      <div className={classNames(classes.tab, classes.dmTab)} onClick={() => setSidebarTab(dmTabActive ? null : 'dm')}>
        <span className={classNames(classes.tabLabel, classes.keystrokeTabLabel, { [classes.activeTab]: dmTabActive })}>
          Send DM
          <KeystrokeDisplay keystroke="M" withMargin />
        </span>
      </div>
      {focusedContent && <div
        className={classNames(classes.tab, classes.rejectTab, { [classes.disabledTab]: !canReject })}
        onClick={() => canReject && setSidebarTab(rejectTabActive ? null : 'reject')}
        title={canReject ? undefined : "This content can't be rejected"}
      >
        <span className={classNames(classes.tabLabel, classes.keystrokeTabLabel, { [classes.activeTab]: rejectPanelVisible })}>
          <span className={classes.rejectTabTitle}>Reject “{getContentTitle(focusedContent)}”</span>
          <KeystrokeDisplay keystroke="R" withMargin />
        </span>
      </div>}
    </div>

    <div className={classNames({ [classes.hiddenTabContent]: !dmTabActive })}>
      <ModeratorMessageComposer
        user={user}
        currentUser={currentUser}
        posts={posts}
        comments={comments}
        active={dmTabActive}
        onEscape={closeTab}
        onSent={closeTab}
        dispatch={dispatch}
      />
    </div>
    {canReject && focusedContent && (
      <div ref={rejectPanelRef} className={classNames({ [classes.hiddenTabContent]: !rejectPanelVisible })}>
        <RejectContentPanel rejectComposerFocusToken={rejectComposerFocusToken} user={user} focusedContent={focusedContent} active={rejectTabActive}
          onEscape={closeTab}
          onRejected={closeTab}
          dispatch={dispatch}
        />
      </div>
    )}
  </div>;
};

export default ModerationSidebarComposers;
