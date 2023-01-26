import React, { useCallback } from 'react';
import Badge from '@material-ui/core/Badge';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useOnFocusTab } from '../hooks/useOnFocusTab';
import IconButton from '@material-ui/core/IconButton';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import * as _ from 'underscore';
import { useQuery, gql } from '@apollo/client';

const styles = (theme: ThemeType): JssStyles => ({
  badgeContainer: {
    padding: "none",
    fontFamily: 'freight-sans-pro, sans-serif',
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: theme.palette.header.text,
    fontFamily: 'freight-sans-pro, sans-serif',
    fontSize: "12px",
    fontWeight: 500,
    right: "1px",
    top: "1px",
    pointerEvents: "none",
  },
  buttonOpen: {
    backgroundColor: theme.palette.buttons.notificationsBellOpen.background,
    color: theme.palette.buttons.notificationsBellOpen.icon,
  },
  buttonClosed: {
    backgroundColor: "transparent",
    color: theme.palette.header.text,
  },
});

const NotificationsMenuButton = ({ open, toggle, currentUser, classes }: {
  open: boolean,
  toggle: ()=>void,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { data, loading, refetch } = useQuery(gql`
    query UnreadNotificationCountQuery {
      unreadNotificationsCount
    }
  `, {
    ssr: true
  });
  const notificationCount = data?.unreadNotificationsCount ?? 0;
  
  useOnNavigate(useCallback(() => {
    void refetch();
  }, [refetch]));
  useOnFocusTab(useCallback(() => {
    void refetch();
  }, [refetch]));

  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;

  return (
    <Badge
      classes={{ root: classes.badgeContainer, badge: classes.badge }}
      badgeContent={(notificationCount>0) ? `${notificationCount}` : ""}
    >
      <IconButton
        classes={{ root: buttonClass }}
        onClick={toggle}
      >
        {(notificationCount>0) ? <NotificationsIcon /> : <NotificationsNoneIcon />}
      </IconButton>
    </Badge>
  )
}

const NotificationsMenuButtonComponent = registerComponent('NotificationsMenuButton', NotificationsMenuButton, {
  styles,
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    NotificationsMenuButton: typeof NotificationsMenuButtonComponent
  }
}
