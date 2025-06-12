module.exports = {
  turbopack: {
    rules: {
      '*.html': {
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
  serverExternalPackages: ['superagent-proxy', 'gpt-3-encoder', 'mathjax-node'],
}