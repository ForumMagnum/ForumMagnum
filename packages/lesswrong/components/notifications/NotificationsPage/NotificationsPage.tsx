import React, { useEffect, useRef } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useCurrentUser } from "../../common/withUser";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { NotificationsPageTabContextProvider } from "./notificationsPageTabs";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import LoginForm from "../../users/LoginForm";
import NotificationsPageFeed from "./NotificationsPageFeed";

const UserKarmaChangesQuery = gql(`
  query NotificationsPage($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UserKarmaChanges
      }
    }
  }
`);

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
  const { data } = useQuery(UserKarmaChangesQuery, {
    variables: { documentId: currentUser?._id },
    skip: !currentUser,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-only",
  });
  const fetchedKarmaChanges = data?.user?.result;

  // Save the initial karma changes to display, as they'll be marked as read
  // once the user visits the page and they'll dissapear
  const karmaChanges = useRef<UserKarmaChanges['karmaChanges']|null>(null);
  if (fetchedKarmaChanges && !karmaChanges.current) {
    karmaChanges.current = fetchedKarmaChanges.karmaChanges;
  }

  useEffect(() => {
    void notificationsOpened();
  }, [notificationsOpened]);

  useEffect(() => {
    if (karmaChanges.current) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.current.endDate ? new Date(karmaChanges.current.endDate) : null,
        karmaChangeBatchStart: karmaChanges.current.startDate ? new Date(karmaChanges.current.startDate) : null,
      });
    }
  }, [fetchedKarmaChanges, updateCurrentUser]);

  if (!currentUser) {
    return (
      <LoginForm />
    );
  }
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <NotificationsPageTabContextProvider>
        <NotificationsPageFeed karmaChanges={karmaChanges.current} />
      </NotificationsPageTabContextProvider>
    </div>
  );
}

export default registerComponent(
  "NotificationsPage",
  NotificationsPage,
  {styles},
);


