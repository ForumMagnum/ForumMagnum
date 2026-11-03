import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';
import ModerationPostItem from './ModerationPostItem';
import CurationPostItem from './CurationPostItem';
import TeamInboxThreadItem from './TeamInboxThreadItem';
import ModerationReportItem from './ModerationReportItem';
import ModerationTagItem from './ModerationTagItem';
import type { TeamInboxThread } from './teamInboxThreads';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import Loading from '@/components/vulcan-core/Loading';
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
  inboxHeader: {
    display: 'flex',
    alignItems: 'center',
    height: 36,
    padding: '0 20px',
    flexShrink: 0,
    borderBottom: theme.palette.border.faint,
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  showDoneLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  showDoneCheckbox: {
    padding: 0,
  },
  inboxScrollContainer: {
    maxHeight: 'calc(100vh - 145px)',
  },
  inboxEmpty: {
    padding: '24px 20px',
    color: theme.palette.grey[600],
    fontSize: 14,
    ...theme.typography.commentStyle,
  },
  doneDivider: {
    padding: '16px 20px 6px',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.palette.grey[600],
    borderBottom: theme.palette.border.faint,
    ...theme.typography.commentStyle,
  },
  loadMoreRow: {
    padding: 16,
    textAlign: 'center',
  },
  group: {},
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

const TeamInboxList = ({
  openThreads,
  doneThreads,
  doneThreadsLoading,
  doneThreadsError,
  hasMoreDoneThreads,
  focusedThreadId,
  onFocusThread,
  onToggleShowDoneThreads,
  onLoadMoreDoneThreads,
}: {
  openThreads: TeamInboxThread[];
  /** Null when done conversations aren't shown */
  doneThreads: TeamInboxThread[] | null;
  doneThreadsLoading: boolean;
  doneThreadsError?: string;
  hasMoreDoneThreads: boolean;
  focusedThreadId: string | null;
  onFocusThread: (conversationId: string) => void;
  onToggleShowDoneThreads: () => void;
  onLoadMoreDoneThreads: () => void;
}) => {
  const classes = useStyles(styles);
  const renderThread = (thread: TeamInboxThread, isDone: boolean) => (
    <TeamInboxThreadItem
      key={thread.conversation._id}
      thread={thread}
      isDone={isDone}
      isFocused={thread.conversation._id === focusedThreadId}
      onFocus={() => onFocusThread(thread.conversation._id)}
    />
  );
  return <>
    <div className={classes.inboxHeader}>
      <label className={classes.showDoneLabel}>
        <Checkbox
          className={classes.showDoneCheckbox}
          checked={!!doneThreads}
          onChange={onToggleShowDoneThreads}
          disableRipple
        />
        Show done
      </label>
    </div>
    <div className={classNames(classes.scrollContainer, classes.inboxScrollContainer)}>
      {openThreads.length === 0 && <div className={classes.inboxEmpty}>No conversations waiting on moderators</div>}
      {openThreads.map(thread => renderThread(thread, false))}
      {doneThreads && <>
        <div className={classes.doneDivider}>Done</div>
        {doneThreads.map(thread => renderThread(thread, true))}
        {doneThreadsLoading && <Loading />}
        {doneThreadsError && <div className={classes.inboxEmpty} role="alert">
          <div>Unable to load done conversations: {doneThreadsError}</div>
          <Button className={classes.reloadButton} variant="outlined" onClick={() => window.location.reload()}>Reload</Button>
        </div>}
        {!doneThreadsLoading && !doneThreadsError && hasMoreDoneThreads && <div className={classes.loadMoreRow}>
          <Button variant="outlined" onClick={onLoadMoreDoneThreads}>Load more</Button>
        </div>}
      </>}
    </div>
  </>;
};

const ModerationInboxList = ({
  userGroups,
  posts,
  curationPosts,
  teamInboxThreads,
  doneTeamInboxThreads,
  doneTeamInboxThreadsLoading,
  doneTeamInboxThreadsError,
  hasMoreDoneTeamInboxThreads,
  onToggleShowDoneThreads,
  onLoadMoreDoneThreads,
  reports,
  tags,
  focusedUserId,
  focusedPostId,
  focusedThreadId,
  focusedReportId,
  focusedTagId,
  onFocusUser,
  onOpenUser,
  onFocusPost,
  onFocusThread,
  onFocusReport,
  onFocusTag,
  activeTab,
  unloadedCount,
  onLoadUnloaded,
  loadingUnloaded,
}: {
  userGroups: GroupEntry[];
  posts: SunshinePostsList[];
  curationPosts: SunshineCurationPostsListItem[];
  teamInboxThreads: TeamInboxThread[];
  doneTeamInboxThreads: TeamInboxThread[] | null;
  doneTeamInboxThreadsLoading: boolean;
  doneTeamInboxThreadsError?: string;
  hasMoreDoneTeamInboxThreads: boolean;
  onToggleShowDoneThreads: () => void;
  onLoadMoreDoneThreads: () => void;
  reports: UnclaimedReportsList[];
  tags: SunshineTagFragment[];
  focusedUserId: string | null;
  focusedPostId: string | null;
  focusedThreadId: string | null;
  focusedReportId: string | null;
  focusedTagId: string | null;
  onFocusUser: (userId: string) => void;
  onOpenUser: (userId: string) => void;
  onFocusPost: (postId: string) => void;
  onFocusThread: (conversationId: string) => void;
  onFocusReport: (reportId: string) => void;
  onFocusTag: (tagId: string) => void;
  activeTab: TabId;
  unloadedCount: number;
  onLoadUnloaded: () => void;
  loadingUnloaded: boolean;
}) => {
  const classes = useStyles(styles);

  const userCount = useMemo(() => userGroups.map(([_, users]) => users).flat().length, [userGroups]);

  return (
    <div className={classes.root}>
      {activeTab === 'inbox' ? (
        <TeamInboxList
          openThreads={teamInboxThreads}
          doneThreads={doneTeamInboxThreads}
          doneThreadsLoading={doneTeamInboxThreadsLoading}
          doneThreadsError={doneTeamInboxThreadsError}
          hasMoreDoneThreads={hasMoreDoneTeamInboxThreads}
          focusedThreadId={focusedThreadId}
          onFocusThread={onFocusThread}
          onToggleShowDoneThreads={onToggleShowDoneThreads}
          onLoadMoreDoneThreads={onLoadMoreDoneThreads}
        />
      ) : activeTab === 'reports' ? (
        reports.length === 0 ? (
          <div className={classes.empty}>No flagged content to review</div>
        ) : (
          <div className={classes.scrollContainer}>
            {reports.map((report) => (
              <ModerationReportItem
                key={report._id}
                report={report}
                isFocused={report._id === focusedReportId}
                onFocus={() => onFocusReport(report._id)}
              />
            ))}
          </div>
        )
      ) : activeTab === 'tags' ? (
        tags.length === 0 ? (
          <div className={classes.empty}>No wikitags to review</div>
        ) : (
          <div className={classes.scrollContainer}>
            {tags.map((tag) => (
              <ModerationTagItem
                key={tag._id}
                tag={tag}
                isFocused={tag._id === focusedTagId}
                onFocus={() => onFocusTag(tag._id)}
              />
            ))}
          </div>
        )
      ) : activeTab === 'curation' ? (
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
