"use client";

import { useEffect, useState } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { userGetDisplayName, userGetProfileUrl } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { commentGetPageUrl } from "@/lib/collections/comments/helpers";
import { getUserFromResults } from "@/components/users/UsersProfile";
import Loading from "@/components/vulcan-core/Loading";
import moment from "moment";

type ProfileTab = "posts" | "sequences" | "comments";

const HabrykaUserQuery = gql(`
  query HabrykaMockupUserQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const HabrykaPostsQuery = gql(`
  query HabrykaMockupPostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

const HabrykaSequencesQuery = gql(`
  query HabrykaMockupSequencesQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequenceContinueReadingFragment
      }
      totalCount
    }
  }
`);

const HabrykaCommentsQuery = gql(`
  query HabrykaMockupCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

export default function HabrykaPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const slug = "habryka4";
  
  return <HabrykaProfileContent slug={slug} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function HabrykaProfileContent({ slug, activeTab, setActiveTab }: { 
  slug: string; 
  activeTab: ProfileTab; 
  setActiveTab: (tab: ProfileTab) => void;
}) {

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
      limit: 10,
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

  const { data: commentsData } = useQuery(HabrykaCommentsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { profileComments: { userId, sortBy: "new", authorIsUnreviewed: null } } : undefined,
      limit: 6,
      enableTotal: false,
    },
  });

  const topPosts = topPostsData?.posts?.results ?? [];
  const topPost = topPosts[0];
  const smallArticles = topPosts.slice(1, 4);
  const recentPosts = recentPostsData?.posts?.results ?? [];
  const listPosts = recentPosts.slice(0, 7);
  const sequences = sequencesData?.sequences?.results ?? [];
  const comments = commentsData?.comments?.results ?? [];

  const username = user ? userGetDisplayName(user) : "Loading...";
  const bio = user?.biography?.plaintextDescription;

  useEffect(() => {
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

    const updateOverflowIndicators = () => {
      const titleNodes = document.querySelectorAll<HTMLElement>(
        ".habryka2 .list-article-title-text"
      );

      titleNodes.forEach((node) => truncateToLines(node, 4));
    };

    const scheduleUpdate = () => window.requestAnimationFrame(updateOverflowIndicators);

    scheduleUpdate();
    if (document.fonts && "ready" in document.fonts) {
      document.fonts.ready.then(scheduleUpdate);
    }

    window.addEventListener("resize", scheduleUpdate);
    return () => window.removeEventListener("resize", scheduleUpdate);
  }, [activeTab]);

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
    const fullSummary = post?.contents?.plaintextDescription ?? "";
    const words = fullSummary.split(/\s+/);
    if (words.length <= 18) return fullSummary;
    return words.slice(0, 18).join(" ") + "...";
  };
  const getPostImageUrl = (post: any) => {
    const url = post?.socialPreviewData?.imageUrl;
    return (url && url.trim()) ? url : "/default-post-preview.png";
  };
  const formatRelativeDate = (date: Date | string) => moment(new Date(date)).fromNow();
  const getCommentParagraphs = (comment: any) => {
    const text = comment.contents?.plaintextMainText;
    if (!text) return [];
    return text.split(/\n+/).map((l: string) => l.trim()).filter(Boolean).slice(0, 2);
  };

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
            <span className="top-posts-label">Top post</span>
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
                    className={`profile-tab ${activeTab === "comments" ? "active" : ""}`}
                    data-tab="comments"
                    type="button"
                    onClick={() => setActiveTab("comments")}
                  >
                    Comments
                  </button>
                </div>
                <div className="sort-control">
                  <span className="sort-icon">⚙</span>
                </div>
              </div>
              <h4 className="sidebar-author-name">{username}</h4>
            </div>

            <div className="all-posts-container">
              <div className={`posts-list tab-panel ${activeTab === "posts" ? "active" : ""}`}>
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

                <div className="read-more">
                  <a href={user ? userGetProfileUrl(user) : "#"} className="read-more-link">
                    Read more
                  </a>
                </div>
              </div>

              <div
                className={`sequences-list tab-panel ${activeTab === "sequences" ? "active" : ""}`}
              >
                <div className="sequences-grid">
                  {sequences.map((sequence) => {
                    const imageId = sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg";
                    return (
                      <a
                        key={sequence._id}
                        href={sequenceGetPageUrl(sequence)}
                        className="sequence-card"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          className="sequence-card-image"
                          style={{
                            backgroundImage: `url('https://res.cloudinary.com/lesswrong-2-0/image/upload/c_fill,dpr_2.0,g_custom,h_380,q_auto,w_1200/v1/${imageId}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        ></div>
                        <h3 className="sequence-card-title">{sequence.title}</h3>
                      </a>
                    );
                  })}
                </div>
              </div>

              <div
                className={`comments-list tab-panel ${activeTab === "comments" ? "active" : ""}`}
              >
                {comments.map((comment) => {
                  const paragraphs = getCommentParagraphs(comment);
                  const [quoteParagraph, ...bodyParagraphs] = paragraphs;
                  const commentTitle = comment.post?.title || comment.tag?.slug || "Comment";
                  return (
                    <div key={comment._id} className="comment-thread">
                      <div className="comment-thread-title">{commentTitle}</div>
                      <div className="comment-meta-row">
                        <span className="comment-author">{comment.user?.displayName}</span>
                        <span className="comment-time">{formatRelativeDate(comment.postedAt!)}</span>
                        <span className="comment-karma">{comment.baseScore ?? 0}</span>
                        <span className="comment-replies">{comment.directChildrenCount ?? 0}</span>
                      </div>
                      {quoteParagraph && (
                        <div className="comment-quote">
                          <p>{quoteParagraph}</p>
                        </div>
                      )}
                      {bodyParagraphs.length > 0 && (
                        <div className="comment-body">
                          {bodyParagraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                      <div className="comment-reply">Reply</div>
                    </div>
                  );
                })}
                <div className="read-more">
                  <a
                    href={user ? `${userGetProfileUrl(user)}/replies` : "#"}
                    className="read-more-link"
                  >
                    See more
                  </a>
                </div>
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
                    <p className="sidebar-author-bio">
                      {bio.length > 300 ? bio.slice(0, 300) + "..." : bio}
                    </p>
                    {bio.length > 300 && (
                      <div className="read-more">
                        <a href={user ? userGetProfileUrl(user) : "#"} className="read-more-link">
                          See more
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
