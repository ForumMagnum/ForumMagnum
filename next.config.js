const path = require('path');
const fs = require('fs');

const serverExternalPackages = [
  'superagent-proxy', 'gpt-3-encoder', 'mathjax-node', 'turndown', 'cloudinary',
  '@aws-sdk/client-cloudfront', 'auth0', 'jimp', '@datadog/browser-rum', 'juice',
  'request', 'stripe', 'openai',
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
  turbopack: {
    rules: {
      'packages/lesswrong/server/utils/arbital/resources/bayesGuideMultipleChoice.html': {
        loaders: ['html-loader']
      },
    },
    resolveAlias: {
      // Replicate the path mappings from tsconfig-client.json
      '@/server/*': { browser: './packages/lesswrong/stubs/server/*' },
      '@/viteClient/*': { browser: './packages/lesswrong/stubs/viteClient/*' },
      '@/client/*': { browser: './packages/lesswrong/client/*', default: './packages/lesswrong/stubs/client/*' },
      '@/allComponents': './packages/lesswrong/lib/generated/allComponents.ts',
      '@/*': './packages/lesswrong/*',

      'superagent-proxy': './packages/lesswrong/stubs/emptyModule.js',
    }
  },
  serverExternalPackages,

  webpack: (config, { isServer }) => {
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

      config.externals = config.externals ?? [];
      config.externals.push(Object.fromEntries([...serverExternalPackages, ...webpackExternalPackages].map(pkg => [pkg, `commonjs ${pkg}`])));
    }

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
    }];
  },
  // TODO: remove this after we fix the remaining issues with the webpack build
  typescript: {
    ignoreBuildErrors: true,
  },
}