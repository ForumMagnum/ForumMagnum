import { globalExternalStylesheets } from '@/themes/globalStyles/externalStyles';

interface SrcdocWrapperOptions {
  origin: string;
}

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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com; style-src 'unsafe-inline' https://use.typekit.net https://p.typekit.net; connect-src ${origin}/ https://unpkg.com; img-src https://res.cloudinary.com data:; font-src https://use.typekit.net;">
  <style>
    html, body { margin: 0; font-size: 13px; }
    body { min-height: 100vh; }
  </style>
  ${externalStylesheetLinks}
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>
  <script src="https://unpkg.com/hyphen@1.14.1/hyphen.js" crossorigin></script>
  <script src="https://unpkg.com/hyphen@1.14.1/patterns/en-us.js" crossorigin></script>
  <script>
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
        getCurrentUser: function() {
          return callRpc('getCurrentUser', {});
        },
        getNotificationCounts: function() {
          return callRpc('getNotificationCounts', {});
        },
        getNotifications: function(params) {
          return callRpc('getNotifications', params || {});
        },
        getKarmaNotifications: function() {
          return callRpc('getKarmaNotifications', {});
        },
        getReadStatuses: function(postIds) {
          return callRpc('getReadStatuses', { postIds: postIds });
        },
        getVoteStatuses: function(params) {
          return callRpc('getVoteStatuses', params);
        },
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
    (function() {
      var ro = new ResizeObserver(function() {
        var height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        window.parent.postMessage({ type: 'resize', height: height }, '*');
      });
      ro.observe(document.documentElement);
    })();
  </script>
</body>
</html>`;
}

export function getDefaultHomePageBody(): string {
  return `
  <style>
    :root {
      --paper: #f8f4ee;
      --paper-shadow: rgba(40, 28, 18, 0.12);
      --ink: #171411;
      --ink-soft: #4c433d;
      --ink-faint: #85776c;
      --rule: rgba(23, 20, 17, 0.18);
      --rule-strong: rgba(23, 20, 17, 0.42);
      --accent: #8f1d12;
      --row-gap: clamp(12px, 0.95vw, 18px);
      --column-gap: clamp(20px, 1.65vw, 32px);
      --page-pad: clamp(12px, 1.6vw, 24px);
      --headline: ETBookRoman, warnock-pro, "Iowan Old Style", Georgia, serif;
      --serif: warnock-pro, "Iowan Old Style", Georgia, serif;
      --sans: "gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif;
      --body-size: clamp(12px, 0.9vw, 14px);
      --body-line: 1.42;
      --body-gap: 0.55rem;
      --cols: 8;
    }

    * { box-sizing: border-box; }

    html, body {
      background: var(--paper);
      color: var(--ink);
      font-family: var(--serif);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    body::before {
      display: none;
    }

    a { color: inherit; text-decoration: none; }
    a:hover { color: var(--accent); }

    .page { padding: calc(var(--page-pad) - 8px) var(--page-pad) var(--page-pad); }

    .sheet {
      position: relative;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      background: transparent;
      border: none;
      box-shadow: none;
    }

    .grid-row {
      display: grid;
      grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
      grid-auto-rows: 1fr;
      column-gap: var(--column-gap);
      row-gap: var(--row-gap);
      align-items: stretch;
      margin-top: var(--row-gap);
    }

    .sheet > .grid-row:first-of-type {
      margin-top: 0;
    }

    .grid-row > * {
      min-height: 0;
    }

    .lead-row { height: clamp(240px, 18vw, 340px); }
    .hero-row { height: clamp(420px, 30vw, 560px); }
    .brief-row { height: clamp(260px, 20vw, 340px); }
    .dispatch-row { height: clamp(200px, 15vw, 270px); }

    .card {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      padding: 0;
      border-top: none;
      border-bottom: none;
      overflow: hidden;
    }

    .card + .card { position: relative; }

    .article-card {
      position: relative;
      background: transparent;
    }

    .announcement-card {
      position: relative;
      padding-bottom: 4px;
      background: transparent;
    }

    .hero-card {
      padding-top: 0;
    }

    .card-label {
      margin-bottom: 6px;
      font-family: var(--sans);
      font-size: 9px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .card-topline {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
      min-width: 0;
    }

    .card-topline .card-label,
    .card-topline .meta {
      margin-bottom: 0;
    }

    .card-topline .meta {
      flex-shrink: 0;
      text-align: right;
    }

    .card-chrome {
      position: relative;
      z-index: 2;
      min-width: 0;
    }

    .announcement-chrome {
      position: relative;
      z-index: 2;
      min-width: 0;
    }

    .headline {
      margin: 0 0 5px;
      font-family: var(--headline);
      font-weight: 400;
      line-height: 0.98;
    }

    .headline a {
      display: block;
    }

    .headline-lead { font-size: clamp(28px, 2.8vw, 46px); }
    .headline-hero { font-size: clamp(38px, 4vw, 72px); line-height: 0.94; }
    .headline-feature { font-size: clamp(22px, 2vw, 34px); }
    .headline-brief { font-size: clamp(18px, 1.6vw, 27px); line-height: 1.02; }

    .announcement-headline {
      margin: 0;
      font-family: var(--headline);
      font-size: clamp(31px, 4.2vw, 65px);
      font-weight: 400;
      line-height: 0.93;
      letter-spacing: 0.006em;
      text-transform: none;
      text-align: left;
      text-wrap: pretty;
    }

    .announcement-dek {
      margin: 8px 0 0;
      text-align: left;
      color: var(--ink-soft);
      min-width: 0;
      font-family: "gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif;
      font-size: 15px;
      line-height: 18px;
      font-weight: 700;
      text-transform: capitalize;
      font-variant: small-caps;
    }

    .announcement-body {
      flex: 1;
      min-height: 0;
    }

    .meta {
      margin-bottom: 8px;
      font-family: var(--sans);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ink-faint);
    }

    .meta span + span::before {
      content: "•";
      margin: 0 6px;
      color: var(--rule-strong);
    }

    .excerpt-shell {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .excerpt-shell.overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    .excerpt-shell.multicolumn { min-height: 0; }

    .excerpt-shell.multicolumn > .fitted-text {
      width: 100%;
      min-width: 0;
      height: 100%;
    }

    .fitted-text {
      height: 100%;
      font-family: var(--serif);
      font-size: var(--body-size);
      line-height: var(--body-line);
      color: var(--ink);
      overflow: hidden;
    }

    .fitted-paragraph {
      margin-bottom: var(--body-gap);
    }

    .fitted-line {
      display: block;
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
    }

    .frag {
      display: inline;
      white-space: pre;
      font: inherit;
      color: inherit;
    }

    .frag--strong {
      font-weight: 700;
    }

    .frag--em {
      font-style: italic;
    }

    .frag--link {
      color: var(--accent);
      text-decoration: none;
    }

    .frag--code {
      background: color-mix(in srgb, var(--ink) 8%, transparent);
      border-radius: 4px;
    }

    .frag--strike {
      text-decoration: line-through;
      text-decoration-thickness: 1px;
    }

    .fitted-line.fallback-left,
    .fitted-line.last {
      text-align: left;
      word-spacing: normal !important;
    }

    .fitted-columns {
      display: flex;
      gap: var(--column-gap, 12px);
      height: 100%;
      min-height: 0;
    }

    .fitted-column {
      box-sizing: border-box;
      flex: 1 1 0;
      min-width: 0;
      overflow: hidden;
    }

    .fitted-gap {
      height: var(--body-gap);
    }

    .dropcap {
      float: left;
      margin: 1px 6px 0 0;
      font-family: var(--headline);
      font-size: 3.15em;
      line-height: 0.82;
    }

    .rail {
      display: grid;
      height: 100%;
      grid-template-rows: repeat(2, minmax(0, 1fr));
      gap: var(--row-gap);
      min-height: 0;
    }

    .rail .card,
    .dispatch-grid .card {
      margin-top: 0;
    }

    .dispatch-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      column-gap: var(--column-gap);
      row-gap: var(--row-gap);
      min-height: 0;
      height: 100%;
    }

    .quicktake-icon {
      display: inline-block;
      width: 10px;
      height: 10px;
      vertical-align: -1px;
    }

    .dispatch-card .fitted-text {
      font-size: clamp(11px, 0.88vw, 13px);
      line-height: 1.38;
    }

    .loading,
    .error {
      padding: 80px 20px;
      text-align: center;
      font-family: var(--headline);
      font-size: 22px;
      color: var(--ink-soft);
      border-top: 2px solid var(--ink);
    }

    .error {
      color: var(--accent);
    }

    /* ── Masthead ── */

    .masthead {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 5px 0 4px;
      border-bottom: 1px solid var(--rule-strong);
      margin-bottom: calc(var(--row-gap) + 4px);
      font-family: var(--sans);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ink-faint);
      gap: 10px;
    }

    .masthead-left {
      display: flex;
      align-items: baseline;
      gap: 14px;
      min-width: 0;
    }

    .masthead-site-title {
      font-family: var(--headline);
      font-size: 16px;
      font-weight: 400;
      letter-spacing: 0.03em;
      text-transform: none;
      color: #000;
      white-space: nowrap;
      line-height: 1;
    }

    .masthead-site-title a,
    .masthead-site-title a:hover {
      color: #000;
      text-decoration: none;
    }

    .masthead-date {
      white-space: nowrap;
    }

    .masthead-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .masthead a {
      color: var(--ink-faint);
      text-decoration: none;
      transition: color 0.15s;
    }

    .masthead a:hover {
      color: var(--accent);
    }

    .masthead .masthead-site-title a,
    .masthead .masthead-site-title a:hover {
      color: #000;
    }

    .masthead-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 12px;
      height: 12px;
      padding: 0 3px;
      border-radius: 6px;
      background: var(--accent);
      color: #fff;
      font-family: var(--sans);
      font-size: 7.5px;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: none;
      line-height: 1;
      margin-left: 2px;
      vertical-align: 1px;
    }

    .masthead-karma {
      color: var(--accent);
    }

    .masthead-user {
      text-transform: none;
      letter-spacing: 0.05em;
      font-size: 11px;
      color: var(--ink-soft);
    }

    .masthead-search-icon {
      display: inline-block;
      width: 10px;
      height: 10px;
      vertical-align: -1px;
      margin-right: 5px;
    }

    .masthead-bell {
      display: inline-flex;
      align-items: baseline;
      gap: 2px;
    }

    .masthead-bell-icon {
      display: inline-block;
      width: 11px;
      height: 11px;
      vertical-align: -2px;
      color: var(--ink-faint);
    }

    .masthead-bell-active .masthead-bell-icon {
      color: var(--accent);
    }

    .masthead-bell-count {
      font-family: var(--sans);
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: none;
      color: var(--accent);
      line-height: 1;
    }

    @media (max-width: 980px) {
    }
  </style>

  <div id="root"></div>

  <script type="module">
    try {
      var pretextModule = await import('https://unpkg.com/@chenglou/pretext@0.0.3/dist/layout.js');
      window.pretextPrepareWithSegments = pretextModule.prepareWithSegments;
      window.pretextLayoutWithLines = pretextModule.layoutWithLines;
      window.pretextLayoutNextLine = pretextModule.layoutNextLine;
      window.pretextReady = true;
    } catch (error) {
      console.warn('Pretext failed to load, using canvas fallback:', error);
      window.pretextReady = false;
    }
    window.dispatchEvent(new Event('pretext-loaded'));
  </script>

  <script>
    try {
      if (window.createHyphenator && window.hyphenationPatternsEnUs) {
        window.hyphenateEnglish = window.createHyphenator(window.hyphenationPatternsEnUs, {
          hyphenChar: '\u00AD',
          minWordLength: 5,
        });
        window.hyphenationReady = true;
      } else {
        window.hyphenationReady = false;
      }
    } catch (error) {
      console.warn('Hyphenation failed to load, using unhyphenated text:', error);
      window.hyphenationReady = false;
    }
    window.dispatchEvent(new Event('hyphenation-loaded'));
  </script>

  <script type="text/babel" data-presets="react" data-plugins="transform-optional-chaining,transform-nullish-coalescing-operator">
    var useEffect = React.useEffect;
    var useLayoutEffect = React.useLayoutEffect;
    var useMemo = React.useMemo;
    var useRef = React.useRef;
    var useState = React.useState;
    var SOFT_HYPHEN = '\u00AD';
    var richContentCache = typeof Map === 'function' ? new Map() : null;

    var POSTS_QUERY = \`
      query RecentPosts($limit: Int) {
        posts(selector: { magic: { forum: true } }, limit: $limit) {
          results {
            _id
            title
            slug
            baseScore
            commentCount
            postedAt
            curatedDate
            hideAuthor
            user { displayName slug }
            customHighlight { html }
            contents { html htmlHighlight }
          }
        }
      }
    \`;

    var CURATED_QUERY = \`
      query CuratedPosts {
        CuratedAndPopularThisWeek(limit: 4) {
          results {
            _id
            title
            slug
            baseScore
            commentCount
            postedAt
            curatedDate
            hideAuthor
            user { displayName slug }
            customHighlight { html }
            contents { html htmlHighlight }
          }
        }
      }
    \`;

    var QUICKTAKES_QUERY = \`
      query QuickTakes($limit: Int) {
        comments(selector: { shortformFrontpage: {} }, limit: $limit) {
          results {
            _id
            postId
            baseScore
            postedAt
            contents { html }
            user { displayName slug }
            post { _id slug title }
          }
        }
      }
    \`;

    var ANNOUNCEMENT_BODY_HTML = [
      '<p>LessWrong frontpages are now customizable. The green <strong>Customize</strong> button opens a live sandbox where layout, typography, hierarchy, and modules can be rewritten without waiting for a site-wide deploy.</p>',
      '<p>These designs are not inert mockups. They can read the real post stream, quick takes, notification counts, read status, and vote state, so a custom frontpage can be fully usable rather than merely decorative.</p>',
      '<p>A design can remain private, become your own default homepage, or be shared publicly as a theme. One reader can run a dense newspaper, another can prefer a calmer digest, and both can still browse the same site.</p>',
      '<p>Shared designs are meant to spread. A reader can publish a public version, hand someone a <code>?theme=</code> link, and let the finished frontpage speak for itself before any committee has written a memo about it.</p>',
      '<p>That changes what the homepage can do. One layout can foreground long-form curation, another can elevate quick takes and open threads, and another can compress the whole site into a dense briefing for people who want the day’s ideas at a glance.</p>',
      '<p>The same sandbox can also react to personal state. A design can notice who you are, surface unread activity, show vote and read markers, and generally behave like a real homepage rather than a static poster pinned over the old one.</p>',
      '<p>That means experimentation can finally happen at the level readers actually experience. Instead of debating abstractions, people can ship a frontpage that works, live with it for a week, share it around, and discover which ideas deserve to become defaults.</p>',
      '<p>The practical result is that homepage design can finally specialize. A person who mainly wants curation can build for depth, a person who checks the site five times a day can build for tempo, and a person introducing friends to LessWrong can build for orientation rather than density.</p>',
      '<p>It also means interface ideas can compete on merit. If someone thinks the frontpage should read like a newspaper, a dashboard, a notebook, or a field guide, they no longer have to win an argument in advance. They can simply build the thing and let readers decide whether it earns repeat visits.</p>',
      '<p>Even the small details become movable again: which sections appear first, how much context accompanies a post, whether highlights are airy or dense, whether comments and quick takes live in the margins or the center, and what sort of rhythm the page should set when you arrive in the morning.</p>',
      '<p>That is the larger shift hidden inside the button. Control moves away from a single frozen homepage and toward an ecosystem of publishable, inspectable, revisable frontpages, each one free to express a different theory of how people should encounter ideas.</p>',
      '<p>It also changes how frontpage work gets built. Instead of arguing in the abstract about what ought to exist, designers can start from the reader’s experience, prototype the real thing, and then keep iterating on a live page until it deserves to last.</p>',
      '<p>In short: the homepage is no longer a single official object. It is becoming a medium readers can shape for themselves.</p>',
    ].join('');

    function sanitizeContentHtml(html) {
      return (html || '')
        .replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, '')
        .replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '')
        .replace(/<mjx-[^>]*>[\\s\\S]*?<\\/mjx-[^>]*>/gi, '');
    }

    function cloneRichStyle(style) {
      return {
        bold: !!(style && style.bold),
        italic: !!(style && style.italic),
        code: !!(style && style.code),
        strike: !!(style && style.strike),
        href: style && style.href ? style.href : '',
      };
    }

    function getRichMetricStyle(style) {
      return {
        bold: !!(style && style.bold),
        italic: !!(style && style.italic),
      };
    }

    function richMetricStyleEquals(a, b) {
      return !!(a && a.bold) === !!(b && b.bold) &&
        !!(a && a.italic) === !!(b && b.italic);
    }

    function getStyledFont(baseFont, style) {
      var font = (baseFont || '').trim();
      if (!font) return font;

      font = font
        .replace(/^(normal|italic|oblique)\\s+/i, '')
        .replace(/^(normal|[1-9]00|bold|bolder|lighter)\\s+/i, '');

      var prefix = [];
      if (style && style.italic) prefix.push('italic');
      if (style && style.bold) prefix.push('700');
      return prefix.length ? (prefix.join(' ') + ' ' + font) : font;
    }

    function getParagraphLayoutStyle(paragraph) {
      if (!isRichParagraph(paragraph) || !paragraph.runs || !paragraph.runs.length) return null;
      var paragraphStyle = null;
      for (var i = 0; i < paragraph.runs.length; i++) {
        var run = paragraph.runs[i];
        if (!run || !run.text || !run.text.replace(/[ \\t]/g, '')) continue;
        var runStyle = getRichMetricStyle(run.style);
        if (!paragraphStyle) {
          paragraphStyle = runStyle;
        } else if (!richMetricStyleEquals(paragraphStyle, runStyle)) {
          return null;
        }
      }
      return paragraphStyle;
    }

    function richStyleEquals(a, b) {
      return !!a === !!b &&
        (!!a ? a.bold : false) === (!!b ? b.bold : false) &&
        (!!a ? a.italic : false) === (!!b ? b.italic : false) &&
        (!!a ? a.code : false) === (!!b ? b.code : false) &&
        (!!a ? a.strike : false) === (!!b ? b.strike : false) &&
        ((a && a.href) || '') === ((b && b.href) || '');
    }

    function mergeRichStyle(style, element) {
      var next = cloneRichStyle(style || {});
      if (!element || !element.tagName) return next;
      var tagName = element.tagName.toLowerCase();
      if (tagName === 'strong' || tagName === 'b') next.bold = true;
      if (tagName === 'em' || tagName === 'i' || tagName === 'cite') next.italic = true;
      if (tagName === 'code' || tagName === 'kbd' || tagName === 'samp') next.code = true;
      if (tagName === 's' || tagName === 'strike' || tagName === 'del') next.strike = true;
      if (tagName === 'a') next.href = element.getAttribute('href') || next.href || '';
      return next;
    }

    function appendRichRun(runs, text, style) {
      var normalized = (text || '').replace(/[ \\t\\r\\n\\u00a0]+/g, ' ');
      if (!normalized) return;
      if (!runs.length) normalized = normalized.replace(/^ +/, '');
      if (!normalized) return;

      var previous = runs[runs.length - 1];
      if (previous && / $/.test(previous.text) && /^ /.test(normalized)) {
        normalized = normalized.replace(/^ +/, '');
      }
      if (!normalized) return;

      var nextStyle = cloneRichStyle(style || {});
      if (previous && richStyleEquals(previous.style, nextStyle)) {
        previous.text += normalized;
      } else {
        runs.push({ text: normalized, style: nextStyle });
      }
    }

    function finalizeRichParagraph(runs) {
      if (!runs || !runs.length) return null;
      var nextRuns = runs.map(function(run) {
        return { text: run.text, style: cloneRichStyle(run.style) };
      }).filter(function(run) {
        return !!run.text;
      });
      if (!nextRuns.length) return null;

      nextRuns[0].text = nextRuns[0].text.replace(/^ +/, '');
      nextRuns[nextRuns.length - 1].text = nextRuns[nextRuns.length - 1].text.replace(/ +$/, '');
      nextRuns = nextRuns.filter(function(run) { return !!run.text; });
      if (!nextRuns.length) return null;

      var mergedRuns = [];
      for (var i = 0; i < nextRuns.length; i++) {
        var previous = mergedRuns[mergedRuns.length - 1];
        if (previous && richStyleEquals(previous.style, nextRuns[i].style)) {
          previous.text += nextRuns[i].text;
        } else {
          mergedRuns.push(nextRuns[i]);
        }
      }

      return {
        text: mergedRuns.map(function(run) { return run.text; }).join(''),
        runs: mergedRuns,
      };
    }

    function isRichParagraph(paragraph) {
      return !!paragraph && typeof paragraph === 'object' && Array.isArray(paragraph.runs);
    }

    function paragraphTextValue(paragraph) {
      return isRichParagraph(paragraph) ? paragraph.text : (paragraph || '');
    }

    function joinParagraphs(first, second) {
      if (!isRichParagraph(first) && !isRichParagraph(second)) {
        return (paragraphTextValue(first) + ' ' + paragraphTextValue(second)).replace(/\\s+/g, ' ').trim();
      }

      var runs = [];
      var firstRuns = isRichParagraph(first) ? first.runs : [{ text: paragraphTextValue(first), style: cloneRichStyle({}) }];
      var secondRuns = isRichParagraph(second) ? second.runs : [{ text: paragraphTextValue(second), style: cloneRichStyle({}) }];

      firstRuns.forEach(function(run) {
        appendRichRun(runs, run.text, run.style);
      });
      appendRichRun(runs, ' ', {});
      secondRuns.forEach(function(run) {
        appendRichRun(runs, run.text, run.style);
      });
      return finalizeRichParagraph(runs);
    }

    function parseRichParagraphs(html) {
      var sanitized = sanitizeContentHtml(html);
      if (!sanitized) return [];
      if (richContentCache && richContentCache.has(sanitized)) {
        return richContentCache.get(sanitized);
      }

      var root = document.createElement('div');
      root.innerHTML = sanitized;
      var paragraphs = [];
      var currentRuns = [];
      var blockTags = {
        p: true,
        div: true,
        section: true,
        article: true,
        blockquote: true,
        aside: true,
        header: true,
        footer: true,
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true,
        li: true,
        ul: true,
        ol: true,
        pre: true,
      };

      function flushParagraph() {
        var paragraph = finalizeRichParagraph(currentRuns);
        if (paragraph) paragraphs.push(paragraph);
        currentRuns = [];
      }

      function walk(node, activeStyle) {
        if (!node) return;
        if (node.nodeType === 3) {
          appendRichRun(currentRuns, node.nodeValue || '', activeStyle);
          return;
        }
        if (node.nodeType !== 1) return;

        var tagName = node.tagName.toLowerCase();
        if (tagName === 'br') {
          appendRichRun(currentRuns, ' ', activeStyle);
          return;
        }

        var isBlock = !!blockTags[tagName];
        if (isBlock && currentRuns.length) flushParagraph();
        var nextStyle = mergeRichStyle(activeStyle, node);

        if (tagName === 'li') {
          appendRichRun(currentRuns, '• ', activeStyle);
        }

        Array.prototype.forEach.call(node.childNodes, function(child) {
          walk(child, nextStyle);
        });

        if (isBlock) flushParagraph();
      }

      Array.prototype.forEach.call(root.childNodes, function(child) {
        walk(child, {});
      });
      flushParagraph();

      if (richContentCache) richContentCache.set(sanitized, paragraphs);
      return paragraphs;
    }

    function richParagraphsToPlainText(paragraphs) {
      return (paragraphs || []).map(function(paragraph) {
        return paragraphTextValue(paragraph);
      }).filter(Boolean).join('\\n\\n');
    }

    function stripHtml(html) {
      if (!html) return '';
      var div = document.createElement('div');
      div.innerHTML = sanitizeContentHtml(html)
        .replace(/<br\\s*\\/?>/gi, '\\n')
        .replace(/<\\/(p|div|section|article|blockquote|aside|header|footer|h1|h2|h3|h4|h5|h6|li|ul|ol|pre)>/gi, '$&\\n\\n');
      return (div.textContent || div.innerText || '')
        .replace(/\\r/g, '')
        .replace(/[ \\t\\u00a0]+/g, ' ')
        .replace(/[ \\t]*\\n[ \\t]*/g, '\\n')
        .replace(/\\n{3,}/g, '\\n\\n')
        .trim();
    }

    function excerptText(post) {
      return stripHtml((post.customHighlight && post.customHighlight.html) || (post.contents && post.contents.htmlHighlight) || '');
    }

    function fullPostContent(post) {
      return parseRichParagraphs((post.contents && post.contents.html) || (post.customHighlight && post.customHighlight.html) || (post.contents && post.contents.htmlHighlight) || '');
    }

    function fullPostText(post) {
      return richParagraphsToPlainText(fullPostContent(post));
    }

    function clipWords(text, limit) {
      var words = (text || '').split(/\\s+/).filter(Boolean);
      if (words.length <= limit) return words.join(' ');
      return words.slice(0, limit).join(' ') + '…';
    }

    function capitalizeWordsPreservingRest(text) {
      return (text || '').replace(/\\b([a-z])/g, function(match, initial) {
        return initial.toUpperCase();
      });
    }

    function splitSentences(text) {
      var cleaned = (text || '').replace(/\\s+/g, ' ').trim();
      if (!cleaned) return [];
      return cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    }

    function splitParagraphs(text) {
      return (text || '')
        .split(/\\n\\s*\\n+/)
        .map(function(paragraph) {
          return paragraph.replace(/\\s+/g, ' ').trim();
        })
        .filter(Boolean);
    }

    function mergeHeadingLikeParagraphs(paragraphs) {
      var merged = [];
      for (var i = 0; i < paragraphs.length; i++) {
        var current = paragraphs[i];
        var next = paragraphs[i + 1];
        var currentText = paragraphTextValue(current);
        var looksLikeHeading = next &&
          currentText.length <= 48 &&
          !/[.!?:;…]$/.test(currentText);

        if (looksLikeHeading) {
          merged.push(joinParagraphs(current, next));
          i += 1;
        } else {
          merged.push(current);
        }
      }
      return merged;
    }

    function compactFragmentaryParagraphs(paragraphs) {
      if (!paragraphs || paragraphs.length < 8) return paragraphs;

      var shortParagraphs = paragraphs.filter(function(paragraph) {
        return paragraphTextValue(paragraph).length < 90;
      }).length;
      if (shortParagraphs < Math.ceil(paragraphs.length * 0.45)) {
        return paragraphs;
      }

      var result = [];
      var buffer = '';

      function pushBuffer() {
        if (!buffer) return;
        result.push(buffer);
        buffer = '';
      }

      for (var i = 0; i < paragraphs.length; i++) {
        var paragraph = paragraphs[i];
        var next = paragraphs[i + 1] || '';
        var paragraphText = paragraphTextValue(paragraph);
        var nextText = paragraphTextValue(next);
        if (!buffer) {
          buffer = paragraph;
        } else {
          buffer = joinParagraphs(buffer, paragraph);
        }

        var bufferShort = paragraphTextValue(buffer).length < 220;
        var currentShort = paragraphText.length < 90;
        var nextShort = next && nextText.length < 90;
        var dialogueish = /^[!>→.]/.test(paragraphText);
        var shouldContinue = bufferShort || currentShort || (nextShort && dialogueish);

        if (!shouldContinue) {
          pushBuffer();
        }
      }

      pushBuffer();
      return result.length ? result : paragraphs;
    }

    function partitionSentences(sentences, count, paragraphCount) {
      var items = sentences.slice(0, count);
      var actualParagraphs = Math.max(1, Math.min(paragraphCount, items.length));
      var result = [];
      var cursor = 0;
      for (var i = 0; i < actualParagraphs; i++) {
        var remainingParagraphs = actualParagraphs - i;
        var remainingSentences = items.length - cursor;
        var take = Math.ceil(remainingSentences / remainingParagraphs);
        result.push(items.slice(cursor, cursor + take).join(' ').trim());
        cursor += take;
      }
      return result.filter(Boolean);
    }

    function useColumns() {
      var state = useState(function() {
        if (typeof window === 'undefined') return 8;
        var width = window.innerWidth;
        if (width < 640) return 2;
        if (width < 900) return 4;
        if (width < 1200) return 6;
        if (width < 1500) return 8;
        return 10;
      });
      var cols = state[0];
      var setCols = state[1];

      useEffect(function() {
        function update() {
          var width = window.innerWidth;
          if (width < 640) setCols(2);
          else if (width < 900) setCols(4);
          else if (width < 1200) setCols(6);
          else if (width < 1500) setCols(8);
          else setCols(10);
        }
        update();
        window.addEventListener('resize', update);
        return function() {
          window.removeEventListener('resize', update);
        };
      }, []);

      return cols;
    }

    function formatByline(post) {
      return post.hideAuthor ? 'Anonymous' : ((post.user && post.user.displayName) || 'Anonymous');
    }

    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function postUrl(post) {
      return '/posts/' + post._id + '/' + (post.slug || '');
    }

    var excerptMeasureCanvas = document.createElement('canvas');
    var excerptMeasureCtx = excerptMeasureCanvas.getContext('2d');
    var richFragmentWidthCache = typeof Map === 'function' ? new Map() : null;

    function countSpaces(text) {
      var matches = (text || '').match(/ /g);
      return matches ? matches.length : 0;
    }

    function measureTextWidth(text, font) {
      if (!text) return 0;
      var key = font + '|' + text;
      if (richFragmentWidthCache && richFragmentWidthCache.has(key)) {
        return richFragmentWidthCache.get(key);
      }
      excerptMeasureCtx.font = font;
      var width = excerptMeasureCtx.measureText(text).width;
      if (richFragmentWidthCache) richFragmentWidthCache.set(key, width);
      return width;
    }

    function trimTextToWidth(text, maxWidth, font) {
      excerptMeasureCtx.font = font;
      var raw = (text || '').trim().replace(/…+$/, '');
      if (!raw) return '…';
      var candidate = raw + '…';
      if (excerptMeasureCtx.measureText(candidate).width <= maxWidth) return candidate;

      var words = raw.split(/\\s+/).filter(Boolean);
      while (words.length > 1) {
        words.pop();
        candidate = words.join(' ') + '…';
        if (excerptMeasureCtx.measureText(candidate).width <= maxWidth) return candidate;
      }

      while (raw.length > 1) {
        raw = raw.slice(0, -1);
        candidate = raw + '…';
        if (excerptMeasureCtx.measureText(candidate).width <= maxWidth) return candidate;
      }

      return '…';
    }

    function makeExcerptParagraphs(text, paragraphCount) {
      if (Array.isArray(text)) {
        var richParagraphs = compactFragmentaryParagraphs(mergeHeadingLikeParagraphs(text));
        return richParagraphs.filter(Boolean);
      }

      var paragraphs = compactFragmentaryParagraphs(mergeHeadingLikeParagraphs(splitParagraphs(text)));
      if (paragraphs.length > 1) {
        return paragraphs;
      }

      var cleaned = (text || '').replace(/\\s+/g, ' ').trim();
      if (!cleaned) return [];
      var sentences = splitSentences(cleaned);
      if (!sentences.length) return [cleaned];
      return partitionSentences(sentences, sentences.length, paragraphCount || 1);
    }

    function hyphenateParagraphText(paragraphText) {
      if (!paragraphText || !window.hyphenateEnglish) return paragraphText;
      try {
        return sanitizeHyphenatedText(window.hyphenateEnglish(paragraphText, { hyphenChar: SOFT_HYPHEN }));
      } catch (error) {
        return paragraphText;
      }
    }

    function hyphenateRichParagraph(paragraph) {
      var plainText = paragraphTextValue(paragraph);
      var layoutText = hyphenateParagraphText(plainText);
      if (!isRichParagraph(paragraph)) {
        return {
          text: layoutText,
          runs: [{ text: layoutText, style: cloneRichStyle({}) }],
        };
      }
      if (layoutText === plainText) {
        return {
          text: layoutText,
          runs: paragraph.runs.map(function(run) {
            return { text: run.text, style: cloneRichStyle(run.style) };
          }),
        };
      }

      var outputRuns = [];
      var runIndex = 0;
      var runOffset = 0;

      function getCurrentStyle() {
        if (paragraph.runs[runIndex]) return paragraph.runs[runIndex].style;
        if (outputRuns.length) return outputRuns[outputRuns.length - 1].style;
        return {};
      }

      function appendOutputText(text, style) {
        if (!text) return;
        var previous = outputRuns[outputRuns.length - 1];
        var nextStyle = cloneRichStyle(style || {});
        if (previous && richStyleEquals(previous.style, nextStyle)) {
          previous.text += text;
        } else {
          outputRuns.push({ text: text, style: nextStyle });
        }
      }

      for (var i = 0; i < layoutText.length; i++) {
        var char = layoutText[i];
        if (char === SOFT_HYPHEN) {
          appendOutputText(char, getCurrentStyle());
          continue;
        }

        while (paragraph.runs[runIndex] && runOffset >= paragraph.runs[runIndex].text.length) {
          runIndex += 1;
          runOffset = 0;
        }

        appendOutputText(char, getCurrentStyle());
        runOffset += 1;
      }

      return {
        text: layoutText,
        runs: outputRuns,
      };
    }

    function countLetterCharacters(text) {
      return Array.from(text || '').filter(function(char) {
        return /[A-Za-z]/.test(char);
      }).length;
    }

    function sanitizeHyphenatedWord(word) {
      if (!word || word.indexOf(SOFT_HYPHEN) === -1) return word;
      var plainWord = word.split(SOFT_HYPHEN).join('');
      if (/[A-Z]/.test(plainWord) || plainWord.indexOf('-') !== -1) {
        return plainWord;
      }

      var parts = word.split(SOFT_HYPHEN);
      var rebuilt = parts[0];
      for (var i = 1; i < parts.length; i++) {
        var leftLetters = countLetterCharacters(rebuilt);
        var rightLetters = countLetterCharacters(parts.slice(i).join(''));
        if (leftLetters >= 4 && rightLetters >= 4) {
          rebuilt += SOFT_HYPHEN;
        }
        rebuilt += parts[i];
      }
      return rebuilt;
    }

    function sanitizeHyphenatedText(text) {
      if (!text || text.indexOf(SOFT_HYPHEN) === -1) return text;
      return text.replace(/\\S+/g, function(word) {
        return sanitizeHyphenatedWord(word);
      });
    }

    function getDropCapMetrics(font, lineHeight) {
      var match = /([0-9.]+)px/.exec(font || '');
      var baseSize = match ? parseFloat(match[1]) : 13;
      var fontSize = Math.round(baseSize * 3.9);
      var indent = Math.round(baseSize * 3.15);
      var lines = Math.max(3, Math.round(fontSize / lineHeight));
      return {
        fontSize: fontSize,
        indent: indent,
        lines: lines,
      };
    }

    function getParagraphIndent(font) {
      var match = /([0-9.]+)px/.exec(font || '');
      var baseSize = match ? parseFloat(match[1]) : 13;
      return Math.round(baseSize * 1.55);
    }

    function computeColumnCount(totalWidth, props) {
      if (!props.multiColumn) return 1;
      var gap = props.columnGap || 12;
      var minColumnWidth = props.minColumnWidth || 210;
      var maxColumns = props.maxColumns || 3;
      var minColumns = props.minColumns || 2;
      var availableColumns = Math.floor((totalWidth + gap) / (minColumnWidth + gap));
      var columnCount = Math.max(minColumns, Math.min(maxColumns, availableColumns));
      if (totalWidth < minColumnWidth * 1.8) columnCount = 1;
      return Math.max(1, columnCount);
    }

    function normalizeRect(rect, containerRect, options) {
      var leftPad = options && options.leftPad ? options.leftPad : 0;
      var rightPad = options && options.rightPad ? options.rightPad : 0;
      var topPad = options && options.topPad ? options.topPad : 0;
      var bottomPad = options && options.bottomPad ? options.bottomPad : 0;
      var bottomTrim = options && options.bottomTrim ? options.bottomTrim : 0;
      var resolvedBottomTrim = typeof bottomTrim === 'function'
        ? bottomTrim(rect)
        : bottomTrim;
      var top = rect.top - containerRect.top - topPad;
      var bottom = rect.bottom - containerRect.top + bottomPad - resolvedBottomTrim;
      return {
        left: Math.max(0, rect.left - containerRect.left - leftPad),
        right: rect.right - containerRect.left + rightPad,
        top: Math.max(0, top),
        bottom: Math.max(0, bottom),
      };
    }

    function getElementLineRects(element, containerRect, options) {
      if (!element) return [];
      var rects = [];

      try {
        var walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(node) {
              return (node.textContent || '').trim()
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
            }
          }
        );
        var textNode = walker.nextNode();
        while (textNode) {
          var range = document.createRange();
          range.selectNodeContents(textNode);
          rects = rects.concat(
            Array.prototype.slice.call(range.getClientRects())
              .filter(function(rect) {
                return rect.width > 0.5 && rect.height > 0.5;
              })
              .map(function(rect) {
                return normalizeRect(rect, containerRect, options);
              })
          );
          textNode = walker.nextNode();
        }
      } catch (error) {
        rects = [];
      }

      if (rects.length) return rects;

      var fallbackRect = element.getBoundingClientRect();
      if (!fallbackRect.width || !fallbackRect.height) return [];
      return [normalizeRect(fallbackRect, containerRect, options)];
    }

    function getElementBoxRects(element, containerRect, options) {
      if (!element) return [];
      var rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return [normalizeRect(rect, containerRect, options)];
    }

    function measureExclusionRects(containerNode, exclusionRefs, options) {
      if (!containerNode || !exclusionRefs || !exclusionRefs.length) return [];
      var containerRect = containerNode.getBoundingClientRect();
      var rects = [];
      for (var i = 0; i < exclusionRefs.length; i++) {
        var entry = exclusionRefs[i];
        var ref = entry && entry.ref ? entry.ref : entry;
        var mode = entry && entry.mode ? entry.mode : 'text';
        var entryRightPad = entry && typeof entry.rightPad === 'number' ? entry.rightPad : null;
        var entryBottomPad = entry && typeof entry.bottomPad === 'number' ? entry.bottomPad : null;
        var entryBottomTrim = entry && typeof entry.bottomTrim === 'number' ? entry.bottomTrim : null;
        var entryBottomTrimRatio = entry && typeof entry.bottomTrimRatio === 'number' ? entry.bottomTrimRatio : null;
        var entryLastLineMinRight = entry && typeof entry.lastLineMinRight === 'number' ? entry.lastLineMinRight : null;
        if (!ref || !ref.current) continue;
        var entryRects = (
          mode === 'box'
            ? getElementBoxRects(ref.current, containerRect, {
                rightPad: 0,
                bottomPad: entryBottomPad !== null ? entryBottomPad : (options && options.boxBottomPad ? options.boxBottomPad : 0),
              })
            : getElementLineRects(ref.current, containerRect, {
                rightPad: entryRightPad !== null ? entryRightPad : (options && options.textRightPad ? options.textRightPad : 0),
                bottomPad: entryBottomPad !== null ? entryBottomPad : (options && options.textBottomPad ? options.textBottomPad : 0),
                bottomTrim: function(rect) {
                  var baseTrim = entryBottomTrim !== null ? entryBottomTrim : (options && options.textBottomTrim ? options.textBottomTrim : 0);
                  var ratioTrim = entryBottomTrimRatio !== null ? rect.height * entryBottomTrimRatio : (options && options.textBottomTrimRatio ? rect.height * options.textBottomTrimRatio : 0);
                  return Math.max(baseTrim, ratioTrim);
                },
              })
        );
        if (entryLastLineMinRight !== null && entryRects.length) {
          var lastBottom = Math.max.apply(null, entryRects.map(function(rect) { return rect.bottom; }));
          entryRects = entryRects.map(function(rect) {
            if (Math.abs(rect.bottom - lastBottom) > 1) return rect;
            return Object.assign({}, rect, {
              right: Math.max(rect.right, entryLastLineMinRight),
            });
          });
        }
        rects = rects.concat(entryRects);
      }
      return rects;
    }

    function snapToLineGrid(value, lineHeight) {
      if (!lineHeight) return Math.max(0, Math.ceil(value));
      return Math.max(0, Math.ceil(value / lineHeight) * lineHeight);
    }

    function buildExclusionBreaks(exclusionRects, lineHeight) {
      var seen = {};
      return [0].concat(
        (exclusionRects || [])
          .map(function(rect) {
            return snapToLineGrid(rect.bottom, lineHeight);
          })
          .filter(function(value) {
            if (seen[value]) return false;
            seen[value] = true;
            return true;
          })
          .sort(function(a, b) { return a - b; })
      );
    }

    function getColumnLeft(columnIndex, columnWidth, columnGap) {
      return columnIndex * (columnWidth + columnGap);
    }

    function getColumnLineBand(columnIndex, lineTop, options) {
      var baseLeft = getColumnLeft(columnIndex, options.columnWidth, options.columnGap);
      var baseRight = baseLeft + options.columnWidth;
      var bandTop = lineTop;
      var bandBottom = lineTop + options.lineHeight;
      var blockingRight = baseLeft;
      var hasBlocking = false;

      for (var rectIndex = 0; rectIndex < (options.exclusionRects || []).length; rectIndex++) {
        var rect = options.exclusionRects[rectIndex];
        var intersectsBand = rect.bottom > bandTop + 0.5 && rect.top < bandBottom - 0.5;
        var intersectsColumn = rect.right > baseLeft + 0.5 && rect.left < baseRight - 0.5;
        if (intersectsBand && intersectsColumn) {
          hasBlocking = true;
          blockingRight = Math.max(blockingRight, Math.min(baseRight, rect.right));
        }
      }

      var shift = hasBlocking ? Math.max(0, blockingRight - baseLeft) : 0;
      var width = Math.max(0, options.columnWidth - shift);
      var threshold = options.columnWidth * (options.partialColumnThreshold || (2 / 3));
      return {
        usable: !hasBlocking || width >= threshold,
        shift: shift,
        width: width,
      };
    }

    function findColumnUsableStart(columnIndex, minTop, options) {
      var breaks = options.exclusionBreaks || [0];
      for (var i = 0; i < breaks.length; i++) {
        var top = breaks[i];
        if (top + 0.5 < minTop) continue;
        var band = getColumnLineBand(columnIndex, top, options);
        if (band.usable) return top;
      }
      return options.columnHeight;
    }

    function computeColumnTopOffsets(columnCount, layoutOptions) {
      var topOffsets = [];
      for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        topOffsets.push(snapToLineGrid(findColumnUsableStart(columnIndex, 0, layoutOptions), layoutOptions.lineHeight));
      }
      return topOffsets;
    }

    function makePreparedLayoutSignature(layout) {
      if (!layout) return '';
      return JSON.stringify({
        columnCount: layout.columnCount,
        columnGap: layout.columnGap,
        columnTopOffsets: layout.columnTopOffsets || [],
        columns: layout.columns.map(function(column) {
          return column.map(function(item) {
            if (item.type === 'gap') return ['g'];
            return [
              'l',
              item.text,
              item.isLast ? 1 : 0,
              item.top || 0,
              item.indent || 0,
              item.shift || 0,
              item.naturalWidth ? Math.round(item.naturalWidth * 100) / 100 : 0,
              item.targetWidth ? Math.round(item.targetWidth * 100) / 100 : 0,
              item.dropCap ? 1 : 0,
              item.dropCapLinesRemaining || 0,
            ];
          });
        }),
      });
    }

    function makeParagraphPrepareKey(paragraphs) {
      return (paragraphs || []).map(function(paragraph) {
        if (isRichParagraph(paragraph)) {
          return paragraph.runs.map(function(run) {
            return run.text + '|' + (run.style.bold ? 'b' : '') + (run.style.italic ? 'i' : '') + (run.style.code ? 'c' : '') + (run.style.strike ? 's' : '') + ':' + (run.style.href || '');
          }).join('');
        }
        return paragraphTextValue(paragraph);
      }).join('\\n\\n');
    }

    function usePreparedParagraphBundle(content, options) {
      var paragraphTexts = useMemo(function() {
        return makeExcerptParagraphs(content, options.paragraphCount);
      }, [content, options.paragraphCount]);
      var paragraphKey = useMemo(function() {
        return makeParagraphPrepareKey(paragraphTexts);
      }, [paragraphTexts]);
      var state = useState(null);
      var preparedBundle = state[0];
      var setPreparedBundle = state[1];

      useEffect(function() {
        var cancelled = false;

        function prepareNow() {
          var nextBundle = paragraphTexts.map(function(paragraph) {
            var paragraphText = paragraphTextValue(paragraph);
            var richLayout = hyphenateRichParagraph(paragraph);
            var layoutText = richLayout.text;
            var layoutStyle = getParagraphLayoutStyle(richLayout);
            var layoutFont = getStyledFont(options.font, layoutStyle);
            var prepared = window.pretextPrepareWithSegments
              ? window.pretextPrepareWithSegments(layoutText, layoutFont)
              : null;
            return {
              text: paragraphText,
              layoutText: layoutText,
              prepared: prepared,
              richRuns: richLayout.runs,
              layoutFont: layoutFont,
              spaceWidth: getSpaceWidth(layoutFont),
              segmentOffsets: prepared ? getPreparedSegmentOffsets(prepared) : null,
            };
          });
          if (!cancelled) {
            setPreparedBundle(nextBundle);
          }
        }

        prepareNow();
        if (!window.pretextReady) {
          window.addEventListener('pretext-loaded', prepareNow);
        }
        if (!window.hyphenationReady) {
          window.addEventListener('hyphenation-loaded', prepareNow);
        }

        return function() {
          cancelled = true;
          window.removeEventListener('pretext-loaded', prepareNow);
          window.removeEventListener('hyphenation-loaded', prepareNow);
        };
      }, [paragraphKey, options.font]);

      return preparedBundle;
    }

    function buildFallbackLines(text, width, font) {
      var words = (text || '').split(/\\s+/).filter(Boolean);
      if (!words.length) return [];
      excerptMeasureCtx.font = font;
      var spaceWidth = excerptMeasureCtx.measureText(' ').width;
      var lines = [];
      var lineWords = [];
      var lineWidth = 0;

      for (var i = 0; i < words.length; i++) {
        var wordWidth = excerptMeasureCtx.measureText(words[i]).width;
        var nextWidth = lineWords.length === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;
        if (lineWords.length > 0 && nextWidth > width) {
          var lineText = lineWords.join(' ');
          lines.push({ text: lineText, width: excerptMeasureCtx.measureText(lineText).width, end: null });
          lineWords = [words[i]];
          lineWidth = wordWidth;
        } else {
          lineWords.push(words[i]);
          lineWidth = nextWidth;
        }
      }

      if (lineWords.length) {
        var finalText = lineWords.join(' ');
        lines.push({ text: finalText, width: excerptMeasureCtx.measureText(finalText).width, end: { done: true } });
      }

      return lines;
    }

    function getRenderedTextRect(node) {
      if (!node) return null;
      var range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    }

    function refineRenderedWordSpacing(containerNode) {
      if (!containerNode) return;
      var lines = Array.prototype.slice.call(containerNode.querySelectorAll('.fitted-line'));
      lines.forEach(function(line) {
        if (line.classList.contains('last') || line.classList.contains('fallback-left')) return;
        var spaces = countSpaces(line.textContent || '');
        if (!spaces) return;
        var parent = line.parentElement;
        if (!parent) return;

        for (var pass = 0; pass < 6; pass++) {
          var rect = getRenderedTextRect(line);
          if (!rect || !rect.width) return;
          var residual = parent.getBoundingClientRect().right - rect.right;
          if (Math.abs(residual) < 0.1) break;
          var currentWordSpacing = parseFloat(line.style.wordSpacing || getComputedStyle(line).wordSpacing) || 0;
          line.style.wordSpacing = (currentWordSpacing + (residual / spaces)) + 'px';
        }
      });
    }

    var excerptGraphemeSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;
    var preparedLineTextCache = typeof WeakMap === 'function' ? new WeakMap() : null;
    var preparedSegmentOffsetsCache = typeof WeakMap === 'function' ? new WeakMap() : null;

    function getPreparedLineCache(prepared) {
      if (!preparedLineTextCache) return {};
      var cache = preparedLineTextCache.get(prepared);
      if (!cache) {
        cache = {};
        preparedLineTextCache.set(prepared, cache);
      }
      return cache;
    }

    function getPreparedSegmentGraphemes(prepared, segmentIndex) {
      var cache = getPreparedLineCache(prepared);
      if (cache[segmentIndex]) return cache[segmentIndex];
      var text = (prepared.segments && prepared.segments[segmentIndex]) || '';
      var graphemes;
      if (excerptGraphemeSegmenter) {
        graphemes = Array.from(excerptGraphemeSegmenter.segment(text), function(entry) {
          return entry.segment;
        });
      } else {
        graphemes = Array.from(text || '');
      }
      cache[segmentIndex] = graphemes;
      return graphemes;
    }

    function getPreparedSegmentOffsets(prepared) {
      if (!preparedSegmentOffsetsCache) {
        var adHocOffsets = [];
        var cursor = 0;
        for (var i = 0; i < prepared.segments.length; i++) {
          adHocOffsets.push(cursor);
          cursor += (prepared.segments[i] || '').length;
        }
        return adHocOffsets;
      }

      var cached = preparedSegmentOffsetsCache.get(prepared);
      if (cached) return cached;

      var offsets = [];
      var offset = 0;
      for (var i = 0; i < prepared.segments.length; i++) {
        offsets.push(offset);
        offset += (prepared.segments[i] || '').length;
      }
      preparedSegmentOffsetsCache.set(prepared, offsets);
      return offsets;
    }

    function getPreparedSegmentCodeUnitOffset(prepared, segmentIndex, graphemeIndex) {
      if (!graphemeIndex) return 0;
      var graphemes = getPreparedSegmentGraphemes(prepared, segmentIndex);
      var offset = 0;
      for (var i = 0; i < graphemeIndex; i++) {
        offset += (graphemes[i] || '').length;
      }
      return offset;
    }

    function lineHasDiscretionaryHyphen(kinds, startSegmentIndex, startGraphemeIndex, endSegmentIndex, endGraphemeIndex) {
      return (
        endSegmentIndex > 0 &&
        kinds[endSegmentIndex - 1] === 'soft-hyphen' &&
        endGraphemeIndex === 0 &&
        !(startSegmentIndex === endSegmentIndex && startGraphemeIndex > 0)
      );
    }

    function buildPreparedLineText(prepared, startCursor, endCursor) {
      var text = '';
      var endsWithDiscretionaryHyphen = lineHasDiscretionaryHyphen(
        prepared.kinds,
        startCursor.segmentIndex,
        startCursor.graphemeIndex,
        endCursor.segmentIndex,
        endCursor.graphemeIndex
      );

      for (var i = startCursor.segmentIndex; i < endCursor.segmentIndex; i++) {
        if (prepared.kinds[i] === 'soft-hyphen' || prepared.kinds[i] === 'hard-break') continue;
        if (i === startCursor.segmentIndex && startCursor.graphemeIndex > 0) {
          text += getPreparedSegmentGraphemes(prepared, i).slice(startCursor.graphemeIndex).join('');
        } else {
          text += prepared.segments[i] || '';
        }
      }

      if (endCursor.graphemeIndex > 0) {
        if (endsWithDiscretionaryHyphen) text += '-';
        text += getPreparedSegmentGraphemes(prepared, endCursor.segmentIndex)
          .slice(
            startCursor.segmentIndex === endCursor.segmentIndex ? startCursor.graphemeIndex : 0,
            endCursor.graphemeIndex
          )
          .join('');
      } else if (endsWithDiscretionaryHyphen) {
        text += '-';
      }

      return text;
    }

    function canBreakAfterKind(kind) {
      return (
        kind === 'space' ||
        kind === 'preserved-space' ||
        kind === 'tab' ||
        kind === 'zero-width-break' ||
        kind === 'soft-hyphen'
      );
    }

    function makeCursorKey(cursor) {
      return cursor.segmentIndex + ':' + cursor.graphemeIndex;
    }

    function cursorsEqual(a, b) {
      return !!a && !!b && a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex;
    }

    function normalizePreparedCursor(prepared, cursor) {
      if (!prepared || !prepared.widths || !prepared.widths.length) return null;
      var segmentIndex = cursor.segmentIndex;
      var graphemeIndex = cursor.graphemeIndex || 0;
      if (segmentIndex >= prepared.widths.length) return null;
      if (graphemeIndex > 0) return { segmentIndex: segmentIndex, graphemeIndex: graphemeIndex };

      var chunks = prepared.chunks || [];
      var chunkIndex = -1;
      for (var i = 0; i < chunks.length; i++) {
        if (segmentIndex < chunks[i].consumedEndSegmentIndex) {
          chunkIndex = i;
          break;
        }
      }
      if (chunkIndex < 0) return null;

      var chunk = chunks[chunkIndex];
      if (chunk.startSegmentIndex === chunk.endSegmentIndex && segmentIndex === chunk.startSegmentIndex) {
        return { segmentIndex: segmentIndex, graphemeIndex: 0 };
      }

      if (segmentIndex < chunk.startSegmentIndex) segmentIndex = chunk.startSegmentIndex;
      while (segmentIndex < chunk.endSegmentIndex) {
        var kind = prepared.kinds[segmentIndex];
        if (kind !== 'space' && kind !== 'zero-width-break' && kind !== 'soft-hyphen') {
          return { segmentIndex: segmentIndex, graphemeIndex: 0 };
        }
        segmentIndex += 1;
      }

      if (chunk.consumedEndSegmentIndex >= prepared.widths.length) return null;
      return { segmentIndex: chunk.consumedEndSegmentIndex, graphemeIndex: 0 };
    }

    function getPreparedSegmentAdvanceRange(prepared, segmentIndex, startGraphemeIndex, endGraphemeIndex) {
      var graphemeWidths = prepared.breakableWidths && prepared.breakableWidths[segmentIndex];
      if (!graphemeWidths || !graphemeWidths.length) {
        return (prepared.widths && prepared.widths[segmentIndex]) || 0;
      }
      var prefixWidths = prepared.breakablePrefixWidths && prepared.breakablePrefixWidths[segmentIndex];
      if (prefixWidths && endGraphemeIndex > 0) {
        return prefixWidths[endGraphemeIndex - 1] - (startGraphemeIndex > 0 ? prefixWidths[startGraphemeIndex - 1] : 0);
      }
      var width = 0;
      for (var i = startGraphemeIndex; i < endGraphemeIndex; i++) {
        width += graphemeWidths[i] || 0;
      }
      return width;
    }

    function createLineCandidate(prepared, startCursor, endCursor, fitWidth, paintWidth, options) {
      var text = buildPreparedLineText(prepared, startCursor, endCursor).replace(/[ \t]+$/, '');
      var hyphenMatch = options.endsWithHyphen ? text.match(/([A-Za-z]+)-$/) : null;
      var nextSegmentLetters = 0;
      if (options.endsWithHyphen && endCursor.segmentIndex < prepared.segments.length) {
        nextSegmentLetters = countLetterCharacters(prepared.segments[endCursor.segmentIndex] || '');
      }
      return {
        start: startCursor,
        end: endCursor,
        fitWidth: fitWidth,
        width: paintWidth,
        text: text,
        spaceCount: countSpaces(text),
        endsWithHyphen: !!options.endsWithHyphen,
        isTerminal: !!options.isTerminal,
        isForced: !!options.isForced,
        hyphenPrefixLetters: hyphenMatch ? countLetterCharacters(hyphenMatch[1]) : 0,
        hyphenSuffixLetters: nextSegmentLetters,
      };
    }

    function makeForcedBreakCandidate(prepared, startCursor, maxWidth) {
      var segmentIndex = startCursor.segmentIndex;
      var graphemeIndex = startCursor.graphemeIndex || 0;
      var graphemeWidths = prepared.breakableWidths && prepared.breakableWidths[segmentIndex];
      if (!graphemeWidths || !graphemeWidths.length) return null;
      var width = 0;
      var endGraphemeIndex = graphemeIndex;
      while (endGraphemeIndex < graphemeWidths.length) {
        var nextWidth = width + (graphemeWidths[endGraphemeIndex] || 0);
        if (endGraphemeIndex > graphemeIndex && nextWidth > maxWidth + 0.01) break;
        width = nextWidth;
        endGraphemeIndex += 1;
        if (nextWidth > maxWidth + 0.01) break;
      }
      if (endGraphemeIndex === graphemeIndex) {
        endGraphemeIndex = Math.min(graphemeWidths.length, graphemeIndex + 1);
        width = getPreparedSegmentAdvanceRange(prepared, segmentIndex, graphemeIndex, endGraphemeIndex);
      }
      var endCursor = endGraphemeIndex >= graphemeWidths.length
        ? { segmentIndex: segmentIndex + 1, graphemeIndex: 0 }
        : { segmentIndex: segmentIndex, graphemeIndex: endGraphemeIndex };
      return createLineCandidate(prepared, startCursor, endCursor, width, width, {
        isForced: true,
      });
    }

    function collectLineCandidates(prepared, startCursor, maxWidth) {
      var cursor = normalizePreparedCursor(prepared, startCursor);
      if (!cursor) return [];
      if (cursor.graphemeIndex > 0) {
        var forcedCandidate = makeForcedBreakCandidate(prepared, cursor, maxWidth);
        return forcedCandidate ? [forcedCandidate] : [];
      }

      var epsilon = 0.01;
      var candidatesByKey = {};
      var hasContent = false;
      var lineWidth = 0;
      var reachedEnd = true;

      function addCandidate(endCursor, fitWidth, paintWidth, options) {
        if (fitWidth > maxWidth + epsilon) return;
        var key = makeCursorKey(endCursor);
        candidatesByKey[key] = createLineCandidate(prepared, cursor, endCursor, fitWidth, paintWidth, options || {});
      }

      for (var i = cursor.segmentIndex; i < prepared.segments.length; i++) {
        var kind = prepared.kinds[i];
        if (kind === 'hard-break') break;

        if (kind === 'soft-hyphen') {
          if (hasContent) {
            var softHyphenWidth = lineWidth + (prepared.discretionaryHyphenWidth || 0);
            addCandidate(
              { segmentIndex: i + 1, graphemeIndex: 0 },
              softHyphenWidth,
              softHyphenWidth,
              { endsWithHyphen: true }
            );
          }
          continue;
        }

        var segmentWidth = kind === 'tab'
          ? ((prepared.widths && prepared.widths[i]) || 0)
          : ((prepared.widths && prepared.widths[i]) || 0);
        var nextWidth = hasContent ? (lineWidth + segmentWidth) : segmentWidth;

        if (nextWidth > maxWidth + epsilon) {
          if (canBreakAfterKind(kind)) {
            var overflowFitWidth = lineWidth - segmentWidth + (kind === 'tab' ? 0 : (prepared.lineEndFitAdvances[i] || 0));
            var overflowPaintWidth = lineWidth - segmentWidth + (kind === 'tab' ? segmentWidth : (prepared.lineEndPaintAdvances[i] || 0));
            addCandidate(
              { segmentIndex: i + 1, graphemeIndex: 0 },
              overflowFitWidth,
              overflowPaintWidth,
              {}
            );
          }
          reachedEnd = false;
          break;
        }

        lineWidth = nextWidth;
        hasContent = true;

        if (canBreakAfterKind(kind)) {
          var fitWidth = lineWidth - segmentWidth + (kind === 'tab' ? 0 : (prepared.lineEndFitAdvances[i] || 0));
          var paintWidth = lineWidth - segmentWidth + (kind === 'tab' ? segmentWidth : (prepared.lineEndPaintAdvances[i] || 0));
          addCandidate(
            { segmentIndex: i + 1, graphemeIndex: 0 },
            fitWidth,
            paintWidth,
            {}
          );
        }
      }

      if (hasContent && reachedEnd) {
        addCandidate(
          { segmentIndex: prepared.segments.length, graphemeIndex: 0 },
          lineWidth,
          lineWidth,
          { isTerminal: true }
        );
      }

      var candidates = Object.keys(candidatesByKey).map(function(key) {
        return candidatesByKey[key];
      });

      candidates.sort(function(a, b) {
        if (a.end.segmentIndex !== b.end.segmentIndex) return a.end.segmentIndex - b.end.segmentIndex;
        return a.end.graphemeIndex - b.end.graphemeIndex;
      });

      if (!candidates.length) {
        var forced = makeForcedBreakCandidate(prepared, cursor, maxWidth);
        if (forced) return [forced];
      }

      return candidates;
    }

    function getSpaceWidth(font) {
      excerptMeasureCtx.font = font;
      return excerptMeasureCtx.measureText(' ').width || 3;
    }

    function computeLineCost(candidate, slot, options) {
      var residual = slot.targetWidth - candidate.fitWidth;
      if (residual < -0.25) return Infinity;
      var fillRatio = candidate.fitWidth / Math.max(slot.targetWidth, 1);
      var spaceWidth = Math.max(options.spaceWidth, 1);
      var preferredStretch = Math.max(spaceWidth * 0.42, 1.25);
      var preferredShrink = Math.max(spaceWidth * 0.28, 0.85);
      var comfortableExtraSpace = Math.max(spaceWidth * 0.78, 2.2);
      var looseExtraSpace = Math.max(spaceWidth * 1.12, 3.35);
      var extremeExtraSpace = Math.max(spaceWidth * 1.72, 5.15);

      if (candidate.endsWithHyphen && (candidate.hyphenPrefixLetters < 4 || candidate.hyphenSuffixLetters > 0 && candidate.hyphenSuffixLetters < 4)) {
        return Infinity;
      }

      if (candidate.isTerminal) {
        var terminalSlack = residual / Math.max(options.spaceWidth * 8, 1);
        var terminalCost = terminalSlack > 0 ? terminalSlack * terminalSlack : 0;
        if (candidate.endsWithHyphen) terminalCost += 120;
        return terminalCost;
      }

      if (candidate.spaceCount <= 0) {
        if (!candidate.isTerminal && !candidate.isForced && fillRatio < 0.5) {
          return Infinity;
        }
        var unbreakableSlack = residual / Math.max(options.spaceWidth, 1);
        var unbreakableCost = 800 + (unbreakableSlack * unbreakableSlack * 25) + (candidate.endsWithHyphen ? 120 : 0) + (candidate.isForced ? 900 : 0);
        if (!candidate.isTerminal && fillRatio < 0.75) {
          unbreakableCost += 25000 * Math.pow(0.75 - fillRatio, 2);
        }
        return unbreakableCost;
      }

      var adjustment = residual / (candidate.spaceCount * Math.max(options.spaceWidth, 1));
      var extraPerSpace = residual / candidate.spaceCount;
      var normalizedAdjustment = residual >= 0
        ? (extraPerSpace / preferredStretch)
        : (extraPerSpace / preferredShrink);
      var badness = 100 * Math.pow(Math.abs(normalizedAdjustment), 3);
      if (!candidate.isTerminal && candidate.spaceCount === 1 && fillRatio < 0.72) {
        badness += 8000 * Math.pow(0.72 - fillRatio, 2);
      }
      if (adjustment > 1.4) {
        badness += 160 * Math.pow(adjustment - 1.4, 2);
      }
      if (extraPerSpace > comfortableExtraSpace) {
        badness += 220 * Math.pow(extraPerSpace - comfortableExtraSpace, 2);
      }
      if (extraPerSpace > looseExtraSpace) {
        badness += 1800 * Math.pow(extraPerSpace - looseExtraSpace, 2);
      }
      if (!candidate.isForced && extraPerSpace > extremeExtraSpace) {
        badness += 25000 * Math.pow(extraPerSpace - extremeExtraSpace, 2);
      }
      if (candidate.endsWithHyphen) badness += 45;
      if (options.previousHyphen && candidate.endsWithHyphen) badness += 110;
      if (candidate.isForced) badness += 900;
      return badness;
    }

    function buildLayoutSlots(options) {
      var slots = [];
      var minTargetWidth = options.minTargetWidth || 40;

      for (var columnIndex = 0; columnIndex < options.columnCount; columnIndex++) {
        var lineTop = (options.columnTopOffsets && options.columnTopOffsets[columnIndex]) || 0;
        while (lineTop + options.lineHeight <= options.columnHeight + 0.5) {
          var band = getColumnLineBand(columnIndex, lineTop, options);
          if (!band.usable || band.width < minTargetWidth) {
            var nextTop = findColumnUsableStart(columnIndex, lineTop + 1, options);
            if (nextTop <= lineTop + 0.5) break;
            lineTop = nextTop;
            continue;
          }

          slots.push({
            absoluteIndex: slots.length,
            columnIndex: columnIndex,
            top: lineTop,
            shift: band.shift,
            baseWidth: band.width,
          });
          lineTop += options.lineHeight;
        }
      }

      return slots;
    }

    function getParagraphSlotSpec(slot, paragraphIndex, lineIndex, options) {
      var dropCap = options.dropCapMetrics;
      var paragraphIndent = options.paragraphIndent || 0;
      if (dropCap && paragraphIndex === 0 && slot.columnIndex === 0 && lineIndex < dropCap.lines) {
        return {
          indent: dropCap.indent,
          shift: slot.shift,
          targetWidth: slot.baseWidth - dropCap.indent,
          dropCap: lineIndex === 0,
          dropCapFontSize: dropCap.fontSize,
          dropCapLinesRemaining: dropCap.lines - lineIndex,
        };
      }

      var shouldIndent = paragraphIndex > 0 && lineIndex === 0 && !(options.prevParagraphLineCount === 1);
      var indent = shouldIndent ? paragraphIndent : 0;
      return {
        indent: indent,
        shift: slot.shift,
        targetWidth: slot.baseWidth - indent,
        dropCap: false,
        dropCapFontSize: 0,
        dropCapLinesRemaining: 0,
      };
    }

    function chooseGreedyCandidate(candidates) {
      if (!candidates || !candidates.length) return null;
      return candidates[candidates.length - 1];
    }

    function solveParagraphWithDP(bundleItem, slots, slotStartIndex, paragraphIndex, options) {
      var prepared = bundleItem.prepared;
      var normalizedStart = normalizePreparedCursor(prepared, { segmentIndex: 0, graphemeIndex: 0 });
      if (!normalizedStart) {
        return { lines: [], cost: 0, greedyCost: 0, usedSlots: 0 };
      }

      var paragraphSlots = [];
      for (var i = slotStartIndex; i < slots.length; i++) {
        var spec = getParagraphSlotSpec(slots[i], paragraphIndex, paragraphSlots.length, options);
        if (spec.targetWidth < 40) break;
        paragraphSlots.push({
          absoluteIndex: i,
          columnIndex: slots[i].columnIndex,
          top: slots[i].top,
          shift: spec.shift,
          indent: spec.indent,
          targetWidth: spec.targetWidth,
          dropCap: spec.dropCap,
          dropCapFontSize: spec.dropCapFontSize,
          dropCapLinesRemaining: spec.dropCapLinesRemaining,
        });
      }

      if (!paragraphSlots.length) {
        return null;
      }

      var memo = {};
      var spaceWidth = options.spaceWidth;

      function solve(slotIndex, cursor, previousHyphen) {
        var normalizedCursor = normalizePreparedCursor(prepared, cursor);
        if (!normalizedCursor) {
          return { cost: 0, lines: [], complete: true };
        }
        if (slotIndex >= paragraphSlots.length) {
          return { cost: 0, lines: [], complete: false };
        }

        var key = slotIndex + '|' + makeCursorKey(normalizedCursor) + '|' + (previousHyphen ? 1 : 0);
        if (memo[key]) return memo[key];

        var slot = paragraphSlots[slotIndex];
        var candidates = collectLineCandidates(prepared, normalizedCursor, slot.targetWidth);
        if (!candidates.length) {
          memo[key] = null;
          return null;
        }

        var best = null;
        for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
          var candidate = candidates[candidateIndex];
          var lineCost = computeLineCost(candidate, slot, {
            spaceWidth: spaceWidth,
            previousHyphen: previousHyphen,
          });
          if (!isFinite(lineCost)) continue;

          var lineData = {
            type: 'line',
            text: candidate.text,
            top: slot.top,
            naturalWidth: candidate.fitWidth,
            targetWidth: slot.targetWidth,
            start: candidate.start,
            end: candidate.end,
            indent: slot.indent,
            shift: slot.shift,
            dropCap: slot.dropCap,
            dropCapFontSize: slot.dropCapFontSize,
            dropCapLinesRemaining: slot.dropCapLinesRemaining,
            isLast: !!candidate.isTerminal,
            endsWithHyphen: candidate.endsWithHyphen,
            layoutFont: options.layoutFont,
            paragraphIndex: paragraphIndex,
          };

          if (candidate.isTerminal) {
            var terminalResult = {
              cost: lineCost,
              lines: [lineData],
              complete: true,
            };
            if (!best || !best.complete || terminalResult.cost < best.cost) {
              best = terminalResult;
            }
            continue;
          }

          var tail = solve(slotIndex + 1, candidate.end, candidate.endsWithHyphen);
          if (!tail) continue;
          var totalCost = lineCost + tail.cost;
          var result = {
            cost: totalCost,
            lines: [lineData].concat(tail.lines),
            complete: !!tail.complete,
          };
          if (!best || (result.complete && !best.complete) || (result.complete === best.complete && totalCost < best.cost)) {
            best = result;
          }
        }

        memo[key] = best;
        return best;
      }

      var optimal = solve(0, normalizedStart, false);
      if (!optimal) return null;

      var greedyLines = [];
      var greedyCursor = normalizedStart;
      var greedyCost = 0;
      var greedyHyphen = false;
      for (var slotIndex = 0; slotIndex < paragraphSlots.length; slotIndex++) {
        var greedySlot = paragraphSlots[slotIndex];
        var greedyCandidates = collectLineCandidates(prepared, greedyCursor, greedySlot.targetWidth);
        if (!greedyCandidates.length) break;
        var greedyCandidate = chooseGreedyCandidate(greedyCandidates);
        var greedyLineCost = computeLineCost(greedyCandidate, greedySlot, {
          spaceWidth: spaceWidth,
          previousHyphen: greedyHyphen,
        });
        greedyCost += isFinite(greedyLineCost) ? greedyLineCost : 0;
        greedyLines.push(greedyCandidate);
        greedyCursor = greedyCandidate.end;
        greedyHyphen = greedyCandidate.endsWithHyphen;
        if (greedyCandidate.isTerminal) break;
      }

      return {
        lines: optimal.lines,
        cost: optimal.cost,
        greedyCost: greedyCost,
        usedSlots: optimal.lines.length,
        greedyUsedSlots: greedyLines.length,
        complete: !!optimal.complete,
      };
    }

    function layoutPreparedParagraphs(bundle, options) {
      var columnCount = options.columnCount;
      var columns = [];
      for (var c = 0; c < columnCount; c++) {
        columns.push([]);
      }

      var columnTopOffsets = (options.columnTopOffsets || []).slice(0, columnCount);
      while (columnTopOffsets.length < columnCount) {
        columnTopOffsets.push(0);
      }
      var slots = buildLayoutSlots({
        columnCount: columnCount,
        columnTopOffsets: columnTopOffsets,
        columnHeight: options.columnHeight,
        lineHeight: options.lineHeight,
        columnWidth: options.columnWidth,
        columnGap: options.columnGap,
        exclusionRects: options.exclusionRects,
        exclusionBreaks: options.exclusionBreaks,
        partialColumnThreshold: options.partialColumnThreshold || (2 / 3),
      });
      var slotIndex = 0;
      var overflowed = false;
      var totalCost = 0;
      var totalGreedyCost = 0;
      var totalHyphenLines = 0;
      var totalLineCount = 0;
      var dropCapMetrics = options.dropCap ? getDropCapMetrics(options.font, options.lineHeight) : null;
      var paragraphIndent = options.paragraphIndent || getParagraphIndent(options.font);
      var spaceWidth = getSpaceWidth(options.font);

      var prevParagraphLineCount = 0;

      for (var p = 0; p < bundle.length; p++) {
        var preparedParagraph = bundle[p];
        if (!preparedParagraph.prepared) {
          if (slotIndex >= slots.length) {
            overflowed = true;
            break;
          }
          var fallbackSlot = slots[slotIndex];
          var fallbackSpec = getParagraphSlotSpec(fallbackSlot, p, 0, {
            dropCapMetrics: dropCapMetrics,
            paragraphIndent: paragraphIndent,
            prevParagraphLineCount: prevParagraphLineCount,
          });
          if (fallbackSpec.targetWidth < 40) {
            overflowed = true;
            break;
          }
          var fallbackFont = preparedParagraph.layoutFont || options.font;
          var fallbackLines = buildFallbackLines(preparedParagraph.text, fallbackSpec.targetWidth, fallbackFont);
          if (!fallbackLines.length) continue;
          for (var fallbackIndex = 0; fallbackIndex < fallbackLines.length && slotIndex < slots.length; fallbackIndex++) {
            var fallbackCurrentSlot = slots[slotIndex];
            var fallbackCurrentSpec = getParagraphSlotSpec(fallbackCurrentSlot, p, fallbackIndex, {
              dropCapMetrics: dropCapMetrics,
              paragraphIndent: paragraphIndent,
              prevParagraphLineCount: prevParagraphLineCount,
            });
            var fallbackLine = fallbackLines[fallbackIndex];
            columns[fallbackCurrentSlot.columnIndex].push({
              type: 'line',
              text: fallbackLine.text,
              top: fallbackCurrentSlot.top,
              naturalWidth: fallbackLine.width,
              targetWidth: fallbackCurrentSpec.targetWidth,
              start: null,
              end: null,
              indent: fallbackCurrentSpec.indent,
              shift: fallbackCurrentSpec.shift,
              dropCap: fallbackCurrentSpec.dropCap,
              dropCapFontSize: fallbackCurrentSpec.dropCapFontSize,
              dropCapLinesRemaining: fallbackCurrentSpec.dropCapLinesRemaining,
              isLast: fallbackIndex === fallbackLines.length - 1,
              endsWithHyphen: false,
              layoutFont: fallbackFont,
              paragraphIndex: p,
            });
            slotIndex += 1;
          }
          prevParagraphLineCount = fallbackLines.length;
          continue;
        }

        var paragraphFont = preparedParagraph.layoutFont || options.font;
        var paragraphResult = solveParagraphWithDP(preparedParagraph, slots, slotIndex, p, {
          font: paragraphFont,
          layoutFont: paragraphFont,
          lineHeight: options.lineHeight,
          dropCapMetrics: dropCapMetrics,
          paragraphIndent: paragraphIndent,
          prevParagraphLineCount: prevParagraphLineCount,
          spaceWidth: preparedParagraph.spaceWidth || spaceWidth,
        });

        if (!paragraphResult || !paragraphResult.lines.length) {
          overflowed = true;
          break;
        }

        for (var lineIndex = 0; lineIndex < paragraphResult.lines.length; lineIndex++) {
          var slot = slots[slotIndex + lineIndex];
          if (!slot) {
            overflowed = true;
            break;
          }
          var lineItem = paragraphResult.lines[lineIndex];
          columns[slot.columnIndex].push(lineItem);
          totalLineCount += 1;
          if (lineItem.endsWithHyphen) totalHyphenLines += 1;
        }

        if (overflowed) break;

        slotIndex += paragraphResult.usedSlots;
        prevParagraphLineCount = paragraphResult.lines.length;
        totalCost += paragraphResult.cost;
        totalGreedyCost += paragraphResult.greedyCost;
        if (!paragraphResult.complete) {
          overflowed = true;
          break;
        }
      }

      if (overflowed) {
        for (var col = columns.length - 1; col >= 0; col--) {
          for (var itemIndex = columns[col].length - 1; itemIndex >= 0; itemIndex--) {
            var item = columns[col][itemIndex];
            if (item.type === 'line') {
              item.text = trimTextToWidth(item.text, item.targetWidth, options.font);
              excerptMeasureCtx.font = item.layoutFont || options.font;
              item.naturalWidth = excerptMeasureCtx.measureText(item.text).width;
              item.isLast = true;
              item.endsWithHyphen = /-$/.test(item.text);
              break;
            }
          }
          if (columns[col].some(function(entry) { return entry.type === 'line'; })) break;
        }
      }

      return {
        columns: columns,
        columnCount: columnCount,
        columnGap: options.columnGap,
        columnTopOffsets: columnTopOffsets,
        metrics: {
          totalCost: totalCost,
          totalGreedyCost: totalGreedyCost,
          totalLineCount: totalLineCount,
          hyphenLines: totalHyphenLines,
        },
      };
    }

    function shouldFallbackToLeftAlign(item, font, naturalWidth) {
      if (!item || item.isLast) return true;
      var spaces = countSpaces(item.text);
      if (!spaces) return true;
      var measuredNaturalWidth = naturalWidth == null ? item.naturalWidth : naturalWidth;
      var extraPerSpace = (item.targetWidth - measuredNaturalWidth) / spaces;
      if (extraPerSpace <= 0) return false;
      var fillRatio = measuredNaturalWidth / Math.max(item.targetWidth, 1);
      var spaceWidth = getSpaceWidth(font);
      var severeExtraSpace = Math.max(spaceWidth * 3.3, 10);
      var shortLineExtraSpace = Math.max(spaceWidth * 2.9, 8.8);

      if (spaces <= 1) {
        return fillRatio < 0.78 && extraPerSpace > shortLineExtraSpace;
      }
      if (spaces <= 3) {
        return (fillRatio < 0.72 && extraPerSpace > severeExtraSpace) || extraPerSpace > (severeExtraSpace + 4.5);
      }
      return fillRatio < 0.64 && extraPerSpace > (severeExtraSpace + 1.4);
    }

    function appendStyledFragment(fragments, text, style) {
      var normalizedText = (text || '').split(SOFT_HYPHEN).join('');
      if (!normalizedText) return;
      var nextStyle = cloneRichStyle(style || {});
      var previous = fragments[fragments.length - 1];
      if (previous && richStyleEquals(previous.style, nextStyle)) {
        previous.text += normalizedText;
      } else {
        fragments.push({ text: normalizedText, style: nextStyle });
      }
    }

    function appendFragmentsForOffsetRange(fragments, richRuns, startOffset, endOffset) {
      if (!richRuns || startOffset >= endOffset) return;
      var cursor = 0;
      for (var i = 0; i < richRuns.length; i++) {
        var run = richRuns[i];
        var runStart = cursor;
        var runEnd = cursor + run.text.length;
        cursor = runEnd;
        if (runEnd <= startOffset) continue;
        if (runStart >= endOffset) break;
        var sliceStart = Math.max(0, startOffset - runStart);
        var sliceEnd = Math.min(run.text.length, endOffset - runStart);
        appendStyledFragment(fragments, run.text.slice(sliceStart, sliceEnd), run.style);
      }
    }

    function trimStyledFragments(fragments) {
      if (!fragments || !fragments.length) return [];
      var nextFragments = fragments.map(function(fragment) {
        return {
          text: fragment.text,
          style: cloneRichStyle(fragment.style),
        };
      }).filter(function(fragment) {
        return !!fragment.text;
      });
      if (!nextFragments.length) return [];

      nextFragments[0].text = nextFragments[0].text.replace(/^ +/, '');
      nextFragments[nextFragments.length - 1].text = nextFragments[nextFragments.length - 1].text.replace(/[ \t]+$/, '');
      nextFragments = nextFragments.filter(function(fragment) {
        return !!fragment.text;
      });
      if (!nextFragments.length) return [];

      var merged = [];
      for (var i = 0; i < nextFragments.length; i++) {
        appendStyledFragment(merged, nextFragments[i].text, nextFragments[i].style);
      }
      return merged;
    }

    function buildPreparedLineFragments(bundleItem, lineItem) {
      if (!bundleItem || !bundleItem.prepared || !bundleItem.richRuns || !lineItem || !lineItem.start || !lineItem.end) {
        return null;
      }

      var prepared = bundleItem.prepared;
      var segmentOffsets = bundleItem.segmentOffsets || getPreparedSegmentOffsets(prepared);
      var start = lineItem.start;
      var end = lineItem.end;
      var fragments = [];

      for (var i = start.segmentIndex; i < end.segmentIndex; i++) {
        var kind = prepared.kinds[i];
        if (kind === 'soft-hyphen' || kind === 'hard-break') continue;
        var segmentStart = segmentOffsets[i];
        if (i === start.segmentIndex && start.graphemeIndex > 0) {
          segmentStart += getPreparedSegmentCodeUnitOffset(prepared, i, start.graphemeIndex);
        }
        var segmentEnd = segmentOffsets[i] + (prepared.segments[i] || '').length;
        appendFragmentsForOffsetRange(fragments, bundleItem.richRuns, segmentStart, segmentEnd);
      }

      if (end.graphemeIndex > 0 && end.segmentIndex < prepared.segments.length) {
        var rangeStart = segmentOffsets[end.segmentIndex];
        if (start.segmentIndex === end.segmentIndex) {
          rangeStart += getPreparedSegmentCodeUnitOffset(prepared, end.segmentIndex, start.graphemeIndex);
        }
        var rangeEnd = segmentOffsets[end.segmentIndex] + getPreparedSegmentCodeUnitOffset(prepared, end.segmentIndex, end.graphemeIndex);
        appendFragmentsForOffsetRange(fragments, bundleItem.richRuns, rangeStart, rangeEnd);
      }

      if (lineItem.endsWithHyphen) {
        appendStyledFragment(fragments, '-', fragments.length ? fragments[fragments.length - 1].style : {});
      }

      return trimStyledFragments(fragments);
    }

    function takeDropCapFromFragments(fragments) {
      if (!fragments || !fragments.length) return null;
      var nextFragments = [];
      var dropCap = null;

      for (var i = 0; i < fragments.length; i++) {
        var fragment = fragments[i];
        if (!fragment.text) continue;
        if (!dropCap) {
          var chars = Array.from(fragment.text);
          dropCap = {
            text: chars[0],
            style: fragment.style,
          };
          var remainder = chars.slice(1).join('');
          if (remainder) {
            nextFragments.push({
              text: remainder,
              style: fragment.style,
            });
          }
        } else {
          nextFragments.push(fragment);
        }
      }

      return dropCap ? { dropCap: dropCap, fragments: nextFragments } : null;
    }

    function getRichFragmentClassName(style) {
      var className = ['frag'];
      if (style && style.bold) className.push('frag--strong');
      if (style && style.italic) className.push('frag--em');
      if (style && style.href) className.push('frag--link');
      if (style && style.code) className.push('frag--code');
      if (style && style.strike) className.push('frag--strike');
      return className.join(' ');
    }

    function getRichFragmentInlineStyle(style) {
      if (!style) return undefined;
      var inlineStyle = {};
      if (style.bold) inlineStyle.fontWeight = 700;
      if (style.italic) inlineStyle.fontStyle = 'italic';
      return Object.keys(inlineStyle).length ? inlineStyle : undefined;
    }

    function measureRichFragmentsWidth(fragments, baseFont) {
      if (!fragments || !fragments.length) return 0;
      var width = 0;
      for (var i = 0; i < fragments.length; i++) {
        var fragment = fragments[i];
        width += measureTextWidth(fragment.text, getStyledFont(baseFont, fragment.style));
      }
      return width;
    }

    function renderRichFragments(fragments, keyPrefix) {
      return fragments.map(function(fragment, index) {
        var className = getRichFragmentClassName(fragment.style);
        var inlineStyle = getRichFragmentInlineStyle(fragment.style);
        if (fragment.style && fragment.style.href) {
          return (
            <a
              key={keyPrefix + '-frag-' + index}
              className={className}
              href={fragment.style.href}
              target="_top"
              rel="noreferrer"
              style={inlineStyle}
            >
              {fragment.text}
            </a>
          );
        }

        return (
          <span key={keyPrefix + '-frag-' + index} className={className} style={inlineStyle}>
            {fragment.text}
          </span>
        );
      });
    }

    function PretextExcerptText(props) {
      var font = props.font || '13px warnock-pro, Georgia, serif';
      var lineHeight = props.lineHeight || 18;
      var paragraphGap = props.paragraphGap || 8;
      var paragraphCount = props.paragraphCount || 1;
      var sourceContent = props.content || props.text;
      var fallbackText = Array.isArray(sourceContent) ? richParagraphsToPlainText(sourceContent) : (props.text || '');
      var preparedBundle = usePreparedParagraphBundle(sourceContent, {
        font: font,
        paragraphCount: paragraphCount,
      });
      var ref = useRef(null);
      var state = useState(null);
      var layout = state[0];
      var setLayout = state[1];
      var signatureRef = useRef('');

      useLayoutEffect(function() {
        if (!ref.current || !preparedBundle) return;
        var node = ref.current;
        var frameId = null;
        var exclusionRefs = props.exclusionRefs || [];
        var mutationObservers = [];

        function performLayout() {
          frameId = null;
          var totalWidth = node.clientWidth;
          var totalHeight = node.clientHeight;
          if (!totalWidth || !totalHeight) return;
          var columnCount = computeColumnCount(totalWidth, props);
          var columnGap = columnCount > 1 ? (props.columnGap || 12) : 0;
          var columnWidth = (totalWidth - columnGap * (columnCount - 1)) / columnCount;
          var exclusionRects = measureExclusionRects(node, exclusionRefs, {
            boxBottomPad: props.toplineClearance || 0,
            textRightPad: props.headerHorizontalClearance || 12,
            textBottomPad: props.headerVerticalClearance || 0,
            textBottomTrim: props.headerBottomTrim || Math.round(lineHeight * 0.35),
            textBottomTrimRatio: props.headerBottomTrimRatio || 0.2,
          });
          var exclusionBreaks = buildExclusionBreaks(exclusionRects, lineHeight);
          var layoutOptions = {
            columnWidth: columnWidth,
            columnGap: columnGap,
            columnHeight: totalHeight,
            lineHeight: lineHeight,
            exclusionRects: exclusionRects,
            exclusionBreaks: exclusionBreaks,
            partialColumnThreshold: props.partialColumnThreshold || (2 / 3),
          };
          var columnTopOffsets = computeColumnTopOffsets(columnCount, layoutOptions);
          var nextLayout = layoutPreparedParagraphs(preparedBundle, {
            columnCount: columnCount,
            columnGap: columnGap,
            columnWidth: columnWidth,
            columnHeight: totalHeight,
            columnTopOffsets: columnTopOffsets,
            exclusionRects: exclusionRects,
            exclusionBreaks: exclusionBreaks,
            partialColumnThreshold: props.partialColumnThreshold || (2 / 3),
            font: font,
            lineHeight: lineHeight,
            paragraphGap: paragraphGap,
            dropCap: !!props.dropCap,
          });
          var nextSignature = makePreparedLayoutSignature(nextLayout);
          if (nextSignature !== signatureRef.current) {
            signatureRef.current = nextSignature;
            setLayout(nextLayout);
          }
        }

        function scheduleLayout() {
          if (frameId !== null) return;
          frameId = requestAnimationFrame(performLayout);
        }

        scheduleLayout();
        var observer = new ResizeObserver(scheduleLayout);
        observer.observe(node);
        exclusionRefs.forEach(function(exclusionRef) {
          if (exclusionRef && exclusionRef.current) {
            observer.observe(exclusionRef.current);
            var mutationObserver = new MutationObserver(scheduleLayout);
            mutationObserver.observe(exclusionRef.current, {
              childList: true,
              subtree: true,
              characterData: true,
            });
            mutationObservers.push(mutationObserver);
          }
        });
        if (document.fonts && document.fonts.addEventListener) {
          document.fonts.addEventListener('loadingdone', scheduleLayout);
        }

        return function() {
          if (frameId !== null) cancelAnimationFrame(frameId);
          observer.disconnect();
          mutationObservers.forEach(function(mutationObserver) {
            mutationObserver.disconnect();
          });
          if (document.fonts && document.fonts.removeEventListener) {
            document.fonts.removeEventListener('loadingdone', scheduleLayout);
          }
        };
      }, [preparedBundle, font, lineHeight, paragraphGap, props.columnGap, props.minColumnWidth, props.maxColumns, props.minColumns, props.multiColumn, props.dropCap, props.exclusionRefs, props.headerClearance, props.partialColumnThreshold, props.layoutDependency]);

      useLayoutEffect(function() {
        if (!ref.current || !layout) return;
        var node = ref.current;
        var frameIds = [];
        var timeoutId = null;

        refineRenderedWordSpacing(node);
        function runRefinePasses(remaining) {
          if (remaining <= 0) return;
          var frameId = requestAnimationFrame(function() {
            refineRenderedWordSpacing(node);
            runRefinePasses(remaining - 1);
          });
          frameIds.push(frameId);
        }
        runRefinePasses(2);
        timeoutId = window.setTimeout(function() {
          refineRenderedWordSpacing(node);
        }, 80);

        return function() {
          frameIds.forEach(function(frameId) {
            cancelAnimationFrame(frameId);
          });
          if (timeoutId !== null) clearTimeout(timeoutId);
        };
      }, [layout]);

      return (
        <div ref={ref} className="fitted-text" style={{ font: font, lineHeight: lineHeight + 'px' }}>
          {!layout ? (
            <div>{clipWords(fallbackText, 40)}</div>
          ) : (
            <div className="fitted-columns" style={{ '--column-gap': layout.columnGap + 'px' }}>
              {layout.columns.map(function(column, columnIndex) {
                var columnTopOffset = ((layout.columnTopOffsets && layout.columnTopOffsets[columnIndex]) || 0);
                var localCursorTop = 0;
                return (
                  <div
                    key={columnIndex}
                    className="fitted-column"
                    style={{ paddingTop: columnTopOffset + 'px' }}
                  >
                    {column.flatMap(function(item, itemIndex) {
                      var renderedItems = [];
                      var itemLocalTop = typeof item.top === 'number'
                        ? Math.max(0, item.top - columnTopOffset)
                        : localCursorTop;
                      if (itemLocalTop > localCursorTop + 0.5) {
                        renderedItems.push(
                          <div
                            key={itemIndex + '-slot-gap'}
                            className="fitted-gap fitted-slot-gap"
                            style={{ height: (itemLocalTop - localCursorTop) + 'px' }}
                          />
                        );
                        localCursorTop = itemLocalTop;
                      }
                      if (item.type === 'gap') {
                        renderedItems.push(<div key={itemIndex} className="fitted-gap" />);
                        return renderedItems;
                      }
                      var spaces = countSpaces(item.text);
                      var richFragments = preparedBundle && preparedBundle[item.paragraphIndex]
                        ? buildPreparedLineFragments(preparedBundle[item.paragraphIndex], item)
                        : null;
                      var dropCapData = item.dropCap
                        ? takeDropCapFromFragments(richFragments || [{ text: item.text, style: cloneRichStyle({}) }])
                        : null;
                      var renderedFragments = richFragments
                        ? (item.dropCap && dropCapData ? dropCapData.fragments : richFragments)
                        : null;
                      var renderedNaturalWidth = renderedFragments && renderedFragments.length
                        ? measureRichFragmentsWidth(renderedFragments, item.layoutFont || font)
                        : item.naturalWidth;
                      var fallbackLeft = shouldFallbackToLeftAlign(item, item.layoutFont || font, renderedNaturalWidth);
                      var wordSpacing = (!item.isLast && spaces > 0)
                        ? (item.targetWidth - renderedNaturalWidth) / spaces
                        : 0;
                      var lineStyle = {
                        wordSpacing: (item.isLast || fallbackLeft) ? undefined : wordSpacing + 'px',
                        paddingLeft: (item.indent || item.shift) ? ((item.indent || 0) + (item.shift || 0)) + 'px' : undefined,
                        position: item.dropCap ? 'relative' : undefined,
                      };
                      renderedItems.push(
                        <div key={itemIndex} className={'fitted-line' + (item.isLast ? ' last' : '') + (fallbackLeft && !item.isLast ? ' fallback-left' : '')} style={lineStyle}>
                          {item.dropCap ? (
                            <span
                              className="dropcap"
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '-0.05em',
                                float: 'none',
                                margin: 0,
                                padding: 0,
                                fontSize: item.dropCapFontSize + 'px',
                                lineHeight: '0.82',
                                fontStyle: dropCapData && dropCapData.dropCap && dropCapData.dropCap.style && dropCapData.dropCap.style.italic ? 'italic' : undefined,
                                fontWeight: dropCapData && dropCapData.dropCap && dropCapData.dropCap.style && dropCapData.dropCap.style.bold ? 700 : undefined,
                              }}
                            >
                              {dropCapData && dropCapData.dropCap ? dropCapData.dropCap.text : item.text[0]}
                            </span>
                          ) : null}
                          {renderedFragments
                            ? renderRichFragments(renderedFragments, columnIndex + '-' + itemIndex)
                            : (item.dropCap ? item.text.slice(1) : item.text)}
                        </div>
                      );
                      localCursorTop += lineHeight;
                      return renderedItems;
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    function PretextDisplayText(props) {
      var font = props.font || '13px warnock-pro, Georgia, serif';
      var lineHeight = props.lineHeight || 18;
      var paragraphGap = props.paragraphGap || 0;
      var paragraphCount = props.paragraphCount || 1;
      var sourceContent = props.content || props.text;
      var fallbackText = Array.isArray(sourceContent) ? richParagraphsToPlainText(sourceContent) : (props.text || '');
      var preparedBundle = usePreparedParagraphBundle(sourceContent, {
        font: font,
        paragraphCount: paragraphCount,
      });
      var ref = useRef(null);
      var state = useState(null);
      var layout = state[0];
      var setLayout = state[1];
      var signatureRef = useRef('');

      useLayoutEffect(function() {
        if (!ref.current || !preparedBundle) return;
        var node = ref.current;
        var frameId = null;

        function performLayout() {
          frameId = null;
          var totalWidth = node.clientWidth;
          if (!totalWidth) return;
          var nextLayout = layoutPreparedParagraphs(preparedBundle, {
            columnCount: 1,
            columnGap: 0,
            columnWidth: totalWidth,
            columnHeight: lineHeight * 32,
            columnTopOffsets: [0],
            exclusionRects: [],
            exclusionBreaks: [],
            partialColumnThreshold: 1,
            font: font,
            lineHeight: lineHeight,
            paragraphGap: paragraphGap,
            dropCap: !!props.dropCap,
          });
          var nextSignature = makePreparedLayoutSignature(nextLayout);
          if (nextSignature !== signatureRef.current) {
            signatureRef.current = nextSignature;
            setLayout(nextLayout);
          }
        }

        function scheduleLayout() {
          if (frameId !== null) return;
          frameId = requestAnimationFrame(performLayout);
        }

        scheduleLayout();
        var observer = new ResizeObserver(scheduleLayout);
        observer.observe(node);
        if (document.fonts && document.fonts.addEventListener) {
          document.fonts.addEventListener('loadingdone', scheduleLayout);
        }

        return function() {
          if (frameId !== null) cancelAnimationFrame(frameId);
          observer.disconnect();
          if (document.fonts && document.fonts.removeEventListener) {
            document.fonts.removeEventListener('loadingdone', scheduleLayout);
          }
        };
      }, [preparedBundle, font, lineHeight, paragraphGap]);

      useLayoutEffect(function() {
        if (!ref.current || !layout || !props.justify) return;
        var node = ref.current;
        var frameIds = [];
        var timeoutId = null;

        refineRenderedWordSpacing(node);
        var frameId = requestAnimationFrame(function() {
          refineRenderedWordSpacing(node);
        });
        frameIds.push(frameId);
        timeoutId = window.setTimeout(function() {
          refineRenderedWordSpacing(node);
        }, 80);

        return function() {
          frameIds.forEach(function(id) {
            cancelAnimationFrame(id);
          });
          if (timeoutId !== null) clearTimeout(timeoutId);
        };
      }, [layout, props.justify]);

      useEffect(function() {
        if (!props.onLayoutSignature) return;
        props.onLayoutSignature(layout ? makePreparedLayoutSignature(layout) : '');
      }, [layout, props.onLayoutSignature]);

      return (
        <div ref={ref} className={props.className || ''} style={{ font: font, lineHeight: lineHeight + 'px' }}>
          {!layout ? (
            <div>{clipWords(fallbackText, 24)}</div>
          ) : (
            (layout.columns[0] || []).map(function(item, itemIndex) {
              if (item.type === 'gap') return <div key={itemIndex} className="fitted-gap" />;
              var spaces = countSpaces(item.text);
              var richFragments = preparedBundle && preparedBundle[item.paragraphIndex]
                ? buildPreparedLineFragments(preparedBundle[item.paragraphIndex], item)
                : null;
              var dropCapData = item.dropCap
                ? takeDropCapFromFragments(richFragments || [{ text: item.text, style: cloneRichStyle({}) }])
                : null;
              var renderedFragments = richFragments
                ? (item.dropCap && dropCapData ? dropCapData.fragments : richFragments)
                : null;
              var fallbackLeft = shouldFallbackToLeftAlign(item, item.layoutFont || font, renderedFragments && renderedFragments.length
                ? measureRichFragmentsWidth(renderedFragments, item.layoutFont || font)
                : item.naturalWidth);
              var renderedNaturalWidth = renderedFragments && renderedFragments.length
                ? measureRichFragmentsWidth(renderedFragments, item.layoutFont || font)
                : item.naturalWidth;
              var shouldJustify = !!props.justify && !item.isLast && spaces > 0 && !fallbackLeft;
              var wordSpacing = shouldJustify
                ? (item.targetWidth - renderedNaturalWidth) / spaces
                : 0;
              return (
                <div
                  key={itemIndex}
                  className={'fitted-line' + (item.isLast ? ' last' : '') + (!shouldJustify ? ' fallback-left' : '')}
                  style={{
                    paddingLeft: (item.indent || item.shift) ? ((item.indent || 0) + (item.shift || 0)) + 'px' : undefined,
                    wordSpacing: shouldJustify ? wordSpacing + 'px' : undefined,
                    position: item.dropCap ? 'relative' : undefined,
                  }}
                >
                  {item.dropCap ? (
                    <span
                      className="dropcap"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '-0.05em',
                        float: 'none',
                        margin: 0,
                        padding: 0,
                        fontSize: item.dropCapFontSize + 'px',
                        lineHeight: '0.82',
                        fontStyle: dropCapData && dropCapData.dropCap && dropCapData.dropCap.style && dropCapData.dropCap.style.italic ? 'italic' : undefined,
                        fontWeight: dropCapData && dropCapData.dropCap && dropCapData.dropCap.style && dropCapData.dropCap.style.bold ? 700 : undefined,
                      }}
                    >
                      {dropCapData && dropCapData.dropCap ? dropCapData.dropCap.text : item.text[0]}
                    </span>
                  ) : null}
                  {renderedFragments
                    ? renderRichFragments(renderedFragments, 'display-' + itemIndex)
                    : (item.dropCap ? item.text.slice(1) : item.text)}
                </div>
              );
            })
          )}
        </div>
      );
    }

    function ArticleCard(props) {
      var variant = props.variant || 'brief';
      var cardClass = variant === 'hero' ? 'card article-card hero-card' : 'card article-card';
      var headlineClass =
        variant === 'hero' ? 'headline headline-hero' :
        variant === 'lead' ? 'headline headline-lead' :
        variant === 'feature' ? 'headline headline-feature' :
        'headline headline-brief';
      var toplineRef = useRef(null);
      var headlineRef = useRef(null);
      var exclusionRefs = useMemo(function() {
        return [
          { ref: toplineRef, mode: 'box' },
          { ref: headlineRef, mode: 'text' },
        ];
      }, []);

      return (
        <article className={cardClass} style={{ gridColumn: 'span ' + props.span }}>
          <div className="card-chrome">
            <div ref={toplineRef} className="card-topline">
              <div className="card-label">{props.label}</div>
              <div className="meta">
                <span>{formatDate(props.post.postedAt)}</span>
                <span>{props.post.baseScore || 0} points</span>
                <span>{props.post.commentCount || 0} comments</span>
              </div>
            </div>
            <h2 ref={headlineRef} className={headlineClass}>
              <a href={postUrl(props.post)} target="_top">{props.post.title}</a>
            </h2>
          </div>
          <div className={'excerpt-shell overlay' + (props.multiColumn ? ' multicolumn' : '')}>
            <PretextExcerptText
              content={props.content}
              text={props.text}
              font={props.font}
              lineHeight={props.lineHeight}
              paragraphGap={props.paragraphGap}
              paragraphCount={props.paragraphCount || props.maxParagraphs || props.minParagraphs || 1}
              multiColumn={props.multiColumn}
              minColumns={props.minColumns}
              maxColumns={props.maxColumns}
              minColumnWidth={props.minColumnWidth}
              columnGap={props.columnGap}
              dropCap={props.dropCap}
              exclusionRefs={exclusionRefs}
              headerClearance={props.headerClearance}
            />
          </div>
        </article>
      );
    }

    function AnnouncementCard(props) {
      var cardRef = useRef(null);
      var toplineRef = useRef(null);
      var headlineRef = useRef(null);
      var dekRef = useRef(null);
      var dekWidthState = useState(null);
      var dekWidth = dekWidthState[0];
      var setDekWidth = dekWidthState[1];
      var bodyColumnWidthState = useState(null);
      var bodyColumnWidth = bodyColumnWidthState[0];
      var setBodyColumnWidth = bodyColumnWidthState[1];
      var headlineWidthState = useState(null);
      var headlineWidth = headlineWidthState[0];
      var setHeadlineWidth = headlineWidthState[1];
      var dekLayoutSignatureState = useState('');
      var dekLayoutSignature = dekLayoutSignatureState[0];
      var setDekLayoutSignature = dekLayoutSignatureState[1];
      var exclusionRefs = useMemo(function() {
        return [
          { ref: toplineRef, mode: 'box' },
          { ref: headlineRef, mode: 'text' },
          { ref: dekRef, mode: 'text', rightPad: 4, bottomPad: 1, bottomTrim: 0, bottomTrimRatio: 0, lastLineMinRight: bodyColumnWidth || 0 },
        ];
      }, [bodyColumnWidth]);

      useLayoutEffect(function() {
        if (!cardRef.current) return;
        var node = cardRef.current;
        var frameId = null;

        function resolveColumnWidth(totalWidth) {
          var columnCount = computeColumnCount(totalWidth, {
            multiColumn: true,
            minColumns: 2,
            maxColumns: 3,
            minColumnWidth: 180,
            columnGap: 14,
          });
          var columnGap = columnCount > 1 ? 14 : 0;
          var columnWidth = (totalWidth - columnGap * (columnCount - 1)) / columnCount;
          return {
            columnCount: columnCount,
            columnGap: columnGap,
            columnWidth: columnWidth,
          };
        }

        function measureDekWidth() {
          frameId = null;
          var totalWidth = node.clientWidth;
          if (!totalWidth) return;
          var columnSpec = resolveColumnWidth(totalWidth);
          var columnCount = columnSpec.columnCount;
          var columnGap = columnSpec.columnGap;
          var columnWidth = columnSpec.columnWidth;
          var dekSpan = Math.min(columnCount, 1.19);
          var dekEffectiveWidth = columnWidth * dekSpan;
          setBodyColumnWidth(columnWidth);
          setDekWidth(Math.min(totalWidth, dekEffectiveWidth));
          setHeadlineWidth(Math.min(totalWidth, columnWidth * Math.min(2, columnCount) + columnGap * Math.max(0, Math.min(2, columnCount) - 1)));
        }

        function scheduleMeasure() {
          if (frameId !== null) return;
          frameId = requestAnimationFrame(measureDekWidth);
        }

        scheduleMeasure();
        var observer = new ResizeObserver(scheduleMeasure);
        observer.observe(node);

        return function() {
          if (frameId !== null) cancelAnimationFrame(frameId);
          observer.disconnect();
        };
      }, []);

      return (
        <article ref={cardRef} className="card announcement-card" style={{ gridColumn: 'span ' + props.span }}>
          <div className="card-chrome announcement-chrome">
            <div ref={toplineRef} className="card-topline">
              <div className="card-label">The People of LessWrong</div>
              <div className="meta">
                <span>Apr 1</span>
                <span>200 points</span>
                <span>120 comments</span>
              </div>
            </div>
            <h1 ref={headlineRef} className="announcement-headline" style={headlineWidth ? { maxWidth: headlineWidth + 'px' } : undefined}>{props.title}</h1>
            <div ref={dekRef} className="announcement-dek" style={dekWidth ? { width: dekWidth + 'px', maxWidth: '100%' } : undefined}>
              <PretextDisplayText
                text={capitalizeWordsPreservingRest(props.subtitle)}
                font='700 15px "gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif'
                lineHeight={18}
                paragraphCount={1}
                justify={false}
                onLayoutSignature={setDekLayoutSignature}
              />
            </div>
          </div>
          <div className="excerpt-shell announcement-body overlay multicolumn">
            <PretextExcerptText
              content={props.content}
              text={props.text}
              font='12px warnock-pro, Georgia, serif'
              lineHeight={18}
              paragraphGap={7}
              paragraphCount={24}
              multiColumn={true}
              minColumns={2}
              maxColumns={3}
              minColumnWidth={180}
              columnGap={14}
              exclusionRefs={exclusionRefs}
              toplineClearance={2}
              headerHorizontalClearance={14}
              headerVerticalClearance={2}
              partialColumnThreshold={0.6}
              dropCap={true}
              layoutDependency={dekLayoutSignature}
            />
          </div>
        </article>
      );
    }

    function DispatchCard(props) {
      return (
        <article className="card dispatch-card">
          <div className="card-topline">
            <div className="card-label"><span className="quicktake-icon" dangerouslySetInnerHTML={{ __html: '<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z"/></svg>' }} /> {props.label}</div>
            <div className="meta">
              <span>{props.meta}</span>
              {props.score != null ? <span>{props.score} points</span> : null}
            </div>
          </div>
          <div className="excerpt-shell">
            <a href={props.href} target="_top" style={{ color: 'inherit', textDecoration: 'none' }}>
              <PretextExcerptText
                text={props.text}
                font='12px warnock-pro, Georgia, serif'
                lineHeight={17}
                paragraphGap={6}
                paragraphCount={4}
              />
            </a>
          </div>
        </article>
      );
    }

    function SiteHeader() {
      var userState = useState(null);
      var userData = userState[0];
      var setUserData = userState[1];

      var notifState = useState(null);
      var notifData = notifState[0];
      var setNotifData = notifState[1];

      var karmaState = useState(null);
      var karmaData = karmaState[0];
      var setKarmaData = karmaState[1];

      useEffect(function() {
        rpc.getCurrentUser().then(function(result) {
          setUserData(result);
          if (result && result.loggedIn) {
            rpc.getNotificationCounts().then(setNotifData).catch(function() {});
            rpc.getKarmaNotifications().then(setKarmaData).catch(function() {});
          }
        }).catch(function() {});
      }, []);

      var today = new Date();
      var dateStr = today.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      var isLoggedIn = userData && userData.loggedIn;
      var user = isLoggedIn ? userData.user : null;
      var unreadCount = notifData ? (notifData.unreadNotifications || 0) : 0;
      var hasNewKarma = karmaData && karmaData.hasNewKarmaChanges;

      var searchSvg = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7.5" cy="7.5" r="5"/><line x1="11" y1="11" x2="16" y2="16"/></svg>';
      var bellSvg = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a.5.5 0 0 1 .5.5v.6A4 4 0 0 1 12 7v3l1.15 1.53a.5.5 0 0 1-.4.8H3.25a.5.5 0 0 1-.4-.8L4 10V7a4 4 0 0 1 3.5-3.97V2a.5.5 0 0 1 .5-.5zM6.5 13a1.5 1.5 0 0 0 3 0h-3z"/></svg>';

      return (
        <nav className="masthead">
          <div className="masthead-left">
            <span className="masthead-site-title">
              <a href="/" target="_top">LESSWRONG</a>
            </span>
            <span className="masthead-date">{dateStr}</span>
          </div>
          <div className="masthead-right">
            <a href="/search" target="_top" title="Search">
              <span className="masthead-search-icon" dangerouslySetInnerHTML={{ __html: searchSvg }} />
              Search
            </a>
            {isLoggedIn ? (
              <>
                {hasNewKarma ? (
                  <a href="/notifications" target="_top" className="masthead-karma">★ Karma</a>
                ) : null}
                <a href="/notifications" target="_top" className={'masthead-bell' + (unreadCount > 0 ? ' masthead-bell-active' : '')}>
                  <span className="masthead-bell-icon" dangerouslySetInnerHTML={{ __html: bellSvg }} />
                  {unreadCount > 0 ? (
                    <span className="masthead-bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  ) : null}
                </a>
                <span className="masthead-user">
                  <a href={'/users/' + (user && user.slug)} target="_top">{user && user.displayName}</a>
                </span>
              </>
            ) : (
              <a href="/auth/login" target="_top">Sign In</a>
            )}
          </div>
        </nav>
      );
    }

    function App() {
      var cols = useColumns();
      var state = useState({ loading: true, error: null, posts: [], curated: [], quicktakes: [] });
      var data = state[0];
      var setData = state[1];

      useEffect(function() {
        Promise.all([
          gqlQuery(POSTS_QUERY, { limit: 18 }),
          gqlQuery(CURATED_QUERY).catch(function() { return null; }),
          gqlQuery(QUICKTAKES_QUERY, { limit: 6 }).catch(function() { return null; }),
        ]).then(function(results) {
          var posts = (results[0] && results[0].posts && results[0].posts.results) || [];
          var curated = (results[1] && results[1].CuratedAndPopularThisWeek && results[1].CuratedAndPopularThisWeek.results) || [];
          var quicktakes = (results[2] && results[2].comments && results[2].comments.results) || [];
          var merged = curated.concat(posts.filter(function(post) {
            return !curated.some(function(featured) { return featured._id === post._id; });
          }));
          setData({ loading: false, error: null, posts: merged, curated: curated, quicktakes: quicktakes });
        }).catch(function(error) {
          setData({ loading: false, error: error.message, posts: [], curated: [], quicktakes: [] });
        });
      }, []);

      if (data.loading) {
        return (
          <div className="page">
            <div className="sheet">
              <div className="loading">Setting the type…</div>
            </div>
          </div>
        );
      }

      if (data.error) {
        return (
          <div className="page">
            <div className="sheet">
              <div className="error">Error: {data.error}</div>
            </div>
          </div>
        );
      }

      var posts = data.posts.filter(function(post) {
        return fullPostText(post).length > 80;
      });
      var hero = posts[0];
      var leadPosts = posts.slice(1, cols >= 8 ? 4 : 3);
      if (leadPosts.length < 2) leadPosts = posts.slice(0, 2);
      var heroRailPosts = posts.slice(leadPosts.length + 1, leadPosts.length + 3);
      var featurePosts = posts.slice(leadPosts.length + 3, leadPosts.length + 6);

      function fillSpans(itemCount, totalCols) {
        var spans = [];
        var used = 0;
        for (var i = 0; i < itemCount; i++) {
          var remainingItems = itemCount - i;
          var remainingCols = totalCols - used;
          var span = Math.floor(remainingCols / remainingItems);
          if (i === 0 && itemCount >= 3 && totalCols >= 8) {
            span = Math.max(span, Math.ceil(totalCols * 0.4));
          }
          if (i === itemCount - 1) span = remainingCols;
          spans.push(span);
          used += span;
        }
        return spans;
      }

      var leadSpans = fillSpans(leadPosts.length, cols);
      var heroSpan = Math.max(1, cols - Math.max(1, Math.ceil(cols * 0.32)));
      var railSpan = cols - heroSpan;
      var featureSpans = fillSpans(featurePosts.length, cols);
      var quicktakes = data.quicktakes.slice(0, Math.max(2, Math.min(4, cols)));
      var pageStyle = { '--cols': cols };
      var announcementContent = parseRichParagraphs(ANNOUNCEMENT_BODY_HTML);
      var announcementText = richParagraphsToPlainText(announcementContent);

      return (
        <div className="page">
          <div className="sheet" style={pageStyle}>
            <SiteHeader />
            <section className="grid-row lead-row">
              {leadPosts.map(function(post, index) {
                var text = fullPostText(post);
                return (
                  <ArticleCard
                    key={post._id}
                    post={post}
                    span={leadSpans[index]}
                    variant="lead"
                    label={formatByline(post)}
                    content={fullPostContent(post)}
                    text={text}
                    font='12px warnock-pro, Georgia, serif'
                    lineHeight={18}
                    paragraphGap={7}
                    minParagraphs={1}
                    maxParagraphs={3}
                    minSentences={2}
                    multiColumn={leadSpans[index] >= Math.max(3, Math.floor(cols / 3))}
                    minColumns={2}
                    maxColumns={2}
                    minColumnWidth={180}
                    columnGap={12}
                    dropCap={index === 0 && cols >= 8}
                  />
                );
              })}
            </section>

            <section className="grid-row hero-row">
              <AnnouncementCard
                span={heroSpan}
                title="Freedom comes to LessWrong"
                subtitle="After years of ruling with an iron fist the site admins have finally returned control of the UI back to the people"
                content={announcementContent}
                text={announcementText}
              />

              <div style={{ gridColumn: 'span ' + railSpan, minWidth: 0 }}>
                <div className="rail">
                  {heroRailPosts.map(function(post, index) {
                    return (
                      <ArticleCard
                        key={post._id}
                        post={post}
                        span={railSpan}
                        variant="feature"
                        label={formatByline(post)}
                        content={fullPostContent(post)}
                        text={fullPostText(post)}
                        font='11.5px warnock-pro, Georgia, serif'
                        lineHeight={17}
                        paragraphGap={7}
                        minParagraphs={1}
                        maxParagraphs={2}
                        minSentences={2}
                        multiColumn={railSpan >= 3}
                        minColumns={2}
                        maxColumns={2}
                        minColumnWidth={170}
                        columnGap={12}
                      />
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="grid-row brief-row">
              {featurePosts.map(function(post, index) {
                return (
                  <ArticleCard
                    key={post._id}
                    post={post}
                    span={featureSpans[index]}
                    variant="feature"
                    label={formatByline(post)}
                    content={fullPostContent(post)}
                    text={fullPostText(post)}
                    font='12.5px warnock-pro, Georgia, serif'
                    lineHeight={18}
                    paragraphGap={7}
                    minParagraphs={1}
                    maxParagraphs={3}
                    minSentences={2}
                    multiColumn={featureSpans[index] >= Math.max(3, Math.floor(cols / 3))}
                    minColumns={2}
                    maxColumns={2}
                    minColumnWidth={175}
                    columnGap={12}
                  />
                );
              })}
            </section>

            <section className="grid-row dispatch-row">
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="dispatch-grid">
                  {quicktakes.map(function(item, index) {
                    var quickText = stripHtml(item.contents && item.contents.html);
                    var href = '/posts/' + (item.postId || '') + '/' + (((item.post && item.post.slug) || '')) + '#' + item._id;
                    return (
                      <DispatchCard
                        key={item._id}
                        label={((item.user && item.user.displayName) || 'Anonymous')}
                        href={href}
                        meta={formatDate(item.postedAt)}
                        score={item.baseScore}
                        text={quickText}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>`;
}

export function getSandboxedHomePageSrcdoc(options: SrcdocWrapperOptions): string {
  return wrapBodyInSrcdoc(getDefaultHomePageBody(), options);
}
