import React from 'react';
import Badge from '@material-ui/core/Badge';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import IconButton from '@material-ui/core/IconButton';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { useCurrentUser } from '../common/withUser';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  badgeContainer: {
    padding: "none",
    fontFamily: 'freight-sans-pro, sans-serif',
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: 'rgba(0,0,0,0.6)',
    fontFamily: 'freight-sans-pro, sans-serif',
    fontSize: "12px",
    fontWeight: 500,
    right: "1px",
    top: "1px",
    pointerEvents: "none",
  },
  buttonOpen: {
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  buttonClosed: {
    backgroundColor: "rgba(0,0,0,0)"
  },
});

const NotificationsMenuButton = ({ terms, classes, open, color, toggle }: {
  terms: NotificationsViewTerms,
  classes: ClassesType,
  open: boolean,
  color?: string,
  toggle: any,
}) => {
  const currentUser = useCurrentUser();
  const { results } = useMulti({
    terms,
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    pollInterval: 0,
    limit: 20,
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  });
  
  let filteredResults: Array<NotificationsList> = [];
  if (currentUser) {
    filteredResults = results && _.filter(results,
      (x) => !currentUser.lastNotificationsCheck || x.createdAt > currentUser.lastNotificationsCheck
    );
  }

  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;
  const notificationIconStyle = {
    color: open ? "#FFFFFF" : (color || "rgba(0,0,0,0.6)"),
  }

  return (
    <Badge
      classes={{ root: classes.badgeContainer, badge: classes.badge }}
      badgeContent={(filteredResults && filteredResults.length) || ""}
    >
      <IconButton
          classes={{ root: buttonClass }}
          onClick={toggle}
          style={ notificationIconStyle }
      >
        {filteredResults && filteredResults.length ? <NotificationsIcon /> : <NotificationsNoneIcon />}
      </IconButton>
    </Badge>
  )
}

const NotificationsMenuButtonComponent = registerComponent('NotificationsMenuButton', NotificationsMenuButton, {styles});

declare global {
  interface ComponentTypes {
    NotificationsMenuButton: typeof NotificationsMenuButtonComponent
  }
}

