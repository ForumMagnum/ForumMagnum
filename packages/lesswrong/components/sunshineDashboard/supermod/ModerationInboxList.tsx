import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';
import ModerationPostItem from './ModerationPostItem';
import ModerationTabs, { TabInfo } from './ModerationTabs';
import type { ReviewGroup } from './groupings';
import classNames from 'classnames';

const styles = defineStyles('ModerationInboxList', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
  list: {},
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 16,
  },
  newContent: {
    background: theme.palette.panelBackground.sunshineNewContentGroup,
  },
  highContext: {
    background: theme.palette.panelBackground.sunshineHighContextGroup,
  },
  maybeSpam: {
    background: theme.palette.panelBackground.sunshineMaybeSpamGroup,
  },
  automod: {
    background: theme.palette.panelBackground.sunshineAutomodGroup,
  },
  snoozeExpired: {
    background: theme.palette.panelBackground.sunshineSnoozeExpiredGroup,
  },
  unknown: {
    background: theme.palette.panelBackground.sunshineUnknownGroup,
  },
}));

export type GroupEntry = [ReviewGroup, SunshineUsersList[]];

const ModerationInboxList = ({
  userGroups,
  posts,
  focusedUserId,
  focusedPostId,
  onFocusUser,
  onOpenUser,
  onFocusPost,
  visibleTabs,
  activeTab,
  onTabChange,
}: {
  userGroups: GroupEntry[];
  posts: SunshinePostsList[];
  focusedUserId: string | null;
  focusedPostId: string | null;
  onFocusUser: (userId: string) => void;
  onOpenUser: (userId: string) => void;
  onFocusPost: (postId: string) => void;
  visibleTabs: TabInfo[];
  activeTab: ReviewGroup | 'all' | 'posts' | 'classifiedPosts';
  onTabChange: (tab: ReviewGroup | 'all' | 'posts' | 'classifiedPosts') => void;
}) => {
  const classes = useStyles(styles);

  const userCount = useMemo(() => userGroups.map(([_, users]) => users).flat().length, [userGroups]);

  return (
    <div className={classes.root}>
      <ModerationTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      {(activeTab === 'posts' || activeTab === 'classifiedPosts') ? (
        posts.length === 0 ? (
          <div className={classes.empty}>
            {activeTab === 'classifiedPosts' ? 'No auto-classified posts to review' : 'No posts to review'}
          </div>
        ) : (
          <div className={classes.list}>
            {posts.map((post) => (
              <ModerationPostItem
                key={post._id}
                post={post}
                isFocused={post._id === focusedPostId}
                onFocus={() => onFocusPost(post._id)}
              />
            ))}
          </div>
        )
      ) : (
        userCount === 0 ? (
          <div className={classes.empty}>
            No users to review
          </div>
        ) : (
          userGroups.map(([group, users]) => {
            const groupStyling = activeTab === 'all' ? classes[group] : undefined;
            return <div key={group} className={classNames(classes.list, groupStyling)}>
              {users.map((user) => (
                <ModerationInboxItem
                  key={user._id}
                  user={user}
                  reviewGroup={group}
                  isFocused={user._id === focusedUserId}
                  onOpen={() => onOpenUser(user._id)}
                />
              ))}
            </div>
          })
        )
      )}
    </div>
  );
};

export default ModerationInboxList;
