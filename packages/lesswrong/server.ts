import './server/databaseSettings'

import './server/vulcan-lib/index';
import './lib/index';

import './server/cronUtil';

import './server/startupSanityChecks';

import './server/database-import/database_import_new';
import './server/rss-integration/cron';
import './server/rss-integration/callbacks';
import './server/karmaInflation/cron';
import './server/useractivities/cron';
import './server/database-import/force_batch_update_scores';
import './server/database-import/cleanup_scripts';
import './server/robots';
import './server/ckEditor/ckEditorToken';
import './server/ckEditor/ckEditorWebhook';
import './server/ckEditor/ckEditorCallbacks';

// Scripts
import './server/scripts/sscImport';
import './server/scripts/hpmorImport';
import './server/scripts/algoliaExport';
import './server/scripts/algoliaConfigureIndexes';
import './server/scripts/backfillParentTags';
import './server/scripts/brokenLinksReport';
import './server/scripts/convertImagesToCloudinary';
import './server/scripts/fixBodyField';
import './server/scripts/fixKarmaField';
import './server/scripts/fixEmailField';
import './server/scripts/fixFrontpageCount';
import './server/scripts/generateUserActivityReport';
import './server/scripts/voteMigration';
import './server/scripts/slugDeduplication';
import './server/scripts/debuggingScripts';
import './server/scripts/rerunAFvotes';
import './server/scripts/nullifyVotes';
import './server/scripts/fixSSCDrafts';
import './server/scripts/fillUserEmail';
import './server/scripts/migrateCollections';
import './server/scripts/deletePgIndexes';
import './server/scripts/dropTestingDatabases';
import './server/scripts/dropAndSeedJestPg';
import './server/scripts/makeMigrations';
import './server/scripts/reviewGetResultsPost';
import './server/scripts/sendWrappedNotifications';

import './server/scripts/oneOffBanSpammers'
import './server/scripts/ensureEmailInEmails';
import './server/scripts/exportPostDetails';
import './server/scripts/legacyKarma_aggregate2';
import './server/scripts/removeObsoleteIndexes';
import './server/scripts/fillMissing';
import './server/scripts/recomputeDenormalized';
import './server/scripts/validateDatabase';
import './server/scripts/validateMakeEditableDenormalization';
import './server/scripts/mergeAccounts';
import "./server/scripts/testPostDescription";
import "./server/scripts/importEAGUserInterests";
import "./server/scripts/importLocalgroups";
import "./server/scripts/setUserTagFilters";
import "./server/scripts/languageModels/generateTaggingPostSets";
import "./server/scripts/languageModels/testModGPTOnComments";
import './server/manualMigrations';
import './server/manualMigrations/migrationsDashboardGraphql';

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
import './server/rsvpToEvent';
import './server/acceptCoauthorRequest';
import './server/bookmarkMutation';
import './server/hidePostMutation';
import './server/rss';
import './server/akismet';
import './server/votingCron';
import './server/votingGraphQL';
import './server/updateScores';
import './server/siteAdminMetadata';
import './server/callbacks';
import './server/notificationCallbacks';
import './server/notificationCallbacksHelpers';
import './server/voteServer';
import './server/recommendations';
import './server/emails/emailTokens';
import './server/partiallyReadSequences';
import './server/eventReminders';

import './server/gatherTownCron';

import './server/tagging/tagCallbacks';
import './server/tagging/tagsGraphQL';

import './server/callbacks/commentCallbacks';
import './server/callbacks/conversationCallbacks';
import './server/callbacks/localgroupCallbacks';
import './server/callbacks/gardenCodeCallbacks';
import './server/resolvers/commentResolvers';
import './server/resolvers/notificationResolvers';
import './server/callbacks/postCallbacks';
import './server/posts/validatePost';
import './server/callbacks/chapterCallbacks';
import './server/callbacks/sequenceCallbacks';
import './server/callbacks/bookCallbacks';
import './server/callbacks/collectionCallbacks';
import './server/callbacks/messageCallbacks';
import './server/callbacks/revisionCallbacks';
import './server/callbacks/userCallbacks';
import './server/callbacks/tagRelsCallbacks';
import './server/staticRoutes/debugHeaders';
import './server/tableOfContents';
import './server/callbacks/subscriptionCallbacks';
import './server/callbacks/rateLimits';
import './server/callbacks/reviewVoteCallbacks';
import './server/callbacks/tagFlagCallbacks';
import './server/callbacks/moderatorActionCallbacks';
import './server/callbacks/advisorRequestsCallbacks';

import './server/resolvers/alignmentForumMutations';
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
import './server/resolvers/arbitalPageData';
import './server/resolvers/tagHistoryFeed';
import './server/resolvers/tagResolvers';
import './server/resolvers/allTagsActivityFeed';
import './server/resolvers/recentDiscussionFeed';
import './server/resolvers/elicitPredictions';
import './server/resolvers/reviewVoteResolvers';
import './server/resolvers/petrovDayResolvers';
import './server/resolvers/analyticsResolvers';
import './server/resolvers/moderationResolvers';

import './server/intercomSetup';
import './server/callbacks/intercomCallbacks';

import './server/fmCrosspost/crosspost';
import './server/fmCrosspost/routes';

import './server/exportUserData';
import './server/deleteUserContent';

import './server/spotlightCron';

import "./server/languageModels/autoTagCallbacks";
import './server/languageModels/languageModelIntegration';
import './server/languageModels/postSummaryResolver';

import './server/codegen/generateTypes';
import './server/styleGeneration';

// Algolia Search Integration
import './server/search/utils';
import './server/search/callbacks';
import './server/search/algoliaCron';

import './server/search/ElasticSearchClient';
