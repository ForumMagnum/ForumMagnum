import React, { useEffect } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useSingle } from "../../../lib/crud/withSingle";
import { useCurrentUser } from "../../common/withUser";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { NotificationsPageTabContextProvider } from "./notificationsPageTabs";

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
  const {document: karmaChanges} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
    skip: !currentUser,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-only",
  });

  useEffect(() => {
    void notificationsOpened();
  }, [notificationsOpened]);

  useEffect(() => {
    if (karmaChanges?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.karmaChanges.endDate,
        karmaChangeBatchStart: karmaChanges.karmaChanges.startDate,
      });
    }
  }, [karmaChanges?.karmaChanges, updateCurrentUser]);

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
        <NotificationsPageFeed
          karmaChanges={karmaChanges?.karmaChanges}
          currentUser={currentUser}
        />
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
