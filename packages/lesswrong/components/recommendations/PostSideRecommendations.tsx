import React, { FC } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { usePostSideRecommendations } from "../../lib/postSideComments";
import { useCurrentUser } from "../common/withUser";
import classNames from "classnames";
import NoSSR from "react-no-ssr";

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

const PostSideRecommendationsImpl: FC<{
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType,
}> = ({post,  classes}) => {
  const currentUser = useCurrentUser();
  const recommendations = usePostSideRecommendations(currentUser, post);
  if (!recommendations) {
    return null;
  }
  const {title, numbered, items} = recommendations;
  const List = numbered ? "ol" : "ul";
  return (
    <>
      <div className={classes.title}>{title}</div>
      <List className={classes.list}>
        {items.map((Item, i) => <Item key={i} />)}
      </List>
    </>
  );
}

const PostSideRecommendations = ({post, className, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  className?: string,
  classes: ClassesType,
}) => {
  const loadingFallback = (
    <div className={classes.listWrapper}>
      <Components.Loading />
    </div>
  );
  return (
    <div className={classNames(classes.root, className)}>
      <NoSSR onSSR={loadingFallback}>
        <PostSideRecommendationsImpl {...{post, className, classes}} />
      </NoSSR>
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
