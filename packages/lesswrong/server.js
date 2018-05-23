import './lib/index.js';
import './lib/database-import/database_import.js';
import './lib/database-import/database_import_new.js';
import './lib/rss-integration/cron.js';
import './lib/scripts/sscImport.js';
import './lib/scripts/hpmorImport.js';
import './lib/scripts/algoliaExport.js';
import './lib/scripts/fixBodyField.js';
import './lib/scripts/fixKarmaField.js';
import './lib/scripts/fixEmailField.js';
import './lib/scripts/fixFrontpageCount.js';
import './lib/scripts/voteMigration.js';
import './lib/scripts/slugDeduplication.js';
import './lib/scripts/debuggingScripts.js';
import './lib/scripts/importOldPasswords.js';
import './lib/scripts/postsEditCallbacks.js';
import './lib/scripts/nullifyVotes.js';

import './lib/collections/comments/callbacks.js';
import './lib/collections/comments/graphql.js';

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
import './lib/scripts/invites.js';

// Old LW posts and comment rerouting
import './lib/legacy-redirects/routes.js';

export * from './lib/index.js';

import './lib/collections/sequences/seed.js';

import './lib/scripts/fixSSCDrafts.js';

import './lib/modules/connection_logs.js';
import './lib/collections/users/validate_login.js';
import './lib/collections/bans/callbacks.js';

import './lib/collections/lwevents/indexes.js';
import './lib/collections/usercollectionrels/indexes.js';
import './lib/collections/usersequencerels/indexes.js';
import './lib/collections/posts/indexes.js';
import './lib/collections/localgroups/indexes.js';
import './lib/logging.js';
