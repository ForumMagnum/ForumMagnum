// # Vulcan Modifications

// schema utils
import { generateIdResolverMulti, generateIdResolverSingle } from './modules/utils/schemaUtils.js'
// Permissions
import './modules/permissions.js';

// Head tags
import './modules/headtags.js'

// ## Accounts
import './modules/accounts/modify_accounts_ui.js';
import './modules/accounts/configuration.js';

// ## Voting
import './modules/voting/new_vote_types.js';
import './modules/voting/callbacks.js';

// Subscriptions
import './collections/subscription_fields.js';
//MomentJS configuration
import '../components/momentjs.js';

// Notifications
import Notifications from './collections/notifications/collection.js';
import './collections/notifications/custom_fields.js';
import './collections/notifications/views.js';
import './collections/notifications/permissions.js';
import './collections/notifications/seed.js';
// Inbox
import Messages from './collections/messages/collection.js'
import './collections/messages/views.js';
import './collections/messages/permissions.js';

import Conversations from './collections/conversations/collection.js'
import './collections/conversations/views.js';
import './collections/conversations/helpers.js';
import './collections/conversations/permissions.js';
//
// RSSFeeds
import RSSFeeds from './collections/rssfeeds/collection.js'
import './collections/rssfeeds/views.js'
//
// Reports
import Reports from './collections/reports/collection.js'
import './collections/reports/views.js'
import './collections/reports/permissions.js'

// LWEvents
import { LWEvents } from './collections/lwevents/index.js';

// Bans
import { Bans } from './collections/bans/index.js'
// Chapters
import Sequences from './collections/sequences/collection.js';
import './collections/sequences/views.js';
import './collections/sequences/utils.js';
import './collections/sequences/helpers.js';

import Chapters from './collections/chapters/collection.js';
import Books from './collections/books/collection.js';
import Collections from './collections/collections/collection.js';

import Localgroups from './collections/localgroups/collection.js'
import './collections/localgroups/views.js';
import './collections/localgroups/permissions.js';
import './collections/localgroups/fragments.js';

import './modules/fragments.js';
import './collections/chapters/fragments.js';
import './collections/sequences/fragments.js';
import './collections/books/fragments.js';
import './collections/collections/fragments.js';
import './modules/alignment-forum/posts/fragments.js';
import './modules/alignment-forum/users/fragments.js';

import './collections/chapters/views.js';

import './collections/sequences/permissions.js';
import './collections/collections/permissions.js';
import './collections/books/permissions.js';


// Subscriptions
import './subscriptions/mutations.js';
import './subscriptions/permissions.js';


// Posts
import './collections/posts/custom_fields.js';
import './collections/posts/views.js';
import './collections/posts/permissions.js';
import './collections/posts/helpers.js';
//
// Users
import './collections/users/helpers.js';
import './collections/users/custom_fields.js';
import './collections/users/callbacks.js';
import './collections/users/views.js';
import './collections/users/permissions.js';

// Comments
import { Comments } from './collections/comments'

// Votes
import './collections/votes/custom_fields.js';
//
//
//
// Internationalization
import './i18n-en-us/en_US.js';
//
// // General
import './modules/callbacks.js';

// // Misc.
import './helpers.js'
import './routes.js';
import './views.js';
import './scrollRestoration.js';

// Algolia Search Integration
import './search/utils.js';
import './search/callbacks.js';

import './components.js';

// Alignment Forum
import './modules/alignment-forum/callbacks.js';
import './modules/alignment-forum/permissions.js';
import './modules/alignment-forum/graphql.js';

import './modules/alignment-forum/posts/custom_fields.js';
import './modules/alignment-forum/posts/callbacks.js';
import './modules/alignment-forum/posts/helpers.js';

import './modules/alignment-forum/comments/custom_fields.js';
import './modules/alignment-forum/comments/callbacks.js';

import './modules/alignment-forum/sequences/custom_fields.js'
import './modules/alignment-forum/sequences/callbacks.js';

import './modules/alignment-forum/users/custom_fields.js';
import './modules/alignment-forum/users/helpers.js';
import './modules/alignment-forum/users/views.js';


//
export {
  Conversations,
  Messages,
  Notifications,
  RSSFeeds,
  Chapters,
  Sequences,
  Collections,
  LWEvents,
  Reports,
  Books,
  Bans,
  Localgroups,
  generateIdResolverMulti,
  generateIdResolverSingle,
  Comments
}
