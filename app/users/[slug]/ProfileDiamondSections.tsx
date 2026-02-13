"use client";

import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { Link } from "@/lib/reactRouterWrapper";
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import type { ProfileDiamondDataQueryQuery } from "@/lib/generated/gql-codegen/graphql";

const DIAMONDS_INITIAL = 250;
const DIAMONDS_SHOW_ALL_LIMIT = 2000;
const COMMENT_DIAMONDS_INITIAL = 500;
const COMMENT_DIAMONDS_SHOW_ALL_LIMIT = 20000;

const ProfileDiamondDataQuery = gql(`
  query ProfileDiamondDataQuery($userId: String!, $postLimit: Int!, $commentLimit: Int!) {
    profileDiamondData: ProfileDiamondData(userId: $userId, postLimit: $postLimit, commentLimit: $commentLimit) {
      posts {
        id
        date
        karma
        isReviewWinner
        isCurated
      }
      comments {
        id
        date
        karma
        postId
      }
    }
  }
`);

type ProfilePostDiamonds = ProfileDiamondDataQueryQuery["profileDiamondData"]["posts"];
type ProfileCommentDiamonds = ProfileDiamondDataQueryQuery["profileDiamondData"]["comments"];

interface ProfileDiamondSectionsProps {
  userId: string;
  postCount: number;
  commentCount: number;
  classes: Record<string, string>;
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

export default function ProfileDiamondSections({
  userId,
  postCount,
  commentCount,
  classes,
}: ProfileDiamondSectionsProps) {
  const [showAllPostDiamonds, setShowAllPostDiamonds] = useState(false);
  const [showAllCommentDiamonds, setShowAllCommentDiamonds] = useState(false);
  const [postShowAllPending, setPostShowAllPending] = useState(false);
  const [commentShowAllPending, setCommentShowAllPending] = useState(false);
  const [cachedDiamondPosts, setCachedDiamondPosts] = useState<ProfilePostDiamonds>([]);
  const [cachedCommentDiamonds, setCachedCommentDiamonds] = useState<ProfileCommentDiamonds>([]);

  const { data: profileDiamondData, loading: profileDiamondLoading } = useQuery(ProfileDiamondDataQuery, {
    skip: !userId,
    variables: {
      userId,
      postLimit: showAllPostDiamonds ? DIAMONDS_SHOW_ALL_LIMIT : DIAMONDS_INITIAL,
      commentLimit: showAllCommentDiamonds ? COMMENT_DIAMONDS_SHOW_ALL_LIMIT : COMMENT_DIAMONDS_INITIAL,
    },
    fetchPolicy: "cache-and-network",
  });

  const queriedDiamondPosts = profileDiamondData?.profileDiamondData?.posts;
  const queriedCommentDiamonds = profileDiamondData?.profileDiamondData?.comments;

  useEffect(() => {
    setCachedDiamondPosts([]);
    setCachedCommentDiamonds([]);
    setShowAllPostDiamonds(false);
    setShowAllCommentDiamonds(false);
    setPostShowAllPending(false);
    setCommentShowAllPending(false);
  }, [userId]);

  useEffect(() => {
    if (!queriedDiamondPosts) return;
    setCachedDiamondPosts(queriedDiamondPosts);
  }, [queriedDiamondPosts]);

  useEffect(() => {
    if (!queriedCommentDiamonds) return;
    setCachedCommentDiamonds(queriedCommentDiamonds);
  }, [queriedCommentDiamonds]);

  useEffect(() => {
    if (!showAllPostDiamonds || !postShowAllPending) return;
    if (!profileDiamondLoading) {
      setPostShowAllPending(false);
    }
  }, [showAllPostDiamonds, postShowAllPending, profileDiamondLoading]);

  useEffect(() => {
    if (!showAllCommentDiamonds || !commentShowAllPending) return;
    if (!profileDiamondLoading) {
      setCommentShowAllPending(false);
    }
  }, [showAllCommentDiamonds, commentShowAllPending, profileDiamondLoading]);

  const diamondPosts = cachedDiamondPosts;
  const postDiamondCount = Math.max(diamondPosts.length, postCount);
  const canShowAllPostDiamonds = postCount > DIAMONDS_INITIAL;
  const isPostDiamondsLoading = postShowAllPending && profileDiamondLoading;

  const commentDiamonds = cachedCommentDiamonds;
  const commentDiamondCount = Math.max(commentDiamonds.length, commentCount);
  const canShowAllCommentDiamonds = commentCount > COMMENT_DIAMONDS_INITIAL;
  const isCommentDiamondsLoading = commentShowAllPending && profileDiamondLoading;

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
                ) : null
              ) : (
                <a
                  href="#"
                  className={classes.readMoreLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setPostShowAllPending(true);
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
                ) : null
              ) : (
                <a
                  href="#"
                  className={classes.readMoreLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setCommentShowAllPending(true);
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
