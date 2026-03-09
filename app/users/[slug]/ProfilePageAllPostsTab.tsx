"use client";
import React, { Suspense, useState, useRef } from "react";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import { Link } from "@/lib/reactRouterWrapper";
import { profileStyles } from "./profileStyles";
import LoadMore from "@/components/common/LoadMore";
import { cssUrl, formatReadableDate, getListPostImageUrl, getPostSummary } from "./userProfilePageUtil";
import { gql } from "@/lib/generated/gql-codegen";

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
export type AllPostsTabSortingMode = "new" | "top" | "topInflation" | "recentComments" | "old" | "magic";

export function ProfilePageAllPostsTab({user, sortBy, setSortBy, sortPanelOpen, sortPanelClosing}: {
  user: UsersProfile
  sortBy: AllPostsTabSortingMode
  setSortBy: React.Dispatch<React.SetStateAction<AllPostsTabSortingMode>>
  sortPanelOpen: boolean
  sortPanelClosing: boolean
}) {
  const classes = useStyles(profileStyles);
  const userId = user._id;

  const { data: recentPostsData, loading: recentPostsLoading, loadMoreProps } = useQueryWithLoadMore(ProfilePostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: sortBy, excludeEvents: true, authorIsUnreviewed: null } } : undefined,
      limit: INITIAL_POSTS_TO_SHOW,
      enableTotal: true,
    },
    itemsPerPage: INITIAL_POSTS_TO_SHOW,
    fetchPolicy: "cache-and-network",
  });
  const recentPosts = recentPostsData?.posts?.results ?? [];
  const hasPosts = user.postCount > 0;

  return <>
    {(sortPanelOpen || sortPanelClosing) && (
      <div className={classNames(classes.sortPanel, sortPanelClosing && classes.sortPanelClosing)}>
        <div className={classes.sortPanelSection}>
          <div className={classes.sortPanelHeader}>Sorted by:</div>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "new" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("new")}
            type="button"
          >
            New
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "old" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("old")}
            type="button"
          >
            Old
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "magic" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("magic")}
            type="button"
          >
            Magic (New & Upvoted)
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "top" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("top")}
            type="button"
          >
            Top
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "topInflation" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("topInflation")}
            type="button"
          >
            Top (Inflation Adjusted)
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "recentComments" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("recentComments")}
            type="button"
          >
            Recent Comments
          </button>
        </div>
      </div>
    )}
    {!hasPosts && !recentPostsLoading && (
      <div className={classes.emptyStateContainer}>
        <p className={classes.emptyStateDescription}>{userGetDisplayName(user)} has not written any posts yet.</p>
        <div className={classes.emptyStateImage}>
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
            className={classes.articleLink}
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
  </>
}
