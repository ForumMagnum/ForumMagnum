import { ReactRouterSSR } from 'meteor/reactrouter:react-router-ssr';

import '../packages/nova-i18n-en-us/lib/en_US.js';

import 'nova-core-server';
import 'nova-users-server';
import 'nova-posts-server';
import 'nova-comments-server';
import 'nova-categories-server';

import 'nova-api-server';
import 'nova-rss-server';
// import 'nova-newsletter-server';
import 'nova-notifications-server';
import 'nova-voting-server';

// Do server-rendering only in production
// Otherwise, it will break the hot-reload
// DO NOT REMOVE THIS LINE TO TEST, use: meteor --production
if (process.env.NODE_ENV === 'production') {
  // Load Webpack infos for SSR
  ReactRouterSSR.LoadWebpackStats(WebpackStats);

  require('./routes').default;
}
