import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { getDisplayConfig } from "./NotificationsPage/NotificationsPageNotification";
import { useCurrentUser } from "../common/withUser";
import type { NotificationDisplay } from "@/lib/notificationTypes";
import classNames from "classnames";
import moment from "moment";
import { useClickableCell } from "../common/useClickableCell";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    padding: 8,
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[140],
    },
  },
  container: {
    flexGrow: 1,
    display: "flex",
    gap: "8px",
    width: "100%",
  },
  info: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  type: {
    color: theme.palette.grey[600],
    fontSize: 12,
    fontWeight: 500,
  },
  message: {
    fontSize: 13,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  messageRead: {
    color: theme.palette.grey[600],
  },
  messageUnread: {
    color: theme.palette.grey[1000],
  },
  unreadFlag: {
    marginTop: 7,
    width: 8,
    height: 8,
    minWidth: 8,
    minHeight: 8,
    borderRadius: "50%",
    background: theme.palette.primary.main,
  },
  date: {
    color: theme.palette.grey[600],
    fontSize: 13,
    fontWeight: 500,
  },
});

const formatNotificationType = (type: string): string => {
  const words = type.replace(/([A-Z])/g, " $1");
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

const NotificationsPopoverNotification = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const {onClick} = useClickableCell({href: notification.link ?? "#"});

  const currentUser = useCurrentUser();
  if (!currentUser) {
    return null;
  }

  const isRead = currentUser.lastNotificationsCheck > notification.createdAt;

  const {Icon, iconVariant} = getDisplayConfig(notification);
  const {NotificationsPageItem} = Components;
  return (
    <div onClick={onClick} className={classes.root}>
      <NotificationsPageItem
        Icon={Icon}
        iconVariant={iconVariant}
        noMargin
      >
        <div className={classes.container}>
          <div className={classes.info}>
            <div className={classes.type}>
              {formatNotificationType(notification.type)}
            </div>
            <div className={classNames(
              classes.message,
              isRead && classes.messageRead,
              !isRead && classes.messageUnread,
            )}>
              {notification.message}
            </div>
          </div>
          {!isRead && <div className={classes.unreadFlag} />}
          <div className={classes.date}>
            {moment(notification.createdAt).fromNow()}
          </div>
        </div>
      </NotificationsPageItem>
    </div>
  );
}

const NotificationsPopoverNotificationComponent = registerComponent(
  "NotificationsPopoverNotification",
  NotificationsPopoverNotification,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPopoverNotification: typeof NotificationsPopoverNotificationComponent
  }
}
