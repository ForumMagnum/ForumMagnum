import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { useRecentOpportunities } from "../hooks/useRecentOpportunities";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { MAX_CONTENT_WIDTH } from "../posts/TableOfContents/ToCColumn";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[55],
    padding: "80px 0",
    marginTop: 80,
  },
  section: {
    maxWidth: MAX_CONTENT_WIDTH,
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
    marginTop: 8,
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
  const {
    results: moreFromAuthorPosts,
    loading: moreFromAuthorLoading,
  } = useMulti({
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    terms: {
      userId: post.userId,
      sortedBy: "topAdjusted",
      limit: 3,
    },
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
    PostsLoading, ToCColumn, EAPostsItem, EALargePostsItem, UserTooltip,
  } = Components;
  return (
    <AnalyticsContext pageSectionContext="postPageFooterRecommendations">
      <div className={classes.root}>
        <ToCColumn tableOfContents={<div />}>
          <div>
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
          </div>
        </ToCColumn>
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
