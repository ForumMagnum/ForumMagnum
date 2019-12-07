import { getSetting} from 'meteor/vulcan:core';

export * from '../lib/index.js';

import './startupSanityChecks.js';

import './database-import/database_import_new.js';
import './rss-integration/cron.js';
import './rss-integration/callbacks.js';
import './database-import/force_batch_update_scores.js';
import './database-import/cleanup_scripts.js';
import './robots.js';
import './ckEditorToken';

// Scripts
import './scripts/sscImport.js';
import './scripts/hpmorImport.js';
import './scripts/algoliaExport.js';
import './scripts/algoliaConfigureIndexes.js';
import './scripts/brokenLinksReport.js';
import './scripts/fixBodyField.js';
import './scripts/fixKarmaField.js';
import './scripts/fixEmailField.js';
import './scripts/fixFrontpageCount.js';
import './scripts/voteMigration.js';
import './scripts/slugDeduplication.js';
import './scripts/debuggingScripts.js';
import './scripts/importOldPasswords.js';
import './scripts/postsEditCallbacks.js';
import './scripts/rerunAFvotes.js';
import './scripts/messagesEditCallbacks.js';
import './scripts/localgroupsEditCallbacks.js';
import './scripts/nullifyVotes.js';
import './scripts/fixSSCDrafts.js';
import './scripts/invites.js';

import './scripts/oneOffBanSpammers'
import './scripts/exportPostDetails.js';
import './scripts/legacyKarma_aggregate2.js';
import './scripts/removeObsoleteIndexes.js';
import './scripts/logMongoQueries.js';
import './scripts/fillMissing.js';
import './scripts/recomputeDenormalized.js';
import './scripts/validateDatabase.js';
import './scripts/validateMakeEditableDenormalization.js';
import './scripts/mergeAccounts.js';
import './migrations';
import './migrations/migrationsDashboardGraphql.js';

import './legacy-redirects/routes.js';
import './material-ui/themeProvider';
import './editor/utils.js';
import './mapsUtils.js';
import './emails/index.js';
import './posts/index.js';

import './analyticsWriter.js';
import './debouncer.js';
import './logging.js';
import './markAsUnread.js';
import './rss.js';
import './akismet.js';
import './votingCron.js';
import './votingGraphQL.js';
import './updateScores.js';
import './siteAdminMetadata.js';
import './callbacks.js';
import './notificationCallbacks.js';
import './voteServer.js';
import './recommendations.js';
import './emails/emailTokens.js';
import './partiallyReadSequences.js';

import './tagging/tagCallbacks.js';
import './tagging/tagsGraphQL.js';

import '../lib/collections/comments/callbacks.js';
import '../lib/collections/comments/graphql.js';
import '../lib/collections/posts/callbacks.js';
import '../lib/collections/posts/validate.js';
import '../lib/collections/chapters/callbacks.js';
import '../lib/collections/sequences/callbacks.js';
import '../lib/collections/books/callbacks.js';
import '../lib/collections/collections/callbacks.js';
import '../lib/collections/messages/callbacks.js';
import '../lib/collections/users/validate_login.js';
import '../lib/collections/users/callbacks.js';
import '../lib/collections/bans/callbacks.js';
import '../lib/collections/posts/tableOfContents.js';
import '../lib/collections/subscriptions/callbacks.js';
if (getSetting('hasEvents', true)) {
  import '../lib/collections/localgroups/callbacks.js';
}

import '../lib/collections/revisions/resolvers.js';
import '../lib/collections/posts/serverSchema.js';
import '../lib/collections/users/serverSchema.js';

import '../lib/events/server.js';
import '../lib/events/callbacks_async.js';
import '../lib/modules/connection_logs.js';


// Algolia Search Integration
import './search/utils.js';
import './search/callbacks.js';
import './search/algoliaCron.js';

//eslint-disable-next-line no-console
console.log("Starting LessWrong server. Versions: "+JSON.stringify(process.versions));
