import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';
import ModerationPostItem from './ModerationPostItem';
import CurationPostItem from './CurationPostItem';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import type { TabId } from './groupings';
import classNames from 'classnames';

const styles = defineStyles('ModerationInboxList', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    minHeight: 0, // Required for flex child to shrink below content height
    maxHeight: 'calc(100vh - 109px)',
    overflowY: 'scroll',
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 16,
  },
  reloadButton: {
    marginTop: 12,
  },
  group: {},
  newContent: {
    background: theme.palette.panelBackground.sunshineNewContentGroup,
  },
  offboard: {
    background: theme.palette.panelBackground.sunshineWarningHighlight,
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

// Only the first page of the queue is loaded, so a tab can run out of loaded items while its count is still non-zero
const UnloadedItemsNotice = ({ unloadedCount, itemName, onLoad, loading }: {
  unloadedCount: number;
  itemName: string;
  onLoad: () => void;
  loading: boolean;
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.empty}>
      <div>{unloadedCount} more queued {itemName}{unloadedCount === 1 ? '' : 's'} not loaded</div>
      <Button className={classes.reloadButton} variant="outlined" onClick={onLoad} disabled={loading}>
        {loading ? 'Loading…' : 'Load them'}
      </Button>
    </div>
  );
};

const ModerationInboxList = ({
  userGroups,
  posts,
  curationPosts,
  focusedUserId,
  focusedPostId,
  onFocusUser,
  onOpenUser,
  onFocusPost,
  activeTab,
  unloadedCount,
  onLoadUnloaded,
  loadingUnloaded,
}: {
  userGroups: GroupEntry[];
  posts: SunshinePostsList[];
  curationPosts: SunshineCurationPostsListItem[];
  focusedUserId: string | null;
  focusedPostId: string | null;
  onFocusUser: (userId: string) => void;
  onOpenUser: (userId: string) => void;
  onFocusPost: (postId: string) => void;
  activeTab: TabId;
  unloadedCount: number;
  onLoadUnloaded: () => void;
  loadingUnloaded: boolean;
}) => {
  const classes = useStyles(styles);

  const userCount = useMemo(() => userGroups.map(([_, users]) => users).flat().length, [userGroups]);

  return (
    <div className={classes.root}>
      {activeTab === 'curation' ? (
        curationPosts.length === 0 ? (
          <div className={classes.empty}>No curation candidates</div>
        ) : (
          <div className={classes.scrollContainer}>
            {curationPosts.map((post) => (
              <CurationPostItem
                key={post._id}
                post={post}
                isFocused={post._id === focusedPostId}
                onFocus={() => onFocusPost(post._id)}
              />
            ))}
          </div>
        )
      ) : (activeTab === 'posts' || activeTab === 'classifiedPosts') ? (
        posts.length === 0 ? (
          unloadedCount > 0 ? (
            <UnloadedItemsNotice unloadedCount={unloadedCount} itemName="post" onLoad={onLoadUnloaded} loading={loadingUnloaded} />
          ) : (
            <div className={classes.empty}>
              {activeTab === 'classifiedPosts' ? 'No auto-classified posts to review' : 'No posts to review'}
            </div>
          )
        ) : (
          <div className={classes.scrollContainer}>
            {posts.map((post) => (
              <ModerationPostItem
                key={post._id}
                post={post}
                isFocused={post._id === focusedPostId}
                onFocus={() => onFocusPost(post._id)}
              />
            ))}
            {unloadedCount > 0 && <UnloadedItemsNotice unloadedCount={unloadedCount} itemName="post" onLoad={onLoadUnloaded} loading={loadingUnloaded} />}
          </div>
        )
      ) : (
        userCount === 0 ? (
          unloadedCount > 0 ? (
            <UnloadedItemsNotice unloadedCount={unloadedCount} itemName="user" onLoad={onLoadUnloaded} loading={loadingUnloaded} />
          ) : (
            <div className={classes.empty}>
              No users to review
            </div>
          )
        ) : (
          <div className={classes.scrollContainer}>
            {userGroups.map(([group, users]) => {
              const groupStyling = activeTab === 'all' ? classes[group] : undefined;
              return <div key={group} className={classNames(classes.group, groupStyling)}>
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
            })}
            {unloadedCount > 0 && <UnloadedItemsNotice unloadedCount={unloadedCount} itemName="user" onLoad={onLoadUnloaded} loading={loadingUnloaded} />}
          </div>
        )
      )}
    </div>
  );
};

export default ModerationInboxList;
