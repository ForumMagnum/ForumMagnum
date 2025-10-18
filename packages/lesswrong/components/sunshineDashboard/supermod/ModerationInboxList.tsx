import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';
import ModerationTabs, { TabInfo } from './ModerationTabs';
import type { ReviewGroup } from './groupings';
import classNames from 'classnames';

const styles = defineStyles('ModerationInboxList', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
  header: {
    padding: '16px 20px',
    borderBottom: theme.palette.border.normal,
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
  },
  title: {
    ...theme.typography.commentStyle,
    fontSize: 20,
    fontWeight: 600,
    color: theme.palette.grey[900],
  },
  count: {
    fontSize: 14,
    color: theme.palette.grey[600],
    marginLeft: 8,
  },
  list: {
    // No padding - items will have their own spacing
  },
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
  unknown: {
    background: theme.palette.panelBackground.sunshineUnknownGroup,
  },
}));

export type GroupEntry = [ReviewGroup, SunshineUsersList[]];

const ModerationInboxList = ({
  userGroups,
  focusedUserId,
  onFocusUser,
  onOpenUser,
  visibleTabs,
  activeTab,
  onTabChange,
}: {
  userGroups: GroupEntry[],
  focusedUserId: string | null;
  onFocusUser: (userId: string) => void;
  onOpenUser: (userId: string) => void;
  visibleTabs: TabInfo[];
  activeTab: ReviewGroup | 'all';
  onTabChange: (tab: ReviewGroup | 'all') => void;
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
      {userCount === 0 ? (
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
      )}
    </div>
  );
};

export default ModerationInboxList;
