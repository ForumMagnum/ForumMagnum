import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";

const styles = (theme: ThemeType) => ({
  root: {
    ...popoverStyles(theme).root,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
  },
});

const NotificationsPopover = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      Notifications are here this is a long bit of text
    </div>
  );
}

const NotificationsPopoverComponent = registerComponent(
  "NotificationsPopover",
  NotificationsPopover,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPopover: typeof NotificationsPopoverComponent
  }
}
