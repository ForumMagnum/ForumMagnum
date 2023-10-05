import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { POST_PREVIEW_WIDTH } from "./helpers";
import type { PostsPreviewTooltipProps } from "./PostsPreviewTooltip";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: POST_PREVIEW_WIDTH,
  },
});

type EAPostsPreviewTooltipProps = PostsPreviewTooltipProps & {
  classes: ClassesType,
}

const EAPostsPreviewTooltip = ({
  postsList,
  post,
  hash,
  classes,
  comment,
}: EAPostsPreviewTooltipProps) => {

  return (
    <AnalyticsContext pageElementContext="hoverPreview">
      <div className={classes.root}>
      </div>
    </AnalyticsContext>
  );
}

const EAPostsPreviewTooltipComponent = registerComponent(
  "EAPostsPreviewTooltip",
  EAPostsPreviewTooltip,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAPostsPreviewTooltip: typeof EAPostsPreviewTooltipComponent
  }
}
