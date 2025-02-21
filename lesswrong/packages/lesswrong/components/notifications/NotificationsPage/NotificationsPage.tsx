import React, { useEffect, useRef } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useSingle } from "../../../lib/crud/withSingle";
import { useCurrentUser } from "../../common/withUser";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { NotificationsPageTabContextProvider } from "./notificationsPageTabs";
import type { KarmaChanges } from "../../../lib/collections/users/karmaChangesGraphQL";

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
});

export const NotificationsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {notificationsOpened} = useUnreadNotifications();
  const {document: fetchedKarmaChanges} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
    skip: !currentUser,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-only",
  });

  // Save the initial karma changes to display, as they'll be marked as read
  // once the user visits the page and they'll dissapear
  const karmaChanges = useRef<KarmaChanges>();
  if (fetchedKarmaChanges && !karmaChanges.current) {
    karmaChanges.current = fetchedKarmaChanges.karmaChanges;
  }

  useEffect(() => {
    void notificationsOpened();
  }, [notificationsOpened]);

  useEffect(() => {
    if (karmaChanges.current) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.current.endDate,
        karmaChangeBatchStart: karmaChanges.current.startDate,
      });
    }
  }, [fetchedKarmaChanges, updateCurrentUser]);

  if (!currentUser) {
    const {LoginForm} = Components;
    return (
      <LoginForm />
    );
  }

  const {NotificationsPageFeed} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <NotificationsPageTabContextProvider>
        <NotificationsPageFeed karmaChanges={karmaChanges.current} />
      </NotificationsPageTabContextProvider>
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
