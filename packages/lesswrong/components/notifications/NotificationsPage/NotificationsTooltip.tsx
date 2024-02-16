import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { useNotificationDisplays } from "./useNotificationDisplays";
import type { NotificationDisplay } from "../../../lib/notificationTypes";

const styles = (_theme: ThemeType) => ({
  root: {
    width: 284,
    maxWidth: "100vw",
    maxHeight: "80vh",
    padding: 20,
  },
});

const MIN_TO_SHOW = 5;
const MAX_TO_SHOW = 12;

export const NotificationsTooltip = ({children, classes}: {
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const {unreadNotifications} = useUnreadNotifications();
  const limit = Math.min(Math.max(unreadNotifications, MAX_TO_SHOW), MIN_TO_SHOW);
  const {data} = useNotificationDisplays(limit);
  const notifs: NotificationDisplay[] = data?.NotificationDisplays?.results ?? [];

  const {HoverOver, NotificationsPageNotification} = Components;
  return (
    <HoverOver
      title={
        <div>
          {notifs.map((notification) =>
            <NotificationsPageNotification
              key={notification._id}
              notification={notification}
              hideCommentPreviews
            />
          )}
        </div>
      }
      placement="bottom"
      clickable
      popperClassName={classes.root}
    >
      {children}
    </HoverOver>
  );
}

const NotificationsTooltipComponent = registerComponent(
  "NotificationsTooltip",
  NotificationsTooltip,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsTooltip: typeof NotificationsTooltipComponent
  }
}
