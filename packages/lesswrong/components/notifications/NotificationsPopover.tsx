import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { HEADER_HEIGHT } from "../common/Header";
import { useCurrentUser } from "../common/withUser";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";
import { useNotificationDisplays } from "./NotificationsPage/useNotificationDisplays";
import { karmaSettingsLink } from "./NotificationsPage/NotificationsPageFeed";
import type { NotificationDisplay } from "@/lib/notificationTypes";
import type { KarmaChangeUpdateFrequency } from "@/lib/collections/users/helpers";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { NotificationsPopoverContext, NotifPopoverLink } from "./useNotificationsPopoverContext";
import { gql, useMutation } from "@apollo/client";
import classNames from "classnames";
import { SectionTitle } from "../common/SectionTitle";
import { NotificationsPageKarmaChangeList } from "./NotificationsPage/NotificationsPageKarmaChangeList";
import { NoNotificationsPlaceholder } from "./NoNotificationsPlaceholder";
import { LoadMore } from "../common/LoadMore";
import { NotificationsPopoverNotification } from "./NotificationsPopoverNotification";
import { ForumIcon } from "../common/ForumIcon";
import { LWClickAwayListener } from "../common/LWClickAwayListener";
import { PopperCard } from "../common/PopperCard";
import { DropdownMenu } from "../dropdowns/DropdownMenu";
import { DropdownItem } from "../dropdowns/DropdownItem";
import { Loading } from "../vulcan-core/Loading";

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
  karmaNotificationMessage: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  noKarma: {
    marginTop: 3,
    marginBottom: 12,
    fontStyle: "italic"
  },
  karmaSubsectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.grey[600],
    marginBottom: 6,
  },
  link: {
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  notifications: {
    margin: "0 -8px",
  },
  notification: {
    display: "flex",
  },
  mainLoading: {
    display: "flex",
    alignItems: "center",
    height: 350,
  },
});

const getSettingsNudge = (batchingFrequency: KarmaChangeUpdateFrequency) => {
  switch (batchingFrequency) {
    case "realtime":  return "appear in real time";
    case "daily":  return "are batched daily";
    case "weekly": return "are batched weekly";
    case "disabled": return "are disabled";
  }
}

const defaultLimit = 20;

const NotificationsPopoverInner = ({
  karmaChanges,
  onOpenNotificationsPopover,
  closePopover,
  classes,
}: {
  karmaChanges?: KarmaChanges,
  onOpenNotificationsPopover?: () => void,
  closePopover?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [limit, setLimit] = useState(defaultLimit);
  const {
    data,
    loading: notificationsLoading,
    refetch,
  } = useNotificationDisplays(limit);
  const loadMore = useCallback(() => setLimit((limit) => limit + 10), []);
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [cachedKarmaChanges] = useState(karmaChanges);

  const toggleMenu = useCallback(() => {
    setIsOpen((open) => !open);
    onOpenNotificationsPopover?.();
  }, [onOpenNotificationsPopover]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const closeNotifications = useCallback(() => {
    closeMenu();
    closePopover?.();
  }, [closePopover, closeMenu]);

  const [markAllAsReadMutation] = useMutation(gql`
    mutation MarkAllNotificationsAsRead {
      MarkAllNotificationsAsRead
    }
  `);

  const markAllAsRead = useCallback(async () => {
    try {
      setMarkingAsRead(true);
      await markAllAsReadMutation();
      await refetch();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setMarkingAsRead(false);
    }
  }, [markAllAsReadMutation, refetch]);

  const notifs: NotificationDisplay[] = data?.NotificationDisplays?.results ?? [];

  useEffect(() => {
    if (!notificationsLoading && notifs.length <= defaultLimit) {
      onOpenNotificationsPopover?.();
    }
  }, [notificationsLoading, onOpenNotificationsPopover, notifs.length]);

  const hasNewKarmaChanges = useMemo(() => cachedKarmaChanges &&
    (
      cachedKarmaChanges.posts?.length ||
      cachedKarmaChanges.comments?.length ||
      cachedKarmaChanges.tagRevisions?.length
    ), [cachedKarmaChanges]
  )
  // Show a section under the new karma notifications called "Today",
  // which includes all karma notifications from the past 24 hours
  const todaysKarmaChanges = cachedKarmaChanges?.todaysKarmaChanges
  const hasKarmaChangesToday = useMemo(() => todaysKarmaChanges &&
    (
      todaysKarmaChanges.posts?.length ||
      todaysKarmaChanges.comments?.length ||
      todaysKarmaChanges.tagRevisions?.length
    ), [todaysKarmaChanges]
  )
  // Show a section under the new karma notifications called "This week",
  // which includes all karma notifications from the past week
  const thisWeeksKarmaChanges = cachedKarmaChanges?.thisWeeksKarmaChanges
  const hasKarmaChangesThisWeek = useMemo(() => thisWeeksKarmaChanges &&
    (
      thisWeeksKarmaChanges.posts?.length ||
      thisWeeksKarmaChanges.comments?.length ||
      thisWeeksKarmaChanges.tagRevisions?.length
    ), [thisWeeksKarmaChanges]
  )

  if (!currentUser) {
    return null;
  }

  const {
    karmaChangeNotifierSettings: {updateFrequency},
    subscribedToDigest,
  } = currentUser;

  const showNotifications = !!(notifs.length > 0 || hasNewKarmaChanges || hasKarmaChangesToday || hasKarmaChangesThisWeek);
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
                    loading={markingAsRead}
                    disabled={markingAsRead}
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
                {!hasNewKarmaChanges && !hasKarmaChangesToday && !hasKarmaChangesThisWeek &&
                  <div className={classNames(classes.karmaNotificationMessage, classes.noKarma)}>
                    <em>No new karma or reacts</em>
                  </div>
                }
                {!!hasKarmaChangesToday &&
                  <div>
                    <div className={classes.karmaSubsectionTitle}>Today</div>
                    <NotificationsPageKarmaChangeList
                      karmaChanges={todaysKarmaChanges ?? undefined}
                      truncateAt={3}
                    />
                  </div>
                }
                {!!hasKarmaChangesThisWeek &&
                  <div>
                    <div className={classes.karmaSubsectionTitle}>This week</div>
                    <NotificationsPageKarmaChangeList
                      karmaChanges={thisWeeksKarmaChanges ?? undefined}
                      truncateAt={2}
                    />
                  </div>
                }
                <div className={classes.karmaNotificationMessage}>
                  Notifications {getSettingsNudge(updateFrequency)}.{" "}
                  <NotifPopoverLink
                    to={karmaSettingsLink}
                    className={classes.link}
                  >
                    Change settings
                  </NotifPopoverLink>
                </div>
                <SectionTitle
                  title="Posts & comments"
                  titleClassName={classes.sectionTitle}
                />
                <div className={classes.notifications}>
                  {notifs.map((notification) =>
                    <NotificationsPopoverNotification
                      key={notification._id}
                      notification={notification}
                      refetch={refetch}
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
                  subscribedToDigest={!!subscribedToDigest}
                />
              )
          }
        </div>
      </NotificationsPopoverContext.Provider>
    </AnalyticsContext>
  );
}

export const NotificationsPopover = registerComponent(
  "NotificationsPopover",
  NotificationsPopoverInner,
  {styles},
);


