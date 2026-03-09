"use client";

import React, { Suspense } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import { Link } from "@/lib/reactRouterWrapper";
import { profileStyles } from "./profileStyles";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { cleanPostPreviewText, cssUrl, DEFAULT_PREVIEWS, formatReadableDate, getDefaultPreview, PostWithPreview } from "./userProfilePageUtil";
import times from "lodash/times";
import { seededShuffle } from "@/lib/random";

const ProfileTopPostsQuery = gql(`
  query ProfileTopPostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ProfileTopPost
      }
      totalCount
    }
  }
  fragment ProfileTopPost on Post {
    ...PostsMinimumInfo
    baseScore
    postedAt
    socialPreviewData { imageUrl }
    contents { plaintextDescription }
  }
`);

const TOP_POSTS_LIMIT = 4;

function getPostImageUrl(
  post: ProfileTopPost,
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
  post: ProfileTopPost,
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
  return <Suspense fallback={<UserProfileTopPostsSectionFallback user={user} />}>
    <UserProfileTopPostsSectionQuery user={user} />
  </Suspense>
}

export function UserProfileTopPostsSectionFallback({user}: {user: UsersProfile}) {
  const numPinnedPosts = user.pinnedPostIds?.length ?? 0;
  const hasPinnedPosts = numPinnedPosts >= TOP_POSTS_LIMIT;
  const numTotalPosts = user.postCount;
  const numPosts = hasPinnedPosts ? numPinnedPosts : numTotalPosts;
  const numTopPosts = Math.min(numPosts, TOP_POSTS_LIMIT);
  
  return <UserProfileTopPostsSectionInner user={user} topPosts={times(numTopPosts, ()=>null)} />;
}

export function UserProfileTopPostsSectionQuery({user}: {user: UsersProfile}) {
  const userId = user._id;
  const pinnedPostIds = user.pinnedPostIds ?? [];
  const hasPinnedPosts = pinnedPostIds.length >= TOP_POSTS_LIMIT;

  const { data } = useSuspenseQuery(ProfileTopPostsQuery, {
    variables: {
      selector: hasPinnedPosts
        ? { default: { exactPostIds: pinnedPostIds } }
        : (userId
          ? { userPosts: { userId, sortedBy: "top", excludeEvents: true, authorIsUnreviewed: null } }
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

  return <UserProfileTopPostsSectionInner user={user} topPosts={topPosts} />
}

export function UserProfileTopPostsSectionInner({user, topPosts}: {
  user: UsersProfile,
  topPosts: (ProfileTopPost|null)[]
}) {
  const classes = useStyles(profileStyles);

  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, TOP_POSTS_LIMIT);
  const topPostDefaultImages = seededShuffle(DEFAULT_PREVIEWS, user._id);
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

      <TopPostBigArticle post={topPost} topPostDefaultImages={topPostDefaultImages} />

      <div className={classes.smallArticlesGrid}>
        {smallArticles.map((post, idx) => <TopPostSmallArticle
          key={post ? post._id : idx}
          post={post}
          topPostDefaultImages={topPostDefaultImages}
          idx={idx}
        />)}
      </div>
    </>
  )
}

function TopPostBigArticle({post, topPostDefaultImages}: {
  post: ProfileTopPost|null
  topPostDefaultImages: string[]
}) {
  const classes = useStyles(profileStyles);
  if (post) {
    return <Link
      to={postGetPageUrl(post)}
      className={classNames(classes.postArticle, classes.postArticleTop)}
    >
      <div className={classes.postContent}>
        <h2 className={classNames(classes.postTitle, classes.topPostTitle)}>
          {post.title}
        </h2>
        <div className={classes.postSummaryWrapper}>
          <p className={classes.postSummary}>{getTopPostSummary(post)}</p>
        </div>
        <div className={classes.postMetaBar}>
          <LWTooltip title="Karma score">
            <span className={classes.karmaScore}>{post.baseScore ?? 0}</span>
          </LWTooltip>
          <LWTooltip title={<ExpandedDate date={post.postedAt!} />}>
            <span className={classes.postDate}>{formatReadableDate(post.postedAt!)}</span>
          </LWTooltip>
        </div>
      </div>
      <div
        className={classes.postImage}
        style={{ backgroundImage: getPostBackgroundImage(post, topPostDefaultImages, 0) }}
      ></div>
    </Link>
  } else {
    return <div className={classNames(classes.postArticle, classes.postArticleTop)}>
      <div className={classes.postContent}>
        <h2 className={classNames(classes.postTitle, classes.topPostTitle)}>{" "}</h2>
        <div className={classes.postSummaryWrapper}>
          <p className={classes.postSummary} />
        </div>
        <div className={classes.postMetaBar} />
      </div>
      <div className={classes.postImage}/>
    </div>
  }
}

function TopPostSmallArticle({post, topPostDefaultImages, idx}: {
  post: ProfileTopPost|null
  topPostDefaultImages: string[],
  idx: number
}) {
  const classes = useStyles(profileStyles);

  if (post) {
    const imageBackground = getPostBackgroundImage(post, topPostDefaultImages, idx + 1);
    return <article className={classes.smallArticle}>
      <Link
        to={postGetPageUrl(post)}
        className={classes.articleLink}
      >
        <div
          className={classes.smallArticleImage}
          style={{ backgroundImage: imageBackground }}
        />
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
  } else {
    return <article className={classes.smallArticle}>
      <div className={classes.smallArticleImage} />
      <div className={classes.smallArticleContent}>
        <h3 className={classes.smallArticleTitle}/>
        <div className={classes.smallArticleMeta}>
          <span className={classes.smallKarma}>&nbsp;</span>
          <span className={classes.smallDate}>&nbsp;</span>
        </div>
      </div>
    </article>
  }
}
