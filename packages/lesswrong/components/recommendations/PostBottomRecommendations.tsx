import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import { useRecentOpportunities } from "../hooks/useRecentOpportunities";
import NoSSR from "react-no-ssr";
import type {
  RecommendationsAlgorithmWithStrategy,
} from "../../lib/collections/users/recommendationSettings";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";

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

const PostBottomRecommendations = ({post, classes}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
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

  const {
    results: digestPosts,
    loading: digestLoading,
  } = usePaginatedResolver({
    fragmentName: "PostsWithNavigation",
    resolverName: "DigestPostsThisWeek",
    limit: 3,
  });

  const {
    results: opportunityPosts,
    loading: opportunitiesLoading,
  } = useRecentOpportunities({
    fragmentName: "PostsListWithVotesAndSequence",
  });

  const {
    RecommendationsList, PostsLoading, EAPostsItem, EALargePostsItem,
  } = Components;
  return (
    <AnalyticsContext pageSectionContext="postPageFooterRecommendations">
      <div className={classes.root}>
        <div className={classes.section}>
          <div className={classes.sectionHeading}>
            More from {post.user?.displayName}
          </div>
          <AnalyticsContext pageSubSectionContext="moreFromAuthor">
            <NoSSR onSSR={<PostsLoading />}>
              <RecommendationsList
                algorithm={moreFromAuthorAlgorithm}
                loadingFallback={<PostsLoading />}
                ListItem={EAPostsItem}
              />
            </NoSSR>
            <div className={classes.viewMore}>
              <Link to={userGetProfileUrl(post.user)}>
                View more
              </Link>
            </div>
          </AnalyticsContext>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionHeading}>
            Recommended by the Forum team this week
          </div>
          {digestLoading && <PostsLoading />}
          <AnalyticsContext pageSubSectionContext="digestThisWeek">
            {digestPosts?.map((post) => (
              <EALargePostsItem post={post} />
            ))}
          </AnalyticsContext>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionHeading}>
            Recent opportunities
          </div>
          {opportunitiesLoading && <PostsLoading />}
          <AnalyticsContext pageSubSectionContext="recentOpportunities">
            {opportunityPosts?.map((post) => (
              <EAPostsItem post={post} />
            ))}
            <div className={classes.viewMore}>
              <Link to="/topics/opportunities-to-take-action">
                View more
              </Link>
            </div>
          </AnalyticsContext>
        </div>
      </div>
    </AnalyticsContext>
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
