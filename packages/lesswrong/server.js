import './server/databaseSettings'

import './server/vulcan-lib/index';

import './server/vulcan-users/main';
import './server/vulcan-core/start';
import './server/vulcan-accounts/index';

export * from './lib/index';

import './server/startupSanityChecks';

import './server/rss-integration/cron';
import './server/rss-integration/callbacks';
//import './server/database-import/database_import_new';
//import './server/database-import/force_batch_update_scores';
//import './server/database-import/cleanup_scripts';
import './server/robots';
import './server/ckEditorToken';

// Scripts
import './server/scripts/sscImport';
import './server/scripts/hpmorImport';
import './server/scripts/algoliaExport';
import './server/scripts/algoliaConfigureIndexes';
import './server/scripts/brokenLinksReport';
import './server/scripts/fixBodyField';
import './server/scripts/fixKarmaField';
import './server/scripts/fixEmailField';
import './server/scripts/fixFrontpageCount';
import './server/scripts/voteMigration';
import './server/scripts/slugDeduplication';
import './server/scripts/debuggingScripts';
import './server/scripts/importOldPasswords';
import './server/scripts/postsEditCallbacks';
import './server/scripts/rerunAFvotes';
import './server/scripts/messagesEditCallbacks';
import './server/scripts/localgroupsEditCallbacks';
import './server/scripts/nullifyVotes';
import './server/scripts/fixSSCDrafts';
import './server/scripts/invites';

import './server/scripts/oneOffBanSpammers'
import './server/scripts/exportPostDetails';
import './server/scripts/legacyKarma_aggregate2';
import './server/scripts/removeObsoleteIndexes';
import './server/scripts/logMongoQueries';
import './server/scripts/fillMissing';
import './server/scripts/recomputeDenormalized';
import './server/scripts/validateDatabase';
import './server/scripts/validateMakeEditableDenormalization';
import './server/scripts/mergeAccounts';
import './server/migrations';
import './server/migrations/migrationsDashboardGraphql';

import './server/legacy-redirects/routes';
import './server/material-ui/themeProvider';
import './server/editor/utils';
import './server/mapsUtils';
import './server/emails/index';
import './server/posts/index';

import './server/analyticsWriter';
import './server/debouncer';
import './server/logging';
import './server/markAsUnread';
import './server/rss';
import './server/akismet';
import './server/votingCron';
import './server/votingGraphQL';
import './server/updateScores';
import './server/siteAdminMetadata';
import './server/callbacks';
import './server/notificationCallbacks';
import './server/voteServer';
import './server/recommendations';
import './server/emails/emailTokens';
import './server/partiallyReadSequences';

import './server/gatherTownCron';

import './server/tagging/tagCallbacks';
import './server/tagging/tagsGraphQL';

import './server/callbacks/commentCallbacks';
import './server/resolvers/commentResolvers';
import './server/callbacks/postCallbacks';
import './lib/collections/posts/validate';
import './server/callbacks/chapterCallbacks';
import './server/callbacks/sequenceCallbacks';
import './server/callbacks/bookCallbacks';
import './server/callbacks/collectionCallbacks';
import './server/callbacks/messageCallbacks';
import './lib/collections/users/validate_login';
import './server/callbacks/userCallbacks';
import './server/callbacks/banCallbacks';
import './server/tableOfContents';
import './server/callbacks/subscriptionCallbacks';
import './server/callbacks/rateLimits';
import './server/callbacks/reviewVoteCallbacks';
import './server/callbacks/tagFlagCallbacks';
import { hasEventsSetting } from './lib/instanceSettings'
if (hasEventsSetting.get()) {
  import './server/callbacks/localgroupCallbacks';
}
import './server/callbacks/alignment-forum/callbacks';
import './server/callbacks/alignment-forum/alignmentCommentCallbacks';
import './server/callbacks/alignment-forum/alignmentPostCallbacks';
import './server/callbacks/alignment-forum/alignmentUserCallbacks';
import './server/callbacks/votingCallbacks';

import './server/resolvers/diffResolvers';
import './server/resolvers/revisionResolvers';
import './server/resolvers/postResolvers';
import './server/resolvers/userResolvers';
import './server/resolvers/karmaChangeResolvers';
import './server/resolvers/coronaLinkDatabase';
import './server/resolvers/mozillaHubsData';
import './server/resolvers/tagHistoryFeed';
import './server/resolvers/allTagsActivityFeed';
import './server/resolvers/recentDiscussionFeed';

import './server/intercomSetup';
import './server/callbacks/intercomCallbacks';
import './server/connection_logs';

import './server/codegen/generateTypes';

import './server/styleGeneration';

// Algolia Search Integration
import './server/search/utils';
import './server/search/callbacks';
import './server/search/algoliaCron';

//eslint-disable-next-line no-console
console.log("Starting LessWrong server. Versions: "+JSON.stringify(process.versions));
