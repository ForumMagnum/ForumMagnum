import { getSetting} from 'meteor/vulcan:core';

export * from './lib/index.js';

import './server/database-import/database_import_new.js';
import './server/rss-integration/cron.js';
import './server/rss-integration/callbacks.js';
import './server/database-import/force_batch_update_scores.js';
import './server/database-import/cleanup_scripts.js';
import './server/robots.js';

// Scripts
import './server/scripts/sscImport.js';
import './server/scripts/hpmorImport.js';
import './server/scripts/algoliaExport.js';
import './server/scripts/algoliaConfigureIndexes.js';
import './server/scripts/brokenLinksReport.js';
import './server/scripts/exportForAprilFoolsTraining.js';
import './server/scripts/fixBodyField.js';
import './server/scripts/fixKarmaField.js';
import './server/scripts/fixEmailField.js';
import './server/scripts/fixFrontpageCount.js';
import './server/scripts/voteMigration.js';
import './server/scripts/slugDeduplication.js';
import './server/scripts/debuggingScripts.js';
import './server/scripts/importOldPasswords.js';
import './server/scripts/postsEditCallbacks.js';
import './server/scripts/rerunAFvotes.js';
import './server/scripts/messagesEditCallbacks.js';
import './server/scripts/localgroupsEditCallbacks.js';
import './server/scripts/nullifyVotes.js';
import './server/scripts/fixSSCDrafts.js';
import './server/scripts/invites.js';

import './server/scripts/exportPostDetails.js';
import './server/scripts/legacyKarma_aggregate2.js';
import './server/scripts/removeObsoleteIndexes.js';
import './server/scripts/logMongoQueries.js';
import './server/scripts/fillMissing.js';
import './server/scripts/recomputeDenormalized.js';
import './server/scripts/validateDatabase.js';
import './server/scripts/validateMakeEditableDenormalization.js';
import './server/migrations';

import './server/legacy-redirects/routes.js';
import './server/material-ui/themeProvider';
import './server/editor/utils.js';
import './server/mapsUtils.js';
import './server/emails/index.js';
import './server/posts/index.js';

import './server/debouncer.js';
import './server/logging.js';
import './server/rss.js';
import './server/akismet.js';
import './server/votingCron.js';
import './server/votingGraphQL.js';
import './server/updateScores.js';
import './server/siteAdminMetadata.js';
import './server/callbacks.js';
import './server/notificationCallbacks.js';
import './server/voteServer.js';
import './server/recommendations.js';
import './server/emails/emailTokens.js';
import './server/partiallyReadSequences.js';

import './lib/collections/comments/callbacks.js';
import './lib/collections/comments/graphql.js';
import './lib/collections/posts/callbacks.js';
import './lib/collections/posts/validate.js';
import './lib/collections/chapters/callbacks.js';
import './lib/collections/sequences/callbacks.js';
import './lib/collections/books/callbacks.js';
import './lib/collections/collections/callbacks.js';
import './lib/collections/messages/callbacks.js';
import './lib/collections/users/validate_login.js';
import './lib/collections/users/callbacks.js';
import './lib/collections/bans/callbacks.js';
import './lib/collections/posts/tableOfContents.js';
if (getSetting('hasEvents', true)) {
  import './lib/collections/localgroups/callbacks.js';
}

import './lib/collections/revisions/resolvers.js';
import './lib/collections/posts/serverSchema.js';
import './lib/collections/users/serverSchema.js';

import './lib/events/server.js';
import './lib/modules/connection_logs.js';


// Algolia Search Integration
import './server/search/utils.js';
import './server/search/callbacks.js';
import './server/search/algoliaCron.js';

// EA Forum only
import './server/scripts/eafIBetaInvites.js';
import './lib/modules/accounts/configuration.js';

//eslint-disable-next-line no-console
console.log("Starting LessWrong server. Versions: "+JSON.stringify(process.versions));
