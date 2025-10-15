import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';

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

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.title}>
          Unreviewed Users
          <span className={classes.count}>({users.length})</span>
        </span>
      </div>
      {users.length === 0 ? (
        <div className={classes.empty}>
          No users to review
        </div>
      ) : (
        <div className={classes.list}>
          {users.map((user) => (
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
