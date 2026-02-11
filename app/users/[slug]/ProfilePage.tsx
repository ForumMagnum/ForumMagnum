"use client";

import { useLayoutEffect, useState, useRef, useEffect } from "react";
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
import Loading from "@/components/vulcan-core/Loading";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import UsersNameWithModal from "@/components/ultraFeed/UsersNameWithModal";
import LWTooltip from "@/components/common/LWTooltip";
import UserMetaInfo from "@/components/users/UserMetaInfo";
import UserNotifyDropdown from "@/components/notifications/UserNotifyDropdown";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import moment from "moment";

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
  "/default-post-preview.png",
  "/default-post-preview-1.png",
  "/default-post-preview-2.png",
  "/default-post-preview-3.png",
];

const SLUG_ALIASES: Record<string, string> = {
  "habryka": "habryka4",
};

// ── Helper functions ──

interface PostWithPreview {
  _id: string;
  title: string;
  baseScore: number | null;
  postedAt: string;
  contents: { plaintextDescription: string } | null;
  socialPreviewData: { imageUrl: string | null } | null;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getPostSummary(post: PostWithPreview): string {
  const fullSummary = (post?.contents?.plaintextDescription ?? "").trim();
  const words = fullSummary.split(/\s+/);
  if (words.length <= POST_SUMMARY_WORD_LIMIT) return fullSummary;
  return words.slice(0, POST_SUMMARY_WORD_LIMIT).join(" ") + "...";
}

function getTopPostSummary(post: PostWithPreview): string {
  return (post?.contents?.plaintextDescription ?? "").trim();
}

function getDefaultPreview(postId: string): string {
  return DEFAULT_PREVIEWS[hashString(postId) % DEFAULT_PREVIEWS.length];
}

function buildTopPostDefaultImages(topPosts: Array<{ _id: string }>): string[] {
  const seed = hashString(topPosts[0]?._id ?? "seed");
  const arr = [...DEFAULT_PREVIEWS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed + i * 2654435761) % (i + 1);
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
  if (url.includes("lh3.googleusercontent.com") || url.includes("docs.google.com")) {
    return fallback;
  }
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/c_fill,g_auto,f_auto,q_auto/");
  }
  return url;
}

function formatRelativeDate(date: Date | string): string {
  return moment(new Date(date)).fromNow();
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

const HabrykaUserQuery = gql(`
  query HabrykaDynamicUserQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const HabrykaPostsQuery = gql(`
  query HabrykaDynamicPostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

const HabrykaSequencesQuery = gql(`
  query HabrykaDynamicSequencesQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequenceContinueReadingFragment
      }
      totalCount
    }
  }
`);


export default function ProfilePage() {
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
  const rawSlug = slugify(params.slug);
  const slug = SLUG_ALIASES[rawSlug] ?? rawSlug;

  const handleTabSwitch = (tab: ProfileTab) => {
    // Preserve scroll position relative to tabs when switching
    const tabsTop = tabsRef.current?.getBoundingClientRect().top ?? 0;
    setActiveTab(tab);
    requestAnimationFrame(() => {
      if (tabsRef.current) {
        const newTabsTop = tabsRef.current.getBoundingClientRect().top;
        window.scrollBy(0, newTabsTop - tabsTop);
      }
    });
  };

  const handleSortPanelToggle = () => {
    if (sortPanelOpen) {
      setSortPanelClosing(true);
      setTimeout(() => {
        setSortPanelOpen(false);
        setSortPanelClosing(false);
      }, SORT_PANEL_CLOSE_MS);
    } else {
      setSortPanelOpen(true);
    }
  };

  const { data: userData, loading: userLoading } = useQuery(HabrykaUserQuery, {
    variables: {
      selector: { usersProfile: { slug } },
      limit: 1,
      enableTotal: false,
    },
  });

  const user = getUserFromResults(userData?.users?.results);
  const userId = user?._id;
  const pinnedPostIds = user?.pinnedPostIds;
  const hasPinnedPosts = pinnedPostIds && pinnedPostIds.length >= TOP_POSTS_LIMIT;

  const { data: topPostsData } = useQuery(HabrykaPostsQuery, {
    skip: !userId || hasPinnedPosts,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: "top" } } : undefined,
      limit: TOP_POSTS_LIMIT,
      enableTotal: false,
    },
  });

  const { data: pinnedPostsData } = useQuery(HabrykaPostsQuery, {
    skip: !hasPinnedPosts,
    variables: {
      selector: hasPinnedPosts ? { default: { exactPostIds: pinnedPostIds } } : undefined,
      limit: TOP_POSTS_LIMIT,
      enableTotal: false,
    },
  });

  const { data: recentPostsData, loading: recentPostsLoading } = useQuery(HabrykaPostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: "new" } } : undefined,
      limit: RECENT_POSTS_LIMIT,
      enableTotal: false,
    },
  });

  const { data: sequencesData } = useQuery(HabrykaSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: SEQUENCES_LIMIT,
      enableTotal: false,
    },
  });


  // When using pinnedPostIds, reorder results to match the pinned order
  const topPosts = hasPinnedPosts
    ? pinnedPostIds.map(id => (pinnedPostsData?.posts?.results ?? []).find(p => p._id === id)).filter((p): p is NonNullable<typeof p> => !!p)
    : (topPostsData?.posts?.results ?? []);
  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, TOP_POSTS_LIMIT);
  const topPostDefaultImages = buildTopPostDefaultImages(topPosts);
  const recentPosts = recentPostsData?.posts?.results ?? [];
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
  }, [recentPostsLoading, userId, hasPosts, setActiveTab]);

  const currentUser = useCurrentUser();
  const isOwnProfile = !!(currentUser && user && currentUser._id === user._id);

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

      const maxHeight = lineHeight * maxLines - paddingBottom - 8;
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
        ".habryka2 .list-article-title-text"
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
      document.fonts.ready.then(() => {
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
    return <div className="content profile-content">
      <main className="profile-main">
        <Loading />
      </main>
    </div>;
  }

  return (
    <div id="page" data-el="page">
      <div className="content profile-content" data-el="content">
        <main className="profile-main" data-el="profile-main">
          <div className="profile-header">
            <h1 className="profile-name">
              {username}
            </h1>
            {isOwnProfile && (
              <a href="/account" className="profile-edit-button">
                Edit
              </a>
            )}
          </div>

          {hasEnoughTopPosts && (
            <>
              <div className="top-posts-indicator">
                <LWTooltip title="Based on karma" placement="bottom">
                  <span className="top-posts-label top-posts-label--plural">Top posts</span>
                  <span className="top-posts-label top-posts-label--singular">Top post</span>
                </LWTooltip>
              </div>

              {topPost && (
                <a
                  href={postGetPageUrl(topPost)}
                  className="post-article"
                >
                  <div className="post-content">
                    <h2 className="post-title">
                      {topPost.title}
                    </h2>
                    <p className="post-summary">{getTopPostSummary(topPost)}</p>
                    <div className="post-meta-bar">
                      <span className="karma-score">{topPost.baseScore ?? 0}</span>
                      <span className="post-date">{formatRelativeDate(topPost.postedAt!)}</span>
                    </div>
                  </div>
                  <div
                    className="post-image"
                    style={{
                      backgroundImage: `url('${getPostImageUrl(topPost, topPostDefaultImages, 0)}')`,
                    }}
                  ></div>
                </a>
              )}

              <div className="small-articles-grid">
                {smallArticles.map((post, idx) => {
                  const imageUrl = getPostImageUrl(post, topPostDefaultImages, idx + 1);
                  return (
                    <article key={post._id} className="small-article">
                      <a
                        href={postGetPageUrl(post)}
                        className="article-link"
                      >
                        <div
                          className="small-article-image"
                          style={{ backgroundImage: `url('${imageUrl}')` }}
                        ></div>
                        <div className="small-article-content">
                          <h3 className="small-article-title">
                            {post.title}
                          </h3>
                          <div className="small-article-meta">
                            <span className="small-karma">{post.baseScore ?? 0}</span>
                            <span className="small-date">{formatRelativeDate(post.postedAt!)}</span>
                          </div>
                        </div>
                      </a>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {(bio || user) && (
            <div className="mobile-profile-bio">
              <h4 className="mobile-profile-name">{username}</h4>
              <div className="mobile-profile-actions sidebar-actions">
                {user ? (
                  <UserNotifyDropdown user={user} popperPlacement="bottom-start" className="sidebar-subscribe" />
                ) : (
                  <div className="sidebar-subscribe">Subscribe</div>
                )}
                {user && currentUser?._id !== user._id ? (
                  <NewConversationButton user={user} currentUser={currentUser}>
                    <a className="sidebar-more">Message</a>
                  </NewConversationButton>
                ) : (
                  <span className="sidebar-more">Message</span>
                )}
              </div>
              {bio && (
                <p className="mobile-bio-text sidebar-author-bio">
                  {truncateBio(bio, bioExpanded)}
                </p>
              )}
              {bio && bioNeedsTruncation(bio) && (
                <div className="read-more">
                  <a
                    href="#"
                    className="read-more-link"
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
                <div className="mobile-meta-info">
                  <UserMetaInfo user={user} />
                </div>
              )}
            </div>
          )}

          <section className="all-posts-section habryka2">
            <div className="all-posts-header" ref={tabsRef}>
              <div className="all-posts-left-header">
                <div className="profile-tabs">
                  <button
                    className={classNames("profile-tab", { active: activeTab === "posts" })}
                    data-tab="posts"
                    type="button"
                    onClick={() => handleTabSwitch("posts")}
                  >
                    All posts
                  </button>
                  {sequences.length > 0 && (
                    <button
                      className={classNames("profile-tab", { active: activeTab === "sequences" })}
                      data-tab="sequences"
                      type="button"
                      onClick={() => handleTabSwitch("sequences")}
                    >
                      Sequences
                    </button>
                  )}
                  <button
                    className={classNames("profile-tab", { active: activeTab === "feed" })}
                    data-tab="feed"
                    type="button"
                    onClick={() => handleTabSwitch("feed")}
                  >
                    Feed
                  </button>
                </div>
                {((activeTab === "posts" && hasPosts) || (activeTab === "feed" && hasFeedContent) || activeTab === "sequences") && (
                  <div className="sort-control">
                    <button 
                      className={classNames("sort-icon-button", { "sort-icon-disabled": activeTab === "sequences" })}
                      onClick={activeTab !== "sequences" ? handleSortPanelToggle : undefined}
                      type="button"
                    >
                      <span className="sort-icon">⚙</span>
                    </button>
                  </div>
                )}
              </div>
              <h4 className="sidebar-author-name">
                <UsersNameWithModal
                  user={user}
                  className="sidebar-author-name-link"
                  tooltipPlacement="bottom-start"
                />
              </h4>
            </div>

            <div className="all-posts-container">
              <div className={classNames("posts-list", "tab-panel", { active: activeTab === "posts" })}>
                {(sortPanelOpen || sortPanelClosing) && (
                  <div className={classNames("sort-panel", { closing: sortPanelClosing })}>
                    <div className="sort-panel-section">
                      <div className="sort-panel-header">Sorted by:</div>
                      <button
                        className={classNames("sort-panel-option", { selected: sortBy === "new" })}
                        onClick={() => setSortBy("new")}
                        type="button"
                      >
                        New
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: sortBy === "old" })}
                        onClick={() => setSortBy("old")}
                        type="button"
                      >
                        Old
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: sortBy === "magic" })}
                        onClick={() => setSortBy("magic")}
                        type="button"
                      >
                        Magic (New & Upvoted)
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: sortBy === "top" })}
                        onClick={() => setSortBy("top")}
                        type="button"
                      >
                        Top
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: sortBy === "topInflation" })}
                        onClick={() => setSortBy("topInflation")}
                        type="button"
                      >
                        Top (Inflation Adjusted)
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: sortBy === "recentComments" })}
                        onClick={() => setSortBy("recentComments")}
                        type="button"
                      >
                        Recent Comments
                      </button>
                    </div>
                  </div>
                )}
                {!hasPosts && !recentPostsLoading && (
                  <div className="empty-state-container">
                    <p className="empty-state-description">{username} has not written any posts yet.</p>
                    <div className="empty-state-image">
                      <img src="/default-post-preview-1.png" alt="" />
                    </div>
                  </div>
                )}
                {listPosts.map((post, index) => {
                  const summary = getPostSummary(post);
                  const imageUrl = getPostImageUrl(post, topPostDefaultImages);
                  const isPinned = !!post.shortform;
                  return (
                    <article key={post._id} className={classNames("list-article", { pinned: isPinned })}>
                      <a
                        href={postGetPageUrl(post)}
                        className="article-link"
                      >
                        <div className="list-article-content">
                          <h3 className="list-article-title">
                            {isPinned && (
                              <span className="pinned-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                  <path
                                    fillRule="evenodd"
                                    d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3"
                                  />
                                </svg>
                              </span>
                            )}
                            <span className="list-article-title-text">{post.title}</span>
                          </h3>
                          {summary && <p className="list-article-summary">{summary}</p>}
                          <div className="list-article-meta">
                            <span className="list-karma">{post.baseScore ?? 0}</span>
                            <span className="list-date">{formatRelativeDate(post.postedAt!)}</span>
                          </div>
                        </div>
                        <div
                          className="list-article-image"
                          style={imageUrl ? {
                            backgroundImage: `url('${imageUrl}')`,
                          } : undefined}
                        ></div>
                      </a>
                    </article>
                  );
                })}

                {hasMorePosts && (
                  <div className="read-more">
                    <a 
                      href="#" 
                      className="read-more-link"
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
                className={classNames("sequences-list", "tab-panel", { active: activeTab === "sequences" })}
              >
                <div className="sequences-grid">
                  {sequences.map((sequence) => {
                    const imageId = sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg";
                    return (
                      <article key={sequence._id} className="sequence-card">
                        <a
                          href={sequenceGetPageUrl(sequence)}
                          className="article-link"
                        >
                          <div
                            className="sequence-card-image"
                            style={{
                              backgroundImage: `url('https://res.cloudinary.com/lesswrong-2-0/image/upload/c_fill,dpr_2.0,g_custom,h_380,q_auto,w_1200/v1/${imageId}')`,
                            }}
                          ></div>
                          <div className="sequence-card-content">
                            <h3 className="sequence-card-title">{sequence.title}</h3>
                          </div>
                        </a>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div
                className={classNames("feed-list", "tab-panel", { active: activeTab === "feed" })}
              >
                {(sortPanelOpen || sortPanelClosing) && (
                  <div className={classNames("sort-panel", "sort-panel-multi", { closing: sortPanelClosing })}>
                    <div className="sort-panel-section">
                      <div className="sort-panel-header">Sorted by:</div>
                      <button
                        className={classNames("sort-panel-option", { selected: feedSortBy === "recent" })}
                        onClick={() => setFeedSortBy("recent")}
                        type="button"
                      >
                        New
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: feedSortBy === "top" })}
                        onClick={() => setFeedSortBy("top")}
                        type="button"
                      >
                        Top
                      </button>
                    </div>
                    <div className="sort-panel-section">
                      <div className="sort-panel-header">Show:</div>
                      <button
                        className={classNames("sort-panel-option", { selected: feedFilter === "all" })}
                        onClick={() => setFeedFilter("all")}
                        type="button"
                      >
                        All
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: feedFilter === "comments" })}
                        onClick={() => setFeedFilter("comments")}
                        type="button"
                      >
                        Comments
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: feedFilter === "quickTakes" })}
                        onClick={() => setFeedFilter("quickTakes")}
                        type="button"
                      >
                        Quick takes
                      </button>
                      <button
                        className={classNames("sort-panel-option", { selected: feedFilter === "posts" })}
                        onClick={() => setFeedFilter("posts")}
                        type="button"
                      >
                        Posts
                      </button>
                    </div>
                  </div>
                )}
                {!hasFeedContent && (
                  <div className="empty-state-container">
                    <p className="empty-state-description">{username} hasn&apos;t written anything yet.</p>
                    <div className="empty-state-image">
                      <img src="/default-post-preview-3.png" alt="" />
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

              <aside className={classNames("posts-sidebar", { "has-bio": !!bio })}>
                <div className="sidebar-actions">
                  {user ? (
                    <UserNotifyDropdown user={user} popperPlacement="bottom-start" className="sidebar-subscribe" />
                  ) : (
                    <div className="sidebar-subscribe">Subscribe</div>
                  )}
                  {user && currentUser?._id !== user._id ? (
                    <NewConversationButton user={user} currentUser={currentUser}>
                      <a className="sidebar-more">Message</a>
                    </NewConversationButton>
                  ) : (
                    <span className="sidebar-more">Message</span>
                  )}
                </div>
                {bio && (
                  <div className="sidebar-bio-section">
                    <div 
                      ref={bioRef}
                      className={classNames("sidebar-bio-wrapper", { expanded: bioExpanded, collapsed: !bioExpanded })}
                    >
                      <p className="sidebar-author-bio">
                        {bio}
                      </p>
                    </div>
                    {bioNeedsTruncation(bio) && (
                      <div className="read-more">
                        <a 
                          href="#" 
                          className="read-more-link"
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
                  <div className="sidebar-stats">
                    {(user.karma ?? 0) !== 0 && (
                      <div className="sidebar-stat-row">{(user.karma ?? 0).toLocaleString()} karma</div>
                    )}
                    {(user.afKarma ?? 0) > 0 && (
                      <div className="sidebar-stat-row">{(user.afKarma ?? 0).toLocaleString()} alignment forum karma</div>
                    )}
                    {(user.postCount ?? 0) > 0 && (
                      <div className="sidebar-stat-row">{user.postCount} {user.postCount === 1 ? "post" : "posts"}</div>
                    )}
                    {(user.commentCount ?? 0) > 0 && (
                      <div className="sidebar-stat-row">{user.commentCount} {user.commentCount === 1 ? "comment" : "comments"}</div>
                    )}
                    {user.createdAt && (
                      <div className="sidebar-stat-row">Member for {moment(new Date(user.createdAt)).fromNow(true)}</div>
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
