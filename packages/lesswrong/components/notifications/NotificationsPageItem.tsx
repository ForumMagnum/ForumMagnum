// TODO: Import component in components.ts
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { getNotificationTypeByName } from '../../lib/notificationTypes';
import { renderMessage } from './NotificationsItem';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 440,
    marginBottom: 24,
  },
  message: {
    marginTop: 8,
    marginRight: 24,
    cursor: "pointer",
    ...commentBodyStyles(theme),
    display: "flex",
    alignItems: "center",
    color: theme.palette.grey[600],
    '& svg': {
      fontSize: 16,
      marginLeft: '4px !important',
      opacity: .5
    }
  },
  notificationPreview: {
    marginLeft: 40
  }
});

export const NotificationsPageItem = ({classes, notification, currentUser}: {
  notification: NotificationsList,
  currentUser: UsersCurrent,
  classes: ClassesType
}) => {
  const { NotificationsPreview } = Components
  const [lastNotificationsCheck] = useState(
    ((currentUser?.lastNotificationsCheck) || ""),
  );

  if (!currentUser) return null
  return <div className={classes.root} key={notification._id} >
    <div className={classes.message}>
      {getNotificationTypeByName(notification.type).getIcon()}
      {renderMessage(notification)}
    </div>
    <div className={classes.notificationPreview}>
      <NotificationsPreview notification={notification} currentUser={currentUser} lastNotificationsCheck={lastNotificationsCheck}/>
    </div>
  </div>;
}

const NotificationsPageItemComponent = registerComponent('NotificationsPageItem', NotificationsPageItem, {styles});

declare global {
  interface ComponentTypes {
    NotificationsPageItem: typeof NotificationsPageItemComponent
  }
}
