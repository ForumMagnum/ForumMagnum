"use client";

import React, { useState, useRef, useEffect } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { useLocation } from "@/lib/routeUtil";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { getUserFromResults } from "@/components/users/UsersProfile";
import { useCurrentUser } from "@/components/common/withUser";
import { slugify } from "@/lib/utils/slugify";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import Loading from "@/components/vulcan-core/Loading";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import UsersNameWithModal from "@/components/ultraFeed/UsersNameWithModal";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import UserMetaInfo from "@/components/users/UserMetaInfo";
import UserNotifyDropdown from "@/components/notifications/UserNotifyDropdown";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import ContentStyles from "@/components/common/ContentStyles";
import { ContentItemBody } from "@/components/contents/ContentItemBody";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import moment from "moment";
import { defaultSequenceBannerIdSetting, nofollowKarmaThreshold } from "@/lib/instanceSettings";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import { SELECTED_PROFILE_TAB_COOKIE } from "@/lib/cookies/cookies";
import { truncate } from "@/lib/editor/ellipsize";
import type { ProfileDiamondDataQueryQuery } from "@/lib/generated/gql-codegen/graphql";
import { profileStyles } from "./profileStyles";

// ── Constants ──

const INITIAL_POSTS_TO_SHOW = 7;
const TOP_POSTS_LIMIT = 4;
const RECENT_POSTS_LIMIT = 50;
const SEQUENCES_LIMIT = 6;
const BIO_COLLAPSED_WORD_LIMIT = 60;
const POST_SUMMARY_WORD_LIMIT = 50;
const SORT_PANEL_CLOSE_MS = 300;
const SEPARATOR_LINE_PATTERN = /^[\s\-_=*~]{8,}$/;

const DEFAULT_PREVIEWS = [
  "/profile-placeholder-1.png",
  "/profile-placeholder-2.png",
  "/profile-placeholder-3.png",
  "/profile-placeholder-4.png",
];

// ── Helper functions ──

// Post shape used by the profile page helper functions. Fields are optional
// to accommodate the DeepPartialObject wrapper that useQuery applies.
interface PostWithPreview {
  _id: string;
  slug: string;
  title?: string | null;
  shortform?: boolean | null;
  baseScore?: number | null;
  postedAt?: string | null;
  contents?: { plaintextDescription?: string | null } | null;
  socialPreviewData?: { imageUrl?: string | null } | null;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function cleanPostPreviewText(rawText: string): string {
  if (!rawText) return "";
  const normalized = rawText.replace(/\r\n?/g, "\n");
  const cleanedLines = normalized
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .map((line) => (SEPARATOR_LINE_PATTERN.test(line) ? "" : line));
  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function truncatePreviewTextByWords(text: string, wordLimit: number): string {
  if (!text) return "";
  const tokens = text.match(/\S+|\s+/g) ?? [];
  let wordCount = 0;
  let result = "";

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      result += token;
      continue;
    }

    if (wordCount >= wordLimit) {
      return `${result.trimEnd()}...`;
    }

    result += token;
    wordCount += 1;
  }

  return result.trimEnd();
}

function collapsePreviewParagraphsForList(text: string): string {
  if (!text) return "";
  // Flatten paragraph/line breaks for list items while leaving visible
  // separation where breaks used to be.
  return text.replace(/\n+/g, "   ").replace(/ {4,}/g, "   ").trim();
}

function getPostSummary(post: { contents?: { plaintextDescription?: string | null } | null }): string {
  const fullSummary = cleanPostPreviewText(post?.contents?.plaintextDescription ?? "");
  const singleParagraphSummary = collapsePreviewParagraphsForList(fullSummary);
  return truncatePreviewTextByWords(singleParagraphSummary, POST_SUMMARY_WORD_LIMIT);
}

function getTopPostSummary(post: { contents?: { plaintextDescription?: string | null } | null }): string {
  return cleanPostPreviewText(post?.contents?.plaintextDescription ?? "");
}

function getDefaultPreview(postId: string): string {
  return DEFAULT_PREVIEWS[hashString(postId) % DEFAULT_PREVIEWS.length];
}

// When posts lack a social preview image, we show placeholder images instead.
// This shuffles the placeholders deterministically (seeded by the first post's
// ID) so each user's profile gets a consistent but varied arrangement -- the
// same user always sees the same placeholders, but different profiles differ.
function buildTopPostDefaultImages(topPosts: ReadonlyArray<PostWithPreview>): string[] {
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

function cssUrl(url: string): string {
  // Use double-quoted CSS url(...) with JS escaping to avoid breakage from apostrophes.
  return `url(${JSON.stringify(url)})`;
}

function getListPostImageUrl(post: PostWithPreview): string | null {
  const rawUrl = post?.socialPreviewData?.imageUrl;
  const imageUrl = rawUrl?.trim();
  if (!imageUrl || imageUrl === "null" || imageUrl === "undefined") return null;
  // List items should only show explicit per-post images, not placeholders.
  if (imageUrl.includes("/profile-placeholder-")) return null;
  if (imageUrl.includes("lh3.googleusercontent.com") || imageUrl.includes("docs.google.com")) {
    return null;
  }
  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    const urlWithoutQuery = imageUrl.split(/[?#]/)[0];
    if (urlWithoutQuery.endsWith("/")) return null;
    return imageUrl.replace("/upload/", "/upload/c_fill,g_auto,f_auto,q_auto/");
  }
  return imageUrl;
}

function formatReadableDate(date: Date | string): string {
  const m = moment(new Date(date));
  if (m.year() === moment().year()) {
    return m.format("MMM D");
  }
  return m.format("MMM D, YYYY");
}

function formatCountWithCommas(count: number): string {
  return count.toLocaleString();
}

function getCollapsedBioHtml(htmlBio: string, wordLimit: number): string {
  return truncate(htmlBio, wordLimit, "words");
}

function getPostDiamondClasses(karma: number, isReviewWinner: boolean, isCurated: boolean) {
  const isGold = isReviewWinner || isCurated;
  const isSolid = true;
  return { isGold, isSolid };
}

function getCommentDiamondClasses(karma: number) {
  const isSolid = true;
  return { isSolid };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDiamondKarmaStyle(karma: number, isGold: boolean, maxKarmaForFullOpacity = 100): React.CSSProperties | undefined {
  if (isGold) return undefined;
  // Keep a fixed base green and vary only transparency by karma.
  // >=maxKarmaForFullOpacity is fully opaque, low karma remains faint.
  const alpha = 0.2 + (0.8 * clamp((karma / maxKarmaForFullOpacity), 0, 1));
  return { opacity: alpha };
}

type ProfileTab = "posts" | "sequences" | "feed";
type ProfilePostDiamonds = ProfileDiamondDataQueryQuery["profileDiamondData"]["posts"];
type ProfileCommentDiamonds = ProfileDiamondDataQueryQuery["profileDiamondData"]["comments"];

function parseProfileTab(value: unknown): ProfileTab | null {
  if (value === "posts" || value === "sequences" || value === "feed") {
    return value;
  }
  return null;
}

function getInitialProfileTab({
  preferredTab,
  hasPosts,
  hasSequences,
}: {
  preferredTab: ProfileTab | null;
  hasPosts: boolean;
  hasSequences: boolean;
}): ProfileTab {
  if (preferredTab === "sequences" && hasSequences) return "sequences";
  if (preferredTab === "posts" && hasPosts) return "posts";
  if (preferredTab === "feed") return "feed";
  if (!hasPosts) return "feed";
  return "posts";
}

function switchTab(
  tab: ProfileTab,
  tabsRef: React.RefObject<HTMLDivElement | null>,
  setActiveTab: (tab: ProfileTab) => void,
) {
  // Preserve scroll position relative to tabs when switching
  const tabsTop = tabsRef.current?.getBoundingClientRect().top ?? 0;
  setActiveTab(tab);
  requestAnimationFrame(() => {
    if (tabsRef.current) {
      const newTabsTop = tabsRef.current.getBoundingClientRect().top;
      window.scrollBy(0, newTabsTop - tabsTop);
    }
  });
}

function toggleSortPanel(
  sortPanelOpen: boolean,
  setSortPanelOpen: (open: boolean) => void,
  setSortPanelClosing: (closing: boolean) => void,
) {
  if (sortPanelOpen) {
    setSortPanelClosing(true);
    setTimeout(() => {
      setSortPanelOpen(false);
      setSortPanelClosing(false);
    }, SORT_PANEL_CLOSE_MS);
  } else {
    setSortPanelOpen(true);
  }
}

const ProfileUserQuery = gql(`
  query ProfileUserQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const ProfilePostsQuery = gql(`
  query ProfilePostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

const ProfileSequencesQuery = gql(`
  query ProfileSequencesQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequenceContinueReadingFragment
      }
      totalCount
    }
  }
`);

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

export default function ProfilePage() {
  const classes = useStyles(profileStyles);
  const [cookies, setCookie] = useCookiesWithConsent([SELECTED_PROFILE_TAB_COOKIE]);
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    () => parseProfileTab(cookies[SELECTED_PROFILE_TAB_COOKIE]) ?? "posts"
  );
  const [bioExpanded, setBioExpanded] = useState(false);
  const [postsToShow, setPostsToShow] = useState(INITIAL_POSTS_TO_SHOW);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [sortPanelClosing, setSortPanelClosing] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "top" | "topInflation" | "recentComments" | "old" | "magic">("new");
  const [feedSortBy, setFeedSortBy] = useState<"recent" | "top">("recent");
  const [feedFilter, setFeedFilter] = useState<"all" | "posts" | "quickTakes" | "comments">("all");
  const [showAllPostDiamonds, setShowAllPostDiamonds] = useState(false);
  const [showAllCommentDiamonds, setShowAllCommentDiamonds] = useState(false);
  const [postShowAllPending, setPostShowAllPending] = useState(false);
  const [commentShowAllPending, setCommentShowAllPending] = useState(false);
  const [cachedDiamondPosts, setCachedDiamondPosts] = useState<ProfilePostDiamonds>([]);
  const [cachedCommentDiamonds, setCachedCommentDiamonds] = useState<ProfileCommentDiamonds>([]);
  const bioRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { params } = useLocation();
  const slug = slugify(params.slug);

  const handleTabSwitch = (tab: ProfileTab) => {
    setCookie(SELECTED_PROFILE_TAB_COOKIE, tab, { path: "/" });
    switchTab(tab, tabsRef, setActiveTab);
  };
  const handleSortPanelToggle = () => toggleSortPanel(sortPanelOpen, setSortPanelOpen, setSortPanelClosing);

  const { data: userData, loading: userLoading } = useQuery(ProfileUserQuery, {
    variables: {
      selector: { usersProfile: { slug } },
      limit: 1,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  const user = getUserFromResults(userData?.users?.results);
  const userId = user?._id;
  const pinnedPostIds = user?.pinnedPostIds ?? [];
  const hideTopPosts = user?.hideProfileTopPosts ?? false;
  const hasPinnedPosts = pinnedPostIds.length >= TOP_POSTS_LIMIT;

  const { data: topPostsData } = useQuery(ProfilePostsQuery, {
    skip: !userId || !!hasPinnedPosts || hideTopPosts,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: "top", excludeEvents: true } } : undefined,
      limit: TOP_POSTS_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: pinnedPostsData } = useQuery(ProfilePostsQuery, {
    skip: !hasPinnedPosts || hideTopPosts,
    variables: {
      selector: hasPinnedPosts ? { default: { exactPostIds: pinnedPostIds } } : undefined,
      limit: TOP_POSTS_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: recentPostsData, loading: recentPostsLoading } = useQuery(ProfilePostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: sortBy, excludeEvents: true } } : undefined,
      limit: RECENT_POSTS_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: sequencesData, loading: sequencesLoading } = useQuery(ProfileSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: SEQUENCES_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: profileDiamondData, loading: profileDiamondLoading } = useQuery(ProfileDiamondDataQuery, {
    skip: !userId,
    variables: {
      userId: userId ?? "",
      postLimit: showAllPostDiamonds ? DIAMONDS_SHOW_ALL_LIMIT : DIAMONDS_INITIAL,
      commentLimit: showAllCommentDiamonds ? COMMENT_DIAMONDS_SHOW_ALL_LIMIT : COMMENT_DIAMONDS_INITIAL,
    },
    fetchPolicy: "cache-and-network",
  });

  const queriedDiamondPosts = profileDiamondData?.profileDiamondData?.posts;
  const queriedCommentDiamonds = profileDiamondData?.profileDiamondData?.comments;

  useEffect(() => {
    // Reset per-profile state so navigating between users doesn't carry over
    // expanded mode or cached diamonds from a previous profile.
    setCachedDiamondPosts([]);
    setCachedCommentDiamonds([]);
    setShowAllPostDiamonds(false);
    setShowAllCommentDiamonds(false);
    setPostShowAllPending(false);
    setCommentShowAllPending(false);
  }, [userId]);

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

  useEffect(() => {
    if (!queriedDiamondPosts) return;
    setCachedDiamondPosts(queriedDiamondPosts);
  }, [queriedDiamondPosts]);

  useEffect(() => {
    if (!queriedCommentDiamonds) return;
    setCachedCommentDiamonds(queriedCommentDiamonds);
  }, [queriedCommentDiamonds]);

  // When using pinnedPostIds, reorder results to match the pinned order.
  // The PostsList fragment guarantees all PostWithPreview fields exist at
  // runtime, but useQuery wraps them in DeepPartialObject which makes
  // every field optional. We narrow once here so helper functions get
  // properly typed inputs.
  const pinnedResults = (pinnedPostsData?.posts?.results ?? []) as PostWithPreview[];
  const topResults = (topPostsData?.posts?.results ?? []) as PostWithPreview[];
  const topPosts = hasPinnedPosts
    ? pinnedPostIds.map(id => pinnedResults.find(p => p._id === id)).filter((p): p is PostWithPreview => !!p)
    : topResults;
  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, TOP_POSTS_LIMIT);
  const topPostDefaultImages = buildTopPostDefaultImages(topPosts);
  const recentPosts = (recentPostsData?.posts?.results ?? []) as PostWithPreview[];
  const listPosts = recentPosts.slice(0, postsToShow);
  const hasMorePosts = recentPosts.length > postsToShow;
  const sequences = sequencesData?.sequences?.results ?? [];

  const allDiamondPosts = cachedDiamondPosts;
  const diamondPosts = allDiamondPosts;
  const userPostCount = user ? (user.postCount ?? 0) : 0;
  const postDiamondCount = Math.max(allDiamondPosts.length, userPostCount);
  const canShowAllPostDiamonds = userPostCount > DIAMONDS_INITIAL;
  const isPostDiamondsLoading = postShowAllPending && profileDiamondLoading;

  const allCommentDiamonds = cachedCommentDiamonds;
  const commentDiamonds = allCommentDiamonds;
  const userCommentCount = user ? (user.commentCount ?? 0) : 0;
  const commentDiamondCount = Math.max(allCommentDiamonds.length, userCommentCount);
  const canShowAllCommentDiamonds = userCommentCount > COMMENT_DIAMONDS_INITIAL;
  const isCommentDiamondsLoading = commentShowAllPending && profileDiamondLoading;

  const hasEnoughTopPosts = !hideTopPosts && topPosts.length >= 4;
  const hasPosts = recentPosts.length > 0;
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;
  const hasSequences = sequences.length > 0;
  const preferredProfileTab = parseProfileTab(cookies[SELECTED_PROFILE_TAB_COOKIE]);

  // The default tab is "posts", but if the user has no posts we switch to the
  // "feed" tab instead. We need to wait until the posts query finishes loading
  // before we can make that determination. If the user has a saved preference,
  // restore it when that tab is available for this profile.
  const tabInitialized = useRef(false);
  useEffect(() => {
    if (tabInitialized.current) return;
    if (recentPostsLoading || sequencesLoading || !userId) return;
    tabInitialized.current = true;
    setActiveTab(getInitialProfileTab({
      preferredTab: preferredProfileTab,
      hasPosts,
      hasSequences,
    }));
  }, [recentPostsLoading, sequencesLoading, userId, hasPosts, hasSequences, preferredProfileTab]);

  const currentUser = useCurrentUser();
  const isOwnProfile = !!(currentUser && user && currentUser._id === user._id);
  const canSubscribeToUser = !!user && !isOwnProfile;
  const canMessageUser = !!user && !!currentUser && !isOwnProfile;

  const username = user ? userGetDisplayName(user) : "Loading...";
  const bioHtml = user?.htmlBio ?? "";
  const collapsedBioHtml = getCollapsedBioHtml(bioHtml, BIO_COLLAPSED_WORD_LIMIT);
  const displayBioHtml = bioExpanded ? bioHtml : collapsedBioHtml;
  const showBioExpand = !!bioHtml && collapsedBioHtml !== bioHtml;
  const bioNoFollow = (user?.karma ?? 0) < nofollowKarmaThreshold.get();

  if (userLoading || !user) {
    return <div className={classes.profileContent}>
      <main className={classes.profileMain}>
        <Loading />
      </main>
    </div>;
  }

  return (
    <div className={classes.page}>
      <div className={classes.profileContent}>
        <main className={classes.profileMain}>
          <div className={classes.profileHeader}>
            <h1 className={classes.profileName}>
              <UsersNameWithModal
                user={user}
                className={classes.profileNameLink}
                tooltipPlacement="bottom-start"
              />
            </h1>
            <div className={classes.profileHeaderActions}>
              {isOwnProfile && (
                <Link to="/account?highlightField=pinnedPostIds" className={classes.profileEditButton}>
                  Edit
                </Link>
              )}
            </div>
          </div>

          {hasEnoughTopPosts && (
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
          )}

          {(bioHtml || user) && (
            <div className={classes.mobileProfileBio}>
              <div className={classes.mobileProfileHeaderRow}>
                <h4 className={classes.mobileProfileName}>{username}</h4>
                <div className={classes.mobileProfileActions}>
                  {canSubscribeToUser ? (
                    <UserNotifyDropdown
                      user={user}
                      popperPlacement="bottom-start"
                      className={classes.sidebarSubscribe}
                    />
                  ) : (
                    <span className={classNames(classes.sidebarSubscribe, classes.sidebarActionDisabled)}>Subscribe</span>
                  )}
                  {canMessageUser ? (
                    <NewConversationButton user={user} currentUser={currentUser}>
                      <a className={classes.sidebarMore}>Message</a>
                    </NewConversationButton>
                  ) : (
                    <span className={classNames(classes.sidebarMore, classes.sidebarActionDisabled)}>Message</span>
                  )}
                </div>
              </div>
              {bioHtml && (
                <ContentStyles contentType="post" className={classes.sidebarAuthorBioContent}>
                  <ContentItemBody
                    className={classes.sidebarAuthorBio}
                    dangerouslySetInnerHTML={{ __html: displayBioHtml }}
                    nofollow={bioNoFollow}
                  />
                </ContentStyles>
              )}
              {showBioExpand && (
                <div className={classes.readMore}>
                  <a
                    href="#"
                    className={classes.readMoreLink}
                    onClick={(e) => {
                      e.preventDefault();
                      setBioExpanded(!bioExpanded);
                    }}
                  >
                    {bioExpanded ? "See less" : "See more"}
                  </a>
                </div>
              )}
              {user && (
                <div className={classes.mobileMetaInfo}>
                  <UserMetaInfo user={user} />
                </div>
              )}
            </div>
          )}

          <section className={classes.allPostsSection}>
            <div className={classes.allPostsLeftColumn}>
            <div className={classes.allPostsHeader} ref={tabsRef}>
              <div className={classes.allPostsLeftHeader}>
                <div className={classes.profileTabs}>
                  <button
                    className={classNames(classes.profileTab, activeTab === "posts" && classes.profileTabActive)}
                    data-tab="posts"
                    type="button"
                    onClick={() => handleTabSwitch("posts")}
                  >
                    All posts
                  </button>
                  {hasSequences && (
                    <button
                      className={classNames(classes.profileTab, activeTab === "sequences" && classes.profileTabActive)}
                      data-tab="sequences"
                      type="button"
                      onClick={() => handleTabSwitch("sequences")}
                    >
                      Sequences
                    </button>
                  )}
                  <button
                    className={classNames(classes.profileTab, activeTab === "feed" && classes.profileTabActive)}
                    data-tab="feed"
                    type="button"
                    onClick={() => handleTabSwitch("feed")}
                  >
                    Feed
                  </button>
                </div>
                {((activeTab === "posts" && hasPosts) || (activeTab === "feed" && hasFeedContent) || activeTab === "sequences") && (
                  <div className={classes.sortControl}>
                    <button 
                      className={classNames(classes.sortIconButton, activeTab === "sequences" && classes.sortIconDisabled)}
                      onClick={activeTab !== "sequences" ? handleSortPanelToggle : undefined}
                      type="button"
                    >
                      <span className={classes.sortIcon}>⚙</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={classes.allPostsContainer}>
              <div className={classNames(classes.postsList, classes.tabPanel, activeTab === "posts" && classes.tabPanelActive)}>
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
                    <p className={classes.emptyStateDescription}>{username} has not written any posts yet.</p>
                    <div className={classes.emptyStateImage}>
                      <img src="/profile-placeholder-2.png" alt="" />
                    </div>
                  </div>
                )}
                {listPosts.map((post) => {
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

                {hasMorePosts && (
                  <div className={classes.readMore}>
                    <a 
                      href="#" 
                      className={classes.readMoreLink}
                      onClick={(e) => {
                        e.preventDefault();
                        setPostsToShow(prev => prev + INITIAL_POSTS_TO_SHOW);
                      }}
                    >
                      See more
                    </a>
                  </div>
                )}
              </div>

              <div
                className={classNames(classes.sequencesList, classes.tabPanel, activeTab === "sequences" && classes.tabPanelActive)}
              >
                <div className={classes.sequencesGrid}>
                  {sequences.map((sequence) => {
                    const imageId = sequence.gridImageId || defaultSequenceBannerIdSetting.get();
                    return (
                      <article key={sequence._id} className={classes.sequenceCard}>
                        <Link
                          to={sequenceGetPageUrl(sequence)}
                          className={classes.articleLink}
                        >
                          <div
                            className={classes.sequenceCardImage}
                            style={{
                              backgroundImage: cssUrl(`https://res.cloudinary.com/lesswrong-2-0/image/upload/c_fill,dpr_2.0,g_custom,h_380,q_auto,w_1200/v1/${imageId}`),
                            }}
                          ></div>
                          <div className={classes.sequenceCardContent}>
                            <h3 className={classes.sequenceCardTitle}>{sequence.title}</h3>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div
                className={classNames(classes.feedList, classes.tabPanel, activeTab === "feed" && classes.tabPanelActive)}
              >
                {(sortPanelOpen || sortPanelClosing) && (
                  <div className={classNames(classes.sortPanel, classes.sortPanelMulti, sortPanelClosing && classes.sortPanelClosing)}>
                    <div className={classes.sortPanelSection}>
                      <div className={classes.sortPanelHeader}>Sorted by:</div>
                      <button
                        className={classNames(classes.sortPanelOption, feedSortBy === "recent" && classes.sortPanelOptionSelected)}
                        onClick={() => setFeedSortBy("recent")}
                        type="button"
                      >
                        New
                      </button>
                      <button
                        className={classNames(classes.sortPanelOption, feedSortBy === "top" && classes.sortPanelOptionSelected)}
                        onClick={() => setFeedSortBy("top")}
                        type="button"
                      >
                        Top
                      </button>
                    </div>
                    <div className={classes.sortPanelSection}>
                      <div className={classes.sortPanelHeader}>Show:</div>
                      <button
                        className={classNames(classes.sortPanelOption, feedFilter === "all" && classes.sortPanelOptionSelected)}
                        onClick={() => setFeedFilter("all")}
                        type="button"
                      >
                        All
                      </button>
                      <button
                        className={classNames(classes.sortPanelOption, feedFilter === "comments" && classes.sortPanelOptionSelected)}
                        onClick={() => setFeedFilter("comments")}
                        type="button"
                      >
                        Comments
                      </button>
                      <button
                        className={classNames(classes.sortPanelOption, feedFilter === "quickTakes" && classes.sortPanelOptionSelected)}
                        onClick={() => setFeedFilter("quickTakes")}
                        type="button"
                      >
                        Quick takes
                      </button>
                      <button
                        className={classNames(classes.sortPanelOption, feedFilter === "posts" && classes.sortPanelOptionSelected)}
                        onClick={() => setFeedFilter("posts")}
                        type="button"
                      >
                        Posts
                      </button>
                    </div>
                  </div>
                )}
                {!hasFeedContent && (
                  <div className={classes.emptyStateContainer}>
                    <p className={classes.emptyStateDescription}>{username} hasn&apos;t written anything yet.</p>
                    <div className={classes.emptyStateImage}>
                      <img src="/profile-placeholder-4.png" alt="" />
                    </div>
                  </div>
                )}
                {hasFeedContent && userId && (
                  <UltraFeedContextProvider openInNewTab={true}>
                    <UltraFeedObserverProvider incognitoMode={false}>
                      <OverflowNavObserverProvider>
                        <UserContentFeed userId={userId} externalSortMode={feedSortBy} externalFilter={feedFilter} />
                      </OverflowNavObserverProvider>
                    </UltraFeedObserverProvider>
                  </UltraFeedContextProvider>
                )}
              </div>
            </div>
            </div>

            <aside className={classNames(classes.postsSidebar, bioHtml && classes.postsSidebarHasBio)}>
              <div className={classes.sidebarAuthorBlock}>
                  <div className={classes.diamondsSectionTitle}>Bio</div>
                  <div className={classes.sidebarBioMeta}>
                    {canSubscribeToUser && (
                      <UserNotifyDropdown
                        user={user}
                        popperPlacement="bottom-start"
                        className={classes.sidebarMetaAction}
                      />
                    )}
                    {canMessageUser && (
                      <NewConversationButton user={user} currentUser={currentUser}>
                        <a className={classes.sidebarMetaAction}>Message</a>
                      </NewConversationButton>
                    )}
                  </div>
                </div>
                <div className={classes.sidebarBioSection}>
                  <div 
                    ref={bioRef}
                    className={classNames(classes.sidebarBioWrapper, bioExpanded ? classes.sidebarBioExpanded : classes.sidebarBioCollapsed)}
                  >
                    <ContentStyles contentType="post" className={classes.sidebarAuthorBioContent}>
                      {bioHtml && (
                        <ContentItemBody
                          className={classes.sidebarAuthorBio}
                          dangerouslySetInnerHTML={{ __html: displayBioHtml }}
                          nofollow={bioNoFollow}
                        />
                      )}
                    </ContentStyles>
                  </div>
                  {showBioExpand && (
                    <div className={classNames(classes.readMore, classes.postsSidebarReadMore)}>
                      <a 
                        href="#" 
                        className={classes.readMoreLink}
                        onClick={(e) => {
                          e.preventDefault();
                          setBioExpanded(!bioExpanded);
                        }}
                      >
                        {bioExpanded ? "See less" : "See more"}
                      </a>
                    </div>
                  )}
                </div>
                {allDiamondPosts.length > 0 && (
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
                        const { isGold, isSolid } = getPostDiamondClasses(post.karma, post.isReviewWinner, post.isCurated);
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
                        const { isSolid } = getCommentDiamondClasses(comment.karma);
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
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
