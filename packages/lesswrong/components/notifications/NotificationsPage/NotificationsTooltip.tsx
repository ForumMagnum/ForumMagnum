import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useNotificationDisplays } from "./useNotificationDisplays";
import { Link } from "../../../lib/reactRouterWrapper";
import { HEADER_HEIGHT } from "../../common/Header";
import type { NotificationDisplay } from "../../../lib/notificationTypes";
import type { KarmaChanges } from "../../../lib/collections/users/karmaChangesGraphQL";

const PADDING = 20;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  notificationsContainer: {
    maxHeight: `calc(100vh - ${HEADER_HEIGHT + (2 * PADDING)}px)`,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingBottom: 8,
  },
  tooltip: {
    width: 284,
    maxWidth: "100vw",
    padding: PADDING,
  },
  showMore: {
    background: theme.palette.grey[0],
    width: "100%",
    boxShadow: `0px -18px 22px 0px ${theme.palette.grey[0]}`,
    paddingTop: 2,
    position: "absolute",
    left: 0,
    bottom: -6,
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: "140%",
  },
});

const MIN_TO_SHOW = 4;
const MAX_TO_SHOW = 8;

export const NotificationsTooltip = ({
  unreadNotifications,
  karmaChanges,
  children,
  classes,
}: {
  unreadNotifications: number,
  karmaChanges?: KarmaChanges,
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const limit = Math.max(Math.min(unreadNotifications, MAX_TO_SHOW), MIN_TO_SHOW);
  const {data} = useNotificationDisplays(limit);
  const notifs: NotificationDisplay[] = data?.NotificationDisplays?.results ?? [];
  const remaining = unreadNotifications - limit;

  const {
    HoverOver, NotificationsPageNotification, NotificationsPageKarmaChangeList,
  } = Components;
  return (
    <HoverOver
      title={
        <div className={classes.root}>
          <div className={classes.notificationsContainer}>
            <NotificationsPageKarmaChangeList karmaChanges={karmaChanges} />
            {notifs.map((notification) =>
              <NotificationsPageNotification
                key={notification._id}
                notification={notification}
                hideCommentPreviews
              />
            )}
          </div>
          <div className={classes.showMore}>
            <Link to="/notifications">
              {remaining > 0 ? `${remaining} more` : "View all"}
            </Link>
          </div>
        </div>
      }
      placement="bottom"
      clickable
      popperClassName={classes.tooltip}
      analyticsProps={{
        pageElementContext: "notificationsTooltip",
      }}
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
