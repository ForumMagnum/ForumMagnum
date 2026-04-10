"use client";

import React, { Suspense } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import { Link } from "@/lib/reactRouterWrapper";
import { profileStyles } from "./profileStyles";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { cleanPostPreviewText, cssUrl, DEFAULT_PREVIEWS, formatReadableDate, getDefaultPreview, PostWithPreview } from "./userProfilePageUtil";
import times from "lodash/times";
import { seededShuffle } from "@/lib/random";

const userProfileTopPostsSectionUnsharedStyles = defineStyles("UserProfileTopPostsSectionUnshared", (theme: ThemeType) => ({
  topPostsIndicator: {
    marginTop: 25,
    marginBottom: 15,
    marginLeft: 0,
    paddingLeft: 0,
  },
  topPostsLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    fontWeight: 400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    display: "block",
    margin: 0,
    padding: 0,
  },
  topPostsLabelPlural: {
    display: "block",
    "@media (max-width: 630px)": {
      display: "none",
    },
  },
  topPostsLabelSingular: {
    display: "none",
    "@media (max-width: 630px)": {
      display: "block",
    },
  },
  postArticle: {
    marginTop: 0,
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 25,
    paddingBottom: 30,
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
    overflow: "visible",
    textDecoration: "none",
    color: "inherit",
    "&:hover": {
      opacity: 1,
    },
    "@media (max-width: 750px)": {
      display: "flex",
      flexDirection: "column-reverse",
      gap: 16,
    },
  },
  postArticleTop: {
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    "&:hover $postTitle": {
      opacity: 0.84,
    },
  },
  postContent: {
    gridColumn: "1 / 4",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
    paddingLeft: 0,
    marginLeft: 0,
    aspectRatio: "3 / 2",
    transition: "opacity 0.15s ease",
    "@media (max-width: 750px)": {
      height: "auto",
      maxHeight: "none",
      width: "100%",
      aspectRatio: "auto",
    },
  },
  postImage: {
    gridColumn: "4 / 7",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "light-dark(rgba(255,255,255,.87),rgba(0,0,0,.92))",
    fontSize: 14,
    aspectRatio: "3 / 2",
    transition: "opacity 0.15s ease",
    mixBlendMode: theme.dark ? "normal" : "multiply",
    "@media (max-width: 750px)": {
      width: "100%",
      height: 220,
      aspectRatio: "auto",
    },
    "@media (max-width: 630px)": {
      height: 200,
    },
  },
  postTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: "2rem",
    fontWeight: 400,
    margin: "0 0 18px 0",
    color: theme.palette.text.normal,
    lineHeight: 1.2,
    letterSpacing: "-.02em",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "normal",
    maxWidth: "100%",
    paddingLeft: 0,
    flexShrink: 0,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 4,
    overflow: "hidden",
    transition: "opacity 0.15s ease",
  },
  topPostTitle: {
    fontSize: 44,
    lineHeight: 1.1,
  },
  postSummaryWrapper: {
    flex: "1 1 0",
    minHeight: 0,
    marginBottom: 10,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 15,
    lineHeight: 1.6,
    color: theme.palette.text.slightlyDim2,
    "@media (max-width: 750px)": {
      flex: "none",
      minHeight: "auto",
      marginBottom: 16,
    },
  },
  postSummary: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16.8,
    fontWeight: 400,
    lineHeight: 1.6,
    color: theme.palette.text.slightlyDim2,
    margin: 0,
    whiteSpace: "pre-line",
    maxHeight: "round(down, 100%, 1lh)",
    overflow: "hidden",
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      right: 0,
      bottom: 0,
      width: "6em",
      height: "1lh",
      backgroundColor: theme.palette.background.profilePageBackground,
      WebkitMaskImage: theme.palette.type === "dark"
        ? "linear-gradient(to right, transparent, white)"
        : "linear-gradient(to right, transparent, black)",
      maskImage: theme.palette.type === "dark"
        ? "linear-gradient(to right, transparent, white)"
        : "linear-gradient(to right, transparent, black)",
      pointerEvents: "none",
    },
    "@media (max-width: 900px)": {
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "pre-line",
    },
    "@media (max-width: 750px)": {
      maxHeight: "none",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: 4,
      lineClamp: 4,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "@media (max-width: 630px)": {
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "pre-line",
    },
  },
  postMetaBar: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    fontSize: 13,
    color: theme.palette.text.dim,
    flexShrink: 0,
  },
  karmaScore: {
    fontSize: 13,
    color: theme.palette.text.slightlyDim2,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  postDate: {
    fontSize: 13,
    color: theme.palette.text.dim,
    fontWeight: 400,
    letterSpacing: 0,
  },
  smallArticlesGrid: {
    marginTop: 30,
    paddingBottom: 30,
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 25,
    "@media (max-width: 630px)": {
      display: "none",
    },
  },
  smallArticle: {
    gridColumn: "span 2",
    display: "flex",
    flexDirection: "column",
    "&:hover $smallArticleTitle": {
      opacity: 0.84,
    },
  },
  smallArticleImage: {
    width: "100%",
    aspectRatio: "3 / 2",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.type === "dark" ? "rgba(0,0,0,.92)" : "rgba(255,255,255,.87)",
    fontSize: 12,
    borderRadius: 4,
    overflow: "hidden",
    transition: "opacity 0.15s ease",
    mixBlendMode: theme.dark ? "normal" : "multiply",
  },
  smallArticleContent: {
    padding: "15px 0 0 0",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    transition: "opacity 0.15s ease",
  },
  smallArticleTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 16,
    fontWeight: 400,
    margin: 0,
    color: theme.palette.text.normal,
    lineHeight: 1.3,
    minHeight: 42,
    letterSpacing: "-.02em",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    lineClamp: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: "opacity 0.15s ease",
    "@media (max-width: 630px)": {
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "normal",
    },
  },
  smallArticleMeta: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  smallKarma: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.slightlyDim2,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  smallDate: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    fontWeight: 400,
    letterSpacing: 0,
  },
}));

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

function getTopPostsTooltipTitle(user: UsersProfile): string {
  const hasPinnedPosts = (user.pinnedPostIds?.length ?? 0) >= TOP_POSTS_LIMIT;
  return hasPinnedPosts ? "User selected" : "Based on karma";
}

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
  const classes = useStyles(userProfileTopPostsSectionUnsharedStyles);
  const topPostsTooltipTitle = getTopPostsTooltipTitle(user);

  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, TOP_POSTS_LIMIT);
  const topPostDefaultImages = seededShuffle(DEFAULT_PREVIEWS, user._id);
  const hasEnoughTopPosts = topPosts.length >= 4;

  if (!hasEnoughTopPosts) return null;

  return (
    <>
      <div className={classes.topPostsIndicator}>
        <LWTooltip title={topPostsTooltipTitle} placement="bottom">
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
  const classes = useStyles(userProfileTopPostsSectionUnsharedStyles);
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
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(userProfileTopPostsSectionUnsharedStyles);

  if (post) {
    const imageBackground = getPostBackgroundImage(post, topPostDefaultImages, idx + 1);
    return <article className={classes.smallArticle}>
      <Link
        to={postGetPageUrl(post)}
        className={sharedClasses.articleLink}
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
