"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { Link } from "@/lib/reactRouterWrapper";
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import {
  type ProfileCommentDiamondDataQueryQuery,
  type ProfilePostDiamondDataQueryQuery,
} from "@/lib/generated/gql-codegen/graphql";

const DIAMONDS_INITIAL = 250;
const DIAMONDS_SHOW_ALL_LIMIT = 2000;
const COMMENT_DIAMONDS_INITIAL = 500;
const COMMENT_DIAMONDS_SHOW_ALL_LIMIT = 20000;

const ProfilePostDiamondDataQuery = gql(`
  query ProfilePostDiamondDataQuery($userId: String!, $postLimit: Int!) {
    profileDiamondData: ProfileDiamondData(userId: $userId, postLimit: $postLimit, commentLimit: 1) {
      posts {
        id
        date
        karma
        isReviewWinner
        isCurated
      }
    }
  }
`);

const ProfileCommentDiamondDataQuery = gql(`
  query ProfileCommentDiamondDataQuery($userId: String!, $commentLimit: Int!) {
    profileDiamondData: ProfileDiamondData(userId: $userId, postLimit: 1, commentLimit: $commentLimit) {
      comments {
        id
        date
        karma
        postId
      }
    }
  }
`);

type ProfilePostDiamonds = ProfilePostDiamondDataQueryQuery["profileDiamondData"]["posts"];
type ProfileCommentDiamonds = ProfileCommentDiamondDataQueryQuery["profileDiamondData"]["comments"];

interface ProfileDiamondSectionsProps {
  userId: string;
  postCount: number;
  commentCount: number;
  classes: Record<string, string>;
}

interface UseProfileDiamondDataWithLoadMoreProps {
  userId: string;
  postCount: number;
  commentCount: number;
}

function formatCountWithCommas(count: number): string {
  return count.toLocaleString();
}

function getPostDiamondClasses(isReviewWinner: boolean, isCurated: boolean) {
  const isGold = isReviewWinner || isCurated;
  const isSolid = true;
  return { isGold, isSolid };
}

function getCommentDiamondClasses() {
  const isSolid = true;
  return { isSolid };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDiamondKarmaStyle(karma: number, isGold: boolean, maxKarmaForFullOpacity = 100): React.CSSProperties | undefined {
  if (isGold) return undefined;
  const alpha = 0.2 + (0.8 * clamp((karma / maxKarmaForFullOpacity), 0, 1));
  return { opacity: alpha };
}

function useProfileDiamondDataWithLoadMore({
  userId,
  postCount,
  commentCount,
}: UseProfileDiamondDataWithLoadMoreProps) {
  const [showAllPostDiamonds, setShowAllPostDiamonds] = useState(false);
  const [showAllCommentDiamonds, setShowAllCommentDiamonds] = useState(false);

  const {
    data: postDiamondData,
    previousData: previousPostDiamondData,
    loading: postDiamondLoading,
  } = useQuery(ProfilePostDiamondDataQuery, {
    skip: !userId,
    variables: {
      userId,
      postLimit: showAllPostDiamonds ? DIAMONDS_SHOW_ALL_LIMIT : DIAMONDS_INITIAL,
    },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: commentDiamondData,
    previousData: previousCommentDiamondData,
    loading: commentDiamondLoading,
  } = useQuery(ProfileCommentDiamondDataQuery, {
    skip: !userId,
    variables: {
      userId,
      commentLimit: showAllCommentDiamonds ? COMMENT_DIAMONDS_SHOW_ALL_LIMIT : COMMENT_DIAMONDS_INITIAL,
    },
    fetchPolicy: "cache-and-network",
  });

  const diamondPosts = postDiamondData?.profileDiamondData?.posts
    ?? previousPostDiamondData?.profileDiamondData?.posts
    ?? [];
  const commentDiamonds = commentDiamondData?.profileDiamondData?.comments
    ?? previousCommentDiamondData?.profileDiamondData?.comments
    ?? [];

  const postDiamondCount = Math.max(diamondPosts.length, postCount);
  const commentDiamondCount = Math.max(commentDiamonds.length, commentCount);
  const canShowAllPostDiamonds = postCount > DIAMONDS_INITIAL;
  const canShowAllCommentDiamonds = commentCount > COMMENT_DIAMONDS_INITIAL;
  const isPostDiamondsLoading = showAllPostDiamonds && postDiamondLoading;
  const isCommentDiamondsLoading = showAllCommentDiamonds && commentDiamondLoading;

  return {
    diamondPosts,
    commentDiamonds,
    postDiamondCount,
    commentDiamondCount,
    canShowAllPostDiamonds,
    canShowAllCommentDiamonds,
    isPostDiamondsLoading,
    isCommentDiamondsLoading,
    showAllPostDiamonds,
    showAllCommentDiamonds,
    setShowAllPostDiamonds,
    setShowAllCommentDiamonds,
  };
}

export default function ProfileDiamondSections({
  userId,
  postCount,
  commentCount,
  classes,
}: ProfileDiamondSectionsProps) {
  const {
    diamondPosts,
    commentDiamonds,
    postDiamondCount,
    commentDiamondCount,
    canShowAllPostDiamonds,
    canShowAllCommentDiamonds,
    isPostDiamondsLoading,
    isCommentDiamondsLoading,
    showAllPostDiamonds,
    showAllCommentDiamonds,
    setShowAllPostDiamonds,
    setShowAllCommentDiamonds,
  } = useProfileDiamondDataWithLoadMore({
    userId,
    postCount,
    commentCount,
  });

  return (
    <>
      {diamondPosts.length > 0 && (
        <div className={classes.diamondsSection}>
          <div className={classes.diamondsSectionHeader}>
            <div className={classes.diamondsSectionTitle}>
              Posts <span className={classes.diamondsSectionCount}>({formatCountWithCommas(postDiamondCount)})</span>
            </div>
            {canShowAllPostDiamonds && (
              showAllPostDiamonds ? (
                isPostDiamondsLoading ? (
                  <span className={classNames(classes.readMoreLink, classes.sidebarActionDisabled)}>
                    Loading...
                  </span>
                ) : (
                  <span
                    className={classNames(classes.readMoreLink, classes.sidebarActionDisabled)}
                    style={{ visibility: "hidden" }}
                  >
                    Loading...
                  </span>
                )
              ) : (
                <a
                  href="#"
                  className={classes.readMoreLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAllPostDiamonds(true);
                  }}
                >
                  Show all
                </a>
              )
            )}
          </div>
          <div className={classes.diamondsGrid}>
            {diamondPosts.map((post) => {
              const { isGold, isSolid } = getPostDiamondClasses(post.isReviewWinner, post.isCurated);
              const postUrl = `/posts/${post.id}`;
              return (
                <PostsTooltip
                  key={post.id}
                  postId={post.id}
                  placement="bottom-start"
                  As="span"
                >
                  <Link
                    to={postUrl}
                    className={classNames(
                      classes.diamondLink,
                      isSolid ? classes.diamondSolid : classes.diamondHollow,
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
              showAllCommentDiamonds ? (
                isCommentDiamondsLoading ? (
                  <span className={classNames(classes.readMoreLink, classes.sidebarActionDisabled)}>
                    Loading...
                  </span>
                ) : (
                  <span
                    className={classNames(classes.readMoreLink, classes.sidebarActionDisabled)}
                    style={{ visibility: "hidden" }}
                  >
                    Loading...
                  </span>
                )
              ) : (
                <a
                  href="#"
                  className={classes.readMoreLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAllCommentDiamonds(true);
                  }}
                >
                  Show all
                </a>
              )
            )}
          </div>
          <div className={classes.diamondsGrid}>
            {commentDiamonds.map((comment) => {
              if (!comment.postId) return null;
              const { isSolid } = getCommentDiamondClasses();
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
                >
                  <Link
                    to={commentUrl}
                    className={classNames(
                      classes.diamondLink,
                      isSolid ? classes.diamondSolid : classes.diamondHollow,
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
