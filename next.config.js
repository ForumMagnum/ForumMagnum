const path = require('path');
const fs = require('fs');

const serverExternalPackages = [
  'superagent-proxy', 'gpt-3-encoder', 'mathjax-node', 'mathjax', 'turndown', 'cloudinary',
  '@aws-sdk/client-cloudfront', 'auth0', 'jimp', 'juice', '@sentry/nextjs',
  'request', 'stripe', 'openai', 'twitter-api-v2', 'draft-js', 'draft-convert', 'csso',
  'js-tiktoken', 'cheerio', '@elastic/elasticsearch', '@googlemaps/google-maps-services-js',
  'intercom-client',
  // Needs to be external for email-rendering to be able to use prerenderToNodeStream,
  // because nextjs bundles a version of react-dom which omits react-dom/static (and
  // doesn't provide anything in its place that would work for server-component email
  // rendering). This has a somewhat high risk of causing problems related to there
  // being multiple different versions of React present.
  'react-dom/static',
];

const webpackExternalPackages = [
  '@extractus/article-extractor', 'linkedom', 'canvas', 'mz',
  'pg', 'pg-promise', 'pg-cloudflare'
];

// Helper function to read and parse tsconfig
function loadTsConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    // Remove comments and parse
    const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Failed to load ${configPath}:`, error);
    return null;
  }
}

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,

  compiler: {
    define: {
      ...(process.env.E2E === 'true' ? { 'process.env.E2E': 'true' } : {}),
      'process.env.FORUM_TYPE': process.env.FORUM_TYPE ?? 'LessWrong',
    },
  },
  productionBrowserSourceMaps: true,
  typedRoutes: true,
  experimental: {
    serverSourceMaps: true,
  },

  outputFileTracingIncludes: {
    '/graphql': ['./node_modules/mathjax/unpacked/*.js', './node_modules/mathjax/unpacked/**/*.js']
  },
  
  turbopack: {
    resolveAlias: {
      // Replicate the path mappings from tsconfig-client.json
      '@/server/*': { browser: './packages/lesswrong/stubs/server/*' },
      '@/viteClient/*': { browser: './packages/lesswrong/stubs/viteClient/*' },
      '@/client/*': { browser: './packages/lesswrong/client/*', default: './packages/lesswrong/stubs/client/*' },
      '@/allComponents': './packages/lesswrong/lib/generated/allComponents.ts',
      ...(process.env.NODE_ENV === 'production' ? {} : { '@/lib/sentryWrapper': './packages/lesswrong/stubs/noSentry.ts' }),
      '@/*': './packages/lesswrong/*',

      'superagent-proxy': './packages/lesswrong/stubs/emptyModule.js',
    },
  },
  serverExternalPackages,

  headers: async () => {
    return [{
      source: '/(.*?)',
      headers: [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      }]
    }]
  },

  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      config.devtool = 'source-map';
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        canvas: false,
        child_process: false,
        dns: false,
        readline: false,
        stream: false,
        util: false,
        zlib: false,
        http: false,
        https: false,
        url: false,
        buffer: false,
        process: false,
        net: false,
        tls: false,
        cluster: false,
        events: false,
        perf_hooks: false,
        querystring: false,
        string_decoder: false,
        timers: false,
        tty: false,
        vm: false,
        worker_threads: false,
      };
    }

    config.externals = [
      ...config.externals,
      ...[
        ...serverExternalPackages,
        ...webpackExternalPackages
      // For each external package, add both the package name and
      // "commonjs packagename" to the list of external packages. With webpack,
      // these are different, and if you guess wrong which of these to use then
      // the externalization will have no effect, but externalizing with both
      // variants is safe.
      // We need to prevent sentry externalization because the Webpack build breaks
      // in mysterious ways otherwise, and we really only use webpack for deployments
      // so it doesn't matter as much.
      ].filter(pkg => pkg !== '@sentry/nextjs').flatMap(pkg => [pkg, `commonjs ${pkg}`])
    ];

    // What follows is the result of absolutely deranged behavior by NextJS.
    // It turns out that NextJS will, by default, force webpack to use the paths specified in tsconfig.json.
    // Then it will somehow cause it to ignore any aliases specified via config.resolve.alias.
    // It also causes it to ignore the use of tsconfig-paths-webpack-plugin.
    // And of course we can't dynamically specify a tsconfig file to use based on the build type,
    // because that needs to be specified as a constant in the `typescript` block.
    // So instead we load the appropriate tsconfig ourselves and hack together some aliasing logic.
    // (~all of this code was writting by Claude Opus 4; the comment I wrote myself.)

    const tsconfigPath = isServer 
      ? path.resolve(__dirname, 'tsconfig-server.json')
      : path.resolve(__dirname, 'tsconfig-client.json');
    
    const tsconfig = loadTsConfig(tsconfigPath);
    
    if (!tsconfig || !tsconfig.compilerOptions || !tsconfig.compilerOptions.paths) {
      console.warn(`No path mappings found in ${tsconfigPath}`);
      return config;
    }

    const pathMappings = tsconfig.compilerOptions.paths;
    const baseUrl = __dirname;

    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push({
      apply(resolver) {
        resolver.hooks.resolve.tap('TsConfigPathsPlugin', (request, resolveContext) => {
          if (!request.request) return;
          
          // Check each path mapping
          for (const [pattern, targets] of Object.entries(pathMappings)) {
            const target = targets[0]; // Use first target
            
            if (pattern.endsWith('/*') && target.endsWith('/*')) {
              // Handle wildcard patterns
              const prefix = pattern.slice(0, -2);
              if (request.request.startsWith(prefix + '/')) {
                const restOfPath = request.request.slice(prefix.length + 1);
                const targetBase = target.slice(0, -2);
                const newPath = path.resolve(baseUrl, targetBase, restOfPath);
                
                // Update the request
                request.request = newPath;
                break;
              }
            } else {
              // Handle exact matches
              if (request.request === pattern) {
                const newPath = path.resolve(baseUrl, target);
                request.request = newPath;
                break;
              }
            }
          }
        });
      }
    });

    // Given the above comment I'm not sure this even does anything, but it hasn't caused any problems
    // and it's necessary when using turbopack, so I'm leaving it in.
    config.resolve.alias = {
      ...config.resolve.alias,
      'superagent-proxy': path.resolve(__dirname, 'packages/lesswrong/stubs/emptyModule.js'),
    };

    return config;
  },
  // rewrites: async () => {
  //   return {
  //     beforeFiles: [{
  //       source: '/',
  //       destination: 'https://d1vz3tbkledbrz.cloudfront.net/',
  //     }, {
  //       source: '/:path*',
  //       destination: 'https://d1vz3tbkledbrz.cloudfront.net/:path*',
  //     }]
  //   }
  // },
  redirects() {
    return [{
      source: '/tag/:slug*',
      destination: '/w/:slug*',
      permanent: true,
    }, {
      source: '/p/:slug*',
      destination: '/w/:slug*',
      permanent: true,
    }, {
      source: '/compare/tag/:slug*',
      destination: '/compare/w/:slug*',
      permanent: true,
    }, {
      source: '/revisions/tag/:slug*',
      destination: '/revisions/w/:slug*',
      permanent: true,
    }, {
      source: '/users/:slug/reviews',
      destination: '/users/:slug/reviews/2019',
      permanent: true,
    }, {
      source: '/votesByYear/:year',
      destination: '/nominatePosts/:year',
      permanent: true,
    }, {
      source: "/2018/sketch",
      destination: "/posts/yeADMcScw8EW9yxpH/a-sketch-of-good-communication",
      permanent: true
    }, {
      source: "/2018/babble",
      destination: "/posts/i42Dfoh4HtsCAfXxL/babble",
      permanent: true
    }, {
      source: "/2018/babble2",
      destination: "/posts/wQACBmK5bioNCgDoG/more-babble",
      permanent: true
    }, {
      source: "/2018/prune",
      destination: "/posts/rYJKvagRYeDM8E9Rf/prune",
      permanent: true
    }, {
      source: "/2018/validity",
      destination: "/posts/WQFioaudEH8R7fyhm/local-validity-as-a-key-to-sanity-and-civilization",
      permanent: true
    }, {
      source: "/2018/alarm",
      destination: "/posts/B2CfMNfay2P8f2yyc/the-loudest-alarm-is-probably-false",
      permanent: true
    }, {
      source: "/2018/argument",
      destination: "/posts/NLBbCQeNLFvBJJkrt/varieties-of-argumentative-experience",
      permanent: true
    }, {
      source: "/2018/toolbox",
      destination: "/posts/CPP2uLcaywEokFKQG/toolbox-thinking-and-law-thinking",
      permanent: true
    }, {
      source: "/2018/technical",
      destination: "/posts/tKwJQbo6SfWF2ifKh/toward-a-new-technical-explanation-of-technical-explanation",
      permanent: true
    }, {
      source: "/2018/nameless",
      destination: "/posts/4ZwGqkMTyAvANYEDw/naming-the-nameless",
      permanent: true
    }, {
      source: "/2018/lotus",
      destination: "/posts/KwdcMts8P8hacqwrX/noticing-the-taste-of-lotus",
      permanent: true
    }, {
      source: "/2018/tails",
      destination: "/posts/asmZvCPHcB4SkSCMW/the-tails-coming-apart-as-metaphor-for-life",
      permanent: true
    }, {
      source: "/2018/honesty",
      destination: "/posts/xdwbX9pFEr7Pomaxv/meta-honesty-firming-up-honesty-around-its-edge-cases",
      permanent: true
    }, {
      source: "/2018/meditation",
      destination: "/posts/mELQFMi9egPn5EAjK/my-attempt-to-explain-looking-insight-meditation-and",
      permanent: true
    }, {
      source: "/2018/robust",
      destination: "/posts/2jfiMgKkh7qw9z8Do/being-a-robust-agent",
      permanent: true
    }, {
      source: "/2018/punish",
      destination: "/posts/X5RyaEDHNq5qutSHK/anti-social-punishment",
      permanent: true
    }, {
      source: "/2018/common",
      destination: "/posts/9QxnfMYccz9QRgZ5z/the-costly-coordination-mechanism-of-common-knowledge",
      permanent: true
    }, {
      source: "/2018/metacognition",
      destination: "/posts/K4eDzqS2rbcBDsCLZ/unrolling-social-metacognition-three-levels-of-meta-are-not",
      permanent: true
    }, {
      source: "/2018/web",
      destination: "/posts/AqbWna2S85pFTsHH4/the-intelligent-social-web",
      permanent: true
    }, {
      source: "/2018/market",
      destination: "/posts/a4jRN9nbD79PAhWTB/prediction-markets-when-do-they-work",
      permanent: true
    }, {
      source: "/2018/spaghetti",
      destination: "/posts/NQgWL7tvAPgN2LTLn/spaghetti-towers",
      permanent: true
    }, {
      source: "/2018/knowledge",
      destination: "/posts/nnNdz7XQrd5bWTgoP/on-the-loss-and-preservation-of-knowledge",
      permanent: true
    }, {
      source: "/2018/voting",
      destination: "/posts/D6trAzh6DApKPhbv4/a-voting-theory-primer-for-rationalists",
      permanent: true
    }, {
      source: "/2018/pavlov",
      destination: "/posts/3rxMBRCYEmHCNDLhu/the-pavlov-strategy",
      permanent: true
    }, {
      source: "/2018/commons",
      destination: "/posts/2G8j8D5auZKKAjSfY/inadequate-equilibria-vs-governance-of-the-commons",
      permanent: true
    }, {
      source: "/2018/science",
      destination: "/posts/v7c47vjta3mavY3QC/is-science-slowing-down",
      permanent: true
    }, {
      source: "/2018/rescue",
      destination: "/posts/BhXA6pvAbsFz3gvn4/research-rescuers-during-the-holocaust",
      permanent: true
    }, {
      source: "/2018/troll",
      destination: "/posts/CvKnhXTu9BPcdKE4W/an-untrollable-mathematician-illustrated",
      permanent: true
    }, {
      source: "/2018/long1",
      destination: "/posts/mFqG58s4NE3EE68Lq/why-did-everything-take-so-long",
      permanent: true
    }, {
      source: "/2018/long2",
      destination: "/posts/yxTP9FckrwoMjxPc4/why-everything-might-have-taken-so-long",
      permanent: true
    }, {
      source: "/2018/clickbait",
      destination: "/posts/YicoiQurNBxSp7a65/is-clickbait-destroying-our-general-intelligence",
      permanent: true
    }, {
      source: "/2018/active",
      destination: "/posts/XYYyzgyuRH5rFN64K/what-makes-people-intellectually-active",
      permanent: true
    }, {
      source: "/2018/daemon",
      destination: "/posts/nyCHnY7T5PHPLjxmN/open-question-are-minimal-circuits-daemon-free",
      permanent: true
    }, {
      source: "/2018/astro",
      destination: "/posts/Qz6w4GYZpgeDp6ATB/beyond-astronomical-waste",
      permanent: true
    }, {
      source: "/2018/birthorder1",
      destination: "/posts/tj8QP2EFdP8p54z6i/historical-mathematicians-exhibit-a-birth-order-effect-too",
      permanent: true
    }, {
      source: "/2018/birthorder2",
      destination: "/posts/QTLTic5nZ2DaBtoCv/birth-order-effect-found-in-nobel-laureates-in-physics",
      permanent: true
    }, {
      source: "/2018/gaming",
      destination: "/posts/AanbbjYr5zckMKde7/specification-gaming-examples-in-ai-1",
      permanent: true
    }, {
      source: "/2018/takeoff",
      destination: "/posts/AfGmsjGPXN97kNp57/arguments-about-fast-takeoff",
      permanent: true
    }, {
      source: "/2018/rocket",
      destination: "/posts/Gg9a4y8reWKtLe3Tn/the-rocket-alignment-problem",
      permanent: true
    }, {
      source: "/2018/agency",
      destination: "/posts/p7x32SEt43ZMC9r7r/embedded-agents",
      permanent: true
    }, {
      source: "/2018/faq",
      destination: "/posts/Djs38EWYZG8o7JMWY/paul-s-research-agenda-faq",
      permanent: true
    }, {
      source: "/2018/challenges",
      destination: "/posts/S7csET9CgBtpi7sCh/challenges-to-christiano-s-capability-amplification-proposal",
      permanent: true
    }, {
      source: "/2018/response",
      destination: "/posts/Djs38EWYZG8o7JMWY/paul-s-research-agenda-faq?commentId=79jM2ecef73zupPR4",
      permanent: true
    }, {
      source: "/2018/scale",
      destination: "/posts/bBdfbWfWxHN9Chjcq/robustness-to-scale",
      permanent: true
    }, {
      source: "/2018/coherence",
      destination: "/posts/NxF5G6CJiof6cemTw/coherence-arguments-do-not-imply-goal-directed-behavior",
      permanent: true
    }, {
      source: "/reviewVoting",
      destination: "/reviewVoting/2023",
      permanent: true
    }, {
      source: "/reviewQuickPage",
      destination: "/quickReview/2023",
      permanent: true
    }, {
      source: "/quickReview",
      destination: "/quickReview/2023",
      permanent: true
    }, {
      source: "/tagVoting",
      destination: "/tagActivity",
      permanent: true
    }, {
      source: "/nominatePosts",
      destination: "/nominatePosts/2023",
      permanent: true
    }, {
      source: "/tag/create",
      destination: "/w/create",
      permanent: true
    }, {
      source: "/tags/random",
      destination: "/wikitags/random",
      permanent: true
    }, {
      source: "/tagActivity",
      destination: "/wActivity",
      permanent: true
    }, {
      source: "/tagFeed",
      destination: "/wFeed",
      permanent: true
    }, {
      source: "/tags/dashboard",
      destination: "/w/dashboard",
      permanent: true
    }, {
      source: "/wiki",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/tags",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/tags/all",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/topics",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/topics/all",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/concepts",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/concepts/all",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/wikitags",
      destination: "/wikitags/all",
      permanent: true
    }, {
      source: "/meta",
      destination: "/tag/site-meta",
      permanent: true
    }, {
      source: "/bestoflesswrongadmin",
      destination: "/bestoflesswrongadmin/2025",
      permanent: true
    }, {
      source: "/leastwrong",
      destination: "/bestoflesswrong",
      permanent: true
    }, {
      source: "/curated",
      destination: "/recommendations",
      permanent: true
    }, {
      source: "/payments",
      destination: "/payments/admin",
      permanent: true
    }, {
      source: "/nominations2018",
      destination: "/nominations/2018",
      permanent: true
    }, {
      source: "/nominations2019",
      destination: "/nominations/2019",
      permanent: true
    }, {
      source: "/reviews2018",
      destination: "/reviews/2018",
      permanent: true
    }, {
      source: "/reviews2019",
      destination: "/reviews/2019",
      permanent: true
    }, {
      source: "/editor",
      destination: "/tag/guide-to-the-lesswrong-editor",
      permanent: true
    }, {
      source: "/shortform",
      destination: "/quicktakes",
      permanent: true
    }, {
      source: "/nominations",
      destination: "/reviewVoting/2023",
      permanent: true
    }, {
      source: "/reviews",
      destination: "/reviews/2023",
      permanent: true
    }, {
      source: "/reviewAdmin",
      destination: "/reviewAdmin/2023",
      permanent: true
    }, {
      source: "/user/:slug/overview",
      destination: "/users/:slug",
      permanent: true
    }, {
      source: "/posts/:id/:slug/:commentId",
      destination: "/posts/:id/:slug?commentId=:commentId",
      permanent: true
    }, {
      // I didn't want to figure out how to use a regex to say
      // "at least one of these two path parameters", so just
      // spell out all 3 combinations manually.
      source: "/:section(r)/:subreddit(all|discussion|lesswrong)?/lw/:id*",
      destination: "/lw/:id*",
      permanent: false,
    }, {
      source: "/:section(r)?/:subreddit(all|discussion|lesswrong)/lw/:id*",
      destination: "/lw/:id*",
      permanent: false,
    }, {
      source: "/r/:subreddit(all|discussion|lesswrong)/lw/:id*",
      destination: "/lw/:id*",
      permanent: false,
    }, {
      source: "/static/imported/:year/:month/:day/:imageName",
      destination: "https://raw.githubusercontent.com/tricycle/lesswrong/master/r2/r2/public/static/imported/:year/:month/:day/:imageName",
      permanent: true
    }, {
      source: "/.rss",
      destination: "/feed.xml",
      permanent: true
    }, {
      source: "/comments/.rss",
      destination: "/feed.xml?type=comments",
      permanent: true
    }, {
      source: "/rss/comments.xml",
      destination: "/feed.xml?type=comments",
      permanent: true
    }, {
      source: "/daily",
      destination: "/allPosts",
      permanent: true
    }, {
      source: "/:section?/:subreddit?/:new?/.rss",
      destination: "/feed.xml",
      permanent: true
    }, {
      source: "/promoted",
      destination: "/allPosts?filter=curated&sortedBy=new&timeframe=allTime",
      permanent: true
    }, {
      source: "/promoted/.rss",
      destination: "/feed.xml?view=curatedRss",
      permanent: true
    }, {
      source: "/favicon.ico",
      destination: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico",
      permanent: true
    }, {
      source: "/featured",
      destination: "/allPosts?filter=curated&view=new&timeframe=allTime",
      permanent: true
    }, {
      source: "/recentComments",
      destination: "/allComments",
      permanent: true
    },
    // TODO: all the redirects from here until "saved" need to be gated to AF somehow.
    {
      source: "/newcomments",
      destination: "/allComments",
      permanent: true
    }, {
      source: "/how-to-contribute",
      destination: "/posts/FoiiRDC3EhjHx7ayY/introducing-the-ai-alignment-forum-faq",
      permanent: true
    }, {
      source: "/submitted",
      has: [{
        type: "query",
        key: "id",
      }],
      destination: "/users/:id",
      permanent: true
    }, {
      source: "/threads",
      has: [{
        type: "query",
        key: "id",
      }],
      destination: "/users/:id",
      permanent: true
    }, {
      source: "/user",
      has: [{
        type: "query",
        key: "id",
      }],
      destination: "/users/:id",
      permanent: true
    }, {
      source: "/submit",
      destination: "/newPost",
      permanent: true
    }, {
      source: "/rss",
      destination: "/feed.xml",
      permanent: true
    }, {
      source: "/saved",
      destination: "/account",
      permanent: true
    }];
  },
  // TODO: remove this after we fix the remaining issues with the webpack build
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = process.env.E2E ? module.exports : withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "lesswrong",
    project: "lesswrong",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/api/sentry',

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    authToken: process.env.SENTRY_AUTH_TOKEN,

    sourcemaps: {
      deleteSourcemapsAfterUpload: false,
    }
  }
);

if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
   
  module.exports = withBundleAnalyzer(module.exports);  
}
