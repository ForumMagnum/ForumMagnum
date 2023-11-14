import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {

  },
});

export const NotificationsPageItem = ({item, classes}: {
  item: NotificationsList,
  classes: ClassesType<typeof styles>,
}) => {
  const {type} = item;
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
