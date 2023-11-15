import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { gql, useQuery } from "@apollo/client";
import { useCurrentUser } from "../../common/withUser";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { useSingle } from "../../../lib/crud/withSingle";
import { Link } from "../../../lib/reactRouterWrapper";
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
  title: {
    fontSize: 28,
    fontWeight: 600,
    margin: "40px 0",
  },
  tabs: {
    marginBottom: 16,
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
    marginTop: 24,
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

const tabs = [
  {
    name: "all",
    type: undefined,
  },
  {
    name: "karma",
    type: undefined,
  },
  {
    name: "comments",
    type: "newComment",
  },
  {
    name: "reactions",
    type: "reactions",
  },
  {
    name: "new posts",
    type: "newPost",
  },
] as const;

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

export const NotificationsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {notificationsOpened} = useUnreadNotifications();
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [tabIndex, setTabIndex] = useState(0);
  const currentTab = tabs[tabIndex] ?? tabs[0];
  const canLoadMore = currentTab.name !== "karma";

  useEffect(() => {
    void notificationsOpened();
  }, [notificationsOpened]);

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
      type: currentTab.type,
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
    notifications.current = [];
    setLimit(DEFAULT_LIMIT);

    const newTabIndex = tabs.findIndex(({name}) => name === tabName);
    setTabIndex(newTabIndex >= 0 ? newTabIndex : 0);

    if (tabName === "karma" && karmaChanges?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.karmaChanges.endDate,
        karmaChangeBatchStart: karmaChanges.karmaChanges.startDate,
      });
    }
  }, [karmaChanges?.karmaChanges, updateCurrentUser]);

  if (!currentUser) {
    const {WrappedLoginForm} = Components;
    return (
      <WrappedLoginForm />
    );
  }

  const {NotificationsPageKarma, NotificationsPageItem, LoadMore} = Components;

  const feeds: Feed[] = [];
  if (
    karmaChanges?.karmaChanges &&
    (currentTab.name === "all" || currentTab.name === "karma")
  ) {
    feeds.push({
      items: [karmaChanges.karmaChanges],
      getId: ({endDate}: KarmaChanges) => `karma-${endDate}`,
      getDate: ({endDate}: KarmaChanges) => new Date(endDate),
      Component: ({item}: {item: KarmaChanges}) => (
        <NotificationsPageKarma karmaChanges={item} />
      ),
    });
  }
  if (currentTab.name !== "karma") {
    feeds.push({
      items: notifications.current,
      getId: ({_id}: NotificationDisplay) => _id,
      getDate: ({createdAt}: NotificationDisplay) => new Date(createdAt),
      Component: ({item}: {item: NotificationDisplay}) => (
        <NotificationsPageItem notification={item} />
      ),
    });
  }

  const batchedText = karmaChanges?.karmaChanges?.updateFrequency === "realtime"
    ? "in realtime"
    : `batched ${karmaChanges?.karmaChanges?.updateFrequency}`;

  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <Tabs
        value={currentTab.name}
        onChange={onChangeTab}
        className={classes.tabs}
        textColor="primary"
        aria-label="select notification type"
        scrollable
        scrollButtons="off"
      >
        {tabs.map(({name}) => (
          <Tab label={name} value={name} key={name} />
        ))}
      </Tabs>
      {currentTab.name === "karma" &&
        <div className={classes.karmaBatching}>
          Karma notifications are {batchedText}
          <Link to="/account">Change settings</Link>
        </div>
      }
      {feeds
        .flatMap((feed) => feed.items.map((item) => ({item, feed})))
        .sort((a, b) =>
          a.feed.getDate(a.item).getTime() - b.feed.getDate(a.item).getTime()
        )
        .map(({item, feed: {Component, getId}}) => (
          <Component item={item} key={getId(item)} />
        ))
      }
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

const NotificationsPageComponent = registerComponent(
  "NotificationsPage",
  NotificationsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPage: typeof NotificationsPageComponent
  }
}
