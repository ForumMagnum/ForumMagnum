import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationInboxItem from './ModerationInboxItem';
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
}: {
  userGroups: GroupEntry[],
  focusedUserId: string | null;
  onFocusUser: (userId: string) => void;
  onOpenUser: (userId: string) => void;
}) => {
  const classes = useStyles(styles);

  const userCount = useMemo(() => userGroups.flat().length, [userGroups]);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.title}>
          {'Unreviewed Users'}
          <span className={classes.count}>({userCount})</span>
        </span>
      </div>
      {userCount === 0 ? (
        <div className={classes.empty}>
          No users to review
        </div>
      ) : (
        userGroups.map(([group, users]) => (
          <div key={group} className={classNames(classes.list, classes[group])}>
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
        ))
      )}
    </div>
  );
};

export default ModerationInboxList;
