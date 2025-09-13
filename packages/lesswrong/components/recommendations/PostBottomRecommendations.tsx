import React, { useMemo } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { useRecentOpportunities } from "../hooks/useRecentOpportunities";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useRecommendations } from "./withRecommendations";
import ToCColumn, { MAX_CONTENT_WIDTH } from "../posts/TableOfContents/ToCColumn";
import { isFriendlyUI } from "@/themes/forumTheme";
import PostsLoading from "../posts/PostsLoading";
import EAPostsItem from "../posts/EAPostsItem";
import EALargePostsItem from "../posts/EALargePostsItem";
import UserTooltip from "../users/UserTooltip";
import PostsItem from "../posts/PostsItem";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { RecommendationsAlgorithm } from "@/lib/collections/users/recommendationSettings";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("PostBottomRecommendations", (theme: ThemeType) => ({
  root: {
    background: theme.isFriendlyUI ? theme.palette.grey[55] : 'transparent',
    padding: "60px 0 80px 0",
    marginTop: 60,
    [theme.breakpoints.down('sm')]: {
      // make the background flush with the sides of the screen on mobile
      paddingLeft: 8,
      paddingRight: 8,
      marginLeft: -8,
      marginRight: -8,
    },
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
}));

const WrapperComponent = ({hasTableOfContents, children}: {
  hasTableOfContents: boolean
  children: React.ReactNode
}) => {
  if (isFriendlyUI()) {
    return <ToCColumn
      tableOfContents={hasTableOfContents ? <div /> : null}
      notHideable
    >
      {children}
    </ToCColumn>;
  } else {
    return <>{children}</>
  }
};

const PostBottomRecommendations = ({post, hasTableOfContents, ssr = false}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList,
  hasTableOfContents?: boolean,
  ssr?: boolean,
}) => {
  const classes = useStyles(styles);
  const postId = post._id;
  const algorithm: RecommendationsAlgorithm = useMemo(() => ({
    strategy: {
      name: "moreFromAuthor",
      postId: postId,
      context: "post-footer",
    },
    count: 3,
    disableFallbacks: true,
  }), [postId]);

  const {
    recommendationsLoading: moreFromAuthorLoading,
    recommendations: moreFromAuthorPosts,
  } = useRecommendations({ algorithm, ssr });

  const { data: curatedAndPopularData, loading: curatedAndPopularLoading } = useQuery(gql(`
    query CuratedAndPopularThisWeek($limit: Int) {
      CuratedAndPopularThisWeek(limit: $limit) {
        results {
          ...PostsListWithVotes
        }
      }
    }
  `), {
    variables: { limit: 3 },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    ssr
  });

  const curatedAndPopularPosts = curatedAndPopularData?.CuratedAndPopularThisWeek?.results;

  const {
    results: opportunityPosts,
    loading: opportunitiesLoading,
    coreTagLabel
  } = useRecentOpportunities({
    fragmentName: "PostsListWithVotes",
    post,
    maxAgeInDays: 60,
    ssr,
    skip: !isFriendlyUI(),
  });

  const profileUrl = userGetProfileUrl(post.user);

  const postAuthor = post.user;
  const hasUserPosts = postAuthor && (moreFromAuthorLoading || !!moreFromAuthorPosts?.length);
  return (
    <AnalyticsContext pageSectionContext="postPageFooterRecommendations">
      <div className={classes.root}>
        <WrapperComponent hasTableOfContents={!!hasTableOfContents}>
          <div>
            {hasUserPosts &&
              <div className={classes.section}>
                <div className={classes.sectionHeading}>
                  More from{" "}
                  <UserTooltip user={postAuthor} inlineBlock={false}>
                    <Link to={profileUrl}>{postAuthor.displayName}</Link>
                  </UserTooltip>
                </div>
                {moreFromAuthorLoading && !moreFromAuthorPosts?.length &&
                  <PostsLoading />
                }
                <AnalyticsContext pageSubSectionContext="moreFromAuthor">
                  {moreFromAuthorPosts?.map((post) => 
                    <PostsItem key={post._id} post={post} />
                  )}
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
                Curated and popular this week
              </div>
              {curatedAndPopularLoading && !curatedAndPopularPosts?.length &&
                <PostsLoading />
              }
              <AnalyticsContext pageSubSectionContext="curatedAndPopular">
                {curatedAndPopularPosts?.map((post) => (
                  isFriendlyUI() ? <EALargePostsItem
                    key={post._id}
                    post={post}
                    className={classes.largePostItem}
                    noImagePlaceholder
                  /> : <PostsItem key={post._id} post={post} />
                ))}
              </AnalyticsContext>
            </div>
            {isFriendlyUI() && <div className={classes.section}>
              <div className={classes.sectionHeading}>
                {coreTagLabel ? "Recent" : "Relevant"} opportunities{coreTagLabel ? ` in ${coreTagLabel}` : ""}
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
            }
          </div>
        </WrapperComponent>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent("PostBottomRecommendations", PostBottomRecommendations, {
  areEqual: "auto"
});
