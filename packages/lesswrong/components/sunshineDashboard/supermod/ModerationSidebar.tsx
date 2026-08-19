import React, { useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SunshineUserMessages from '../SunshineUserMessages';
import SupermodModeratorActions from './SupermodModeratorActions';
import type { InboxAction } from './inboxReducer';
import type { ContentItem } from './helpers';
import type { SelectedSidebarTab } from './sidebarTabs';

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    // Without another section filling the column, highlighted sections divide
    // the free height evenly.
    '&:not(:has([data-moderation-sidebar-fills-space="true"])) [data-moderation-sidebar-highlights="true"]': {
      flex: '1 1 0',
    },
  },
  empty: {
    color: theme.palette.grey[600],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
}));

const ModerationSidebar = ({
  user,
  currentUser,
  posts,
  comments,
  contentsLoading,
  focusedContent,
  sidebarTab,
  setSidebarTab,
  addToUndoQueue,
  dispatch,
  onContentRejectStart,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  contentsLoading: boolean;
  focusedContent: ContentItem | null;
  sidebarTab: SelectedSidebarTab;
  setSidebarTab: (tab: SelectedSidebarTab) => void;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  onContentRejectStart: (content: ContentItem) => void;
}) => {
  const classes = useStyles(styles);
  const moderatorActionsExpanded = sidebarTab === 'moderatorActions';
  // With Rejections or Send Message expanded, Moderator Actions collapses to a
  // bare header (no highlighted action buttons) so the expanded section gets
  // the full height
  const otherActionSectionExpanded = sidebarTab === 'reject' || sidebarTab === 'dm';

  const handleRejectStart = useCallback((content: ContentItem) => {
    dispatch({ type: 'ADJUST_USER_REJECTED_CONTENT_COUNT', userId: user._id, delta: 1 });
    onContentRejectStart(content);
  }, [dispatch, user._id, onContentRejectStart]);

  const handleRejectFailed = useCallback(() => {
    dispatch({ type: 'ADJUST_USER_REJECTED_CONTENT_COUNT', userId: user._id, delta: -1 });
  }, [dispatch, user._id]);

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
        onRejectStart={handleRejectStart}
        onRejectFailed={handleRejectFailed}
      />
      <SupermodModeratorActions
        user={user}
        currentUser={currentUser}
        posts={posts}
        comments={comments}
        contentsLoading={contentsLoading}
        expanded={moderatorActionsExpanded}
        showCollapsedActions={!otherActionSectionExpanded}
        onToggle={() => setSidebarTab(moderatorActionsExpanded ? null : 'moderatorActions')}
        addToUndoQueue={addToUndoQueue}
        dispatch={dispatch}
      />
    </div>
  );
};

export default ModerationSidebar;
