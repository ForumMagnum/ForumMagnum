import './server/databaseSettings'

import './server/vulcan-lib/index';
import './server/apolloServer';
import './lib/index';

import './server/cronUtil';

import './server/startupSanityChecks';

import './server/postgresView';
import './server/analyticsViews';

import './server/database-import/database_import_new';
import './server/rss-integration/cron';
import './server/rss-integration/callbacks';
import './server/karmaInflation/cron';
import './server/useractivities/cron';
import './server/cache';
import './server/users/cron';
import './server/users/permanentDeletion';
import './server/curationEmails/cron';
import './server/database-import/force_batch_update_scores';
import './server/database-import/cleanup_scripts';
import './server/robots';
import './server/ckEditor/ckEditorToken';
import './server/ckEditor/ckEditorWebhook';
import './server/ckEditor/ckEditorCallbacks';

// Scripts
import './server/scripts/sscImport';
import './server/scripts/hpmorImport';
import './server/scripts/backfillParentTags';
import './server/scripts/brokenLinksReport';
import './server/scripts/bestOfLessWrongTagUpdate';
import './server/scripts/convertImagesToCloudinary';
import './server/scripts/fixKarmaField';
import './server/scripts/fixEmailField';
import './server/scripts/fixFrontpageCount';
import './server/scripts/generateUserActivityReport';
import './server/scripts/generateInflationAdjustedKarmaReport';
import './server/scripts/voteMigration';
import './server/scripts/slugDeduplication';
import './server/scripts/debuggingScripts';
import './server/scripts/createKarmaAward'
import './server/scripts/rerunAFvotes';
import './server/scripts/nullifyVotes';
import './server/scripts/fillUserEmail';
import './server/scripts/deletePgIndexes';
import './server/scripts/dropTestingDatabases';
import './server/scripts/dropAndSeedJestPg';
import './server/scripts/generateSQLSchema';
import './server/scripts/reviewGetResultsPost';
import './server/scripts/sendAnnualForumUserSurveyEmails';
import './server/scripts/removeRsvp';
import './server/scripts/regenerateUnicodeSlugs';
import './server/scripts/checkPostForSockpuppetVoting';
import './server/scripts/convertAllPostsToEAEmojis';
import './server/scripts/reindexDeletedUserContent';
import './server/scripts/oneOffBanSpammers'
import './server/scripts/ensureEmailInEmails';
import './server/scripts/exportPostDetails';
import './server/scripts/legacyKarma_aggregate2';
import './server/scripts/fillMissing';
import './server/scripts/recomputeDenormalized';
import './server/scripts/recomputeReceivedVoteCounts';
import './server/scripts/validateDatabase';
import './server/scripts/validateMakeEditableDenormalization';
import './server/scripts/mergeAccounts';
import './server/scripts/petrov2024assigning';
import "./server/scripts/testPostDescription";
import "./server/scripts/importEAGUserInterests";
import "./server/scripts/importLocalgroups";
import "./server/scripts/setUserTagFilters";
import "./server/scripts/randomRecommendationSamples";
import './server/scripts/cleanUpDuplicatePostAutosaves';
import "./server/scripts/generativeModels/generateTaggingPostSets";
import "./server/scripts/generativeModels/testModGPTOnComments";
import "./server/scripts/generativeModels/coverImage";
import "./server/scripts/addManualReviewArt";
import "./server/scripts/backfillRecombee";
import "./server/scripts/backfillGoogleVertex";
import "./server/scripts/exportAEStudiosData";
// doesn't pass unit tests but works fine. Leaving commented out for now
import './server/scripts/generativeModels/autoSpotlight';
import "./server/scripts/mongoQueryToSQL";
import "./server/scripts/arbitalImport/arbitalImport";
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
import './server/twitterBot';
import './server/voteServer';
import './server/recommendations';
import './server/recommendations/mutations';
import './server/recommendations/recommedationsCron';
import './server/recommendations/UniquePostUpvoters';
import './server/emails/emailTokens';
import './server/partiallyReadSequences';
import './server/eventReminders';
import './server/prunePerfMetricsCron';

import './server/gatherTownCron';

import './server/tagging/tagCallbacks';
import './server/tagging/tagsGraphQL';

import './server/callbacks/commentCallbacks';
import './server/callbacks/conversationCallbacks';
import './server/callbacks/localgroupCallbacks';
import './server/callbacks/gardenCodeCallbacks';
import './server/resolvers/commentResolvers';
import './server/resolvers/notificationResolvers';
import './server/resolvers/conversationResolvers';
import './server/resolvers/dialogueMessageResolvers';
import './server/resolvers/subscribedUsersFeedResolver';
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
import './server/callbacks/rateLimitCallbacks';
import './server/callbacks/reviewVoteCallbacks';
import './server/callbacks/tagFlagCallbacks';
import './server/callbacks/moderatorActionCallbacks';
import './server/callbacks/digestCallbacks';
import './server/callbacks/jargonTermCallbacks';


import './server/resolvers/alignmentForumMutations';
import './server/callbacks/alignment-forum/callbacks';
import './server/callbacks/alignment-forum/alignmentCommentCallbacks';
import './server/callbacks/alignment-forum/alignmentPostCallbacks';
import './server/callbacks/alignment-forum/alignmentUserCallbacks';
import './server/callbacks/votingCallbacks';
import './server/callbacks/electionCandidateCallbacks';

import './server/resolvers/diffResolvers';
import './server/resolvers/revisionResolvers';
import './server/resolvers/postResolvers';
import './server/resolvers/spotlightResolvers';
import './server/resolvers/userResolvers';
import './server/resolvers/wrappedResolvers';
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
import './server/resolvers/petrovDay2024Resolvers';
import './server/resolvers/analyticsResolvers';
import './server/resolvers/adminResolvers';
import './server/resolvers/surveyResolvers';
import './server/resolvers/moderationResolvers';
import './server/resolvers/typingIndicatorsResolvers';
import './server/resolvers/databaseSettingsResolvers';
import './server/resolvers/reviewWinnerResolvers';
import './server/resolvers/googleVertexResolvers';
import './server/resolvers/defaultResolvers';
import './server/resolvers/forumEventResolvers';
import './server/resolvers/anthropicResolvers';
import './server/resolvers/llmConversationsResolvers';
import './server/resolvers/jargonResolvers/jargonTermResolvers';
import './server/resolvers/multiDocumentResolvers';
import './server/resolvers/importUrlAsDraftPost';
import './server/resolvers/lightcone2024FundraiserResolvers';

import './server/intercomSetup';
import './server/callbacks/intercomCallbacks';

import './server/fmCrosspost/crosspost';
import './server/fmCrosspost/routes';

import './server/exportUserData';
import './server/deleteUserContent';

import './server/spotlightCron';
import './server/userJobAdCron';
import './server/inactiveUserSurveyCron';

import "./server/languageModels/autoTagCallbacks";
import './server/languageModels/languageModelIntegration';
import './server/languageModels/postSummaryResolver';

import './server/codegen/generateTypes';
import './server/styleGeneration';

import './server/embeddings';

// EA Forum wrapped
import './server/wrapped/sendWrappedNotifications';
import './server/wrapped/sampleWrappedPersonalities';
import './server/wrapped/triggerWrappedRefresh';

// Elasticsearch integration
import './server/search/elastic/ElasticExporter';
import './server/search/elastic/elasticCallbacks';
import './server/search/elastic/elasticGraphQL';
import './server/search/facetFieldSearch';

// Incremental views
import './server/analytics/analyticsCron';
import './server/conversationUnreadMessages';
import './server/userLoginTokens';

import './server/migrations/meta/utils';
