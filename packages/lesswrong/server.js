import './lib/index.js';
// import './lib/init_script.js';
import './lib/database-import/database_import.js';
import './lib/rss-integration/cron.js';
import './lib/closed-beta/sscImport.js';
import './lib/closed-beta/hpmorImport.js';
import './lib/closed-beta/algoliaExport.js';
import './lib/closed-beta/fixBodyField.js';
import './lib/closed-beta/fixKarmaField.js';
import './lib/closed-beta/fixEmailField.js';
import './lib/closed-beta/fixFrontpageCount.js';
import './lib/closed-beta/voteMigration.js';
import './lib/closed-beta/slugDeduplication.js';

import './lib/collections/comments/callbacks.js';
import './lib/collections/posts/callbacks.js';
import './lib/collections/chapters/callbacks.js';
import './lib/collections/sequences/callbacks.js';
import './lib/collections/books/callbacks.js';
import './lib/collections/collections/callbacks.js';

// LW Events
import './lib/events/server.js';

// Mongo DB indexes
import './lib/modules/indexes.js';

// Closed Beta stuff
import './lib/closed-beta/invites.js';

// Old LW posts and comment rerouting
import './lib/legacy-redirects/routes.js';

export * from './lib/index.js';

import './lib/collections/sequences/seed.js';

import './lib/closed-beta/fixSSCDrafts.js';

import './lib/modules/connection_logs.js';
import './lib/collections/users/validate_login.js';
import './lib/collections/bans/callbacks.js';

import './lib/collections/lwevents/indexes.js';
import './lib/collections/usercollectionrels/indexes.js';
import './lib/collections/usersequencerels/indexes.js';
import './lib/collections/posts/indexes.js';
