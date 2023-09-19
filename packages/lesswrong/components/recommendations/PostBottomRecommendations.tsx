import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import NoSSR from "react-no-ssr";
import type { RecommendationsAlgorithmWithStrategy } from "../../lib/collections/users/recommendationSettings";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[55],
    padding: 80,
    marginTop: 80,
  },
  section: {
    maxWidth: SECTION_WIDTH,
    margin: "0 auto 60px",
  },
  sectionHeading: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 20,
    fontWeight: 600,
    color: theme.palette.grey[1000],
    marginBottom: 16,
  },
  viewMore: {
    marginTop: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.grey[600],
  },
});

const ListItem: FC<{post: PostsListWithVotesAndSequence}> = ({post}) => (
  <Components.EAPostsItem post={post} />
);

const PostBottomRecommendations = ({post, classes}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision
  classes: ClassesType,
}) => {
  const moreFromAuthorAlgorithm: RecommendationsAlgorithmWithStrategy = {
    strategy: {
      name: "moreFromAuthor",
      postId: post._id,
      context: "post-footer",
    },
    count: 3,
  };

  const {RecommendationsList, PostsLoading} = Components;

  const loadingFallback = (
    <div className={classes.listWrapper}>
      <PostsLoading />
    </div>
  );

  return (
    <div className={classes.root}>
      <div className={classes.section}>
        <div className={classes.sectionHeading}>
          More from {post.user?.displayName}
        </div>
        <NoSSR onSSR={loadingFallback}>
          <RecommendationsList
            algorithm={moreFromAuthorAlgorithm}
            loadingFallback={loadingFallback}
            ListItem={ListItem}
          />
        </NoSSR>
        <div className={classes.viewMore}>
          <Link to={userGetProfileUrl(post.user)}>
            View more
          </Link>
        </div>
      </div>
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
