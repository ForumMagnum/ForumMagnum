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
  toggle: any,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { results, refetch } = useMulti({
    terms: {
      view: 'userNotifications',
      userId: currentUser._id
    },
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  });
  
  useOnNavigate(useCallback(() => {
    refetch();
  }, [refetch]));
  useOnFocusTab(useCallback(() => {
    refetch();
  }, [refetch]));
  
  let filteredResults: Array<NotificationsList> | undefined = results && _.filter(results,
    (x) => !currentUser.lastNotificationsCheck || x.createdAt > currentUser.lastNotificationsCheck
  );

  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;

  return (
    <Badge
      classes={{ root: classes.badgeContainer, badge: classes.badge }}
      badgeContent={(filteredResults && filteredResults.length) || ""}
    >
      <IconButton
        classes={{ root: buttonClass }}
        onClick={toggle}
      >
        {filteredResults && filteredResults.length ? <NotificationsIcon /> : <NotificationsNoneIcon />}
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
