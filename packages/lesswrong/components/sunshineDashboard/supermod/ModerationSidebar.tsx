import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SupermodModeratorActions from './SupermodModeratorActions';
import { ModerationUserClientInfo } from './ModerationUserIdentityColumn';
import ModerationUserBioColumn from './ModerationUserBioColumn';
import ModerationSidebarComposers from './ModerationSidebarComposers';
import type { InboxAction } from './inboxReducer';
import type { ContentItem } from './helpers';
import type { SelectedSidebarTab } from './sidebarTabs';

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    height: '100%',
  },
  empty: {
    color: theme.palette.grey[600],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: theme.palette.background.paper,
    padding: 12,
    flexShrink: 0,
    borderBottom: theme.palette.border.normal,
    '&:empty': {
      display: 'none',
    },
  },
  bio: {
    padding: '0 12px 12px',
  },
  moderatorActions: {
    marginTop: 'auto',
    padding: 12,
    flexShrink: 0,
    borderTop: theme.palette.border.normal,
  },
}));

const ModerationSidebar = ({
  user,
  currentUser,
  posts,
  comments,
  focusedContent,
  sidebarTab,
  setSidebarTab,
  addToUndoQueue,
  dispatch,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  focusedContent: ContentItem | null;
  sidebarTab: SelectedSidebarTab;
  setSidebarTab: (tab: SelectedSidebarTab) => void;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);

  if (!user) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a user to review
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.section}>
        <ModerationSidebarComposers
          key={user._id}
          user={user}
          currentUser={currentUser}
          posts={posts}
          comments={comments}
          focusedContent={focusedContent}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          addToUndoQueue={addToUndoQueue}
          dispatch={dispatch}
        />
      </div>
      <div className={classes.section}>
        <ModerationUserClientInfo user={user} />
      </div>
      <div className={classes.bio}>
        <ModerationUserBioColumn user={user} />
      </div>
      <div className={classes.moderatorActions}>
        <SupermodModeratorActions user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} />
      </div>
    </div>
  );
};

export default ModerationSidebar;
