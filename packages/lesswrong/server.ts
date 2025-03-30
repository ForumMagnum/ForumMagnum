import './server/databaseSettings'

import './server/vulcan-lib/site';
import './server/collections/allCollections';
import './server/vulcan-lib/utils';
import './server/vulcan-lib/apollo-server/authentication';

import './server/apolloServer';
import './lib/index';

import './server/startupSanityChecks';

import './server/postgresView';
import './server/analytics/analyticsViews';

import './server/rss-integration/cron';
import './server/rss-integration/callbacks';
import './server/karmaInflation/cron';
import './server/useractivities/cron';
import './server/cache';
import './server/users/cron';
import './server/users/permanentDeletion';
import './server/curationEmails/cron';
import './server/robots';
import './server/ckEditor/ckEditorToken';
import './server/ckEditor/ckEditorWebhook';
import './server/ckEditor/ckEditorCallbacks';

import './server/manualMigrations';
import './server/manualMigrations/migrationsDashboardGraphql';

import './server/legacy-redirects/routes';
import './server/material-ui/themeProvider';
import './server/editor/utils';
import './server/mapsUtils';
import './server/emails/index';
import './server/posts/index';

import './server/analytics/serverAnalyticsWriter';
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
import './server/emails/emailTokens';
import './server/partiallyReadSequences';
import './server/eventReminders';
import './server/prunePerfMetricsCron';
import './server/collections/users/karmaChangesGraphQL';

import './server/tagging/tagsGraphQL';
import './server/callbacks/multiDocumentCallbacks';

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
import './server/staticRoutes/debugHeaders';
import './server/tableOfContents';
import './server/callbacks/subscriptionCallbacks';
import './server/callbacks/reviewVoteCallbacks';
import './server/callbacks/tagFlagCallbacks';
import './server/callbacks/moderatorActionCallbacks';
import './server/callbacks/digestCallbacks';
import './server/callbacks/jargonTermCallbacks';


import './server/resolvers/alignmentForumMutations';
import './server/callbacks/alignment-forum/callbacks';
import './server/callbacks/votingCallbacks';
import './server/callbacks/electionCandidateCallbacks';

import './server/resolvers/diffResolvers';
import './server/resolvers/revisionResolvers';
import './server/resolvers/postResolvers';
import './server/resolvers/spotlightResolvers';
import './server/resolvers/userResolvers';
import './server/resolvers/wrappedResolvers';
import './server/resolvers/coronaLinkDatabase';
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
import './server/resolvers/multiDocumentResolvers';
import './server/resolvers/importUrlAsDraftPost';
import './server/resolvers/lightcone2024FundraiserResolvers';

import './server/intercomSetup';

import './server/fmCrosspost/crosspost';
import './server/fmCrosspost/routes';

import './server/exportUserData';
import './server/deleteUserContent';

import './server/spotlightCron';
import './server/userJobAdCron';
import './server/inactiveUserSurveyCron';

import "./server/languageModels/autoTagCallbacks";
import './server/languageModels/languageModelIntegration';

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

import './server/migrations/meta/utils';
