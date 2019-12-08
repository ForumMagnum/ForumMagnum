import { getSetting} from 'meteor/vulcan:core';

export * from '../imports/lib/index.js';

import '../imports/server/startupSanityChecks.js';

import '../imports/server/database-import/database_import_new.js';
import '../imports/server/rss-integration/cron.js';
import '../imports/server/rss-integration/callbacks.js';
import '../imports/server/database-import/force_batch_update_scores.js';
import '../imports/server/database-import/cleanup_scripts.js';
import '../imports/server/robots.js';
import '../imports/server/ckEditorToken';

// Scripts
import '../imports/server/scripts/sscImport.js';
import '../imports/server/scripts/hpmorImport.js';
import '../imports/server/scripts/algoliaExport.js';
import '../imports/server/scripts/algoliaConfigureIndexes.js';
import '../imports/server/scripts/brokenLinksReport.js';
import '../imports/server/scripts/fixBodyField.js';
import '../imports/server/scripts/fixKarmaField.js';
import '../imports/server/scripts/fixEmailField.js';
import '../imports/server/scripts/fixFrontpageCount.js';
import '../imports/server/scripts/voteMigration.js';
import '../imports/server/scripts/slugDeduplication.js';
import '../imports/server/scripts/debuggingScripts.js';
import '../imports/server/scripts/importOldPasswords.js';
import '../imports/server/scripts/postsEditCallbacks.js';
import '../imports/server/scripts/rerunAFvotes.js';
import '../imports/server/scripts/messagesEditCallbacks.js';
import '../imports/server/scripts/localgroupsEditCallbacks.js';
import '../imports/server/scripts/nullifyVotes.js';
import '../imports/server/scripts/fixSSCDrafts.js';
import '../imports/server/scripts/invites.js';

import '../imports/server/scripts/oneOffBanSpammers'
import '../imports/server/scripts/exportPostDetails.js';
import '../imports/server/scripts/legacyKarma_aggregate2.js';
import '../imports/server/scripts/removeObsoleteIndexes.js';
import '../imports/server/scripts/logMongoQueries.js';
import '../imports/server/scripts/fillMissing.js';
import '../imports/server/scripts/recomputeDenormalized.js';
import '../imports/server/scripts/validateDatabase.js';
import '../imports/server/scripts/validateMakeEditableDenormalization.js';
import '../imports/server/scripts/mergeAccounts.js';
import '../imports/server/migrations';
import '../imports/server/migrations/migrationsDashboardGraphql.js';

import '../imports/server/legacy-redirects/routes.js';
import '../imports/server/material-ui/themeProvider';
import '../imports/server/editor/utils.js';
import '../imports/server/mapsUtils.js';
import '../imports/server/emails/index.js';
import '../imports/server/posts/index.js';

import '../imports/server/analyticsWriter.js';
import '../imports/server/debouncer.js';
import '../imports/server/logging.js';
import '../imports/server/markAsUnread.js';
import '../imports/server/rss.js';
import '../imports/server/akismet.js';
import '../imports/server/votingCron.js';
import '../imports/server/votingGraphQL.js';
import '../imports/server/updateScores.js';
import '../imports/server/siteAdminMetadata.js';
import '../imports/server/callbacks.js';
import '../imports/server/notificationCallbacks.js';
import '../imports/server/voteServer.js';
import '../imports/server/recommendations.js';
import '../imports/server/emails/emailTokens.js';
import '../imports/server/partiallyReadSequences.js';

import '../imports/server/tagging/tagCallbacks.js';
import '../imports/server/tagging/tagsGraphQL.js';

import '../imports/lib/collections/comments/callbacks.js';
import '../imports/lib/collections/comments/graphql.js';
import '../imports/lib/collections/posts/callbacks.js';
import '../imports/lib/collections/posts/validate.js';
import '../imports/lib/collections/chapters/callbacks.js';
import '../imports/lib/collections/sequences/callbacks.js';
import '../imports/lib/collections/books/callbacks.js';
import '../imports/lib/collections/collections/callbacks.js';
import '../imports/lib/collections/messages/callbacks.js';
import '../imports/lib/collections/users/validate_login.js';
import '../imports/lib/collections/users/callbacks.js';
import '../imports/lib/collections/bans/callbacks.js';
import '../imports/lib/collections/posts/tableOfContents.js';
import '../imports/lib/collections/subscriptions/callbacks.js';
if (getSetting('hasEvents', true)) {
  import '../imports/lib/collections/localgroups/callbacks.js';
}

import '../imports/lib/collections/revisions/resolvers.js';
import '../imports/lib/collections/posts/serverSchema.js';
import '../imports/lib/collections/users/serverSchema.js';

import '../imports/lib/events/server.js';
import '../imports/lib/events/callbacks_async.js';
import '../imports/lib/modules/connection_logs.js';


// Algolia Search Integration
import '../imports/server/search/utils.js';
import '../imports/server/search/callbacks.js';
import '../imports/server/search/algoliaCron.js';

//eslint-disable-next-line no-console
console.log("Starting LessWrong server. Versions: "+JSON.stringify(process.versions));
