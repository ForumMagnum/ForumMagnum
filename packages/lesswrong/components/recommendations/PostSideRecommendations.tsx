import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

const WIDTH = 250;

const styles = (_theme: ThemeType) => ({
  root: {
    width: WIDTH,
    minWidth: WIDTH,
    maxWidth: WIDTH,
  },
});

const PostSideRecommendations = ({post, className, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  className?: string,
  classes: ClassesType,
}) => {
  return (
    <div className={classNames(classes.root, className)}>
      Hello world
    </div>
  );
}

const PostSideRecommendationsComponent = registerComponent(
  "PostSideRecommendations",
  PostSideRecommendations,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostSideRecommendations: typeof PostSideRecommendationsComponent
  }
}
