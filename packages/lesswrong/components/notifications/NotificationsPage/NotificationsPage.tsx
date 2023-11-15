import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { gql, useQuery } from "@apollo/client";
import { useCurrentUser } from "../../common/withUser";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useSingle } from "../../../lib/crud/withSingle";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import type { NotificationDisplay } from "../../../lib/notificationTypes";

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
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [tabIndex, setTabIndex] = useState(0);
  const currentTab = tabs[tabIndex] ?? tabs[0];
  const canLoadMore = currentTab.name !== "karma";

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
      {currentTab.name === "karma" && karmaChanges &&
        <NotificationsPageKarma karmaChanges={karmaChanges} />
      }
      {currentTab.name !== "karma" && (
        notifications.current.map((notification) => (
          <NotificationsPageItem
            key={notification._id}
            notification={notification}
          />
        ))
      )}
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
