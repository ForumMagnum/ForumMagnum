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
  serverExternalPackages: [
    'superagent-proxy', 'gpt-3-encoder', 'mathjax-node', 'turndown', 'cloudinary',
    '@aws-sdk/client-cloudfront', 'auth0', 'jimp', '@datadog/browser-rum', 'juice',
    'request', 'stripe', 'openai',
  ],
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
  }
}