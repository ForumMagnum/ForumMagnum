const path = require('path');
const fs = require('fs');
const { redirects } = require("packages/lesswrong/lib/redirects");

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
    return redirects;
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
