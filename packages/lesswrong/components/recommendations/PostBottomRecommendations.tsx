import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { useRecentOpportunities } from "../hooks/useRecentOpportunities";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { useRecommendations } from "./withRecommendations";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import NoSSR from "react-no-ssr";

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
  largePostItem: {
    marginTop: 16,
  },
  viewMore: {
    marginTop: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.grey[600],
  },
});

type PostBottomRecommendationsProps = {
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  classes: ClassesType,
}

const RecommendationContent: FC<PostBottomRecommendationsProps> = ({
  post,
  classes,
}) => {
  const {
    recommendationsLoading: moreFromAuthorLoading,
    recommendations: moreFromAuthorPosts,
  } = useRecommendations({
    strategy: {
      name: "moreFromAuthor",
      postId: post._id,
      context: "post-footer",
    },
    count: 3,
    disableFallbacks: true,
  });

  const {
    results: digestPosts,
    loading: digestLoading,
  } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "DigestPostsThisWeek",
    limit: 3,
  });

  const {
    results: opportunityPosts,
    loading: opportunitiesLoading,
  } = useRecentOpportunities({
    fragmentName: "PostsListWithVotes",
  });

  const profileUrl = userGetProfileUrl(post.user);

  const hasUserPosts = post.user &&
    (moreFromAuthorLoading || !!moreFromAuthorPosts?.length);

  const {
    PostsLoading, EAPostsItem, EALargePostsItem, UserTooltip,
  } = Components;
  return (
    <>
      {hasUserPosts &&
        <div className={classes.section}>
          <div className={classes.sectionHeading}>
            More from{" "}
            <UserTooltip user={post.user} inlineBlock={false}>
              <Link to={profileUrl}>{post.user.displayName}</Link>
            </UserTooltip>
          </div>
          {moreFromAuthorLoading && !moreFromAuthorPosts?.length &&
            <PostsLoading />
          }
          <AnalyticsContext pageSubSectionContext="moreFromAuthor">
            {moreFromAuthorPosts?.map((post) => (
              <EAPostsItem key={post._id} post={post} />
            ))}
            <div className={classes.viewMore}>
              <Link to={profileUrl}>
                View more
              </Link>
            </div>
          </AnalyticsContext>
        </div>
      }
      <div className={classes.section}>
        <div className={classes.sectionHeading}>
          Recommended by the Forum team this week
        </div>
        {digestLoading && !digestPosts?.length &&
          <PostsLoading />
        }
        <AnalyticsContext pageSubSectionContext="digestThisWeek">
          {digestPosts?.map((post) => (
            <EALargePostsItem
              key={post._id}
              post={post}
              className={classes.largePostItem}
              noImagePlaceholder
            />
          ))}
        </AnalyticsContext>
      </div>
      <div className={classes.section}>
        <div className={classes.sectionHeading}>
          Recent opportunities
        </div>
        {opportunitiesLoading && !opportunityPosts?.length &&
          <PostsLoading />
        }
        <AnalyticsContext pageSubSectionContext="recentOpportunities">
          {opportunityPosts?.map((post) => (
            <EAPostsItem key={post._id} post={post} />
          ))}
          <div className={classes.viewMore}>
            <Link to="/topics/opportunities-to-take-action">
              View more
            </Link>
          </div>
        </AnalyticsContext>
      </div>
    </>
  );
}

const PostBottomRecommendations = ({
  post,
  classes,
}: PostBottomRecommendationsProps) => {
  return (
    <AnalyticsContext pageSectionContext="postPageFooterRecommendations">
      <div className={classes.root}>
        <NoSSR onSSR={<Components.PostsLoading />}>
          <RecommendationContent post={post} classes={classes} />
        </NoSSR>
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
