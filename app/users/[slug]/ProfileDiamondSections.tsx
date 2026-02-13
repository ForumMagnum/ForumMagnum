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

interface ProfileDiamondSectionsProps {
  userId: string;
  classes: Record<string, string>;
}

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

export default function ProfileDiamondSections({
  userId,
  classes,
}: ProfileDiamondSectionsProps) {
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
                <span className={classNames(classes.readMoreLink, classes.sidebarActionHidden)}>
                  Show all
                </span>
              ) : (
                <LoadMore
                  {...postDiamondsLoadMoreProps}
                  totalCount={undefined}
                  className={classes.readMoreLink}
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
                <span className={classNames(classes.readMoreLink, classes.sidebarActionHidden)}>
                  Show all
                </span>
              ) : (
                <LoadMore
                  {...commentDiamondsLoadMoreProps}
                  totalCount={undefined}
                  className={classes.readMoreLink}
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
