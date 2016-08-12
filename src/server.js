/*

### How to use this file ###

You can add and remove imports based on the features you need. 

Make sure to remove the equivalent import (i.e. nova-rss and nova-rss-server)
in client.js as well.  

The server imports listed here are special server-only versions of the various
Nova modules. For example, nova-posts-server loads all the Posts logic contained
in nova-posts, but also loads server-only publication code. 

*/

import { ReactRouterSSR } from 'meteor/reactrouter:react-router-ssr';

// i18n

import '../packages/nova-i18n-en-us/lib/en_US.js';

// same on server and client

import 'nova-debug';
import 'nova-subscribe';

// server-specific

import 'nova-core-server';
import 'nova-users-server';
import 'nova-posts-server';
import 'nova-comments-server';
import 'nova-categories-server';
import 'nova-api-server';
import 'nova-rss-server';
// import 'nova-newsletter-server'; // bug
import 'nova-notifications-server';
import 'nova-voting-server';
import 'nova-getting-started-server';
import 'nova-kadira-server';

// Do server-rendering only in production
// Otherwise, it will break the hot-reload
// DO NOT REMOVE THIS LINE TO TEST, use: meteor --production
if (process.env.NODE_ENV === 'production') {
  // Load Webpack infos for SSR
  ReactRouterSSR.LoadWebpackStats(WebpackStats);

  require('nova-base-routes').default;
}
