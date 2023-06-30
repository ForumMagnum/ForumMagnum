import React from 'react';
import Badge from '@material-ui/core/Badge';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import IconButton from '@material-ui/core/IconButton';
import { isEAForum } from '../../lib/instanceSettings';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  badgeContainer: {
    padding: "none",
    fontFamily: 'freight-sans-pro, sans-serif',
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: isEAForum ? theme.palette.grey[600] : theme.palette.header.text,
    fontWeight: 500,
    right: "1px",
    top: "1px",
    pointerEvents: "none",
    ...(isEAForum
      ? {
        fontSize: 10,
      }
      : {
        fontFamily: "freight-sans-pro, sans-serif",
        fontSize: 12,
      }),
  },
  buttonOpen: {
    backgroundColor: theme.palette.buttons.notificationsBellOpen.background,
    color: isEAForum ? theme.palette.grey[600] : theme.palette.buttons.notificationsBellOpen.icon,
  },
  buttonClosed: {
    backgroundColor: "transparent",
    color: isEAForum ? theme.palette.grey[600] : theme.palette.header.text,
  },
});

const NotificationsMenuButton = ({ unreadNotifications, open, toggle, className, classes }: {
  unreadNotifications: number,
  open: boolean,
  toggle: ()=>void,
  className?: string,
  classes: ClassesType,
}) => {
  const { ForumIcon } = Components
  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;

  return (
    <Badge
      classes={{ root: classNames(classes.badgeContainer, className), badge: classes.badge }}
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
