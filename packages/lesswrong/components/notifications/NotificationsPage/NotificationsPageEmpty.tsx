import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { Link } from "../../../lib/reactRouterWrapper";
import type { NotificationsPageTabName } from "./notificationsPageTabs";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    margin: "50px auto",
    width: 290,
    maxWidth: "100%",
    textAlign: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
});

const NotificationsPageEmpty = ({tabName, classes}: {
  tabName: NotificationsPageTabName,
  classes: ClassesType<typeof styles>,
}) => {
  switch (tabName) {
  case "all":
    return (
      <div className={classes.root}>
        <div>
          You have no notifications.
        </div>
      </div>
    );
  case "comments":
    return (
      <div className={classes.root}>
        <div>
          You have no notifications for comments.
        </div>
        <div>
          <Link to="/allPosts">Comment on a post</Link> to receive replies.
        </div>
      </div>
    );
  case "new posts":
    return (
      <div className={classes.root}>
        <div>
          You have no notifications for posts.
        </div>
        <div>
          <Link to="/topics">Subscribe to a topic</Link> or an author to get
          notified about new posts.
        </div>
      </div>
    );
  default:
    return null;
  }
}

const NotificationsPageEmptyComponent = registerComponent(
  "NotificationsPageEmpty",
  NotificationsPageEmpty,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageEmpty: typeof NotificationsPageEmptyComponent,
  }
}
