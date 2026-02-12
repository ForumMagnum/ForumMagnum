"use client";

import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
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
import { Link } from "@/lib/reactRouterWrapper";
import moment from "moment";
import { profileStyles } from "./profileStyles";

// ── Constants ──

const INITIAL_POSTS_TO_SHOW = 7;
const TOP_POSTS_LIMIT = 4;
const RECENT_POSTS_LIMIT = 50;
const SEQUENCES_LIMIT = 6;
const BIO_WORD_LIMIT = 45;
const POST_SUMMARY_WORD_LIMIT = 50;
const SORT_PANEL_CLOSE_MS = 300;
const FONT_LOAD_TIMEOUT_MS = 1000;

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

function getPostSummary(post: { contents?: { plaintextDescription?: string | null } | null }): string {
  const fullSummary = (post?.contents?.plaintextDescription ?? "").trim();
  const words = fullSummary.split(/\s+/);
  if (words.length <= POST_SUMMARY_WORD_LIMIT) return fullSummary;
  return words.slice(0, POST_SUMMARY_WORD_LIMIT).join(" ") + "...";
}

function getTopPostSummary(post: { contents?: { plaintextDescription?: string | null } | null }): string {
  return (post?.contents?.plaintextDescription ?? "").trim();
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
  if (!url || !url.trim()) return fallback;
  // Google-hosted images (Docs embeds, profile photos) don't render well as
  // post preview cards, so fall back to a placeholder instead
  if (url.includes("lh3.googleusercontent.com") || url.includes("docs.google.com")) {
    return fallback;
  }
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/c_fill,g_auto,f_auto,q_auto/");
  }
  return url;
}

function formatReadableDate(date: Date | string): string {
  const m = moment(new Date(date));
  if (m.year() === moment().year()) {
    return m.format("MMM D");
  }
  return m.format("MMM D, YYYY");
}

function truncateBio(bio: string, expanded: boolean): string {
  if (expanded) return bio;
  const words = bio.split(/\s+/);
  if (words.length <= BIO_WORD_LIMIT) return bio;
  return words.slice(0, BIO_WORD_LIMIT).join(" ") + "...";
}

function bioNeedsTruncation(bio: string): boolean {
  return bio.split(/\s+/).length > BIO_WORD_LIMIT;
}

type ProfileTab = "posts" | "sequences" | "feed";

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


export default function ProfilePage() {
  const classes = useStyles(profileStyles);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [postsToShow, setPostsToShow] = useState(INITIAL_POSTS_TO_SHOW);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [sortPanelClosing, setSortPanelClosing] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "top" | "topInflation" | "recentComments" | "old" | "magic">("new");
  const [feedSortBy, setFeedSortBy] = useState<"recent" | "top">("recent");
  const [feedFilter, setFeedFilter] = useState<"all" | "posts" | "quickTakes" | "comments">("all");
  const bioRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { params } = useLocation();
  const slug = slugify(params.slug);

  const handleTabSwitch = (tab: ProfileTab) => switchTab(tab, tabsRef, setActiveTab);
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
  const pinnedPostIds = user?.pinnedPostIds;
  const hasPinnedPosts = pinnedPostIds && pinnedPostIds.length >= TOP_POSTS_LIMIT;

  const { data: topPostsData } = useQuery(ProfilePostsQuery, {
    skip: !userId || !!hasPinnedPosts,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: "top", excludeEvents: true } } : undefined,
      limit: TOP_POSTS_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: pinnedPostsData } = useQuery(ProfilePostsQuery, {
    skip: !hasPinnedPosts,
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

  const { data: sequencesData } = useQuery(ProfileSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: SEQUENCES_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });


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

  const hasEnoughTopPosts = topPosts.length >= 4;
  const hasPosts = recentPosts.length > 0;
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;

  const tabInitialized = useRef(false);
  useEffect(() => {
    if (tabInitialized.current) return;
    if (recentPostsLoading || !userId) return;
    tabInitialized.current = true;
    if (!hasPosts) {
      setActiveTab("feed");
    }
  }, [recentPostsLoading, userId, hasPosts]);

  const currentUser = useCurrentUser();
  const isOwnProfile = !!(currentUser && user && currentUser._id === user._id);
  const canSubscribeToUser = !!user && !isOwnProfile;
  const canMessageUser = !!user && !!currentUser && !isOwnProfile;

  const username = user ? userGetDisplayName(user) : "Loading...";
  const bio = user?.biography?.plaintextDescription;


  useLayoutEffect(() => {
    const truncateToLines = (node: HTMLElement, maxLines: number) => {
      const fullText = node.dataset.fullText ?? node.textContent ?? "";
      if (!fullText) {
        return;
      }

      if (!node.dataset.fullText) {
        node.dataset.fullText = fullText;
      }

      node.textContent = fullText;
      const style = window.getComputedStyle(node);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const paddingBottom = Number.parseFloat(style.paddingBottom);
      if (!Number.isFinite(lineHeight)) {
        return;
      }

      const maxHeight = (lineHeight * maxLines) - paddingBottom - 8;
      if (node.scrollHeight <= maxHeight + paddingBottom) {
        return;
      }

      const ellipsis = "...";
      let low = 0;
      let high = fullText.length;

      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        node.textContent = `${fullText.slice(0, mid).trimEnd()}${ellipsis}`;
        if (node.scrollHeight <= maxHeight + paddingBottom) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      let truncated = fullText.slice(0, Math.max(1, low)).trimEnd();
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > Math.max(0, truncated.length - 20)) {
        truncated = truncated.slice(0, lastSpace).trimEnd();
      }
      node.textContent = `${truncated}${ellipsis}`;
    };

    const truncateToFit = (node: HTMLElement) => {
      const fullText = node.dataset.fullText ?? node.textContent ?? "";
      if (!fullText) {
        return;
      }

      if (!node.dataset.fullText) {
        node.dataset.fullText = fullText;
      }

      // On mobile/responsive (below the stacking breakpoint), skip JS
      // truncation and let CSS line-clamp handle it instead
      if (window.innerWidth <= 750) {
        node.style.display = "";
        node.style.position = "";
        node.style.height = "";
        node.style.flex = "";
        node.style.width = "";
        node.textContent = fullText;
        return;
      }

      // Reset all inline styles before measuring so CSS takes over and we
      // get accurate flex-allocated dimensions
      node.style.display = "";
      node.style.flex = "";
      node.style.position = "";
      node.style.height = "";
      node.style.width = "";
      node.textContent = fullText;

      const style = window.getComputedStyle(node);
      const lineHeight = Number.parseFloat(style.lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
        return;
      }

      // In a flex container, clientHeight is the allocated space (our budget)
      const availableHeight = node.clientHeight;
      const flexWidth = node.clientWidth;
      if (availableHeight <= 0 || flexWidth <= 0) {
        return;
      }

      // Subtract a small buffer so descenders on the last line aren't clipped
      const descenderBuffer = 4;
      const maxLines = Math.floor((availableHeight - descenderBuffer) / lineHeight);
      if (maxLines < 2) {
        node.textContent = "";
        node.style.display = "none";
        return;
      }

      const targetHeight = lineHeight * maxLines;

      // Temporarily take element out of flex flow so scrollHeight reflects
      // actual content height rather than being clamped to clientHeight.
      // Lock the width to match the flex-allocated width so line wrapping
      // is identical during measurement and final display.
      node.style.position = "absolute";
      node.style.height = "auto";
      node.style.flex = "none";
      node.style.width = `${flexWidth}px`;

      const naturalHeight = node.scrollHeight;

      if (naturalHeight <= targetHeight + 1) {
        // Content fits — restore with flex: none so element shrinks to content
        node.style.position = "";
        node.style.height = "";
        node.style.flex = "none";
        node.style.width = "";
        return;
      }

      const ellipsis = "...";
      let low = 0;
      let high = fullText.length;

      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        node.textContent = `${fullText.slice(0, mid).trimEnd()}${ellipsis}`;
        if (node.scrollHeight <= targetHeight + 1) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      let truncated = fullText.slice(0, Math.max(1, low)).trimEnd();
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > Math.max(0, truncated.length - 20)) {
        truncated = truncated.slice(0, lastSpace).trimEnd();
      }
      node.textContent = `${truncated}${ellipsis}`;

      // Restore layout but keep flex: none so the element shrinks to its
      // truncated content height instead of stretching to fill the container
      node.style.position = "";
      node.style.height = "";
      node.style.flex = "none";
      node.style.width = "";
    };

    const updateOverflowIndicators = () => {
      const postTitleNodes = document.querySelectorAll<HTMLElement>(".post-title");
      postTitleNodes.forEach((node) => truncateToLines(node, 4));

      const summaryNodes = document.querySelectorAll<HTMLElement>(".post-summary");
      summaryNodes.forEach((node) => truncateToFit(node));

      const titleNodes = document.querySelectorAll<HTMLElement>(
        ".list-article-title-text"
      );

      titleNodes.forEach((node) => truncateToLines(node, 4));
    };

    const scheduleUpdate = () => window.requestAnimationFrame(updateOverflowIndicators);

    document.documentElement.classList.remove("truncation-ready");
    document.documentElement.classList.remove("dates-ready");

    // Run immediately to attempt truncation before paint, then schedule
    // a follow-up via rAF in case CSS wasn't applied yet
    updateOverflowIndicators();
    scheduleUpdate();

    const finalizeTruncation = () => {
      updateOverflowIndicators();
      document.documentElement.classList.add("truncation-ready");
      document.documentElement.classList.add("dates-ready");
    };

    // Re-run after web fonts load (may change line widths/heights)
    // Add timeout fallback in case fonts take too long
    const fontTimeout = setTimeout(finalizeTruncation, FONT_LOAD_TIMEOUT_MS);
    
    if (document.fonts && "ready" in document.fonts) {
      void document.fonts.ready.then(() => {
        clearTimeout(fontTimeout);
        finalizeTruncation();
      });
    } else {
      scheduleUpdate();
      window.requestAnimationFrame(() => {
        clearTimeout(fontTimeout);
        finalizeTruncation();
      });
    }

    window.addEventListener("resize", scheduleUpdate);
    return () => window.removeEventListener("resize", scheduleUpdate);
  }, [activeTab, topPost?._id]);

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
            {isOwnProfile && (
              <Link to="/account" className={classes.profileEditButton}>
                Edit
              </Link>
            )}
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
                    <h2 className={classNames("post-title", classes.postTitle, classes.topPostTitle)}>
                      {topPost.title}
                    </h2>
                    <p className={classNames("post-summary", classes.postSummary)}>{getTopPostSummary(topPost)}</p>
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
                      backgroundImage: `url('${getPostImageUrl(topPost, topPostDefaultImages, 0)}')`,
                    }}
                  ></div>
                </Link>
              )}

              <div className={classes.smallArticlesGrid}>
                {smallArticles.map((post, idx) => {
                  const imageUrl = getPostImageUrl(post, topPostDefaultImages, idx + 1);
                  return (
                    <article key={post._id} className={classes.smallArticle}>
                      <Link
                        to={postGetPageUrl(post)}
                        className={classes.articleLink}
                      >
                        <div
                          className={classes.smallArticleImage}
                          style={{ backgroundImage: `url('${imageUrl}')` }}
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

          {(bio || user) && (
            <div className={classes.mobileProfileBio}>
              <h4 className={classes.mobileProfileName}>{username}</h4>
              <div className={classNames(classes.mobileProfileActions, classes.sidebarActions)}>
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
              {bio && (
                <p className={classes.sidebarAuthorBio}>
                  {truncateBio(bio, bioExpanded)}
                </p>
              )}
              {bio && bioNeedsTruncation(bio) && (
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
                  {sequences.length > 0 && (
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
              <h4 className={classes.sidebarAuthorName}>
                <UsersNameWithModal
                  user={user}
                  className={classes.sidebarAuthorNameLink}
                  tooltipPlacement="bottom-start"
                />
              </h4>
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
                {listPosts.map((post, index) => {
                  const summary = getPostSummary(post);
                  const imageUrl = getPostImageUrl(post, topPostDefaultImages);
                  const isPinned = !!pinnedPostIds?.includes(post._id);
                  return (
                    <article key={post._id} className={classes.listArticle}>
                      <Link
                        to={postGetPageUrl(post)}
                        className={classes.articleLink}
                      >
                        <div className={classes.listArticleContent}>
                          <h3 className={classes.listArticleTitle}>
                            {isPinned && (
                              <span className={classes.pinnedIcon} aria-hidden="true">
                                <svg className={classes.pinnedIconSvg} viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                  <path
                                    fillRule="evenodd"
                                    d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3"
                                  />
                                </svg>
                              </span>
                            )}
                            <span className={classNames("list-article-title-text", classes.listArticleTitleText)}>{post.title}</span>
                          </h3>
                          {summary && <p className={classes.listArticleSummary}>{summary}</p>}
                          <div className={classes.listArticleMeta}>
                            <LWTooltip title="Karma score">
                              <span className={classes.listKarma}>{post.baseScore ?? 0}</span>
                            </LWTooltip>
                            <LWTooltip title={<ExpandedDate date={post.postedAt!} />}>
                              <span className={classes.listDate}>{formatReadableDate(post.postedAt!)}</span>
                            </LWTooltip>
                          </div>
                        </div>
                        <div
                          className={classes.listArticleImage}
                          style={imageUrl ? {
                            backgroundImage: `url('${imageUrl}')`,
                          } : undefined}
                        ></div>
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
                    const imageId = sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg";
                    return (
                      <article key={sequence._id} className={classes.sequenceCard}>
                        <Link
                          to={sequenceGetPageUrl(sequence)}
                          className={classes.articleLink}
                        >
                          <div
                            className={classes.sequenceCardImage}
                            style={{
                              backgroundImage: `url('https://res.cloudinary.com/lesswrong-2-0/image/upload/c_fill,dpr_2.0,g_custom,h_380,q_auto,w_1200/v1/${imageId}')`,
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

              <aside className={classNames(classes.postsSidebar, bio && classes.postsSidebarHasBio)}>
                <div className={classes.sidebarActions}>
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
                {bio && (
                  <div className={classes.sidebarBioSection}>
                    <div 
                      ref={bioRef}
                      className={classNames(classes.sidebarBioWrapper, bioExpanded ? classes.sidebarBioExpanded : classes.sidebarBioCollapsed)}
                    >
                      <p className={classes.sidebarAuthorBio}>
                        {bio}
                      </p>
                    </div>
                    {bioNeedsTruncation(bio) && (
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
                )}
                {user && (
                  <div className={classes.sidebarStats}>
                    {(user.karma ?? 0) !== 0 && (
                      <div className={classes.sidebarStatRow}>{(user.karma ?? 0).toLocaleString()} karma</div>
                    )}
                    {(user.afKarma ?? 0) > 0 && (
                      <div className={classes.sidebarStatRow}>{(user.afKarma ?? 0).toLocaleString()} alignment forum karma</div>
                    )}
                    {(user.postCount ?? 0) > 0 && (
                      <div className={classes.sidebarStatRow}>{user.postCount} {user.postCount === 1 ? "post" : "posts"}</div>
                    )}
                    {(user.commentCount ?? 0) > 0 && (
                      <div className={classes.sidebarStatRow}>{user.commentCount} {user.commentCount === 1 ? "comment" : "comments"}</div>
                    )}
                    {user.createdAt && (
                      <div className={classes.sidebarStatRow}>Member for {moment(new Date(user.createdAt)).fromNow(true)}</div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
