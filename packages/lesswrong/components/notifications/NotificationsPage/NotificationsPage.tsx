import React, { useEffect } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
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
  const {notificationsOpened} = useUnreadNotifications();

  useEffect(() => {
    void notificationsOpened();
  }, [notificationsOpened]);


  if (!currentUser) {
    const {WrappedLoginForm} = Components;
    return (
      <WrappedLoginForm />
    );
  }

  const {NotificationsPageFeed} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <NotificationsPageTabContextProvider>
        <NotificationsPageFeed currentUser={currentUser} />
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
