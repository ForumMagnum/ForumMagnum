"use client";

import { useLayoutEffect, useState, useRef, useEffect } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { useLocation } from "@/lib/routeUtil";
import { userGetDisplayName, userGetProfileUrl } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { getUserFromResults } from "@/components/users/UsersProfile";
import { slugify } from "@/lib/utils/slugify";
import Loading from "@/components/vulcan-core/Loading";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import moment from "moment";

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


export default function HabrykaUserPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [postsToShow, setPostsToShow] = useState(7);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [sortPanelClosing, setSortPanelClosing] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "top" | "topInflation" | "recentComments" | "old" | "magic">("new");
  const bioRef = useRef<HTMLDivElement>(null);
  const { params } = useLocation();
  const slug = slugify(params.slug);

  const handleSortPanelToggle = () => {
    if (sortPanelOpen) {
      setSortPanelClosing(true);
      setTimeout(() => {
        setSortPanelOpen(false);
        setSortPanelClosing(false);
      }, 300);
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

  const { data: topPostsData } = useQuery(HabrykaPostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: "top", authorIsUnreviewed: null } } : undefined,
      limit: 4,
      enableTotal: false,
    },
  });

  const { data: recentPostsData } = useQuery(HabrykaPostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: "new", authorIsUnreviewed: null } } : undefined,
      limit: 50,
      enableTotal: false,
    },
  });

  const { data: sequencesData } = useQuery(HabrykaSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: 6,
      enableTotal: false,
    },
  });


  const topPosts = topPostsData?.posts?.results ?? [];
  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, 4);
  const recentPosts = recentPostsData?.posts?.results ?? [];
  const listPosts = recentPosts.slice(0, postsToShow);
  const hasMorePosts = recentPosts.length > postsToShow;
  const sequences = sequencesData?.sequences?.results ?? [];

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
    const fontTimeout = setTimeout(finalizeTruncation, 1000);
    
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

  const getPostSummary = (post: any) => {
    const fullSummary = post?.contents?.plaintextDescription ?? "";
    const words = fullSummary.split(/\s+/);
    if (words.length <= 50) return fullSummary;
    return words.slice(0, 50).join(" ") + "...";
  };
  const getTopPostSummary = (post: any) => {
    return post?.contents?.plaintextDescription ?? "";
  };
  const getPostImageUrl = (post: any) => {
    const url = post?.socialPreviewData?.imageUrl;
    return (url && url.trim()) ? url : "/default-post-preview.png";
  };
  const formatRelativeDate = (date: Date | string) => moment(new Date(date)).fromNow();

  return (
    <div id="page" data-el="page">
      <div className="content profile-content" data-el="content">
        <main className="profile-main" data-el="profile-main">
          <div
            className="profile-header"
            style={{
              marginBottom: "15px",
              paddingBottom: "10px",
              borderBottom: "1px solid #e5ddd6",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <h1 className="profile-name" style={{ margin: 0 }}>
              {username}
            </h1>
          </div>

          <div className="top-posts-indicator">
            <span className="top-posts-label top-posts-label--plural">Top posts</span>
            <span className="top-posts-label top-posts-label--singular">Top post</span>
          </div>

          {topPost ? (
            <a
              href={postGetPageUrl(topPost)}
              className="post-article"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="post-content">
                <h2 className="post-title">
                  {topPost.title}
                </h2>
                <p className="post-summary">
                  {getTopPostSummary(topPost)}
                </p>
                <div className="post-meta-bar">
                  <span className="karma-score">{topPost.baseScore ?? 0}</span>
                  <span className="post-date">{formatRelativeDate(topPost.postedAt!)}</span>
                </div>
              </div>
              <div
                className="post-image"
                style={{
                  backgroundImage: `url('${getPostImageUrl(topPost)}')`,
                }}
              ></div>
            </a>
          ) : (
            <div>No top post yet.</div>
          )}

          <div className="small-articles-grid">
            {smallArticles.map((post) => {
              const imageUrl = getPostImageUrl(post);
              return (
                <article key={post._id} className="small-article">
                  <a
                    href={postGetPageUrl(post)}
                    style={{ textDecoration: "none", color: "inherit", display: "contents" }}
                  >
                    <div
                      className="small-article-image"
                      style={{
                        backgroundImage: `url('${imageUrl}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
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

          <section className="all-posts-section habryka2">
            <div className="all-posts-header">
              <div className="all-posts-left-header">
                <div className="profile-tabs">
                  <button
                    className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
                    data-tab="posts"
                    type="button"
                    onClick={() => setActiveTab("posts")}
                  >
                    All posts
                  </button>
                  <button
                    className={`profile-tab ${activeTab === "sequences" ? "active" : ""}`}
                    data-tab="sequences"
                    type="button"
                    onClick={() => setActiveTab("sequences")}
                  >
                    Sequences
                  </button>
                  <button
                    className={`profile-tab ${activeTab === "feed" ? "active" : ""}`}
                    data-tab="feed"
                    type="button"
                    onClick={() => setActiveTab("feed")}
                  >
                    Feed
                  </button>
                </div>
                <div className="sort-control">
                  <button 
                    className="sort-icon-button"
                    onClick={handleSortPanelToggle}
                    type="button"
                  >
                    <span className="sort-icon">⚙</span>
                  </button>
                </div>
              </div>
              <h4 className="sidebar-author-name">{username}</h4>
            </div>

            <div className="all-posts-container">
              <div className={`posts-list tab-panel ${activeTab === "posts" ? "active" : ""}`}>
                {(sortPanelOpen || sortPanelClosing) && (
                  <div className={`sort-panel ${sortPanelClosing ? "closing" : ""}`}>
                    <div className="sort-panel-section">
                      <div className="sort-panel-header">Sorted by:</div>
                      <button
                        className={`sort-panel-option ${sortBy === "new" ? "selected" : ""}`}
                        onClick={() => setSortBy("new")}
                        type="button"
                      >
                        New
                      </button>
                      <button
                        className={`sort-panel-option ${sortBy === "old" ? "selected" : ""}`}
                        onClick={() => setSortBy("old")}
                        type="button"
                      >
                        Old
                      </button>
                      <button
                        className={`sort-panel-option ${sortBy === "magic" ? "selected" : ""}`}
                        onClick={() => setSortBy("magic")}
                        type="button"
                      >
                        Magic (New & Upvoted)
                      </button>
                      <button
                        className={`sort-panel-option ${sortBy === "top" ? "selected" : ""}`}
                        onClick={() => setSortBy("top")}
                        type="button"
                      >
                        Top
                      </button>
                      <button
                        className={`sort-panel-option ${sortBy === "topInflation" ? "selected" : ""}`}
                        onClick={() => setSortBy("topInflation")}
                        type="button"
                      >
                        Top (Inflation Adjusted)
                      </button>
                      <button
                        className={`sort-panel-option ${sortBy === "recentComments" ? "selected" : ""}`}
                        onClick={() => setSortBy("recentComments")}
                        type="button"
                      >
                        Recent Comments
                      </button>
                    </div>
                  </div>
                )}
                {listPosts.map((post, index) => {
                  const summary = getPostSummary(post);
                  const imageUrl = getPostImageUrl(post);
                  const isPinned = !!post.shortform;
                  return (
                    <article key={post._id} className={isPinned ? "list-article pinned" : "list-article"}>
                      <a
                        href={postGetPageUrl(post)}
                        style={{ textDecoration: "none", color: "inherit", display: "contents" }}
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
                        setPostsToShow(prev => prev + 7);
                      }}
                    >
                      Read more
                    </a>
                  </div>
                )}
              </div>

              <div
                className={`sequences-list tab-panel ${activeTab === "sequences" ? "active" : ""}`}
              >
                <div className="sequences-grid">
                  {sequences.map((sequence) => {
                    const imageId = sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg";
                    return (
                      <article key={sequence._id} className="sequence-card">
                        <a
                          href={sequenceGetPageUrl(sequence)}
                          style={{ textDecoration: "none", color: "inherit", display: "contents" }}
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
                className={`feed-list tab-panel ${activeTab === "feed" ? "active" : ""}`}
              >
                {userId && (
                  <UltraFeedContextProvider openInNewTab={true}>
                    <UltraFeedObserverProvider incognitoMode={false}>
                      <OverflowNavObserverProvider>
                        <UserContentFeed userId={userId} />
                      </OverflowNavObserverProvider>
                    </UltraFeedObserverProvider>
                  </UltraFeedContextProvider>
                )}
              </div>

              <aside className="posts-sidebar">
                <div className="sidebar-actions">
                  <div className="sidebar-subscribe">Subscribe</div>
                  <a href="#" className="sidebar-more">
                    Message
                  </a>
                </div>
                {bio && (
                  <>
                    <div 
                      ref={bioRef}
                      className={`sidebar-bio-wrapper ${bioExpanded ? "expanded" : "collapsed"}`}
                    >
                      <p className="sidebar-author-bio">
                        {bio}
                      </p>
                    </div>
                    {bio.split(/\s+/).filter(Boolean).length > 65 && (
                      <div className="read-more">
                        <a 
                          href="#" 
                          className="read-more-link"
                          onClick={(e) => {
                            e.preventDefault();
                            setBioExpanded(!bioExpanded);
                          }}
                        >
                          {bioExpanded ? "Show less" : "Read more"}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
