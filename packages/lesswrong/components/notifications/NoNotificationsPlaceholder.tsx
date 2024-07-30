import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    padding: "60px 24px",
    color: theme.palette.grey[600],
    lineHeight: "140%",
    textAlign: "center",
  },
  icon: {
    width: 60,
    height: 60,
  },
  title: {
    color: theme.palette.grey[1000],
    fontSize: 18,
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 500,
  },
});

const SubscribedPlaceholder = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <ForumIcon icon="BellBorder" className={classes.icon} />
      <div className={classes.title}>
        No notifications yet
      </div>
      <div className={classes.subtitle}>
        Subscribe to posts, authors or comments to get notified about new activity
      </div>
    </div>
  );
}

const NotSubscribedPlaceholder = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.title}>
        Turn on email digest
      </div>
      <div className={classes.subtitle}>
        The EA Forum Digest is a curated reading list of Forum posts,{" "}
        sent every Wednesday
      </div>
    </div>
  );
}

const NoNotificationsPlaceholder = ({subscribedToDigest, classes}: {
  subscribedToDigest: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    subscribedToDigest
      ? <SubscribedPlaceholder classes={classes} />
      : <NotSubscribedPlaceholder classes={classes} />
    );
}

const NoNotificationsPlaceholderComponent = registerComponent(
  "NoNotificationsPlaceholder",
  NoNotificationsPlaceholder,
  {styles},
);

declare global {
  interface ComponentTypes {
    NoNotificationsPlaceholder: typeof NoNotificationsPlaceholderComponent
  }
}
