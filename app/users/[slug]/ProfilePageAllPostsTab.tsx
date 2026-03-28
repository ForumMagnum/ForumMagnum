"use client";
import React from "react";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import { Link } from "@/lib/reactRouterWrapper";
import { profileStyles, TabPanel } from "./profileStyles";
import LoadMore from "@/components/common/LoadMore";
import { cssUrl, formatReadableDate, getListPostImageUrl, getPostSummary } from "./userProfilePageUtil";
import { gql } from "@/lib/generated/gql-codegen";
import { z } from "zod";

const profilePageAllPostsTabUnsharedStyles = defineStyles("ProfilePageAllPostsTabUnshared", (theme: ThemeType) => ({
  postsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 12,
    "@media (max-width: 630px)": {
      width: "100%",
    },
  },
  listArticle: {
    padding: "14px 0 15px",
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
    display: "block",
    overflow: "visible",
    "&:hover": {
      opacity: 1,
    },
    "&:last-of-type": {
      borderBottom: "none",
    },
    "@media (max-width: 630px)": {
      padding: "12px 0",
    },
  },
  listArticleContent: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    "@media (max-width: 630px)": {
      gap: 7,
    },
  },
  listArticleBody: {
    display: "flex",
    alignItems: "stretch",
    gap: 14,
    minWidth: 0,
    "@media (max-width: 750px)": {
      gap: 10,
    },
  },
  listArticleBodyNoImage: {
    display: "block",
  },
  listArticleText: {
    minWidth: 0,
    flex: 1,
    minHeight: 120,
    height: 120,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    overflow: "hidden",
    "@media (max-width: 750px)": {
      minHeight: 0,
      height: "auto",
      gap: 7,
      overflow: "visible",
    },
  },
  listArticleTextNoImage: {
    minHeight: 0,
    height: "auto",
    gap: 7,
    overflow: "visible",
  },
  listArticleTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 20,
    fontWeight: 400,
    margin: 0,
    color: theme.palette.text.normal,
    lineHeight: 1.2,
    letterSpacing: "-.015em",
    whiteSpace: "normal",
    "@media (max-width: 630px)": {
      fontSize: 18,
      lineHeight: 1.28,
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "normal",
      overflow: "visible",
      textOverflow: "clip",
    },
  },
  listArticleTitleText: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    lineClamp: 2,
    overflow: "hidden",
    minWidth: 0,
    position: "relative",
    zIndex: 1,
    textDecoration: "none",
    transition: "opacity 0.15s ease",
    "&:hover": {
      opacity: 0.84,
      textDecoration: "none",
    },
  },
  listArticleSummaryWrapper: {
    flex: "1 1 0",
    minHeight: 0,
    marginTop: 1,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 14,
    lineHeight: 1.48,
    color: theme.palette.text.slightlyDim2,
    "@media (max-width: 750px)": {
      flex: "none",
      minHeight: "auto",
    },
  },
  listArticleSummaryWrapperNoImage: {
    flex: "none",
    minHeight: "auto",
  },
  listArticleSummary: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.48,
    color: theme.palette.text.slightlyDim2,
    margin: 0,
    whiteSpace: "pre-wrap",
    maxHeight: "round(down, 100%, 1lh)",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
    transition: "opacity 0.15s ease",
    "&::after": {
      content: '""',
      position: "absolute",
      right: 0,
      bottom: 0,
      width: "5.2em",
      height: "1lh",
      backgroundColor: theme.palette.background.profilePageBackground,
      WebkitMaskImage: "linear-gradient(to right, transparent, light-dark(black, white))",
      maskImage: "linear-gradient(to right, transparent, light-dark(black, white))",
      pointerEvents: "none",
    },
    "@media (max-width: 750px)": {
      maxHeight: "none",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: 2,
      lineClamp: 2,
      textOverflow: "ellipsis",
      "&::after": {
        display: "none",
      },
    },
  },
  listArticleSummaryNoImage: {
    maxHeight: "none",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    lineClamp: 3,
    textOverflow: "ellipsis",
    "&::after": {
      display: "none",
    },
  },
  listArticleMeta: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginTop: "auto",
    minHeight: 20,
  },
  listMetaDivider: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.dim,
    fontWeight: 500,
    lineHeight: 1,
  },
  listKarma: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.slightlyDim2,
    fontWeight: 600,
    letterSpacing: 0.2,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
  },
  listDate: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.dim,
    fontWeight: 500,
    letterSpacing: 0.45,
    textTransform: "uppercase",
    lineHeight: 1.35,
    whiteSpace: "nowrap",
  },
  listArticleImage: {
    display: "block",
    width: 204,
    height: "auto",
    aspectRatio: "16 / 9",
    borderRadius: 7,
    flex: "0 0 204px",
    alignSelf: "stretch",
    backgroundColor: theme.palette.greyAlpha(0.07),
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "opacity 0.15s ease",
    mixBlendMode: theme.dark ? "normal" : "multiply",
    "@media (max-width: 750px)": {
      display: "none",
    },
  },
}));

const ProfilePostsQuery = gql(`
  query ProfilePostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserProfilePost
      }
      totalCount
    }
  }
  fragment UserProfilePost on Post {
    ...PostsMinimumInfo
    baseScore postedAt
    contents { plaintextDescription }
  }
`);

const INITIAL_POSTS_TO_SHOW = 7;
export const allPostsTabSortingModeSchema = z.enum(["new", "top", "topInflation", "recentComments", "old", "magic"]);
export type AllPostsTabSortingMode = z.infer<typeof allPostsTabSortingModeSchema>;

export const profilePageAllPostsTabSettingsSchema = z.object({
  sortBy: allPostsTabSortingModeSchema,
});
export type ProfilePageAllPostsTabSettings = z.infer<typeof profilePageAllPostsTabSettingsSchema>;

export const defaultProfilePageAllPostsTabSettings: ProfilePageAllPostsTabSettings = {
  sortBy: "new",
};

export function ProfilePageAllPostsTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageAllPostsTabSettings,
  onChange: (settings: ProfilePageAllPostsTabSettings) => void,
}) {
  const sharedClasses = useStyles(profileStyles);

  return <div className={sharedClasses.sortPanelSection}>
    <div className={sharedClasses.sortPanelHeader}>Sorted by:</div>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "new" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "new" })}
      type="button"
    >
      New
    </button>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "old" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "old" })}
      type="button"
    >
      Old
    </button>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "magic" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "magic" })}
      type="button"
    >
      Magic (New & Upvoted)
    </button>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "top" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "top" })}
      type="button"
    >
      Top
    </button>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "topInflation" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "topInflation" })}
      type="button"
    >
      Top (Inflation Adjusted)
    </button>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "recentComments" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "recentComments" })}
      type="button"
    >
      Recent Comments
    </button>
  </div>;
}

export function ProfilePageAllPostsTabContents({user, settings}: {
  user: UsersProfile
  settings: ProfilePageAllPostsTabSettings
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageAllPostsTabUnsharedStyles);
  const userId = user._id;

  const { data: recentPostsData, loading: recentPostsLoading, loadMoreProps } = useQueryWithLoadMore(ProfilePostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: settings.sortBy, excludeEvents: true, authorIsUnreviewed: null } } : undefined,
      limit: INITIAL_POSTS_TO_SHOW,
      enableTotal: true,
    },
    itemsPerPage: INITIAL_POSTS_TO_SHOW,
    fetchPolicy: "cache-and-network",
  });
  const recentPosts = recentPostsData?.posts?.results ?? [];
  const hasPosts = user.postCount > 0 || recentPosts.length > 0;

  return <TabPanel className={classes.postsList}>
    {!hasPosts && !recentPostsLoading && (
      <div className={sharedClasses.emptyStateContainer}>
        <p className={sharedClasses.emptyStateDescription}>{userGetDisplayName(user)} has not written any posts yet.</p>
        <div className={sharedClasses.emptyStateImage}>
          <img src="/profile-placeholder-2.png" alt="" />
        </div>
      </div>
    )}
    {recentPosts.map((post) => {
      const summary = getPostSummary(post);
      const imageUrl = getListPostImageUrl(post);
      const hasListImage = !!imageUrl;
      return (
        <article key={post._id} className={classes.listArticle}>
          <Link
            to={postGetPageUrl(post)}
            className={sharedClasses.articleLink}
          >
            <div className={classes.listArticleContent}>
              <div className={classNames(classes.listArticleBody, !hasListImage && classes.listArticleBodyNoImage)}>
                <div className={classNames(classes.listArticleText, !hasListImage && classes.listArticleTextNoImage)}>
                  <h3 className={classes.listArticleTitle}>
                    <span className={classes.listArticleTitleText}>{post.title}</span>
                  </h3>
                  {summary && (
                    <div className={classNames(
                      classes.listArticleSummaryWrapper,
                      !hasListImage && classes.listArticleSummaryWrapperNoImage,
                    )}>
                      <p className={classNames(
                        classes.listArticleSummary,
                        !hasListImage && classes.listArticleSummaryNoImage,
                      )}>{summary}</p>
                    </div>
                  )}
                  <div className={classNames(classes.listArticleMeta)}>
                    <LWTooltip title={<ExpandedDate date={post.postedAt!} />}>
                      <span className={classes.listDate}>{formatReadableDate(post.postedAt!)}</span>
                    </LWTooltip>
                    <span className={classes.listMetaDivider} aria-hidden="true">•</span>
                    <LWTooltip title="Karma score">
                      <span className={classes.listKarma}>{post.baseScore ?? 0}</span>
                    </LWTooltip>
                  </div>
                </div>
                {hasListImage && (
                  <div
                    className={classes.listArticleImage}
                    style={{
                      backgroundImage: cssUrl(imageUrl),
                    }}
                  ></div>
                )}
              </div>
            </div>
          </Link>
        </article>
      );
    })}

    <LoadMore {...loadMoreProps} />
  </TabPanel>
}
