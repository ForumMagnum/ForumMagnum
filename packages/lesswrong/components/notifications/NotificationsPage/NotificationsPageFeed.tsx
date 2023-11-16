import React, { FC, useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useSingle } from "../../../lib/crud/withSingle";
import { gql, useQuery } from "@apollo/client";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { Link } from "../../../lib/reactRouterWrapper";
import {
  isNotificationsPageTabName,
  notificationPageTabs,
  useNotificationsPageTab,
} from "./notificationsPageTabs";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import type { NotificationDisplay } from "../../../lib/notificationTypes";
import type { KarmaChanges } from "../../../lib/types/karmaChangesTypes";

type Feed<T = unknown> = {
  items: T[],
  getId: (item: T) => string,
  getDate: (item: T) => Date,
  Component: FC<{item: T}>,
}

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
  karmaBatching: {
    marginBottom: 24,
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 600,
      marginLeft: 10,
    },
  },
});

// We have to do this manually outside of `usePaginatedResolver` because the
// return type is pure unadulterated JSON, not a registered fragment type
const query = gql`
  query getNotificationDisplays($limit: Int, $type: String) {
    NotificationDisplays(limit: $limit, type: $type) {
      results
    }
  }
`;

const DEFAULT_LIMIT = 20;

export const NotificationsPageFeed = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const {tab, setTab} = useNotificationsPageTab();
  const canLoadMore = tab.name !== "karma";

  const {document: karmaChanges} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
    skip: !currentUser,
  });

  const {
    data,
    error,
    loading,
    networkStatus,
  } = useQuery(query, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    skip: !currentUser,
    pollInterval: 0,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
    variables: {
      type: tab.type,
      limit,
    },
  });

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

  const onChangeTab = useCallback((_: React.ChangeEvent, tabName: string) => {
    if (!isNotificationsPageTabName(tabName)) {
      return;
    }

    notifications.current = [];
    setLimit(DEFAULT_LIMIT);
    setTab(tabName);

    if (tabName === "karma" && karmaChanges?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.karmaChanges.endDate,
        karmaChangeBatchStart: karmaChanges.karmaChanges.startDate,
      });
    }
  }, [karmaChanges?.karmaChanges, updateCurrentUser, setTab]);

  const {
    NotificationsPageKarma, NotificationsPageItem, LoadMore,
    NotificationsPageEmpty,
  } = Components;

  const feeds: Feed[] = [];
  if (karmaChanges?.karmaChanges && (tab.name === "all" || tab.name === "karma")) {
    feeds.push({
      items: [karmaChanges.karmaChanges],
      getId: ({endDate}: KarmaChanges) => `karma-${endDate}`,
      getDate: ({endDate}: KarmaChanges) => new Date(endDate),
      Component: ({item}: {item: KarmaChanges}) => (
        <NotificationsPageKarma karmaChanges={item} />
      ),
    });
  }
  if (tab.name !== "karma") {
    feeds.push({
      items: notifications.current,
      getId: ({_id}: NotificationDisplay) => _id,
      getDate: ({createdAt}: NotificationDisplay) => new Date(createdAt),
      Component: ({item}: {item: NotificationDisplay}) => (
        <NotificationsPageItem notification={item} />
      ),
    });
  }

  const flatFeed = feeds
    .flatMap((feed) => feed.items.map((item) => ({item, feed})))
    .sort((a, b) =>
      a.feed.getDate(a.item).getTime() - b.feed.getDate(a.item).getTime()
    );

  const batchedText = karmaChanges?.karmaChanges?.updateFrequency === "realtime"
    ? "in realtime"
    : `batched ${karmaChanges?.karmaChanges?.updateFrequency}`;

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
      {tab.name === "karma" &&
        <div className={classes.karmaBatching}>
          Karma notifications are {batchedText}
          <Link to="/account">Change settings</Link>
        </div>
      }
      {flatFeed.length === 0 && !loading &&
        <NotificationsPageEmpty tabName={tab.name} />
      }
      {flatFeed.map(({item, feed: {Component, getId}}) => (
        <Component item={item} key={getId(item)} />
      ))}
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
