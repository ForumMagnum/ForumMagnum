import React, { useCallback, useEffect, useRef, useState } from "react";
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

  const closeAll = useCallback(() => {
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

  if (!currentUser) {
    return null;
  }

  const {
    karmaChangeNotifierSettings: {updateFrequency},
    subscribedToDigest,
  } = currentUser;

  const showNotifications = !!(notifs.current.length > 0 || cachedKarmaChanges);

  const {
    SectionTitle, NotificationsPageKarmaChangeList, NoNotificationsPlaceholder,
    LoadMore, NotificationsPopoverNotification, ForumIcon, LWClickAwayListener,
    PopperCard, DropdownMenu, DropdownItem, Loading,
  } = Components;
  return (
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
              className={classes.sectionTitle}
            />
            {cachedKarmaChanges &&
              <NotificationsPageKarmaChangeList karmaChanges={cachedKarmaChanges} />
            }
            {!cachedKarmaChanges &&
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
                  onClick={closeAll}
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
