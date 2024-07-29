import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { styles as popoverStyles } from "../common/FriendlyHoverOver";

const styles = (theme: ThemeType) => ({
  root: {
    ...popoverStyles(theme).root,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
    width: 400,
    maxWidth: "95vw",
    maxHeight: "95vh",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 12,
  },
});

const NotificationsPopover = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {SectionTitle} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <SectionTitle title="Karma & reacts" className={classes.sectionTitle} />
      <SectionTitle title="Posts & comments" className={classes.sectionTitle} />
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
