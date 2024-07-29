import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { HEADER_HEIGHT } from "../common/Header";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";
import { useNotificationDisplays } from "./NotificationsPage/useNotificationDisplays";
import type { NotificationDisplay } from "@/lib/notificationTypes";

const styles = (theme: ThemeType) => ({
  root: {
    ...popoverStyles(theme).root,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
    width: 400,
    maxWidth: "calc(100vw - 32px)",
    maxHeight: `calc(100vh - ${HEADER_HEIGHT + 16}px)`,
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 12,
  },
  notifications: {
    overflow: "hidden",
  },
  loading: {
    height: 20,
  },
});

const NotificationsPopover = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data, loading: notificationsLoading} = useNotificationDisplays(20);
  const notifs: NotificationDisplay[] = data?.NotificationDisplays?.results ?? [];

  const {SectionTitle, Loading, NotificationsPageNotification} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <SectionTitle title="Karma & reacts" className={classes.sectionTitle} />
      <SectionTitle title="Posts & comments" className={classes.sectionTitle} />
      <div className={classes.notifications}>
        {notifs.map((notification) =>
          <NotificationsPageNotification
            key={notification._id}
            notification={notification}
            hideCommentPreviews
          />
        )}
        {notificationsLoading && <Loading className={classes.loading} />}
      </div>
    </div>
  );
}

const NotificationsPopoverComponent = registerComponent(
  "NotificationsPopover",
  NotificationsPopover,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPopover: typeof NotificationsPopoverComponent
  }
}
