import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

export const ForumEventFrontpageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      frontpage banner
    </div>
  );
}

const ForumEventFrontpageBannerComponent = registerComponent(
  "ForumEventFrontpageBanner",
  ForumEventFrontpageBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventFrontpageBanner: typeof ForumEventFrontpageBannerComponent
  }
}
