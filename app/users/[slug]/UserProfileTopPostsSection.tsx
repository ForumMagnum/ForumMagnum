"use client";

import React from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import { Link } from "@/lib/reactRouterWrapper";
import { profileStyles } from "./profileStyles";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { cleanPostPreviewText, cssUrl, DEFAULT_PREVIEWS, formatReadableDate, getDefaultPreview, hashString, PostWithPreview } from "./userProfilePageUtil";

const ProfileTopPostsQuery = gql(`
  query ProfileTopPostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

const TOP_POSTS_LIMIT = 4;

// When posts lack a social preview image, we show placeholder images instead.
// This shuffles the placeholders deterministically (seeded by the first post's
// ID) so each user's profile gets a consistent but varied arrangement -- the
// same user always sees the same placeholders, but different profiles differ.
function buildTopPostDefaultImages(topPosts: PostsMinimumInfo[]): string[] {
  const seed = hashString(topPosts[0]?._id ?? "seed");
  const arr = [...DEFAULT_PREVIEWS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed + (i * 2654435761)) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getPostImageUrl(
  post: PostWithPreview,
  topPostDefaultImages: string[],
  topPostIndex?: number,
): string {
  const fallback = topPostIndex !== undefined
    ? topPostDefaultImages[topPostIndex % topPostDefaultImages.length]
    : getDefaultPreview(post?._id ?? "0");
  const url = post?.socialPreviewData?.imageUrl;
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return fallback;
  if (trimmedUrl === "null" || trimmedUrl === "undefined") return fallback;
  // Google-hosted images (Docs embeds, profile photos) don't render well as
  // post preview cards, so fall back to a placeholder instead
  if (trimmedUrl.includes("lh3.googleusercontent.com") || trimmedUrl.includes("docs.google.com")) {
    return fallback;
  }
  if (trimmedUrl.includes("res.cloudinary.com") && trimmedUrl.includes("/upload/")) {
    // Some legacy posts have an empty cloudinary public ID, which yields
    // URLs like `.../upload/.../` that render as broken images.
    const urlWithoutQuery = trimmedUrl.split(/[?#]/)[0];
    if (urlWithoutQuery.endsWith("/")) return fallback;
    return trimmedUrl.replace("/upload/", "/upload/c_fill,g_auto,f_auto,q_auto/");
  }
  return trimmedUrl;
}

function getPostBackgroundImage(
  post: PostWithPreview,
  topPostDefaultImages: string[],
  topPostIndex?: number,
): string {
  const fallback = topPostIndex !== undefined
    ? topPostDefaultImages[topPostIndex % topPostDefaultImages.length]
    : getDefaultPreview(post?._id ?? "0");
  const imageUrl = getPostImageUrl(post, topPostDefaultImages, topPostIndex);
  if (imageUrl === fallback) return cssUrl(fallback);
  // Keep a fallback layer so broken/404 primary URLs still render a placeholder.
  return `${cssUrl(imageUrl)}, ${cssUrl(fallback)}`;
}

function getTopPostSummary(post: { contents?: { plaintextDescription?: string | null } | null }): string {
  return cleanPostPreviewText(post?.contents?.plaintextDescription ?? "");
}

export function UserProfileTopPostsSection({user}: {user: UsersProfile}) {
  const classes = useStyles(profileStyles);
  const userId = user._id;
  const pinnedPostIds = user.pinnedPostIds ?? [];
  const hasPinnedPosts = pinnedPostIds.length >= TOP_POSTS_LIMIT;

  const { data } = useQuery(ProfileTopPostsQuery, {
    skip: !hasPinnedPosts,
    variables: {
      selector: hasPinnedPosts
        ? { default: { exactPostIds: pinnedPostIds } }
        : (userId
          ? { userPosts: { userId, sortedBy: "top", excludeEvents: true } }
          : undefined
        ),
      limit: TOP_POSTS_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  // When using pinned posts, reorder results to match the pinned order.
  const postResults = data?.posts?.results ?? [];
  const topPosts = hasPinnedPosts
    ? filterNonnull(pinnedPostIds.map(id => postResults.find(p => p._id === id)))
    : postResults;

  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, TOP_POSTS_LIMIT);
  const topPostDefaultImages = buildTopPostDefaultImages(topPosts);
  const hasEnoughTopPosts = topPosts.length >= 4;

  if (!hasEnoughTopPosts) return null;

  return (
    <>
      <div className={classes.topPostsIndicator}>
        <LWTooltip title="Based on karma" placement="bottom">
          <span className={classNames(classes.topPostsLabel, classes.topPostsLabelPlural)}>Top posts</span>
          <span className={classNames(classes.topPostsLabel, classes.topPostsLabelSingular)}>Top post</span>
        </LWTooltip>
      </div>

      {topPost && topPost.slug && (
        <Link
          to={postGetPageUrl(topPost)}
          className={classNames(classes.postArticle, classes.postArticleTop)}
        >
          <div className={classes.postContent}>
            <h2 className={classNames(classes.postTitle, classes.topPostTitle)}>
              {topPost.title}
            </h2>
            <div className={classes.postSummaryWrapper}>
              <p className={classes.postSummary}>{getTopPostSummary(topPost)}</p>
            </div>
            <div className={classes.postMetaBar}>
              <LWTooltip title="Karma score">
                <span className={classes.karmaScore}>{topPost.baseScore ?? 0}</span>
              </LWTooltip>
              <LWTooltip title={<ExpandedDate date={topPost.postedAt!} />}>
                <span className={classes.postDate}>{formatReadableDate(topPost.postedAt!)}</span>
              </LWTooltip>
            </div>
          </div>
          <div
            className={classes.postImage}
            style={{
              backgroundImage: getPostBackgroundImage(topPost, topPostDefaultImages, 0),
            }}
          ></div>
        </Link>
      )}

      <div className={classes.smallArticlesGrid}>
        {smallArticles.map((post, idx) => {
          const imageBackground = getPostBackgroundImage(post, topPostDefaultImages, idx + 1);
          return (
            <article key={post._id} className={classes.smallArticle}>
              <Link
                to={postGetPageUrl(post)}
                className={classes.articleLink}
              >
                <div
                  className={classes.smallArticleImage}
                  style={{ backgroundImage: imageBackground }}
                ></div>
                <div className={classes.smallArticleContent}>
                  <h3 className={classes.smallArticleTitle}>
                    {post.title}
                  </h3>
                  <div className={classes.smallArticleMeta}>
                    <LWTooltip title="Karma score">
                      <span className={classes.smallKarma}>{post.baseScore ?? 0}</span>
                    </LWTooltip>
                    <LWTooltip title={<ExpandedDate date={post.postedAt!} />}>
                      <span className={classes.smallDate}>{formatReadableDate(post.postedAt!)}</span>
                    </LWTooltip>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </>
  )
}
