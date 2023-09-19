import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[55],
    padding: 80,
    marginTop: 80,
  },
});

const PostBottomRecommendations = ({classes}: {
  classes: ClassesType,
}) => {
  return (
    <div className={classes.root}>
      Bottom recommendations
    </div>
  );
}

const PostBottomRecommendationsComponent = registerComponent(
  "PostBottomRecommendations",
  PostBottomRecommendations,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostBottomRecommendations: typeof PostBottomRecommendationsComponent
  }
}
