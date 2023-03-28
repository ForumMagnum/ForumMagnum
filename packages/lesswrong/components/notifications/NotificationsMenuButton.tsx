import React from 'react';
import Badge from '@material-ui/core/Badge';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import IconButton from '@material-ui/core/IconButton';
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

const NotificationsMenuButton = ({ unreadNotifications, open, toggle, currentUser, classes }: {
  unreadNotifications: number,
  open: boolean,
  toggle: ()=>void,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { ForumIcon } = Components
  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;

  return (
    <Badge
      classes={{ root: classes.badgeContainer, badge: classes.badge }}
      badgeContent={(unreadNotifications>0) ? `${unreadNotifications}` : ""}
    >
      <IconButton
        classes={{ root: buttonClass }}
        onClick={toggle}
      >
        {(unreadNotifications>0) ? <ForumIcon icon="Bell" /> : <ForumIcon icon="BellBorder" />}
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
