import React, { MouseEvent, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getDisplayConfig } from "./NotificationsPage/NotificationsPageNotification";
import { useClickableCell } from "../common/useClickableCell";
import { useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import type { NotificationDisplay } from "@/lib/notificationTypes";
import classNames from "classnames";
import moment from "moment";
import { useNotificationsPopoverContext } from "./useNotificationsPopoverContext";
import { useUpdate } from "@/lib/crud/withUpdate";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[140],
    },
  },
  icon: {
    marginTop: 4,
  },
  container: {
    flexGrow: 1,
    display: "flex",
    gap: "4px",
    width: "100%",
  },
  info: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  meta: {
    display: "flex",
    flexGrow: 1,
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
    marginTop: 5,
    width: 10,
    height: 10,
    minWidth: 10,
    minHeight: 10,
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
  switch (type) {
    case "newRSVP":
      return "New RSVP";
    case "newShortform":
      return "New Quick take";
    case "coauthorRequestNotification":
      return "Co-author requested";
    case "coauthorAcceptNotification":
      return "Co-author accepted";
    default:
      const words = type.replace(/([A-Z])/g, " $1");
      return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  }
}

const NotificationsPopoverNotification = ({notification, refetch, classes}: {
  notification: NotificationDisplay,
  refetch?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {_id, post, comment, type, link, viewed, message, createdAt} = notification;

  const currentUser = useCurrentUser();
  const {captureEvent} = useTracking();
  const {onClick: redirect} = useClickableCell({href: notification.link ?? "#"});
  const {closeNotifications} = useNotificationsPopoverContext();
  const {mutate: updateNotification} = useUpdate({
    collectionName: "Notifications",
    fragmentName: "NotificationsList",
  });

  const onSelect = useCallback((ev: MouseEvent<HTMLDivElement>) => {
    closeNotifications();
    void updateNotification({
      selector: {_id},
      data: {viewed: true},
    });
    refetch?.();
    captureEvent("notificationClick", {
      notification: {_id, link},
    });
    redirect(ev);
  }, [
    closeNotifications,
    captureEvent,
    _id,
    link,
    redirect,
    updateNotification,
    refetch,
  ]);

  if (!currentUser) {
    return null;
  }

  const {Icon, iconVariant} = getDisplayConfig(notification);
  const {PostsTooltip, NotificationsPageItem} = Components;
  return (
    <PostsTooltip
      postId={post?._id ?? comment?.post?._id}
      commentId={comment?._id}
      placement="left-start"
      clickable
    >
      <div onClick={onSelect} className={classes.root}>
        <NotificationsPageItem
          Icon={Icon}
          iconVariant={iconVariant}
          iconClassName={classes.icon}
          metaClassName={classes.meta}
          noMargin
        >
          <div className={classes.container}>
            <div className={classes.info}>
              <div className={classes.type}>
                {formatNotificationType(type)}
              </div>
              <div className={classNames(
                classes.message,
                viewed && classes.messageRead,
                !viewed && classes.messageUnread,
              )}>
                {message}
              </div>
            </div>
            {!viewed && <div className={classes.unreadFlag} />}
            <div className={classes.date}>
              {moment(createdAt).fromNow()}
            </div>
          </div>
        </NotificationsPageItem>
      </div>
    </PostsTooltip>
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
