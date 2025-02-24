import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { useRecentOpportunities } from "../hooks/useRecentOpportunities";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useRecommendations } from "./withRecommendations";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { MAX_CONTENT_WIDTH } from "../posts/TableOfContents/ToCColumn";
import { isEAForum } from "@/lib/instanceSettings";

const styles = (theme: ThemeType) => ({
  root: {
    background: isEAForum ? theme.palette.grey[55] : 'transparent',
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
});

const EAForumWrapperComponent = ({children}: {children: React.ReactNode}) => {
  const { ToCColumn } = Components;
  return <ToCColumn tableOfContents={<div />} notHideable>{children}</ToCColumn>;
};

const PostBottomRecommendations = ({post, hasTableOfContents, ssr = false, classes}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList,
  hasTableOfContents?: boolean,
  ssr?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {
    recommendationsLoading: moreFromAuthorLoading,
    recommendations: moreFromAuthorPosts,
  } = useRecommendations({
    algorithm: {
      strategy: {
        name: "moreFromAuthor",
        postId: post._id,
        context: "post-footer",
      },
      count: 3,
      disableFallbacks: true,
    },
    ssr
  });

  const {
    results: curatedAndPopularPosts,
    loading: curatedAndPopularLoading,
  } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "CuratedAndPopularThisWeek",
    limit: 3,
    ssr
  });

  const {
    results: opportunityPosts,
    loading: opportunitiesLoading,
    coreTagLabel
  } = useRecentOpportunities({
    fragmentName: "PostsListWithVotes",
    post,
    maxAgeInDays: 60,
    ssr
  });

  const profileUrl = userGetProfileUrl(post.user);

  const hasUserPosts = post.user &&
    (moreFromAuthorLoading || !!moreFromAuthorPosts?.length);

  const {
    PostsLoading, EAPostsItem, EALargePostsItem, UserTooltip, PostsItem
  } = Components;

  const WrapperComponent = isEAForum ? EAForumWrapperComponent : React.Fragment;

  return (
    <AnalyticsContext pageSectionContext="postPageFooterRecommendations">
      <div className={classes.root}>
        <WrapperComponent>

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
                    isEAForum ? <EAPostsItem key={post._id} post={post} /> : <PostsItem key={post._id} post={post} />
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
                Curated and popular this week
              </div>
              {curatedAndPopularLoading && !curatedAndPopularPosts?.length &&
                <PostsLoading />
              }
              <AnalyticsContext pageSubSectionContext="curatedAndPopular">
                {curatedAndPopularPosts?.map((post) => (
                  isEAForum ? <EALargePostsItem
                    key={post._id}
                    post={post}
                    className={classes.largePostItem}
                    noImagePlaceholder
                  /> : <PostsItem key={post._id} post={post} />
                ))}
              </AnalyticsContext>
            </div>
            {isEAForum && <div className={classes.section}>
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
