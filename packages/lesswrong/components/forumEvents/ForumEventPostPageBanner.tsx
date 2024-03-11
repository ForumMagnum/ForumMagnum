import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

export const ForumEventPostPageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentForumEvent();
  if (!currentForumEvent) {
    return null;
  }

  return (
    <div className={classes.root}>
      post page banner
    </div>
  );
}

const ForumEventPostPageBannerComponent = registerComponent(
  "ForumEventPostPageBanner",
  ForumEventPostPageBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventPostPageBanner: typeof ForumEventPostPageBannerComponent
  }
}
