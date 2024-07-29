import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { HEADER_HEIGHT } from "../common/Header";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";
import { useNotificationDisplays } from "./NotificationsPage/useNotificationDisplays";
import type { NotificationDisplay } from "@/lib/notificationTypes";
import type { KarmaChanges } from "@/lib/collections/users/karmaChangesGraphQL";

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
  loading: {
    height: 20,
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
    maskImage: `linear-gradient(to bottom, ${theme.palette.grey[0]} 90%, transparent 100%)`,
    "-webkit-mask-image": `linear-gradient(to bottom, ${theme.palette.grey[0]} 90%, transparent 100%)`,
  },
  notification: {
    display: "flex",
  },
});

const NotificationsPopover = ({karmaChanges, classes}: {
  karmaChanges?: KarmaChanges,
  classes: ClassesType<typeof styles>,
}) => {
  const {data, loading: notificationsLoading} = useNotificationDisplays(20);
  const notifs: NotificationDisplay[] = data?.NotificationDisplays?.results ?? [];

  const {
    SectionTitle, Loading, NotificationsPageKarmaChangeList,
    NotificationsPopoverNotification,
  } = Components;
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <SectionTitle title="Karma & reacts" className={classes.sectionTitle} />
      {karmaChanges &&
        <NotificationsPageKarmaChangeList karmaChanges={karmaChanges} />
      }
      <SectionTitle title="Posts & comments" className={classes.sectionTitle} />
      <div className={classes.notifications}>
        {notifs.map((notification) =>
          <NotificationsPopoverNotification
            key={notification._id}
            notification={notification}
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
