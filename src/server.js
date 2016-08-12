import { ReactRouterSSR } from 'meteor/reactrouter:react-router-ssr';

import '../packages/nova-i18n-en-us/lib/en_US.js';
import '../packages/nova-core/lib/server.js';
import '../packages/nova-users/lib/server.js';
import '../packages/nova-posts/lib/server.js';
import '../packages/nova-comments/lib/server.js';
import '../packages/nova-categories/lib/server.js';

import '../packages/nova-api/lib/server.js';
import '../packages/nova-rss/lib/server.js';
// import '../packages/nova-newsletter/lib/server.js';
import '../packages/nova-notifications/lib/server.js';
import '../packages/nova-voting/lib/server.js';

// Do server-rendering only in production
// Otherwise, it will break the hot-reload
// DO NOT REMOVE THIS LINE TO TEST, use: meteor --production
if (process.env.NODE_ENV === 'production') {
  // Load Webpack infos for SSR
  ReactRouterSSR.LoadWebpackStats(WebpackStats);

  require('./routes').default;
}
