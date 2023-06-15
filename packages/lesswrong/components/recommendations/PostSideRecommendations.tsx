import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePostSideRecommendations } from "../../lib/postSideRecommendations";
import { useCurrentUser } from "../common/withUser";
import classNames from "classnames";

const WIDTH = 250;

const styles = (theme: ThemeType) => ({
  root: {
    width: WIDTH,
    minWidth: WIDTH,
    maxWidth: WIDTH,
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
  },
  list: {
    "& li": {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 13,
      fontWeight: 500,
    },
  },
});

const PostSideRecommendations = ({post, className, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  className?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {
    loading,
    title,
    numbered,
    items,
  } = usePostSideRecommendations(currentUser, post);
  const List = numbered ? "ol" : "ul";
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.title}>{title}</div>
      {loading && <Components.Loading />}
      <List className={classes.list}>
        {items.map((Item, i) => <Item key={i} />)}
      </List>
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
