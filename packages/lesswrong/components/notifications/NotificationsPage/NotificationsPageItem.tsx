import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import type { ForumIconName } from "../../common/ForumIcon";
import type { NotificationDisplay } from "../../../lib/types/notificationDisplayTypes";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

type DisplayDetails = {
  icon: ForumIconName,
  primaryIcon?: boolean,
  userName: string,
  userLink: string,
  action: string,
  postName: string,
  postLink: string,
  timestamp: Date,
}

const getDisplayDetails = ({
  type,
  link,
  createdAt,
}: NotificationDisplay): DisplayDetails | null => {
  switch (type) {
  case "newPost":
    return {
      icon: "DocumentFilled",
      userName: "User",
      userLink: "#",
      action: "created a new post",
      postName: "Post",
      postLink: link,
      timestamp: createdAt,
    };
  case "newComment":
  case "newMention":
  case "newReplyToYou":
    break;
  }
  return null;
}

export const NotificationsPageItem = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const displayDetails = getDisplayDetails(notification);
  if (!displayDetails) {
    return null;
  }
  console.log("details", displayDetails);
  const {
    icon,
    primaryIcon,
    userName,
    userLink,
    action,
    postName,
    postLink,
    timestamp,
  } = displayDetails;
  return (
    <div className={classes.root}>
    </div>
  );
}

const NotificationsPageItemComponent = registerComponent(
  "NotificationsPageItem",
  NotificationsPageItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageItem: typeof NotificationsPageItemComponent
  }
}
