import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { HEADER_HEIGHT } from "../common/Header";
import { useCurrentUser } from "../common/withUser";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";
import { useNotificationDisplays } from "./NotificationsPage/useNotificationDisplays";
import { karmaSettingsLink } from "./NotificationsPage/NotificationsPageFeed";
import type { NotificationDisplay } from "@/lib/notificationTypes";
import type { KarmaChanges } from "@/lib/collections/users/karmaChangesGraphQL";
import type { KarmaChangeUpdateFrequency } from "@/lib/collections/users/schema";

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
    overflow: "hidden auto",
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
  noKarma: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  link: {
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  notifications: {},
  notification: {
    display: "flex",
  },
});

const getKarmaFrequency = (batchingFrequency: KarmaChangeUpdateFrequency) => {
  switch (batchingFrequency) {
    case "daily":  return " since yesterday";
    case "weekly": return " since last week";
    default:       return "";
  }
}

const NotificationsPopover = ({karmaChanges, classes}: {
  karmaChanges?: KarmaChanges,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [limit, setLimit] = useState(20);
  const {data, loading: notificationsLoading} = useNotificationDisplays(limit);
  const loadMore = useCallback(() => setLimit((limit) => limit + 10), []);

  const notifs = useRef<NotificationDisplay[]>([]);
  if (
    data?.NotificationDisplays?.results?.length &&
    data.NotificationDisplays.results.length !== notifs.current.length
  ) {
    notifs.current = data.NotificationDisplays.results ?? [];
  }

  if (!currentUser) {
    return null;
  }

  const {
    karmaChangeNotifierSettings: {updateFrequency},
    subscribedToDigest,
  } = currentUser;

  const showNotifications = !!(
    notificationsLoading ||
    notifs.current.length > 0 ||
    karmaChanges
  );

  const {
    SectionTitle, NotificationsPageKarmaChangeList, NoNotificationsPlaceholder,
    LoadMore, NotificationsPopoverNotification,
  } = Components;
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      {showNotifications
        ? (
          <>
            <SectionTitle
              title="Karma & reacts"
              className={classes.sectionTitle}
            />
            {karmaChanges &&
              <NotificationsPageKarmaChangeList karmaChanges={karmaChanges} />
            }
            {!karmaChanges &&
              <div className={classes.noKarma}>
                No new karma or reacts{getKarmaFrequency(updateFrequency)}.{" "}
                <Link to={karmaSettingsLink} className={classes.link}>
                  Change settings
                </Link>
              </div>
            }
            <SectionTitle
              title="Posts & comments"
              className={classes.sectionTitle}
            />
            <div className={classes.notifications}>
              {notifs.current.map((notification) =>
                <NotificationsPopoverNotification
                  key={notification._id}
                  notification={notification}
                />
              )}
              <LoadMore
                loadMore={loadMore}
                loading={notificationsLoading}
                loadingClassName={classes.loading}
              />
            </div>
          </>
        )
        : (
          <NoNotificationsPlaceholder subscribedToDigest={subscribedToDigest} />
        )
      }
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
