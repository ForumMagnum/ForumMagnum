import React, { useCallback, useRef, useState, ChangeEvent } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { Link } from "../../../lib/reactRouterWrapper";
import {
  isNotificationsPageTabName,
  notificationPageTabs,
  useNotificationsPageTab,
} from "./notificationsPageTabs";
import Tabs from "@/lib/vendor/@material-ui/core/src/Tabs";
import Tab from "@/lib/vendor/@material-ui/core/src/Tab";
import type { NotificationDisplay } from "../../../lib/notificationTypes";
import type { KarmaChanges } from "../../../server/collections/users/karmaChangesGraphQL";
import type { KarmaChangeUpdateFrequency } from "@/lib/collections/users/helpers";
import { useNotificationDisplays } from "./useNotificationDisplays";

export const karmaSettingsLink = "/account?highlightField=karmaChangeNotifierSettings";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    width: 760,
    maxWidth: "100%",
    margin: "0 auto",
  },
  tabs: {
    marginBottom: 24,
    "& .MuiTabs-flexContainer": {
      gap: "32px",
    },
    "& .MuiTab-root": {
      minWidth: 100,
      [theme.breakpoints.down("xs")]: {
        minWidth: 50,
      },
    },
    "& .MuiTab-labelContainer": {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "0.28px",
      textTransform: "uppercase",
    },
  },
  karmaChanges: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: 10,
  },
  karmaBatching: {
    marginBottom: 32,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "140%",
    color: theme.palette.grey[600],
    "& span:first-child": {
      marginRight: 4,
    },
    "& a": {
      color: theme.palette.primary.dark,
      fontWeight: 600,
    },
  },
  notifications: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: 10,
  },
});

const DEFAULT_LIMIT = 20;

const batchingMessages: Record<KarmaChangeUpdateFrequency, string> = {
  disabled: "Karma change batching is disabled",
  daily: "Karma changes are batched daily",
  weekly: "Karma changes are batched weekly",
  realtime: "Karma changes are shown in realtime",
};

export const NotificationsPageFeed = ({karmaChanges, classes}: {
  karmaChanges?: KarmaChanges|null,
  classes: ClassesType<typeof styles>,
}) => {
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const {tab, setTab} = useNotificationsPageTab();

  const {
    data,
    error,
    loading,
    networkStatus,
  } = useNotificationDisplays(limit, tab.type);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading notifications:", error);
  }

  const loadMore = useCallback(() => {
    setLimit((currentLimit) => currentLimit + DEFAULT_LIMIT);
  }, []);

  const notifications = useRef<NotificationDisplay[]>([]);
  if (data?.NotificationDisplays?.results && !loading) {
    notifications.current = data.NotificationDisplays.results;
  }

  const canLoadMore = !loading &&
    notifications.current.length > 0 &&
    notifications.current.length >= limit;

  const hasKarmaChanges = Boolean(
    karmaChanges?.posts?.length ||
    karmaChanges?.comments?.length ||
    karmaChanges?.tagRevisions?.length
  );
  const showKarmaChanges = hasKarmaChanges && tab.name === "all";

  const onChangeTab = useCallback((_: ChangeEvent, tabName: string) => {
    if (isNotificationsPageTabName(tabName)) {
      notifications.current = [];
      setLimit(DEFAULT_LIMIT);
      setTab(tabName);
    }
  }, [setTab]);

  const {
    NotificationsPageNotification, NotificationsPageKarmaChangeList,
    NotificationsPageEmpty, LoadMore, Loading, SectionTitle,
  } = Components;
  return (
    <div className={classes.root}>
      <Tabs
        value={tab.name}
        onChange={onChangeTab}
        className={classes.tabs}
        textColor="primary"
        aria-label="select notification type"
        scrollable
        scrollButtons="off"
      >
        {notificationPageTabs.map(({name}) => (
          <Tab label={name} value={name} key={name} />
        ))}
      </Tabs>
      {showKarmaChanges &&
        <>
          <SectionTitle title="Karma and reactions" />
          <div className={classes.karmaChanges}>
            <NotificationsPageKarmaChangeList karmaChanges={karmaChanges ?? undefined} />
            <div className={classes.karmaBatching}>
              <span>{batchingMessages[karmaChanges!.updateFrequency]}{" "}</span>
              <Link to={karmaSettingsLink}>
                Change settings
              </Link>
            </div>
          </div>
          <SectionTitle title="All other" />
        </>
      }
      {notifications.current.length === 0 && !loading &&
        <NotificationsPageEmpty tabName={tab.name} />
      }
      {notifications?.current?.length > 0 &&
        <div className={classes.notifications}>
          {notifications.current.map((notification) => (
            <NotificationsPageNotification
              key={notification._id}
              notification={notification}
            />
          ))}
        </div>
      }
      {loading && <Loading />}
      {canLoadMore &&
        <LoadMore
          loadMore={loadMore}
          loading={loading}
          networkStatus={networkStatus}
        />
      }
    </div>
  );
}

const NotificationsPageFeedComponent = registerComponent(
  "NotificationsPageFeed",
  NotificationsPageFeed,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageFeed: typeof NotificationsPageFeedComponent
  }
}
