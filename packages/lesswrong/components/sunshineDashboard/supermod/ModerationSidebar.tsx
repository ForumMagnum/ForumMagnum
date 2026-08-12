import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SunshineUserMessages from '../SunshineUserMessages';
import SupermodModeratorActions from './SupermodModeratorActions';
import ModerationSectionTitle from './ModerationSectionTitle';
import type { InboxAction } from './inboxReducer';
import type { ContentItem } from './helpers';
import type { SelectedSidebarTab } from './sidebarTabs';

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
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
    overflow: 'hidden',
    '&:not(:last-child)': {
      borderBottom: theme.palette.border.normal,
    },
  },
  userMessages: {
    overflow: 'auto',
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
        <ModerationSectionTitle>Moderator Actions</ModerationSectionTitle>
        <SupermodModeratorActions user={user} currentUser={currentUser} addToUndoQueue={addToUndoQueue} dispatch={dispatch} />
      </div>
      <div className={classes.section}>
        <div className={classes.userMessages}>
          {/* TODO: maybe "expand" should actually open a model with the contents, since expanding a conversation inline is kind of annoying with the "no overflow" thing */}
          <SunshineUserMessages
            key={user._id}
            user={user}
            currentUser={currentUser}
            posts={posts}
            comments={comments}
            focusedContent={focusedContent}
            sidebarTab={sidebarTab}
            setSidebarTab={setSidebarTab}
          />
        </div>
      </div>
    </div>
  );
};

export default ModerationSidebar;
