"use client";

import React from "react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import LoadMore from "@/components/common/LoadMore";
import { Link } from "@/lib/reactRouterWrapper";
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";

const profileDiamondSectionsUnsharedStyles = defineStyles("ProfileDiamondSectionsUnshared", (theme: ThemeType) => ({
  diamondsSection: {
    marginTop: 28,
  },
  diamondsSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 20,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
  },
  diamondsSectionTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.dim,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  diamondsSectionCount: {
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none" as const,
  },
  diamondsGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 2,
  },
  diamondLink: {
    display: "block",
    width: 10,
    height: 10,
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    textDecoration: "none",
    "&:hover": {
      opacity: 0.5,
    },
  },
  diamondSolid: {
    backgroundColor: theme.palette.primary.main,
  },
  diamondGold: {
    backgroundColor: "light-dark(#b8860b, #daa520)",
    borderColor: "light-dark(#b8860b, #daa520)",
  },
  sidebarActionHidden: {
    visibility: "hidden",
  },
  loadMoreLoading: {
    marginRight: 0,
  },
}));

const DIAMONDS_INITIAL = 250;
const DIAMONDS_SHOW_ALL_LIMIT = 2000;
const COMMENT_DIAMONDS_INITIAL = 500;
const COMMENT_DIAMONDS_SHOW_ALL_LIMIT = 20000;

const ProfilePostDiamondDataQuery = gql(`
  query ProfilePostDiamondDataQuery($userId: String!, $limit: Int!) {
    ProfileDiamondPosts(userId: $userId, limit: $limit) {
      results {
        _id
        slug
        date
        karma
        isReviewWinner
        isCurated
      }
      totalCount
    }
  }
`);

const ProfileCommentDiamondDataQuery = gql(`
  query ProfileCommentDiamondDataQuery($userId: String!, $limit: Int!) {
    ProfileDiamondComments(userId: $userId, limit: $limit) {
      results {
        id
        date
        karma
        postId
      }
      totalCount
    }
  }
`);

function formatCountWithCommas(count: number): string {
  return count.toLocaleString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDiamondKarmaStyle(karma: number, isGold: boolean, maxKarmaForFullOpacity = 100): React.CSSProperties | undefined {
  if (isGold) return undefined;
  const alpha = 0.2 + (0.8 * clamp((karma / maxKarmaForFullOpacity), 0, 1));
  return { opacity: alpha };
}

function useProfileDiamondDataWithLoadMore(userId: string) {
  const {
    data: postDiamondData,
    previousData: previousPostDiamondData,
    loadMoreProps: postDiamondsLoadMoreProps,
  } = useQueryWithLoadMore(ProfilePostDiamondDataQuery, {
    skip: !userId,
    variables: {
      userId,
      limit: DIAMONDS_INITIAL,
    },
    fetchPolicy: "cache-and-network",
    itemsPerPage: DIAMONDS_SHOW_ALL_LIMIT - DIAMONDS_INITIAL,
    ssr: false,
  });

  const {
    data: commentDiamondData,
    previousData: previousCommentDiamondData,
    loadMoreProps: commentDiamondsLoadMoreProps,
  } = useQueryWithLoadMore(ProfileCommentDiamondDataQuery, {
    skip: !userId,
    variables: {
      userId,
      limit: COMMENT_DIAMONDS_INITIAL,
    },
    fetchPolicy: "cache-and-network",
    itemsPerPage: COMMENT_DIAMONDS_SHOW_ALL_LIMIT - COMMENT_DIAMONDS_INITIAL,
    ssr: false,
  });

  const diamondPosts = postDiamondData?.ProfileDiamondPosts?.results
    ?? previousPostDiamondData?.ProfileDiamondPosts?.results
    ?? [];
  const commentDiamonds = commentDiamondData?.ProfileDiamondComments?.results
    ?? previousCommentDiamondData?.ProfileDiamondComments?.results
    ?? [];

  const postDiamondCount = postDiamondData?.ProfileDiamondPosts?.totalCount
    ?? previousPostDiamondData?.ProfileDiamondPosts?.totalCount
    ?? 0;
  const commentDiamondCount = commentDiamondData?.ProfileDiamondComments?.totalCount
    ?? previousCommentDiamondData?.ProfileDiamondComments?.totalCount
    ?? 0;

  return {
    diamondPosts,
    commentDiamonds,
    postDiamondCount,
    commentDiamondCount,
    canShowAllPostDiamonds: postDiamondCount > DIAMONDS_INITIAL,
    canShowAllCommentDiamonds: commentDiamondCount > COMMENT_DIAMONDS_INITIAL,
    postDiamondsLoadMoreProps,
    commentDiamondsLoadMoreProps,
  };
}

export default function ProfileDiamondSections({ userId }: {
  userId: string;
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profileDiamondSectionsUnsharedStyles);
  const {
    diamondPosts,
    commentDiamonds,
    postDiamondCount,
    commentDiamondCount,
    canShowAllPostDiamonds,
    canShowAllCommentDiamonds,
    postDiamondsLoadMoreProps,
    commentDiamondsLoadMoreProps,
  } = useProfileDiamondDataWithLoadMore(userId);

  return (
    <>
      {diamondPosts.length > 0 && (
        <div className={classes.diamondsSection}>
          <div className={classes.diamondsSectionHeader}>
            <div className={classes.diamondsSectionTitle}>
              Posts <span className={classes.diamondsSectionCount}>({formatCountWithCommas(postDiamondCount)})</span>
            </div>
            {canShowAllPostDiamonds && (
              postDiamondsLoadMoreProps.hidden ? (
                <span className={classNames(sharedClasses.readMoreLink, classes.sidebarActionHidden)}>
                  Show all
                </span>
              ) : (
                <LoadMore
                  {...postDiamondsLoadMoreProps}
                  totalCount={undefined}
                  className={sharedClasses.readMoreLink}
                  loadingClassName={classes.loadMoreLoading}
                  message="Show all"
                />
              )
            )}
          </div>
          <div className={classes.diamondsGrid}>
            {diamondPosts.map((post) => {
              const isGold = post.isReviewWinner || post.isCurated;
              const postUrl = postGetPageUrl(post);
              return (
                <PostsTooltip
                  key={post._id}
                  postId={post._id}
                  placement="bottom-start"
                  As="span"
                  clickable
                >
                  <Link
                    to={postUrl}
                    className={classNames(
                      classes.diamondLink,
                      classes.diamondSolid,
                      isGold && classes.diamondGold,
                    )}
                    style={getDiamondKarmaStyle(post.karma, isGold)}
                  />
                </PostsTooltip>
              );
            })}
          </div>
        </div>
      )}
      {commentDiamonds.length > 0 && (
        <div className={classes.diamondsSection}>
          <div className={classes.diamondsSectionHeader}>
            <div className={classes.diamondsSectionTitle}>
              Comments <span className={classes.diamondsSectionCount}>({formatCountWithCommas(commentDiamondCount)})</span>
            </div>
            {canShowAllCommentDiamonds && (
              commentDiamondsLoadMoreProps.hidden ? (
                <span className={classNames(sharedClasses.readMoreLink, classes.sidebarActionHidden)}>
                  Show all
                </span>
              ) : (
                <LoadMore
                  {...commentDiamondsLoadMoreProps}
                  totalCount={undefined}
                  className={sharedClasses.readMoreLink}
                  loadingClassName={classes.loadMoreLoading}
                  message="Show all"
                />
              )
            )}
          </div>
          <div className={classes.diamondsGrid}>
            {commentDiamonds.map((comment) => {
              const commentUrl = commentGetPageUrlFromIds({
                postId: comment.postId,
                commentId: comment.id,
              });
              return (
                <PostsTooltip
                  key={comment.id}
                  postId={comment.postId}
                  commentId={comment.id}
                  placement="bottom-start"
                  As="span"
                  clickable
                >
                  <Link
                    to={commentUrl}
                    className={classNames(
                      classes.diamondLink,
                      classes.diamondSolid,
                    )}
                    style={getDiamondKarmaStyle(comment.karma, false, 50)}
                  />
                </PostsTooltip>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
