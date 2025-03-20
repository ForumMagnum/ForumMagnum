import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { DisplayFeedPostWithComments } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";

// Styles for the UltraFeedPostThreadItem component
const styles = defineStyles("UltraFeedPostThreadItem", (theme: ThemeType) => ({
  root: {
    // Empty for now
  },
}));

// Main component definition
const UltraFeedPostThreadItem = ({thread}: {
  thread: DisplayFeedPostWithComments,
}) => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();

  const { UltraFeedPostItem } = Components;
  const { post, comments } = thread;

  return (
    <div className={classes.root}>
      <UltraFeedPostItem post={post} />
      {/* TODO: Add comments */}
    </div>
  );
}

const UltraFeedPostThreadItemComponent = registerComponent(
  "UltraFeedPostThreadItem",
  UltraFeedPostThreadItem
);

export default UltraFeedPostThreadItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedPostThreadItem: typeof UltraFeedPostThreadItemComponent
  }
} 