import { globalExternalStylesheets } from '@/themes/globalStyles/externalStyles';

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
  const externalStylesheetLinks = globalExternalStylesheets
    .map((href) => `<link rel="stylesheet" type="text/css" href="${href}">`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'unsafe-inline' https://use.typekit.net https://p.typekit.net; connect-src ${origin}/; img-src https://res.cloudinary.com data:; font-src https://use.typekit.net;">
  <style>
    html { font-size: 13px; overflow: hidden; }
    body { overflow: hidden; }
  </style>
  ${externalStylesheetLinks}
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
 * Hacker News–style home page body. Numbered list, upvote arrows,
 * compact monospace-adjacent layout, orange accents.
 */
export function getHackerNewsHomePageBody(): string {
  return `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Verdana, Geneva, sans-serif;
      background: transparent;
      color: #828282;
      font-size: 13px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }

    a { color: inherit; text-decoration: none; }

    .hn-table {
      max-width: 765px;
      margin: 0 auto;
      border-collapse: collapse;
    }
    .hn-table td { vertical-align: top; }

    .hn-spacer { height: 5px; }

    .hn-row td { padding: 2px 0; }

    .hn-rank {
      text-align: right;
      padding-right: 6px;
      color: #828282;
      font-size: 13px;
      min-width: 28px;
    }

    .hn-vote {
      width: 14px;
      padding-right: 4px;
      cursor: pointer;
    }
    .hn-vote-arrow {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 10px solid #9a9a9a;
      display: inline-block;
    }
    .hn-vote-arrow:hover { border-bottom-color: #ff6600; }

    .hn-title-cell { padding-right: 5px; }
    .hn-title-link {
      font-size: 13px;
      color: rgba(0,0,0,0.87);
    }
    .hn-title-link:hover { text-decoration: underline; }
    .hn-title-link.is-read { color: #828282; }

    .hn-subrow td {
      padding-bottom: 8px;
      font-size: 11px;
    }
    .hn-subtext {
      padding-left: 48px;
      color: #828282;
    }
    .hn-subtext a { color: #828282; }
    .hn-subtext a:hover { text-decoration: underline; }
    .hn-score { color: #ff6600; font-weight: 600; }

    .hn-curated-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #ff6600;
      border: 1px solid #ff6600;
      border-radius: 2px;
      padding: 0 3px;
      margin-left: 5px;
      vertical-align: middle;
      position: relative;
      top: -1px;
    }

    .hn-more {
      display: block;
      padding: 10px 0 10px 48px;
      background: none;
      border: none;
      font-family: inherit;
      font-size: 13px;
      color: rgba(0,0,0,0.87);
      cursor: pointer;
    }
    .hn-more:hover { text-decoration: underline; }

    .loading {
      text-align: center;
      padding: 48px;
      color: #828282;
    }
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #e0e0e0;
      border-top-color: #ff6600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error { text-align: center; padding: 48px; color: #9b5e5e; }
  </style>

  <div id="root"></div>

  <script type="text/babel" data-presets="react" data-plugins="transform-optional-chaining,transform-nullish-coalescing-operator">
    const { useState, useEffect, useCallback } = React;

    function formatRelative(dateStr) {
      const sec = Math.abs(Date.now() - new Date(dateStr).getTime()) / 1000;
      if (sec < 60) return 'just now';
      if (sec < 3600) return Math.round(sec / 60) + ' minutes ago';
      if (sec < 86400) return Math.round(sec / 3600) + ' hours ago';
      if (sec < 86400 * 30) return Math.round(sec / 86400) + ' days ago';
      return Math.round(sec / (30.4 * 86400)) + ' months ago';
    }

    function Loading() {
      return (
        <div className="loading">
          <div className="loading-spinner" />
          <div>Loading...</div>
        </div>
      );
    }

    function PostRow({ post, rank, isRead }) {
      const postUrl = '/posts/' + post._id + '/' + (post.slug || '');
      const commentsUrl = postUrl + '#comments';
      return (
        <>
          <tr className="hn-row">
            <td className="hn-rank">{rank}.</td>
            <td className="hn-vote"><div className="hn-vote-arrow" title="upvote" /></td>
            <td className="hn-title-cell">
              <a className={'hn-title-link' + (isRead ? ' is-read' : '')} href={postUrl} target="_top">
                {post.title}
              </a>
              {post.curatedDate && <span className="hn-curated-tag">curated</span>}
            </td>
          </tr>
          <tr className="hn-subrow">
            <td colSpan="2"></td>
            <td className="hn-subtext">
              <span className="hn-score">{post.baseScore} points</span>
              {' by '}
              <a href={'/users/' + (post.user?.slug || '')} target="_top">{post.user?.displayName || 'Anonymous'}</a>
              {' '}
              {formatRelative(post.postedAt)}
              {' | '}
              <a href={commentsUrl} target="_top">
                {post.commentCount != null ? post.commentCount + ' comments' : 'discuss'}
              </a>
            </td>
          </tr>
        </>
      );
    }

    const CURATED_QUERY = \`
      query CuratedPosts {
        CuratedAndPopularThisWeek(limit: 3) {
          results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
        }
      }
    \`;

    const FRONTPAGE_QUERY = \`
      query FrontpagePosts($limit: Int, $offset: Int) {
        posts(selector: { magic: { forum: true } }, limit: $limit, offset: $offset) {
          results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
          totalCount
        }
      }
    \`;

    const PAGE_SIZE = 30;

    function App() {
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
            const [curatedData, postsData] = await Promise.all([
              gqlQuery(CURATED_QUERY),
              gqlQuery(FRONTPAGE_QUERY, { limit: PAGE_SIZE, offset: 0 }),
            ]);
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

      const curatedIds = new Set(curated.map(p => p._id));
      const regularPosts = posts.filter(p => !curatedIds.has(p._id));
      const allPosts = [...curated, ...regularPosts];
      const hasMore = totalCount != null && posts.length < totalCount;

      return (
        <div>
          <table className="hn-table">
            <tbody>
              <tr className="hn-spacer"><td colSpan="3"></td></tr>
              {allPosts.map((post, i) => (
                <PostRow key={post._id} post={post} rank={i + 1} isRead={readStatuses[post._id] || false} />
              ))}
            </tbody>
          </table>
          {hasMore && (
            <button className="hn-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'More'}
            </button>
          )}
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>`;
}

/**
 * Twitter/X–style home page body. Card-based timeline layout,
 * engagement metrics, rounded avatars with initials, blue accents.
 */
export function getTwitterHomePageBody(): string {
  return `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: transparent;
      color: #0f1419;
      font-size: 15px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }

    a { color: inherit; text-decoration: none; }

    .timeline {
      max-width: 600px;
      margin: 0 auto;
    }

    .tweet {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #eff3f4;
      cursor: pointer;
      transition: background 0.15s;
    }
    .tweet:hover { background: rgba(0,0,0,0.03); }
    .tweet.is-read .tweet-title { color: #536471; }

    .avatar {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1d9bf0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
      text-transform: uppercase;
    }

    .tweet-body { flex: 1; min-width: 0; }

    .tweet-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }
    .tweet-author {
      font-weight: 700;
      font-size: 15px;
      color: #0f1419;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tweet-author:hover { text-decoration: underline; }
    .tweet-handle {
      color: #536471;
      font-size: 15px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tweet-separator { color: #536471; padding: 0 2px; flex-shrink: 0; }
    .tweet-time { color: #536471; font-size: 15px; white-space: nowrap; flex-shrink: 0; }

    .tweet-curated {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      font-weight: 600;
      color: #1d9bf0;
      margin-bottom: 4px;
    }
    .tweet-curated svg { width: 14px; height: 14px; fill: #1d9bf0; }

    .tweet-title {
      font-size: 15px;
      line-height: 1.4;
      color: #0f1419;
      margin-bottom: 10px;
    }
    .tweet-title a { color: inherit; }
    .tweet-title a:hover { text-decoration: underline; }

    .tweet-actions {
      display: flex;
      justify-content: space-between;
      max-width: 300px;
    }
    .tweet-action {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #536471;
      font-size: 13px;
      cursor: pointer;
      padding: 2px;
      border-radius: 50px;
      transition: color 0.15s;
    }
    .tweet-action svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .tweet-action.comment:hover { color: #1d9bf0; }
    .tweet-action.like:hover { color: #f91880; }
    .tweet-action.karma:hover { color: #00ba7c; }

    .load-more-wrap { text-align: center; padding: 16px; }
    .load-more-btn {
      background: none;
      border: none;
      font-family: inherit;
      font-size: 15px;
      color: #1d9bf0;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 20px;
    }
    .load-more-btn:hover { background: rgba(29,155,240,0.1); }

    .loading {
      text-align: center;
      padding: 48px;
      color: #536471;
    }
    .loading-spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid #eff3f4;
      border-top-color: #1d9bf0;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error { text-align: center; padding: 48px; color: #f4212e; }
  </style>

  <div id="root"></div>

  <script type="text/babel" data-presets="react" data-plugins="transform-optional-chaining,transform-nullish-coalescing-operator">
    const { useState, useEffect, useCallback } = React;

    function formatRelative(dateStr) {
      const sec = Math.abs(Date.now() - new Date(dateStr).getTime()) / 1000;
      if (sec < 60) return 'now';
      if (sec < 3600) return Math.round(sec / 60) + 'm';
      if (sec < 86400) return Math.round(sec / 3600) + 'h';
      const d = new Date(dateStr);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[d.getMonth()] + ' ' + d.getDate();
    }

    function getInitial(name) {
      return (name || '?').charAt(0).toUpperCase();
    }

    // Deterministic color from a string
    function avatarColor(name) {
      var colors = ['#1d9bf0','#7856ff','#f91880','#ff7a00','#00ba7c','#ffd400'];
      var hash = 0;
      for (var i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    }

    function Loading() {
      return (
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      );
    }

    function CommentIcon() {
      return (
        <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.82l-3.518 3.547c-.272.275-.655.432-1.052.432H9.756c-4.421 0-8.005-3.58-8.005-8v-1.93zm8.005-6C6.34 4 3.751 6.614 3.751 10v1.93c0 3.317 2.589 6.07 6.005 6.07h5.54l3.519-3.548A6.13 6.13 0 0 0 20.251 10.13C20.251 6.744 17.546 4 14.122 4H9.756z"/></svg>
      );
    }

    function HeartIcon() {
      return (
        <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.56-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
      );
    }

    function KarmaIcon() {
      return (
        <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
      );
    }

    function Tweet({ post, isRead }) {
      const postUrl = '/posts/' + post._id + '/' + (post.slug || '');
      const commentsUrl = postUrl + '#comments';
      const displayName = post.user?.displayName || 'Anonymous';
      const handle = '@' + (post.user?.slug || 'anonymous');
      return (
        <div className={'tweet' + (isRead ? ' is-read' : '')}>
          <a href={'/users/' + (post.user?.slug || '')} target="_top">
            <div className="avatar" style={{ background: avatarColor(displayName) }}>
              {getInitial(displayName)}
            </div>
          </a>
          <div className="tweet-body">
            <div className="tweet-header">
              <a className="tweet-author" href={'/users/' + (post.user?.slug || '')} target="_top">{displayName}</a>
              <span className="tweet-handle">{handle}</span>
              <span className="tweet-separator">&middot;</span>
              <span className="tweet-time">{formatRelative(post.postedAt)}</span>
            </div>
            {post.curatedDate && (
              <div className="tweet-curated">
                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                Curated
              </div>
            )}
            <div className="tweet-title">
              <a href={postUrl} target="_top">{post.title}</a>
            </div>
            <div className="tweet-actions">
              <a className="tweet-action comment" href={commentsUrl} target="_top" title="Comments">
                <CommentIcon />
                <span>{post.commentCount || ''}</span>
              </a>
              <span className="tweet-action karma" title="Karma">
                <KarmaIcon />
                <span>{post.baseScore}</span>
              </span>
              <span className="tweet-action like" title="Like">
                <HeartIcon />
              </span>
            </div>
          </div>
        </div>
      );
    }

    const CURATED_QUERY = \`
      query CuratedPosts {
        CuratedAndPopularThisWeek(limit: 3) {
          results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
        }
      }
    \`;

    const FRONTPAGE_QUERY = \`
      query FrontpagePosts($limit: Int, $offset: Int) {
        posts(selector: { magic: { forum: true } }, limit: $limit, offset: $offset) {
          results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
          totalCount
        }
      }
    \`;

    const PAGE_SIZE = 20;

    function App() {
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
            const [curatedData, postsData] = await Promise.all([
              gqlQuery(CURATED_QUERY),
              gqlQuery(FRONTPAGE_QUERY, { limit: PAGE_SIZE, offset: 0 }),
            ]);
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

      const curatedIds = new Set(curated.map(p => p._id));
      const regularPosts = posts.filter(p => !curatedIds.has(p._id));
      const allPosts = [...curated, ...regularPosts];
      const hasMore = totalCount != null && posts.length < totalCount;

      return (
        <div className="timeline">
          {allPosts.map(post => (
            <Tweet key={post._id} post={post} isRead={readStatuses[post._id] || false} />
          ))}
          {hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Show more'}
              </button>
            </div>
          )}
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>`;
}

/** All named default home page designs. */
export const defaultHomePageDesigns: Record<string, { label: string; getBody: () => string }> = {
  default: { label: 'Classic LessWrong', getBody: getDefaultHomePageBody },
  hackerNews: { label: 'Hacker News', getBody: getHackerNewsHomePageBody },
  twitter: { label: 'Twitter', getBody: getTwitterHomePageBody },
};

/**
 * Get the complete default srcdoc (wrapper + default body).
 */
export function getSandboxedHomePageSrcdoc(options: SrcdocWrapperOptions): string {
  return wrapBodyInSrcdoc(getDefaultHomePageBody(), options);
}
