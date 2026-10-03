import path from 'path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

const repoRoot = path.join(__dirname, '..');

loadEnvConfig(repoRoot, process.env.NODE_ENV !== 'production');
process.env.FORUM_TYPE ??= 'LessWrong';

const serverExternalPackages = [
  'superagent-proxy', 'gpt-3-encoder', 'mathjax-full', 'turndown', 'cloudinary',
  '@aws-sdk/client-cloudfront', 'jimp', 'juice', '@sentry/nextjs',
  'request', 'stripe', 'openai', 'twitter-api-v2', 'draft-js', 'draft-convert', 'csso',
  'js-tiktoken', 'cheerio', '@elastic/elasticsearch', '@googlemaps/google-maps-services-js',
  'intercom-client', 'jsdom',
  'react-dom/static',
];

const nextConfig: NextConfig = {
  reactStrictMode: false,

  turbopack: {
    root: repoRoot,
    resolveAlias: {
      '@/server/*': { browser: '../packages/lesswrong/stubs/server/*' },
      '@/client/*': { browser: '../packages/lesswrong/client/*', default: '../packages/lesswrong/stubs/client/*' },
      '@/allComponents': '../packages/lesswrong/lib/generated/allComponents.ts',
      '@/lib/sentryWrapper': '../packages/lesswrong/stubs/noSentry.ts',
      '@/*': '../packages/lesswrong/*',

      'superagent-proxy': '../packages/lesswrong/stubs/emptyModule.js',
      'jsdom': {
        browser: '../packages/lesswrong/stubs/emptyModule.js',
      },
    },
  },
  serverExternalPackages,
};

export default nextConfig;
