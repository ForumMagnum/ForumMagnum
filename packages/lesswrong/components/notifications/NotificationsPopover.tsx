import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { HEADER_HEIGHT } from "../common/Header";
import { useCurrentUser } from "../common/withUser";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";
import { useNotificationDisplays } from "./NotificationsPage/useNotificationDisplays";
import { karmaSettingsLink } from "./NotificationsPage/NotificationsPageFeed";
import type { NotificationDisplay } from "@/lib/notificationTypes";
import type { KarmaChanges } from "@/lib/collections/users/karmaChangesGraphQL";
import type { KarmaChangeUpdateFrequency } from "@/lib/collections/users/schema";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { NotificationsPopoverContext, NotifPopoverLink } from "./useNotificationsPopoverContext";

const notificationsSettingsLink = "/account?highlightField=auto_subscribe_to_my_posts";

const styles = (theme: ThemeType) => ({
  root: {
    ...popoverStyles(theme).root,
    fontFamily: theme.palette.fonts.sansSerifStack,
    position: "relative",
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
  menuContainer: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  menu: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: theme.palette.grey[600],
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[140],
    },
  },
  sectionTitle: {
    fontSize: 12,
  },
  noKarma: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  karmaSubsectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.grey[600],
    marginBottom: 6,
  },
  link: {
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  notifications: {},
  notification: {
    display: "flex",
  },
  mainLoading: {
    display: "flex",
    alignItems: "center",
    height: 350,
  },
});

const getKarmaFrequency = (batchingFrequency: KarmaChangeUpdateFrequency) => {
  switch (batchingFrequency) {
    case "daily":  return " since yesterday";
    case "weekly": return " since last week";
    default:       return "";
  }
}

const defaultLimit = 20;

const NotificationsPopover = ({karmaChanges, markAllAsRead, closePopover, classes}: {
  karmaChanges?: KarmaChanges,
  markAllAsRead?: () => void,
  closePopover?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [limit, setLimit] = useState(defaultLimit);
  const {data, loading: notificationsLoading} = useNotificationDisplays(limit);
  const loadMore = useCallback(() => setLimit((limit) => limit + 10), []);
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [cachedKarmaChanges] = useState(karmaChanges);

  const toggleMenu = useCallback(() => {
    setIsOpen((open) => !open);
    markAllAsRead?.();
  }, [markAllAsRead]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const closeNotifications = useCallback(() => {
    closeMenu();
    closePopover?.();
  }, [closePopover, closeMenu]);

  const notifs = useRef<NotificationDisplay[]>([]);
  if (
    data?.NotificationDisplays?.results?.length &&
    data.NotificationDisplays.results.length !== notifs.current.length
  ) {
    notifs.current = data.NotificationDisplays.results ?? [];
  }

  useEffect(() => {
    if (!notificationsLoading && notifs.current.length <= defaultLimit) {
      markAllAsRead?.();
    }
  }, [notificationsLoading, markAllAsRead]);

  const hasNewKarmaChanges = useMemo(() => cachedKarmaChanges &&
    (
      cachedKarmaChanges.posts?.length ||
      cachedKarmaChanges.comments?.length ||
      cachedKarmaChanges.tagRevisions?.length
    ), [cachedKarmaChanges]
  )
  // For realtime karma notifications, show a section under the new karma notifications
  // called "Today", which includes all karma notifications from the past 24 hours
  const todaysKarmaChanges = cachedKarmaChanges?.todaysKarmaChanges
  const hasKarmaChangesToday = useMemo(() => todaysKarmaChanges &&
    (
      todaysKarmaChanges.posts?.length ||
      todaysKarmaChanges.comments?.length ||
      todaysKarmaChanges.tagRevisions?.length
    ), [todaysKarmaChanges]
  )

  if (!currentUser) {
    return null;
  }

  const {
    karmaChangeNotifierSettings: {updateFrequency},
    subscribedToDigest,
  } = currentUser;
    
  const showNotifications = !!(notifs.current.length > 0 || hasNewKarmaChanges || hasKarmaChangesToday);

  const {
    SectionTitle, NotificationsPageKarmaChangeList, NoNotificationsPlaceholder,
    LoadMore, NotificationsPopoverNotification, ForumIcon, LWClickAwayListener,
    PopperCard, DropdownMenu, DropdownItem, Loading,
  } = Components;

  return (
    <AnalyticsContext pageSectionContext="notificationsPopover">
      <NotificationsPopoverContext.Provider value={{ closeNotifications }}>
        <div className={classes.root}>
          <div className={classes.title}>Notifications</div>
          <div className={classes.menuContainer}>
            <div className={classes.menu} onClick={toggleMenu} ref={anchorEl}>
              <ForumIcon icon="EllipsisVertical" />
            </div>
            <PopperCard
              open={isOpen}
              anchorEl={anchorEl.current}
              placement="bottom-end"
            >
              <LWClickAwayListener onClickAway={closeMenu}>
                <DropdownMenu>
                  <DropdownItem
                    title="Mark all as read"
                    onClick={markAllAsRead}
                  />
                  <DropdownItem
                    title="Notification settings"
                    to={notificationsSettingsLink}
                    onClick={closeNotifications}
                  />
                </DropdownMenu>
              </LWClickAwayListener>
            </PopperCard>
          </div>
          {showNotifications
            ? (
              <>
                <SectionTitle
                  title="Karma & reacts"
                  titleClassName={classes.sectionTitle}
                />
                {!!hasNewKarmaChanges &&
                  <NotificationsPageKarmaChangeList
                    karmaChanges={cachedKarmaChanges}
                  />
                }
                {!hasNewKarmaChanges && !hasKarmaChangesToday &&
                  <div className={classes.noKarma}>
                    No new karma or reacts{getKarmaFrequency(updateFrequency)}.{" "}
                    <NotifPopoverLink
                      to={karmaSettingsLink}
                      className={classes.link}
                    >
                      Change settings
                    </NotifPopoverLink>
                  </div>
                }
                {!!hasKarmaChangesToday &&
                  <div>
                    <div className={classes.karmaSubsectionTitle}>Today</div>
                    <NotificationsPageKarmaChangeList
                      karmaChanges={todaysKarmaChanges}
                      truncateAt={3}
                    />
                  </div>
                }
                <SectionTitle
                  title="Posts & comments"
                  titleClassName={classes.sectionTitle}
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
            : notificationsLoading
              ? (
                <Loading className={classes.mainLoading} />
              )
              : (
                <NoNotificationsPlaceholder
                  subscribedToDigest={subscribedToDigest}
                />
              )
          }
        </div>
      </NotificationsPopoverContext.Provider>
    </AnalyticsContext>
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
