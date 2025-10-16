import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';
import { getUserReviewGroup, REVIEW_GROUP_TO_PRIORITY } from './groupings';

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
}));

const ModerationInboxList = ({
  users,
  focusedUserId,
  onFocusUser,
  onOpenUser,
}: {
  users: SunshineUsersList[];
  focusedUserId: string | null;
  onFocusUser: (userId: string) => void;
  onOpenUser: (userId: string) => void;
}) => {
  const classes = useStyles(styles);

  const sortedUsers = useMemo(() => {
    return users.sort((a, b) => {
      const aGroup = getUserReviewGroup(a);
      const bGroup = getUserReviewGroup(b);
      return REVIEW_GROUP_TO_PRIORITY[bGroup] - REVIEW_GROUP_TO_PRIORITY[aGroup];
    });
  }, [users]);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.title}>
          {'Unreviewed Users'}
          <span className={classes.count}>({sortedUsers.length})</span>
        </span>
      </div>
      {sortedUsers.length === 0 ? (
        <div className={classes.empty}>
          No users to review
        </div>
      ) : (
        <div className={classes.list}>
          {sortedUsers.map((user) => (
            <ModerationInboxItem
              key={user._id}
              user={user}
              isFocused={user._id === focusedUserId}
              onFocus={() => onFocusUser(user._id)}
              onOpen={() => onOpenUser(user._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationInboxList;
