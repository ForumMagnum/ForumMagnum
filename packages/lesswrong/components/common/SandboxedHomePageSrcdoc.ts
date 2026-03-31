/**
 * Srcdoc generation for the sandboxed iframe home page.
 *
 * Architecture:
 * - `wrapBodyInSrcdoc` creates a full HTML document from body content, handling:
 *   CSP meta tag, library loading, RPC bridge setup, and height reporting.
 * - `getDefaultHomePageBody` returns the default LW home page as body content.
 * - `getSandboxedHomePageSrcdoc` combines both for the default experience.
 *
 * LLM-generated designs only provide body content; the wrapper is applied by
 * the parent component before setting it as the iframe srcdoc.
 */

interface SrcdocWrapperOptions {
  /** The origin of the parent page, used for CSP connect-src. */
  origin: string;
}

/**
 * Wrap body content in a complete HTML document with CSP, libraries,
 * RPC bridge, and height reporting.
 */
export function wrapBodyInSrcdoc(bodyContent: string, options: SrcdocWrapperOptions): string {
  const { origin } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'unsafe-inline'; connect-src ${origin}/; img-src https://res.cloudinary.com data:; font-src 'none';">
  <style>
    html { font-size: 13px; overflow: hidden; }
    body { overflow: hidden; }
  </style>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>
  <script>
    // ---- RPC bridge ----
    // Provides window.rpc with methods for communicating with the parent frame.
    (function() {
      var rpcIdCounter = 0;
      var pendingRpcs = {};

      window.addEventListener('message', function(event) {
        var data = event.data || {};
        if (data.type === 'rpc-response' && pendingRpcs[data.id]) {
          var cb = pendingRpcs[data.id];
          delete pendingRpcs[data.id];
          if (data.error) cb.reject(new Error(data.error));
          else cb.resolve(data.result);
        }
      });

      function callRpc(method, params) {
        return new Promise(function(resolve, reject) {
          var id = ++rpcIdCounter;
          pendingRpcs[id] = { resolve: resolve, reject: reject };
          window.parent.postMessage({ type: 'rpc-request', id: id, method: method, params: params }, '*');
        });
      }

      // GraphQL helper — fetches directly from the iframe (unauthenticated)
      window.gqlQuery = function(query, variables) {
        return fetch('${origin}/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query, variables: variables || {} }),
        }).then(function(resp) {
          if (!resp.ok) throw new Error('GraphQL request failed: ' + resp.status);
          return resp.json();
        }).then(function(json) {
          if (json.errors) throw new Error(json.errors[0].message);
          return json.data;
        });
      };

      window.rpc = {
        /**
         * Get read statuses for a list of post IDs.
         * @param {string[]} postIds
         * @returns {Promise<Record<string, boolean>>}
         */
        getReadStatuses: function(postIds) {
          return callRpc('getReadStatuses', { postIds: postIds });
        },
        /**
         * Get the current user's vote statuses for a list of document IDs.
         * @param {{postIds?: string[], commentIds?: string[]}} params
         * @returns {Promise<Record<string, {voteType: string|null}>>}
         */
        getVoteStatuses: function(params) {
          return callRpc('getVoteStatuses', params);
        },
        /**
         * Cast a vote on a document.
         * @param {{documentId: string, collectionName: string, voteType: string}} params
         *   collectionName: "Posts" or "Comments"
         *   voteType: "smallUpvote", "bigUpvote", "smallDownvote", "bigDownvote", or "neutral" (to clear)
         * @returns {Promise<{success: boolean}>}
         */
        castVote: function(params) {
          return callRpc('castVote', params);
        },
      };
    })();
  </script>
</head>
<body>
  ${bodyContent}
  <script>
    // Report document height to parent so the iframe sizes to fit content.
    (function() {
      var ro = new ResizeObserver(function() {
        window.parent.postMessage({ type: 'resize', height: document.documentElement.scrollHeight }, '*');
      });
      ro.observe(document.documentElement);
    })();
  </script>
</body>
</html>`;
}

/**
 * The default LW home page body content. This is what gets rendered in the
 * iframe when no custom design is active.
 */
export function getDefaultHomePageBody(): string {
  return `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'GreekFallback', Calibri, 'gill-sans-nova', 'Gill Sans', 'Gill Sans MT',
        'Myriad Pro', Myriad, 'Liberation Sans', 'Nimbus Sans L', Tahoma, Geneva,
        'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: transparent;
      color: rgba(0,0,0,0.87);
      font-size: 15.08px;
      line-height: 19.8px;
      font-weight: 400;
      -webkit-font-smoothing: antialiased;
    }

    a { color: inherit; text-decoration: none; }

    .section {
      max-width: 765px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 32px;
      position: relative;
    }

    .spotlight {
      position: relative;
      margin-bottom: 12px;
      max-width: 765px;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 1px 5px rgba(0,0,0,0.025);
      overflow: hidden;
    }
    .spotlight-inner {
      position: relative;
      background: #fff;
      display: flex;
      min-height: 130px;
    }
    .spotlight-content {
      padding: 16px;
      padding-right: 35px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      z-index: 2;
      margin-right: 150px;
      min-height: 100px;
      text-shadow: 0px 0px 10px #fff, 0px 0px 20px #fff;
    }
    .spotlight-title {
      font-family: warnock-pro, Palatino, 'Palatino Linotype', 'Palatino LT STD',
        'Book Antiqua', Georgia, serif;
      font-size: 20px;
      font-variant: small-caps;
      line-height: 1.2em;
    }
    .spotlight-title a { color: rgba(0,0,0,0.87); }
    .spotlight-title a:hover { color: #5f9b65; }
    .spotlight-subtitle {
      font-family: warnock-pro, Palatino, 'Palatino Linotype', 'Palatino LT STD',
        'Book Antiqua', Georgia, serif;
      font-style: italic;
      min-height: 25px;
      color: #757575;
      font-size: 15px;
      margin-top: -1px;
    }
    .spotlight-subtitle a { color: #5f9b65; }
    .spotlight-description {
      margin-top: 7px;
      margin-bottom: 10px;
      font-family: warnock-pro, Palatino, 'Palatino Linotype', 'Palatino LT STD',
        'Book Antiqua', Georgia, serif;
      font-size: 14px;
      line-height: 1.55;
      color: rgba(0,0,0,0.87);
    }
    .spotlight-image {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: auto;
      max-width: 60%;
      object-fit: cover;
      -webkit-mask-image: linear-gradient(to right, transparent 0, #fff 80%, #fff 100%);
      mask: linear-gradient(to right, transparent 0, #fff 80%, #fff 100%);
    }
    @media (max-width: 600px) {
      .spotlight-content { margin-right: 50px; }
      .spotlight-description { display: none; }
    }

    .post-item {
      display: flex;
      align-items: center;
      position: relative;
      padding: 10px 10px 10px 6px;
      background: #fff;
      border-bottom: 2px solid rgba(0,0,0,0.05);
    }
    .post-item:hover { background: #fafafa; }
    .post-item.is-read .post-title a { color: rgba(0,0,0,0.55); }
    .post-item.is-read .post-title a:hover { color: rgba(0,0,0,0.87); }

    .curated-icon {
      flex-shrink: 0;
      width: 15.6px;
      height: 15.6px;
      margin-right: 6px;
      color: #9e9e9e;
      position: relative;
      bottom: 2px;
    }

    .post-karma {
      width: 32px;
      margin-right: 4px;
      flex-shrink: 0;
      flex-grow: 0;
      text-align: center;
      color: #757575;
      font-size: 1.1rem;
    }

    .post-title {
      flex: 1 1 0;
      min-width: 0;
      overflow: hidden;
      min-height: 26px;
      margin-right: 12px;
      position: relative;
      top: 1px;
      display: flex;
      align-items: center;
    }
    .post-title a {
      font-family: warnock-pro, Palatino, 'Palatino Linotype', 'Palatino LT STD',
        'Book Antiqua', Georgia, serif;
      font-size: 16.9px;
      line-height: 1.7rem;
      color: rgba(0,0,0,0.87);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .post-title a:hover { color: rgba(0,0,0,0.55); }

    .post-author {
      flex: 0 1 auto;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: 12px;
      color: #757575;
      font-size: 1.1rem;
    }
    .post-author a { color: inherit; }
    .post-author a:hover { opacity: 0.7; }

    .post-date {
      width: 38px;
      font-size: 1rem;
      font-weight: 300;
      color: rgba(0,0,0,0.9);
      flex-shrink: 0;
      flex-grow: 0;
      text-align: center;
    }

    .post-comments {
      width: 36px;
      height: 30px;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
      margin-left: 4px;
      top: 2px;
    }
    .post-comments svg {
      position: absolute;
      right: 50%;
      top: 50%;
      transform: translate(50%, -50%);
      width: 30px;
      height: 30px;
      fill: rgba(0,0,0,0.22);
    }
    .post-comments .comment-count-text {
      position: absolute;
      right: 50%;
      top: 50%;
      transform: translate(50%, -50%);
      z-index: 1;
      font-variant-numeric: lining-nums;
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      margin-top: -2px;
    }

    .load-more {
      display: block;
      width: 100%;
      margin-top: 6px;
      background: none;
      border: none;
      font-family: inherit;
      font-size: 15.08px;
      color: rgba(105, 136, 110, 1);
      cursor: pointer;
      text-align: left;
    }
    .load-more:hover { color: rgba(105, 136, 110, 0.87); }

    .loading {
      text-align: center;
      padding: 48px;
      color: #757575;
      font-size: 1.1rem;
    }
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #e0e0e0;
      border-top-color: #5f9b65;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error {
      text-align: center;
      padding: 48px;
      color: #9b5e5e;
    }

    @media (max-width: 600px) {
      .post-item {
        flex-wrap: wrap;
        padding: 8px 0 8px 5px;
      }
      .post-title {
        order: -1;
        width: 100%;
        max-width: unset;
        flex: unset;
        white-space: unset;
        padding-right: 8px;
      }
      .post-karma {
        width: unset;
        margin-left: 2px;
        margin-right: 8px;
      }
      .post-author {
        justify-content: flex-end;
        width: unset;
        margin-left: 0;
        flex: unset;
      }
    }
  </style>

  <div id="root"></div>

  <script type="text/babel" data-presets="react" data-plugins="transform-optional-chaining,transform-nullish-coalescing-operator">
    const { useState, useEffect, useCallback } = React;

    function formatRelative(dateStr) {
      const msApart = Math.abs(Date.now() - new Date(dateStr).getTime());
      const sec = msApart / 1000;
      if (sec < 44) return 'now';
      if (sec < 45 * 60) return Math.round(sec / 60) + 'm';
      if (sec < 22 * 3600) return Math.round(sec / 3600) + 'h';
      if (sec < 26 * 86400) return Math.round(sec / 86400) + 'd';
      if (sec < 335 * 86400) return Math.round(sec / (30.4 * 86400)) + 'mo';
      return Math.round(sec / (365 * 86400)) + 'y';
    }

    function CommentBubbleIcon() {
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
        </svg>
      );
    }

    function CuratedStarIcon() {
      return (
        <svg className="curated-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      );
    }

    function Loading() {
      return (
        <div className="loading">
          <div className="loading-spinner" />
          <div>Loading...</div>
        </div>
      );
    }

    function Spotlight({ spotlight }) {
      if (!spotlight) return null;
      const doc = spotlight.post || spotlight.sequence || spotlight.tag;
      if (!doc) return null;
      const title = spotlight.customTitle || doc.title || doc.name || '';
      const subtitle = spotlight.customSubtitle || '';
      const subtitleUrl = spotlight.subtitleUrl || '';
      const description = spotlight.description?.html || '';
      const imageUrl = spotlight.spotlightImageId
        ? 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1/' + spotlight.spotlightImageId
        : null;
      let url = '/';
      if (spotlight.post) url = '/posts/' + spotlight.post._id + '/' + (spotlight.post.slug || '');
      else if (spotlight.sequence) url = '/s/' + spotlight.sequence._id;
      else if (spotlight.tag) url = '/tag/' + (spotlight.tag.slug || spotlight.tag._id);
      return (
        <div className="section">
          <div className="spotlight">
            <a href={url} target="_top">
              <div className="spotlight-inner">
                <div className="spotlight-content">
                  <div className="spotlight-title">{title}</div>
                  {description && (
                    <div className="spotlight-description" dangerouslySetInnerHTML={{ __html: description }} />
                  )}
                  {subtitle && (
                    <div className="spotlight-subtitle">
                      {subtitleUrl
                        ? <span>First Post: <a href={subtitleUrl} target="_top" onClick={e => e.stopPropagation()}>{subtitle}</a></span>
                        : subtitle}
                    </div>
                  )}
                </div>
                {imageUrl && <img className="spotlight-image" src={imageUrl} alt="" />}
              </div>
            </a>
          </div>
        </div>
      );
    }

    function PostComments({ count, postId, slug }) {
      return (
        <a className="post-comments"
           href={'/posts/' + postId + '/' + (slug || '') + '#comments'}
           target="_top"
           title={count + ' comments'}>
          <CommentBubbleIcon />
          <span className="comment-count-text">{count != null ? count : ''}</span>
        </a>
      );
    }

    function PostItem({ post, isRead, showCuratedIcon }) {
      const dateText = formatRelative(post.postedAt);
      const postUrl = '/posts/' + post._id + '/' + (post.slug || '');
      return (
        <div className={'post-item' + (isRead ? ' is-read' : '')}>
          <div className="post-karma">{post.baseScore}</div>
          <div className="post-title">
            {showCuratedIcon && post.curatedDate && <CuratedStarIcon />}
            <a href={postUrl} target="_top">{post.title}</a>
          </div>
          <div className="post-author">
            <a href={'/users/' + (post.user?.slug || '')} target="_top">
              {post.user?.displayName || 'Anonymous'}
            </a>
          </div>
          <div className="post-date">{dateText}</div>
          <PostComments count={post.commentCount} postId={post._id} slug={post.slug} />
        </div>
      );
    }

    const SPOTLIGHT_QUERY = \`
      query CurrentSpotlight {
        currentSpotlight {
          _id documentType customTitle customSubtitle subtitleUrl spotlightImageId
          description { html }
          post { _id slug title user { displayName } }
          sequence { _id title }
          tag { _id name slug }
        }
      }
    \`;

    const CURATED_QUERY = \`
      query CuratedPosts {
        CuratedAndPopularThisWeek(limit: 3) {
          results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
        }
      }
    \`;

    const FRONTPAGE_QUERY = \`
      query FrontpagePosts($limit: Int, $offset: Int) {
        posts(selector: { magic: { forum: true } }, limit: $limit, offset: $offset, enableTotal: true) {
          results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
          totalCount
        }
      }
    \`;

    const PAGE_SIZE = 13;

    function App() {
      const [spotlight, setSpotlight] = useState(null);
      const [curated, setCurated] = useState([]);
      const [posts, setPosts] = useState([]);
      const [readStatuses, setReadStatuses] = useState({});
      const [totalCount, setTotalCount] = useState(null);
      const [loading, setLoading] = useState(true);
      const [loadingMore, setLoadingMore] = useState(false);
      const [error, setError] = useState(null);

      useEffect(() => {
        (async () => {
          try {
            const [spotlightData, curatedData, postsData] = await Promise.all([
              gqlQuery(SPOTLIGHT_QUERY).catch(() => null),
              gqlQuery(CURATED_QUERY),
              gqlQuery(FRONTPAGE_QUERY, { limit: PAGE_SIZE, offset: 0 }),
            ]);
            setSpotlight(spotlightData?.currentSpotlight || null);
            const curatedResults = curatedData.CuratedAndPopularThisWeek?.results || [];
            const postsResults = postsData.posts?.results || [];
            setCurated(curatedResults);
            setPosts(postsResults);
            setTotalCount(postsData.posts?.totalCount);
            const allIds = [...curatedResults.map(p => p._id), ...postsResults.map(p => p._id)];
            if (allIds.length > 0) {
              const statuses = await rpc.getReadStatuses(allIds);
              setReadStatuses(statuses);
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        })();
      }, []);

      const loadMore = useCallback(async () => {
        setLoadingMore(true);
        try {
          const data = await gqlQuery(FRONTPAGE_QUERY, { limit: PAGE_SIZE, offset: posts.length });
          const newPosts = data.posts?.results || [];
          setPosts(prev => [...prev, ...newPosts]);
          setTotalCount(data.posts?.totalCount);
          const newIds = newPosts.map(p => p._id);
          if (newIds.length > 0) {
            const statuses = await rpc.getReadStatuses(newIds);
            setReadStatuses(prev => ({ ...prev, ...statuses }));
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoadingMore(false);
        }
      }, [posts.length]);

      if (loading) return <Loading />;
      if (error) return <div className="error">Error: {error}</div>;

      const hasMore = totalCount != null && posts.length < totalCount;
      const curatedIds = new Set(curated.map(p => p._id));
      const regularPosts = posts.filter(p => !curatedIds.has(p._id));

      return (
        <div>
          <Spotlight spotlight={spotlight} />
          <div className="section">
            {curated.map(post => (
              <PostItem key={post._id} post={post} isRead={readStatuses[post._id] || false} showCuratedIcon={true} />
            ))}
            {regularPosts.map(post => (
              <PostItem key={post._id} post={post} isRead={readStatuses[post._id] || false} showCuratedIcon={true} />
            ))}
            {hasMore && (
              <button className="load-more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>`;
}

/**
 * Get the complete default srcdoc (wrapper + default body).
 */
export function getSandboxedHomePageSrcdoc(options: SrcdocWrapperOptions): string {
  return wrapBodyInSrcdoc(getDefaultHomePageBody(), options);
}
