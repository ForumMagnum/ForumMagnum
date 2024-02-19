import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { useNotificationDisplays } from "./useNotificationDisplays";
import { HEADER_HEIGHT } from "../../common/Header";
import type { NotificationDisplay } from "../../../lib/notificationTypes";

const PADDING = 20;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    maxHeight: `calc(100vh - ${HEADER_HEIGHT + (2 * PADDING)}px)`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tooltip: {
    width: 284,
    maxWidth: "100vw",
    padding: PADDING,
  },
  remaining: {
    background: theme.palette.grey[0],
    width: "100%",
    boxShadow: `0px -18px 22px 0px ${theme.palette.grey[0]}`,
    paddingTop: 8,
    position: "absolute",
    left: 0,
    bottom: 0,
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: "140%",
  },
});

const MIN_TO_SHOW = 4;
const MAX_TO_SHOW = 8;

export const NotificationsTooltip = ({children, classes}: {
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const {unreadNotifications} = useUnreadNotifications();
  const limit = Math.max(Math.min(unreadNotifications, MAX_TO_SHOW), MIN_TO_SHOW);
  const {data} = useNotificationDisplays(limit);
  const notifs: NotificationDisplay[] = data?.NotificationDisplays?.results ?? [];

  const remaining = unreadNotifications - limit;

  const {HoverOver, NotificationsPageNotification} = Components;
  return (
    <HoverOver
      title={
        <div className={classes.root}>
          {notifs.map((notification) =>
            <NotificationsPageNotification
              key={notification._id}
              notification={notification}
              hideCommentPreviews
            />
          )}
          {remaining > 0 &&
            <div className={classes.remaining}>
              <Link to="/notifications">
                {remaining} more
              </Link>
            </div>
          }
        </div>
      }
      placement="bottom"
      clickable
      popperClassName={classes.tooltip}
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
