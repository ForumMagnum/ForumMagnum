// Generate GraphQL-syntax schemas from resolvers &c that were set up with
// addGraphQLResolvers &c.

import gql from 'graphql-tag'; 
import type { GraphQLResolveInfo, GraphQLScalarType } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from './graphql-date';
import { graphqlTypeDefs as notificationTypeDefs, graphqlQueries as notificationQueries } from '@/server/notificationBatching';
import { graphqlTypeDefs as arbitalLinkedPagesTypeDefs } from '@/lib/collections/helpers/arbitalLinkedPagesField';
import { graphqlTypeDefs as additionalPostsTypeDefs } from '@/lib/collections/posts/newSchema';
import { graphqlTypeDefs as additionalRevisionsTypeDefs } from '@/lib/collections/revisions/newSchema';
import { graphqlTypeDefs as additionalTagsTypeDefs } from '@/lib/collections/tags/newSchema';
import { graphqlTypeDefs as additionalUsersTypeDefs } from '@/lib/collections/users/newSchema';
import { graphqlTypeDefs as recommendationsTypeDefs, graphqlQueries as recommendationsQueries } from '@/server/recommendations';
import { graphqlTypeDefs as userResolversTypeDefs, graphqlMutations as userResolversMutations, graphqlQueries as userResolversQueries } from '@/server/resolvers/userResolvers';
import { graphqlVoteTypeDefs as postVoteTypeDefs, graphqlVoteMutations as postVoteMutations } from '@/server/collections/posts/collection';
import { graphqlVoteTypeDefs as commentVoteTypeDefs, graphqlVoteMutations as commentVoteMutations } from '@/server/collections/comments/collection';
import { graphqlVoteTypeDefs as tagRelVoteTypeDefs, graphqlVoteMutations as tagRelVoteMutations } from '@/server/collections/tagRels/collection';
import { graphqlVoteTypeDefs as revisionVoteTypeDefs, graphqlVoteMutations as revisionVoteMutations } from '@/server/collections/revisions/collection';
import { graphqlVoteTypeDefs as electionCandidateVoteTypeDefs, graphqlVoteMutations as electionCandidateVoteMutations } from '@/server/collections/electionCandidates/collection';
import { graphqlVoteTypeDefs as tagVoteTypeDefs, graphqlVoteMutations as tagVoteMutations } from '@/server/collections/tags/collection';
import { graphqlVoteTypeDefs as multiDocumentVoteTypeDefs, graphqlVoteMutations as multiDocumentVoteMutations } from '@/server/collections/multiDocuments/collection';
import { graphqlTypeDefs as commentTypeDefs, graphqlMutations as commentMutations, graphqlQueries as commentQueries } from '@/server/resolvers/commentResolvers'
import { karmaChangesTypeDefs, karmaChangesFieldResolvers } from '@/server/collections/users/karmaChangesGraphQL';
import { analyticsGraphQLQueries, analyticsGraphQLTypeDefs } from '@/server/resolvers/analyticsResolvers';
import { arbitalGraphQLTypeDefs, arbitalGraphQLQueries } from '@/server/resolvers/arbitalPageData';
import { elicitPredictionsGraphQLTypeDefs, elicitPredictionsGraphQLQueries, elicitPredictionsGraphQLFieldResolvers, elicitPredictionsGraphQLMutations } from '@/server/resolvers/elicitPredictions';
import { notificationResolversGqlTypeDefs, notificationResolversGqlQueries, notificationResolversGqlMutations } from '@/server/resolvers/notificationResolvers'
import { lightcone2024FundraiserGraphQLTypeDefs, lightcone2024FundraiserGraphQLQueries } from '@/server/resolvers/lightcone2024FundraiserResolvers';
import { petrovDay2024GraphQLQueries, petrovDay2024GraphQLTypeDefs } from '@/server/resolvers/petrovDay2024Resolvers';
import { petrovDayLaunchGraphQLMutations, petrovDayLaunchGraphQLQueries, petrovDayLaunchGraphQLTypeDefs } from '@/server/resolvers/petrovDayResolvers';
import { reviewVoteGraphQLMutations, reviewVoteGraphQLTypeDefs, reviewVoteGraphQLQueries } from '@/server/resolvers/reviewVoteResolvers';
import { postGqlQueries, postGqlMutations, postGqlTypeDefs } from '@/server/resolvers/postResolvers'
import { adminGqlTypeDefs, adminGqlMutations } from '@/server/resolvers/adminResolvers'
import { alignmentForumMutations, alignmentForumTypeDefs } from '@/server/resolvers/alignmentForumMutations'
import { allTagsActivityFeedGraphQLQueries, allTagsActivityFeedGraphQLTypeDefs } from '@/server/resolvers/allTagsActivityFeed';
import { recentDiscussionFeedGraphQLQueries, recentDiscussionFeedGraphQLTypeDefs } from '@/server/resolvers/recentDiscussionFeed';
import { ultraFeedGraphQLQueries, ultraFeedGraphQLTypeDefs } from '@/server/resolvers/ultraFeedResolver';
import { subscribedUsersFeedGraphQLQueries, subscribedUsersFeedGraphQLTypeDefs } from '@/server/resolvers/subscribedUsersFeedResolver';
import { tagHistoryFeedGraphQLQueries, tagHistoryFeedGraphQLTypeDefs } from '@/server/resolvers/tagHistoryFeed';
import { subForumFeedGraphQLQueries, subForumFeedGraphQLTypeDefs, tagGraphQLTypeDefs, tagResolversGraphQLMutations, tagResolversGraphQLQueries } from '@/server/resolvers/tagResolvers';
import { conversationGqlMutations, conversationGqlTypeDefs } from '@/server/resolvers/conversationResolvers'
import { surveyResolversGraphQLMutations, surveyResolversGraphQLQueries, surveyResolversGraphQLTypeDefs } from '@/server/resolvers/surveyResolvers';
import { wrappedResolversGqlTypeDefs, wrappedResolversGraphQLQueries } from '@/server/resolvers/wrappedResolvers';
import { databaseSettingsGqlTypeDefs, databaseSettingsGqlMutations } from '@/server/resolvers/databaseSettingsResolvers'
import { siteGraphQLQueries, siteGraphQLTypeDefs } from '../site';
import { loginDataGraphQLMutations, loginDataGraphQLTypeDefs } from './authentication';
import { dialogueMessageGqlQueries, dialogueMessageGqlTypeDefs } from '@/server/resolvers/dialogueMessageResolvers';
import { forumEventGqlMutations, forumEventGqlTypeDefs } from '@/server/resolvers/forumEventResolvers';
import { ckEditorCallbacksGraphQLMutations, ckEditorCallbacksGraphQLTypeDefs, getLinkSharedPostGraphQLQueries } from '@/server/ckEditor/ckEditorCallbacks';
import { googleVertexGqlMutations, googleVertexGqlTypeDefs } from '@/server/resolvers/googleVertexResolvers';
import { migrationsDashboardGraphQLQueries, migrationsDashboardGraphQLTypeDefs } from '@/server/manualMigrations/migrationsDashboardGraphql';
import { reviewWinnerGraphQLQueries, reviewWinnerGraphQLTypeDefs } from '@/server/resolvers/reviewWinnerResolvers';
import { importUrlAsDraftPostGqlMutation, importUrlAsDraftPostTypeDefs } from '@/server/resolvers/importUrlAsDraftPost';
import { revisionResolversGraphQLQueries, revisionResolversGraphQLMutations, revisionResolversGraphQLTypeDefs } from '@/server/resolvers/revisionResolvers';
import { moderationGqlMutations, moderationGqlQueries, moderationGqlTypeDefs } from '@/server/resolvers/moderationResolvers';
import { multiDocumentMutations, multiDocumentTypeDefs } from '@/server/resolvers/multiDocumentResolvers';
import { spotlightGqlMutations, spotlightGqlTypeDefs } from '@/server/resolvers/spotlightResolvers';
import { typingIndicatorsGqlMutations, typingIndicatorsGqlTypeDefs } from '@/server/resolvers/typingIndicatorsResolvers';
import { acceptCoauthorRequestMutations, acceptCoauthorRequestTypeDefs } from '@/server/acceptCoauthorRequest';
import { bookmarkGqlMutations, bookmarkGqlTypeDefs } from '@/server/bookmarkMutation';
import { hidePostGqlMutations, hidePostGqlTypeDefs } from '@/server/hidePostMutation';
import { markAsUnreadMutations, markAsUnreadTypeDefs } from '@/server/markAsUnread';
import { cronGraphQLMutations, cronGraphQLQueries, cronGraphQLTypeDefs } from '@/server/rss-integration/cron';
import { partiallyReadSequencesMutations, partiallyReadSequencesTypeDefs } from '@/server/partiallyReadSequences';
import { jargonTermsGraphQLMutations, jargonTermsGraphQLTypeDefs } from '@/server/resolvers/jargonResolvers/jargonTermMutations';
import { rsvpToEventsMutations, rsvpToEventsTypeDefs } from '@/server/rsvpToEvent';
import { siteAdminMetadataGraphQLQueries, siteAdminMetadataGraphQLTypeDefs } from '@/server/siteAdminMetadata';
import { tagsGqlMutations, tagsGqlTypeDefs } from '@/server/tagging/tagsGraphQL';
import { analyticsEventGraphQLMutations, analyticsEventTypeDefs } from '@/server/analytics/serverAnalyticsWriter';
import { usersGraphQLQueries, usersGraphQLTypeDefs } from '@/server/collections/users/collection';
import { elasticGqlMutations, elasticGqlQueries, elasticGqlTypeDefs } from '@/server/search/elastic/elasticGraphQL';
import { emailTokensGraphQLMutations, emailTokensGraphQLTypeDefs } from '@/server/emails/emailTokens';
import { fmCrosspostGraphQLMutations, fmCrosspostGraphQLQueries, fmCrosspostGraphQLTypeDefs } from '@/server/fmCrosspost/resolvers';
import { diffGqlQueries, diffGqlTypeDefs } from '@/server/resolvers/diffResolvers';
import { recommendationsGqlMutations, recommendationsGqlTypeDefs } from '@/server/recommendations/mutations';
import { extraPostResolversGraphQLMutations, extraPostResolversGraphQLTypeDefs } from '@/server/posts/graphql';
import { generateCoverImagesForPostGraphQLMutations, generateCoverImagesForPostGraphQLTypeDefs, flipSplashArtImageGraphQLMutations, flipSplashArtImageGraphQLTypeDefs } from '@/server/resolvers/aiArtResolvers/coverImageMutations';
import { elicitQuestionPredictionsGraphQLTypeDefs } from '@/lib/collections/elicitQuestionPredictions/newSchema';

// Collection imports
import { graphqlAdvisorRequestQueryTypeDefs, advisorRequestGqlQueryHandlers, advisorRequestGqlFieldResolvers } from "@/server/collections/advisorRequests/queries";
import { graphqlArbitalCachesQueryTypeDefs, arbitalCachesGqlFieldResolvers } from "@/server/collections/arbitalCache/queries";
import { graphqlArbitalTagContentRelQueryTypeDefs, arbitalTagContentRelGqlQueryHandlers, arbitalTagContentRelGqlFieldResolvers } from "@/server/collections/arbitalTagContentRels/queries";
import { graphqlAutomatedContentEvaluationQueryTypeDefs, automatedContentEvaluationGqlFieldResolvers } from "@/server/collections/automatedContentEvaluations/queries";
import { graphqlBanQueryTypeDefs, banGqlQueryHandlers, banGqlFieldResolvers } from "@/server/collections/bans/queries";
import { graphqlBookQueryTypeDefs, bookGqlQueryHandlers, bookGqlFieldResolvers } from "@/server/collections/books/queries";
import { graphqlChapterQueryTypeDefs, chapterGqlQueryHandlers, chapterGqlFieldResolvers } from "@/server/collections/chapters/queries";
import { graphqlCkEditorUserSessionQueryTypeDefs, ckEditorUserSessionGqlQueryHandlers, ckEditorUserSessionGqlFieldResolvers } from "@/server/collections/ckEditorUserSessions/queries";
import { graphqlClientIdQueryTypeDefs, clientIdGqlQueryHandlers, clientIdGqlFieldResolvers } from "@/server/collections/clientIds/queries";
import { graphqlCollectionQueryTypeDefs, collectionGqlQueryHandlers, collectionGqlFieldResolvers } from "@/server/collections/collections/queries";
import { graphqlCommentModeratorActionQueryTypeDefs, commentModeratorActionGqlQueryHandlers, commentModeratorActionGqlFieldResolvers } from "@/server/collections/commentModeratorActions/queries";
import { graphqlCommentQueryTypeDefs, commentGqlQueryHandlers, commentGqlFieldResolvers } from "@/server/collections/comments/queries";
import { graphqlConversationQueryTypeDefs, conversationGqlQueryHandlers, conversationGqlFieldResolvers } from "@/server/collections/conversations/queries";
import { graphqlCronHistoryQueryTypeDefs, cronHistoryGqlFieldResolvers } from "@/server/collections/cronHistories/queries";
import { graphqlCurationEmailQueryTypeDefs, curationEmailGqlFieldResolvers } from "@/server/collections/curationEmails/queries";
import { graphqlCurationNoticeQueryTypeDefs, curationNoticeGqlQueryHandlers, curationNoticeGqlFieldResolvers } from "@/server/collections/curationNotices/queries";
import { graphqlDatabaseMetadataQueryTypeDefs, databaseMetadataGqlFieldResolvers } from "@/server/collections/databaseMetadata/queries";
import { graphqlDebouncerEventsQueryTypeDefs, debouncerEventsGqlFieldResolvers } from "@/server/collections/debouncerEvents/queries";
import { graphqlDialogueCheckQueryTypeDefs, dialogueCheckGqlQueryHandlers, dialogueCheckGqlFieldResolvers } from "@/server/collections/dialogueChecks/queries";
import { graphqlDialogueMatchPreferenceQueryTypeDefs, dialogueMatchPreferenceGqlQueryHandlers, dialogueMatchPreferenceGqlFieldResolvers } from "@/server/collections/dialogueMatchPreferences/queries";
import { graphqlDigestPostQueryTypeDefs, digestPostGqlQueryHandlers, digestPostGqlFieldResolvers } from "@/server/collections/digestPosts/queries";
import { graphqlDigestQueryTypeDefs, digestGqlQueryHandlers, digestGqlFieldResolvers } from "@/server/collections/digests/queries";
import { graphqlElectionCandidateQueryTypeDefs, electionCandidateGqlQueryHandlers, electionCandidateGqlFieldResolvers } from "@/server/collections/electionCandidates/queries";
import { graphqlElectionVoteQueryTypeDefs, electionVoteGqlQueryHandlers, electionVoteGqlFieldResolvers } from "@/server/collections/electionVotes/queries";
import { graphqlElicitQuestionPredictionQueryTypeDefs, elicitQuestionPredictionGqlQueryHandlers, elicitQuestionPredictionGqlFieldResolvers } from "@/server/collections/elicitQuestionPredictions/queries";
import { graphqlElicitQuestionQueryTypeDefs, elicitQuestionGqlQueryHandlers, elicitQuestionGqlFieldResolvers } from "@/server/collections/elicitQuestions/queries";
import { graphqlEmailTokensQueryTypeDefs, emailTokensGqlFieldResolvers } from "@/server/collections/emailTokens/queries";
import { graphqlFeaturedResourceQueryTypeDefs, featuredResourceGqlQueryHandlers, featuredResourceGqlFieldResolvers } from "@/server/collections/featuredResources/queries";
import { graphqlFieldChangeQueryTypeDefs, fieldChangeGqlFieldResolvers } from "@/server/collections/fieldChanges/queries";
import { graphqlForumEventQueryTypeDefs, forumEventGqlQueryHandlers, forumEventGqlFieldResolvers } from "@/server/collections/forumEvents/queries";
import { graphqlGardenCodeQueryTypeDefs, gardenCodeGqlQueryHandlers, gardenCodeGqlFieldResolvers } from "@/server/collections/gardencodes/queries";
import { graphqlGoogleServiceAccountSessionQueryTypeDefs, googleServiceAccountSessionGqlQueryHandlers, googleServiceAccountSessionGqlFieldResolvers } from "@/server/collections/googleServiceAccountSessions/queries";
import { graphqlImagesQueryTypeDefs, imagesGqlFieldResolvers } from "@/server/collections/images/queries";
import { graphqlJargonTermQueryTypeDefs, jargonTermGqlQueryHandlers, jargonTermGqlFieldResolvers } from "@/server/collections/jargonTerms/queries";
import { graphqlLWEventQueryTypeDefs, lweventGqlQueryHandlers, lweventGqlFieldResolvers } from "@/server/collections/lwevents/queries";
import { graphqlLegacyDataQueryTypeDefs, legacyDataGqlFieldResolvers } from "@/server/collections/legacyData/queries";
import { graphqlLlmConversationQueryTypeDefs, llmConversationGqlQueryHandlers, llmConversationGqlFieldResolvers } from "@/server/collections/llmConversations/queries";
import { graphqlLlmMessageQueryTypeDefs, llmMessageGqlFieldResolvers } from "@/server/collections/llmMessages/queries";
import { graphqlLocalgroupQueryTypeDefs, localgroupGqlQueryHandlers, localgroupGqlFieldResolvers } from "@/server/collections/localgroups/queries";
import { graphqlManifoldProbabilitiesCacheQueryTypeDefs, manifoldProbabilitiesCacheGqlFieldResolvers } from "@/server/collections/manifoldProbabilitiesCaches/queries";
import { graphqlMessageQueryTypeDefs, messageGqlQueryHandlers, messageGqlFieldResolvers } from "@/server/collections/messages/queries";
import { graphqlMigrationQueryTypeDefs, migrationGqlFieldResolvers } from "@/server/collections/migrations/queries";
import { graphqlModerationTemplateQueryTypeDefs, moderationTemplateGqlQueryHandlers, moderationTemplateGqlFieldResolvers } from "@/server/collections/moderationTemplates/queries";
import { graphqlModeratorActionQueryTypeDefs, moderatorActionGqlQueryHandlers, moderatorActionGqlFieldResolvers } from "@/server/collections/moderatorActions/queries";
import { graphqlMultiDocumentQueryTypeDefs, multiDocumentGqlQueryHandlers, multiDocumentGqlFieldResolvers } from "@/server/collections/multiDocuments/queries";
import { graphqlNotificationQueryTypeDefs, notificationGqlQueryHandlers, notificationGqlFieldResolvers } from "@/server/collections/notifications/queries";
import { graphqlPageCacheEntryQueryTypeDefs, pageCacheEntryGqlFieldResolvers } from "@/server/collections/pagecache/queries";
import { graphqlPetrovDayActionQueryTypeDefs, petrovDayActionGqlQueryHandlers, petrovDayActionGqlFieldResolvers } from "@/server/collections/petrovDayActions/queries";
import { graphqlPetrovDayLaunchQueryTypeDefs, petrovDayLaunchGqlFieldResolvers } from "@/server/collections/petrovDayLaunchs/queries";
import { graphqlPodcastEpisodeQueryTypeDefs, podcastEpisodeGqlQueryHandlers, podcastEpisodeGqlFieldResolvers } from "@/server/collections/podcastEpisodes/queries";
import { graphqlPodcastQueryTypeDefs, podcastGqlQueryHandlers, podcastGqlFieldResolvers } from "@/server/collections/podcasts/queries";
import { graphqlPostRecommendationQueryTypeDefs, postRecommendationGqlFieldResolvers } from "@/server/collections/postRecommendations/queries";
import { graphqlPostRelationQueryTypeDefs, postRelationGqlQueryHandlers, postRelationGqlFieldResolvers } from "@/server/collections/postRelations/queries";
import { graphqlPostQueryTypeDefs, postGqlQueryHandlers, postGqlFieldResolvers } from "@/server/collections/posts/queries";
import { graphqlRSSFeedQueryTypeDefs, rssfeedGqlQueryHandlers, rssfeedGqlFieldResolvers } from "@/server/collections/rssfeeds/queries";
import { graphqlReadStatusQueryTypeDefs, readStatusGqlFieldResolvers } from "@/server/collections/readStatus/queries";
import { graphqlRecommendationsCacheQueryTypeDefs, recommendationsCacheGqlFieldResolvers } from "@/server/collections/recommendationsCaches/queries";
import { graphqlReportQueryTypeDefs, reportGqlQueryHandlers, reportGqlFieldResolvers } from "@/server/collections/reports/queries";
import { graphqlReviewVoteQueryTypeDefs, reviewVoteGqlQueryHandlers, reviewVoteGqlFieldResolvers } from "@/server/collections/reviewVotes/queries";
import { graphqlReviewWinnerArtQueryTypeDefs, reviewWinnerArtGqlQueryHandlers, reviewWinnerArtGqlFieldResolvers } from "@/server/collections/reviewWinnerArts/queries";
import { graphqlReviewWinnerQueryTypeDefs, reviewWinnerGqlQueryHandlers, reviewWinnerGqlFieldResolvers } from "@/server/collections/reviewWinners/queries";
import { graphqlRevisionQueryTypeDefs, revisionGqlQueryHandlers, revisionGqlFieldResolvers } from "@/server/collections/revisions/queries";
import { graphqlSequenceQueryTypeDefs, sequenceGqlQueryHandlers, sequenceGqlFieldResolvers } from "@/server/collections/sequences/queries";
import { graphqlSessionQueryTypeDefs, sessionGqlFieldResolvers } from "@/server/collections/sessions/queries";
import { graphqlSideCommentCacheQueryTypeDefs, sideCommentCacheGqlFieldResolvers } from "@/server/collections/sideCommentCaches/queries";
import { graphqlSplashArtCoordinateQueryTypeDefs, splashArtCoordinateGqlQueryHandlers, splashArtCoordinateGqlFieldResolvers } from "@/server/collections/splashArtCoordinates/queries";
import { graphqlSpotlightQueryTypeDefs, spotlightGqlQueryHandlers, spotlightGqlFieldResolvers } from "@/server/collections/spotlights/queries";
import { graphqlSubscriptionQueryTypeDefs, subscriptionGqlQueryHandlers, subscriptionGqlFieldResolvers } from "@/server/collections/subscriptions/queries";
import { graphqlSurveyQuestionQueryTypeDefs, surveyQuestionGqlQueryHandlers, surveyQuestionGqlFieldResolvers } from "@/server/collections/surveyQuestions/queries";
import { graphqlSurveyResponseQueryTypeDefs, surveyResponseGqlQueryHandlers, surveyResponseGqlFieldResolvers } from "@/server/collections/surveyResponses/queries";
import { graphqlSurveyScheduleQueryTypeDefs, surveyScheduleGqlQueryHandlers, surveyScheduleGqlFieldResolvers } from "@/server/collections/surveySchedules/queries";
import { graphqlSurveyQueryTypeDefs, surveyGqlQueryHandlers, surveyGqlFieldResolvers } from "@/server/collections/surveys/queries";
import { graphqlTagFlagQueryTypeDefs, tagFlagGqlQueryHandlers, tagFlagGqlFieldResolvers } from "@/server/collections/tagFlags/queries";
import { graphqlTagRelQueryTypeDefs, tagRelGqlQueryHandlers, tagRelGqlFieldResolvers } from "@/server/collections/tagRels/queries";
import { graphqlTagQueryTypeDefs, tagGqlQueryHandlers, tagGqlFieldResolvers } from "@/server/collections/tags/queries";
import { graphqlTweetQueryTypeDefs, tweetGqlFieldResolvers } from "@/server/collections/tweets/queries";
import { graphqlTypingIndicatorQueryTypeDefs, typingIndicatorGqlQueryHandlers, typingIndicatorGqlFieldResolvers } from "@/server/collections/typingIndicators/queries";
import { graphqlUltraFeedEventQueryTypeDefs, ultraFeedEventGqlFieldResolvers } from "@/server/collections/ultraFeedEvents/queries";
import { graphqlUserActivityQueryTypeDefs, userActivityGqlFieldResolvers } from "@/server/collections/useractivities/queries";
import { graphqlUserEAGDetailQueryTypeDefs, userEAGDetailGqlQueryHandlers, userEAGDetailGqlFieldResolvers } from "@/server/collections/userEAGDetails/queries";
import { graphqlUserJobAdQueryTypeDefs, userJobAdGqlQueryHandlers, userJobAdGqlFieldResolvers } from "@/server/collections/userJobAds/queries";
import { graphqlUserMostValuablePostQueryTypeDefs, userMostValuablePostGqlQueryHandlers, userMostValuablePostGqlFieldResolvers } from "@/server/collections/userMostValuablePosts/queries";
import { graphqlUserRateLimitQueryTypeDefs, userRateLimitGqlQueryHandlers, userRateLimitGqlFieldResolvers } from "@/server/collections/userRateLimits/queries";
import { graphqlUserTagRelQueryTypeDefs, userTagRelGqlQueryHandlers, userTagRelGqlFieldResolvers } from "@/server/collections/userTagRels/queries";
import { graphqlUserQueryTypeDefs, userGqlQueryHandlers, userGqlFieldResolvers } from "@/server/collections/users/queries";
import { graphqlVoteQueryTypeDefs, voteGqlQueryHandlers, voteGqlFieldResolvers } from "@/server/collections/votes/queries";
import { createAdvisorRequestGqlMutation, updateAdvisorRequestGqlMutation, graphqlAdvisorRequestTypeDefs } from "@/server/collections/advisorRequests/mutations";
import { createBookGqlMutation, updateBookGqlMutation, graphqlBookTypeDefs } from "@/server/collections/books/mutations";
import { createChapterGqlMutation, updateChapterGqlMutation, graphqlChapterTypeDefs } from "@/server/collections/chapters/mutations";
import { createCollectionGqlMutation, updateCollectionGqlMutation, graphqlCollectionTypeDefs } from "@/server/collections/collections/mutations";
import { createCommentModeratorActionGqlMutation, updateCommentModeratorActionGqlMutation, graphqlCommentModeratorActionTypeDefs } from "@/server/collections/commentModeratorActions/mutations";
import { createCommentGqlMutation, updateCommentGqlMutation, graphqlCommentTypeDefs } from "@/server/collections/comments/mutations";
import { createConversationGqlMutation, updateConversationGqlMutation, graphqlConversationTypeDefs } from "@/server/collections/conversations/mutations";
import { createCurationNoticeGqlMutation, updateCurationNoticeGqlMutation, graphqlCurationNoticeTypeDefs } from "@/server/collections/curationNotices/mutations";
import { createDigestPostGqlMutation, updateDigestPostGqlMutation, graphqlDigestPostTypeDefs } from "@/server/collections/digestPosts/mutations";
import { createDigestGqlMutation, updateDigestGqlMutation, graphqlDigestTypeDefs } from "@/server/collections/digests/mutations";
import { createElectionCandidateGqlMutation, updateElectionCandidateGqlMutation, graphqlElectionCandidateTypeDefs } from "@/server/collections/electionCandidates/mutations";
import { createElectionVoteGqlMutation, updateElectionVoteGqlMutation, graphqlElectionVoteTypeDefs } from "@/server/collections/electionVotes/mutations";
import { createElicitQuestionGqlMutation, updateElicitQuestionGqlMutation, graphqlElicitQuestionTypeDefs } from "@/server/collections/elicitQuestions/mutations";
import { createForumEventGqlMutation, updateForumEventGqlMutation, graphqlForumEventTypeDefs } from "@/server/collections/forumEvents/mutations";
import { createJargonTermGqlMutation, updateJargonTermGqlMutation, graphqlJargonTermTypeDefs } from "@/server/collections/jargonTerms/mutations";
import { createLWEventGqlMutation, graphqlLWEventTypeDefs } from "@/server/collections/lwevents/mutations";
import { updateLlmConversationGqlMutation, graphqlLlmConversationTypeDefs } from "@/server/collections/llmConversations/mutations";
import { createLocalgroupGqlMutation, updateLocalgroupGqlMutation, graphqlLocalgroupTypeDefs } from "@/server/collections/localgroups/mutations";
import { createMessageGqlMutation, updateMessageGqlMutation, graphqlMessageTypeDefs } from "@/server/collections/messages/mutations";
import { createModerationTemplateGqlMutation, updateModerationTemplateGqlMutation, graphqlModerationTemplateTypeDefs } from "@/server/collections/moderationTemplates/mutations";
import { createModeratorActionGqlMutation, updateModeratorActionGqlMutation, graphqlModeratorActionTypeDefs } from "@/server/collections/moderatorActions/mutations";
import { createMultiDocumentGqlMutation, updateMultiDocumentGqlMutation, graphqlMultiDocumentTypeDefs } from "@/server/collections/multiDocuments/mutations";
import { updateNotificationGqlMutation, graphqlNotificationTypeDefs } from "@/server/collections/notifications/mutations";
import { createPetrovDayActionGqlMutation, graphqlPetrovDayActionTypeDefs } from "@/server/collections/petrovDayActions/mutations";
import { createPodcastEpisodeGqlMutation, graphqlPodcastEpisodeTypeDefs } from "@/server/collections/podcastEpisodes/mutations";
import { createPostGqlMutation, updatePostGqlMutation, graphqlPostTypeDefs } from "@/server/collections/posts/mutations";
import { createRSSFeedGqlMutation, updateRSSFeedGqlMutation, graphqlRSSFeedTypeDefs } from "@/server/collections/rssfeeds/mutations";
import { createReportGqlMutation, updateReportGqlMutation, graphqlReportTypeDefs } from "@/server/collections/reports/mutations";
import { updateRevisionGqlMutation, graphqlRevisionTypeDefs } from "@/server/collections/revisions/mutations";
import { createSequenceGqlMutation, updateSequenceGqlMutation, graphqlSequenceTypeDefs } from "@/server/collections/sequences/mutations";
import { createSplashArtCoordinateGqlMutation, graphqlSplashArtCoordinateTypeDefs } from "@/server/collections/splashArtCoordinates/mutations";
import { createSpotlightGqlMutation, updateSpotlightGqlMutation, graphqlSpotlightTypeDefs } from "@/server/collections/spotlights/mutations";
import { createSubscriptionGqlMutation, graphqlSubscriptionTypeDefs } from "@/server/collections/subscriptions/mutations";
import { createSurveyQuestionGqlMutation, updateSurveyQuestionGqlMutation, graphqlSurveyQuestionTypeDefs } from "@/server/collections/surveyQuestions/mutations";
import { createSurveyResponseGqlMutation, updateSurveyResponseGqlMutation, graphqlSurveyResponseTypeDefs } from "@/server/collections/surveyResponses/mutations";
import { createSurveyScheduleGqlMutation, updateSurveyScheduleGqlMutation, graphqlSurveyScheduleTypeDefs } from "@/server/collections/surveySchedules/mutations";
import { createSurveyGqlMutation, updateSurveyGqlMutation, graphqlSurveyTypeDefs } from "@/server/collections/surveys/mutations";
import { createTagFlagGqlMutation, updateTagFlagGqlMutation, graphqlTagFlagTypeDefs } from "@/server/collections/tagFlags/mutations";
import { createTagGqlMutation, updateTagGqlMutation, graphqlTagTypeDefs } from "@/server/collections/tags/mutations";
import { createUltraFeedEventGqlMutation, graphqlUltraFeedEventTypeDefs } from "@/server/collections/ultraFeedEvents/mutations";
import { createUserEAGDetailGqlMutation, updateUserEAGDetailGqlMutation, graphqlUserEAGDetailTypeDefs } from "@/server/collections/userEAGDetails/mutations";
import { createUserJobAdGqlMutation, updateUserJobAdGqlMutation, graphqlUserJobAdTypeDefs } from "@/server/collections/userJobAds/mutations";
import { createUserMostValuablePostGqlMutation, updateUserMostValuablePostGqlMutation, graphqlUserMostValuablePostTypeDefs } from "@/server/collections/userMostValuablePosts/mutations";
import { createUserRateLimitGqlMutation, updateUserRateLimitGqlMutation, graphqlUserRateLimitTypeDefs } from "@/server/collections/userRateLimits/mutations";
import { createUserTagRelGqlMutation, updateUserTagRelGqlMutation, graphqlUserTagRelTypeDefs } from "@/server/collections/userTagRels/mutations";
import { createUserGqlMutation, updateUserGqlMutation, graphqlUserTypeDefs } from "@/server/collections/users/mutations";


const selectorInput = gql`
  input SelectorInput {
    _id: String
    documentId: String
  }
`;

export const typeDefs = gql`
  type Query
  type Mutation
  scalar JSON
  scalar Date
  ${selectorInput}
  ${notificationTypeDefs}
  ${arbitalLinkedPagesTypeDefs}
  ${additionalPostsTypeDefs}
  ${additionalRevisionsTypeDefs}
  ${additionalTagsTypeDefs}
  ${additionalUsersTypeDefs}
  ${recommendationsTypeDefs}
  ${userResolversTypeDefs}
  # # Vote typedefs
  ${postVoteTypeDefs}
  ${commentVoteTypeDefs}
  ${tagRelVoteTypeDefs}
  ${revisionVoteTypeDefs}
  ${electionCandidateVoteTypeDefs}
  ${tagVoteTypeDefs}
  ${multiDocumentVoteTypeDefs}
  ${commentTypeDefs}
  # # End vote typedefs
  ${karmaChangesTypeDefs}
  ${analyticsGraphQLTypeDefs}
  ${arbitalGraphQLTypeDefs}
  ${elicitPredictionsGraphQLTypeDefs}
  ${notificationResolversGqlTypeDefs}
  ${lightcone2024FundraiserGraphQLTypeDefs}
  ${petrovDay2024GraphQLTypeDefs}
  ${petrovDayLaunchGraphQLTypeDefs}
  ${reviewVoteGraphQLTypeDefs}
  ${postGqlTypeDefs}
  ${adminGqlTypeDefs}
  ${alignmentForumTypeDefs}
  ${allTagsActivityFeedGraphQLTypeDefs}
  ${recentDiscussionFeedGraphQLTypeDefs}
  ${subscribedUsersFeedGraphQLTypeDefs}
  ${tagHistoryFeedGraphQLTypeDefs}
  ${subForumFeedGraphQLTypeDefs}
  ${conversationGqlTypeDefs}
  ${surveyResolversGraphQLTypeDefs}
  ${tagGraphQLTypeDefs}
  ${wrappedResolversGqlTypeDefs}
  ${databaseSettingsGqlTypeDefs}
  ${siteGraphQLTypeDefs}
  ${loginDataGraphQLTypeDefs}
  ${dialogueMessageGqlTypeDefs}
  ${forumEventGqlTypeDefs}
  ${ckEditorCallbacksGraphQLTypeDefs}
  ${migrationsDashboardGraphQLTypeDefs}
  ${reviewWinnerGraphQLTypeDefs}
  ${googleVertexGqlTypeDefs}
  ${importUrlAsDraftPostTypeDefs}
  ${revisionResolversGraphQLTypeDefs}
  ${moderationGqlTypeDefs}
  ${multiDocumentTypeDefs}
  ${spotlightGqlTypeDefs}
  ${typingIndicatorsGqlTypeDefs}
  ${acceptCoauthorRequestTypeDefs}
  ${bookmarkGqlTypeDefs}
  ${hidePostGqlTypeDefs}
  ${markAsUnreadTypeDefs}
  ${cronGraphQLTypeDefs}
  ${partiallyReadSequencesTypeDefs}
  ${jargonTermsGraphQLTypeDefs}
  ${rsvpToEventsTypeDefs}
  ${siteAdminMetadataGraphQLTypeDefs}
  ${tagsGqlTypeDefs}
  ${analyticsEventTypeDefs}
  ${usersGraphQLTypeDefs}
  ${elasticGqlTypeDefs}
  ${emailTokensGraphQLTypeDefs}
  ${fmCrosspostGraphQLTypeDefs}
  ${diffGqlTypeDefs}
  ${recommendationsGqlTypeDefs}
  ${extraPostResolversGraphQLTypeDefs}
  ${ultraFeedGraphQLTypeDefs}
  ${generateCoverImagesForPostGraphQLTypeDefs}
  ${flipSplashArtImageGraphQLTypeDefs}
  ${elicitQuestionPredictionsGraphQLTypeDefs}
  ## CRUD Query typedefs
  ${graphqlAdvisorRequestQueryTypeDefs}
  ${graphqlArbitalCachesQueryTypeDefs}
  ${graphqlArbitalTagContentRelQueryTypeDefs}
  ${graphqlAutomatedContentEvaluationQueryTypeDefs}
  ${graphqlBanQueryTypeDefs}
  ${graphqlBookQueryTypeDefs}
  ${graphqlChapterQueryTypeDefs}
  ${graphqlCkEditorUserSessionQueryTypeDefs}
  ${graphqlClientIdQueryTypeDefs}
  ${graphqlCollectionQueryTypeDefs}
  ${graphqlCommentModeratorActionQueryTypeDefs}
  ${graphqlCommentQueryTypeDefs}
  ${graphqlConversationQueryTypeDefs}
  ${graphqlCronHistoryQueryTypeDefs}
  ${graphqlCurationEmailQueryTypeDefs}
  ${graphqlCurationNoticeQueryTypeDefs}
  ${graphqlDatabaseMetadataQueryTypeDefs}
  ${graphqlDebouncerEventsQueryTypeDefs}
  ${graphqlDialogueCheckQueryTypeDefs}
  ${graphqlDialogueMatchPreferenceQueryTypeDefs}
  ${graphqlDigestPostQueryTypeDefs}
  ${graphqlDigestQueryTypeDefs}
  ${graphqlElectionCandidateQueryTypeDefs}
  ${graphqlElectionVoteQueryTypeDefs}
  ${graphqlElicitQuestionPredictionQueryTypeDefs}
  ${graphqlElicitQuestionQueryTypeDefs}
  ${graphqlEmailTokensQueryTypeDefs}
  ${graphqlFeaturedResourceQueryTypeDefs}
  ${graphqlFieldChangeQueryTypeDefs}
  ${graphqlForumEventQueryTypeDefs}
  ${graphqlGardenCodeQueryTypeDefs}
  ${graphqlGoogleServiceAccountSessionQueryTypeDefs}
  ${graphqlImagesQueryTypeDefs}
  ${graphqlJargonTermQueryTypeDefs}
  ${graphqlLWEventQueryTypeDefs}
  ${graphqlLegacyDataQueryTypeDefs}
  ${graphqlLlmConversationQueryTypeDefs}
  ${graphqlLlmMessageQueryTypeDefs}
  ${graphqlLocalgroupQueryTypeDefs}
  ${graphqlManifoldProbabilitiesCacheQueryTypeDefs}
  ${graphqlMessageQueryTypeDefs}
  ${graphqlMigrationQueryTypeDefs}
  ${graphqlModerationTemplateQueryTypeDefs}
  ${graphqlModeratorActionQueryTypeDefs}
  ${graphqlMultiDocumentQueryTypeDefs}
  ${graphqlNotificationQueryTypeDefs}
  ${graphqlPageCacheEntryQueryTypeDefs}
  ${graphqlPetrovDayActionQueryTypeDefs}
  ${graphqlPetrovDayLaunchQueryTypeDefs}
  ${graphqlPodcastEpisodeQueryTypeDefs}
  ${graphqlPodcastQueryTypeDefs}
  ${graphqlPostRecommendationQueryTypeDefs}
  ${graphqlPostRelationQueryTypeDefs}
  ${graphqlPostQueryTypeDefs}
  ${graphqlRSSFeedQueryTypeDefs}
  ${graphqlReadStatusQueryTypeDefs}
  ${graphqlRecommendationsCacheQueryTypeDefs}
  ${graphqlReportQueryTypeDefs}
  ${graphqlReviewVoteQueryTypeDefs}
  ${graphqlReviewWinnerArtQueryTypeDefs}
  ${graphqlReviewWinnerQueryTypeDefs}
  ${graphqlRevisionQueryTypeDefs}
  ${graphqlSequenceQueryTypeDefs}
  ${graphqlSessionQueryTypeDefs}
  ${graphqlSideCommentCacheQueryTypeDefs}
  ${graphqlSplashArtCoordinateQueryTypeDefs}
  ${graphqlSpotlightQueryTypeDefs}
  ${graphqlSubscriptionQueryTypeDefs}
  ${graphqlSurveyQuestionQueryTypeDefs}
  ${graphqlSurveyResponseQueryTypeDefs}
  ${graphqlSurveyScheduleQueryTypeDefs}
  ${graphqlSurveyQueryTypeDefs}
  ${graphqlTagFlagQueryTypeDefs}
  ${graphqlTagRelQueryTypeDefs}
  ${graphqlTagQueryTypeDefs}
  ${graphqlTweetQueryTypeDefs}
  ${graphqlTypingIndicatorQueryTypeDefs}
  ${graphqlUltraFeedEventQueryTypeDefs}
  ${graphqlUserActivityQueryTypeDefs}
  ${graphqlUserEAGDetailQueryTypeDefs}
  ${graphqlUserJobAdQueryTypeDefs}
  ${graphqlUserMostValuablePostQueryTypeDefs}
  ${graphqlUserRateLimitQueryTypeDefs}
  ${graphqlUserTagRelQueryTypeDefs}
  ${graphqlUserQueryTypeDefs}
  ${graphqlVoteQueryTypeDefs}
  ## CRUD Mutation and input typedefs
  ${graphqlAdvisorRequestTypeDefs}
  ${graphqlBookTypeDefs}
  ${graphqlChapterTypeDefs}
  ${graphqlCollectionTypeDefs}
  ${graphqlCommentModeratorActionTypeDefs}
  ${graphqlCommentTypeDefs}
  ${graphqlConversationTypeDefs}
  ${graphqlCurationNoticeTypeDefs}
  ${graphqlDigestPostTypeDefs}
  ${graphqlDigestTypeDefs}
  ${graphqlElectionCandidateTypeDefs}
  ${graphqlElectionVoteTypeDefs}
  ${graphqlElicitQuestionTypeDefs}
  ${graphqlForumEventTypeDefs}
  ${graphqlJargonTermTypeDefs}
  ${graphqlLWEventTypeDefs}
  ${graphqlLlmConversationTypeDefs}
  ${graphqlLocalgroupTypeDefs}
  ${graphqlMessageTypeDefs}
  ${graphqlModerationTemplateTypeDefs}
  ${graphqlModeratorActionTypeDefs}
  ${graphqlMultiDocumentTypeDefs}
  ${graphqlNotificationTypeDefs}
  ${graphqlPetrovDayActionTypeDefs}
  ${graphqlPodcastEpisodeTypeDefs}
  ${graphqlPostTypeDefs}
  ${graphqlRSSFeedTypeDefs}
  ${graphqlReportTypeDefs}
  ${graphqlRevisionTypeDefs}
  ${graphqlSequenceTypeDefs}
  ${graphqlSplashArtCoordinateTypeDefs}
  ${graphqlSpotlightTypeDefs}
  ${graphqlSubscriptionTypeDefs}
  ${graphqlSurveyQuestionTypeDefs}
  ${graphqlSurveyResponseTypeDefs}
  ${graphqlSurveyScheduleTypeDefs}
  ${graphqlSurveyTypeDefs}
  ${graphqlTagFlagTypeDefs}
  ${graphqlTagTypeDefs}
  ${graphqlUltraFeedEventTypeDefs}
  ${graphqlUserEAGDetailTypeDefs}
  ${graphqlUserJobAdTypeDefs}
  ${graphqlUserMostValuablePostTypeDefs}
  ${graphqlUserRateLimitTypeDefs}
  ${graphqlUserTagRelTypeDefs}
  ${graphqlUserTypeDefs}
`


export const resolvers = {
  JSON: GraphQLJSON,
  Date: GraphQLDate,
  Query: {
    ...userResolversQueries,
    ...recommendationsQueries,
    ...notificationQueries,
    ...commentQueries,
    ...analyticsGraphQLQueries,
    ...arbitalGraphQLQueries,
    ...elicitPredictionsGraphQLQueries,
    ...notificationResolversGqlQueries,
    ...elicitPredictionsGraphQLQueries,
    ...lightcone2024FundraiserGraphQLQueries,
    ...petrovDay2024GraphQLQueries,
    ...petrovDayLaunchGraphQLQueries,
    ...reviewVoteGraphQLQueries,
    ...postGqlQueries,
    ...allTagsActivityFeedGraphQLQueries,
    ...recentDiscussionFeedGraphQLQueries,
    ...subscribedUsersFeedGraphQLQueries,
    ...tagHistoryFeedGraphQLQueries,
    ...subForumFeedGraphQLQueries,
    ...wrappedResolversGraphQLQueries,
    ...siteGraphQLQueries,
    ...dialogueMessageGqlQueries,
    ...getLinkSharedPostGraphQLQueries,
    ...migrationsDashboardGraphQLQueries,
    ...reviewWinnerGraphQLQueries,  
    ...revisionResolversGraphQLQueries,
    ...moderationGqlQueries,
    ...tagResolversGraphQLQueries,
    ...cronGraphQLQueries,
    ...siteAdminMetadataGraphQLQueries,
    ...usersGraphQLQueries,
    ...elasticGqlQueries,
    ...fmCrosspostGraphQLQueries,
    ...diffGqlQueries,
    ...surveyResolversGraphQLQueries,
    ...tagResolversGraphQLQueries,
    ...ultraFeedGraphQLQueries,

    // CRUD Query Handlers
    ...advisorRequestGqlQueryHandlers,
    ...arbitalTagContentRelGqlQueryHandlers,
    ...banGqlQueryHandlers,
    ...bookGqlQueryHandlers,
    ...chapterGqlQueryHandlers,
    ...ckEditorUserSessionGqlQueryHandlers,
    ...clientIdGqlQueryHandlers,
    ...collectionGqlQueryHandlers,
    ...commentModeratorActionGqlQueryHandlers,
    ...commentGqlQueryHandlers,
    ...conversationGqlQueryHandlers,
    ...curationNoticeGqlQueryHandlers,
    ...dialogueCheckGqlQueryHandlers,
    ...dialogueMatchPreferenceGqlQueryHandlers,
    ...digestPostGqlQueryHandlers,
    ...digestGqlQueryHandlers,
    ...electionCandidateGqlQueryHandlers,
    ...electionVoteGqlQueryHandlers,
    ...elicitQuestionPredictionGqlQueryHandlers,
    ...elicitQuestionGqlQueryHandlers,
    ...featuredResourceGqlQueryHandlers,
    ...forumEventGqlQueryHandlers,
    ...gardenCodeGqlQueryHandlers,
    ...googleServiceAccountSessionGqlQueryHandlers,
    ...jargonTermGqlQueryHandlers,
    ...lweventGqlQueryHandlers,
    ...llmConversationGqlQueryHandlers,
    ...localgroupGqlQueryHandlers,
    ...messageGqlQueryHandlers,
    ...moderationTemplateGqlQueryHandlers,
    ...moderatorActionGqlQueryHandlers,
    ...multiDocumentGqlQueryHandlers,
    ...notificationGqlQueryHandlers,
    ...petrovDayActionGqlQueryHandlers,
    ...podcastEpisodeGqlQueryHandlers,
    ...podcastGqlQueryHandlers,
    ...postRelationGqlQueryHandlers,
    ...postGqlQueryHandlers,
    ...rssfeedGqlQueryHandlers,
    ...reportGqlQueryHandlers,
    ...reviewVoteGqlQueryHandlers,
    ...reviewWinnerArtGqlQueryHandlers,
    ...reviewWinnerGqlQueryHandlers,
    ...revisionGqlQueryHandlers,
    ...sequenceGqlQueryHandlers,
    ...splashArtCoordinateGqlQueryHandlers,
    ...spotlightGqlQueryHandlers,
    ...subscriptionGqlQueryHandlers,
    ...surveyQuestionGqlQueryHandlers,
    ...surveyResponseGqlQueryHandlers,
    ...surveyScheduleGqlQueryHandlers,
    ...surveyGqlQueryHandlers,
    ...tagFlagGqlQueryHandlers,
    ...tagRelGqlQueryHandlers,
    ...tagGqlQueryHandlers,
    ...typingIndicatorGqlQueryHandlers,
    ...userEAGDetailGqlQueryHandlers,
    ...userJobAdGqlQueryHandlers,
    ...userMostValuablePostGqlQueryHandlers,
    ...userRateLimitGqlQueryHandlers,
    ...userTagRelGqlQueryHandlers,
    ...userGqlQueryHandlers,
    ...voteGqlQueryHandlers,
  },
  Mutation: {
    ...userResolversMutations,
    ...postVoteMutations,
    ...commentVoteMutations,
    ...tagRelVoteMutations,
    ...revisionVoteMutations,
    ...electionCandidateVoteMutations,
    ...tagVoteMutations,
    ...multiDocumentVoteMutations,
    ...commentMutations,
    ...notificationResolversGqlMutations,
    ...elicitPredictionsGraphQLMutations,
    ...petrovDayLaunchGraphQLMutations,
    ...reviewVoteGraphQLMutations,
    ...postGqlMutations,
    ...adminGqlMutations,
    ...alignmentForumMutations,
    ...conversationGqlMutations,
    ...databaseSettingsGqlMutations,
    ...forumEventGqlMutations,
    ...googleVertexGqlMutations,
    ...ckEditorCallbacksGraphQLMutations,
    ...importUrlAsDraftPostGqlMutation,
    ...revisionResolversGraphQLMutations,
    ...moderationGqlMutations,
    ...multiDocumentMutations,
    ...spotlightGqlMutations,
    ...typingIndicatorsGqlMutations,
    ...tagResolversGraphQLMutations,
    ...acceptCoauthorRequestMutations,
    ...bookmarkGqlMutations,
    ...hidePostGqlMutations,
    ...markAsUnreadMutations,
    ...cronGraphQLMutations,
    ...partiallyReadSequencesMutations,
    ...jargonTermsGraphQLMutations,
    ...generateCoverImagesForPostGraphQLMutations,
    ...flipSplashArtImageGraphQLMutations,
    ...rsvpToEventsMutations,
    ...tagsGqlMutations,
    ...analyticsEventGraphQLMutations,
    ...elasticGqlMutations,
    ...emailTokensGraphQLMutations,
    ...fmCrosspostGraphQLMutations,
    ...surveyResolversGraphQLMutations, 
    ...recommendationsGqlMutations,
    ...extraPostResolversGraphQLMutations,
    ...loginDataGraphQLMutations,

    // CRUD Mutation Handlers
    createAdvisorRequest: createAdvisorRequestGqlMutation,
    updateAdvisorRequest: updateAdvisorRequestGqlMutation,
    createBook: createBookGqlMutation,
    updateBook: updateBookGqlMutation,
    createChapter: createChapterGqlMutation,
    updateChapter: updateChapterGqlMutation,
    createCollection: createCollectionGqlMutation,
    updateCollection: updateCollectionGqlMutation,
    createCommentModeratorAction: createCommentModeratorActionGqlMutation,
    updateCommentModeratorAction: updateCommentModeratorActionGqlMutation,
    createComment: createCommentGqlMutation,
    updateComment: updateCommentGqlMutation,
    createConversation: createConversationGqlMutation,
    updateConversation: updateConversationGqlMutation,
    createCurationNotice: createCurationNoticeGqlMutation,
    updateCurationNotice: updateCurationNoticeGqlMutation,
    createDigestPost: createDigestPostGqlMutation,
    updateDigestPost: updateDigestPostGqlMutation,
    createDigest: createDigestGqlMutation,
    updateDigest: updateDigestGqlMutation,
    createElectionCandidate: createElectionCandidateGqlMutation,
    updateElectionCandidate: updateElectionCandidateGqlMutation,
    createElectionVote: createElectionVoteGqlMutation,
    updateElectionVote: updateElectionVoteGqlMutation,
    createElicitQuestion: createElicitQuestionGqlMutation,
    updateElicitQuestion: updateElicitQuestionGqlMutation,
    createForumEvent: createForumEventGqlMutation,
    updateForumEvent: updateForumEventGqlMutation,
    createJargonTerm: createJargonTermGqlMutation,
    updateJargonTerm: updateJargonTermGqlMutation,
    createLWEvent: createLWEventGqlMutation,
    updateLlmConversation: updateLlmConversationGqlMutation,
    createLocalgroup: createLocalgroupGqlMutation,
    updateLocalgroup: updateLocalgroupGqlMutation,
    createMessage: createMessageGqlMutation,
    updateMessage: updateMessageGqlMutation,
    createModerationTemplate: createModerationTemplateGqlMutation,
    updateModerationTemplate: updateModerationTemplateGqlMutation,
    createModeratorAction: createModeratorActionGqlMutation,
    updateModeratorAction: updateModeratorActionGqlMutation,
    createMultiDocument: createMultiDocumentGqlMutation,
    updateMultiDocument: updateMultiDocumentGqlMutation,
    updateNotification: updateNotificationGqlMutation,
    createPetrovDayAction: createPetrovDayActionGqlMutation,
    createPodcastEpisode: createPodcastEpisodeGqlMutation,
    createPost: createPostGqlMutation,
    updatePost: updatePostGqlMutation,
    createRSSFeed: createRSSFeedGqlMutation,
    updateRSSFeed: updateRSSFeedGqlMutation,
    createReport: createReportGqlMutation,
    updateReport: updateReportGqlMutation,
    updateRevision: updateRevisionGqlMutation,
    createSequence: createSequenceGqlMutation,
    updateSequence: updateSequenceGqlMutation,
    createSplashArtCoordinate: createSplashArtCoordinateGqlMutation,
    createSpotlight: createSpotlightGqlMutation,
    updateSpotlight: updateSpotlightGqlMutation,
    createSubscription: createSubscriptionGqlMutation,
    createSurveyQuestion: createSurveyQuestionGqlMutation,
    updateSurveyQuestion: updateSurveyQuestionGqlMutation,
    createSurveyResponse: createSurveyResponseGqlMutation,
    updateSurveyResponse: updateSurveyResponseGqlMutation,
    createSurveySchedule: createSurveyScheduleGqlMutation,
    updateSurveySchedule: updateSurveyScheduleGqlMutation,
    createSurvey: createSurveyGqlMutation,
    updateSurvey: updateSurveyGqlMutation,
    createTagFlag: createTagFlagGqlMutation,
    updateTagFlag: updateTagFlagGqlMutation,
    createTag: createTagGqlMutation,
    updateTag: updateTagGqlMutation,
    createUltraFeedEvent: createUltraFeedEventGqlMutation,
    createUserEAGDetail: createUserEAGDetailGqlMutation,
    updateUserEAGDetail: updateUserEAGDetailGqlMutation,
    createUserJobAd: createUserJobAdGqlMutation,
    updateUserJobAd: updateUserJobAdGqlMutation,
    createUserMostValuablePost: createUserMostValuablePostGqlMutation,
    updateUserMostValuablePost: updateUserMostValuablePostGqlMutation,
    createUserRateLimit: createUserRateLimitGqlMutation,
    updateUserRateLimit: updateUserRateLimitGqlMutation,
    createUserTagRel: createUserTagRelGqlMutation,
    updateUserTagRel: updateUserTagRelGqlMutation,
    createUser: createUserGqlMutation,
    updateUser: updateUserGqlMutation,
  },
  ...karmaChangesFieldResolvers,
  ...elicitPredictionsGraphQLFieldResolvers,
  // Collection Field Resolvers
  ...advisorRequestGqlFieldResolvers,
  ...arbitalCachesGqlFieldResolvers,
  ...arbitalTagContentRelGqlFieldResolvers,
  ...automatedContentEvaluationGqlFieldResolvers,
  ...banGqlFieldResolvers,
  ...bookGqlFieldResolvers,
  ...chapterGqlFieldResolvers,
  ...ckEditorUserSessionGqlFieldResolvers,
  ...clientIdGqlFieldResolvers,
  ...collectionGqlFieldResolvers,
  ...commentModeratorActionGqlFieldResolvers,
  ...commentGqlFieldResolvers,
  ...conversationGqlFieldResolvers,
  ...cronHistoryGqlFieldResolvers,
  ...curationEmailGqlFieldResolvers,
  ...curationNoticeGqlFieldResolvers,
  ...databaseMetadataGqlFieldResolvers,
  ...debouncerEventsGqlFieldResolvers,
  ...dialogueCheckGqlFieldResolvers,
  ...dialogueMatchPreferenceGqlFieldResolvers,
  ...digestPostGqlFieldResolvers,
  ...digestGqlFieldResolvers,
  ...electionCandidateGqlFieldResolvers,
  ...electionVoteGqlFieldResolvers,
  ...elicitQuestionPredictionGqlFieldResolvers,
  ...elicitQuestionGqlFieldResolvers,
  ...emailTokensGqlFieldResolvers,
  ...featuredResourceGqlFieldResolvers,
  ...fieldChangeGqlFieldResolvers,
  ...forumEventGqlFieldResolvers,
  ...gardenCodeGqlFieldResolvers,
  ...googleServiceAccountSessionGqlFieldResolvers,
  ...imagesGqlFieldResolvers,
  ...jargonTermGqlFieldResolvers,
  ...lweventGqlFieldResolvers,
  ...legacyDataGqlFieldResolvers,
  ...llmConversationGqlFieldResolvers,
  ...llmMessageGqlFieldResolvers,
  ...localgroupGqlFieldResolvers,
  ...manifoldProbabilitiesCacheGqlFieldResolvers,
  ...messageGqlFieldResolvers,
  ...migrationGqlFieldResolvers,
  ...moderationTemplateGqlFieldResolvers,
  ...moderatorActionGqlFieldResolvers,
  ...multiDocumentGqlFieldResolvers,
  ...notificationGqlFieldResolvers,
  ...pageCacheEntryGqlFieldResolvers,
  ...petrovDayActionGqlFieldResolvers,
  ...petrovDayLaunchGqlFieldResolvers,
  ...podcastEpisodeGqlFieldResolvers,
  ...podcastGqlFieldResolvers,
  ...postRecommendationGqlFieldResolvers,
  ...postRelationGqlFieldResolvers,
  ...postGqlFieldResolvers,
  ...rssfeedGqlFieldResolvers,
  ...readStatusGqlFieldResolvers,
  ...recommendationsCacheGqlFieldResolvers,
  ...reportGqlFieldResolvers,
  ...reviewVoteGqlFieldResolvers,
  ...reviewWinnerArtGqlFieldResolvers,
  ...reviewWinnerGqlFieldResolvers,
  ...revisionGqlFieldResolvers,
  ...sequenceGqlFieldResolvers,
  ...sessionGqlFieldResolvers,
  ...sideCommentCacheGqlFieldResolvers,
  ...splashArtCoordinateGqlFieldResolvers,
  ...spotlightGqlFieldResolvers,
  ...subscriptionGqlFieldResolvers,
  ...surveyQuestionGqlFieldResolvers,
  ...surveyResponseGqlFieldResolvers,
  ...surveyScheduleGqlFieldResolvers,
  ...surveyGqlFieldResolvers,
  ...tagFlagGqlFieldResolvers,
  ...tagRelGqlFieldResolvers,
  ...tagGqlFieldResolvers,
  ...tweetGqlFieldResolvers,
  ...typingIndicatorGqlFieldResolvers,
  ...ultraFeedEventGqlFieldResolvers,
  ...userActivityGqlFieldResolvers,
  ...userEAGDetailGqlFieldResolvers,
  ...userJobAdGqlFieldResolvers,
  ...userMostValuablePostGqlFieldResolvers,
  ...userRateLimitGqlFieldResolvers,
  ...userTagRelGqlFieldResolvers,
  ...userGqlFieldResolvers,
  ...voteGqlFieldResolvers,
} satisfies {
  JSON: typeof GraphQLJSON,
  Date: typeof GraphQLDate,
  Query: Record<string, (root: void, args: any, context: ResolverContext, info: GraphQLResolveInfo) => any>,
  Mutation: Record<string, (root: void, args: any, context: ResolverContext) => any>,
  KarmaChanges: { updateFrequency: (root: void, args: any, context: ResolverContext) => any },
  ElicitUser: { lwUser: (root: void, args: any, context: ResolverContext) => any },
};

export type SchemaGraphQLFieldArgument = {name: string, type: string|GraphQLScalarType|null}
export type SchemaGraphQLFieldDescription = {
  description?: string
  name: string
  args?: SchemaGraphQLFieldArgument[]|string|null|undefined
  type: string|GraphQLScalarType|null
  directive?: string
  required?: boolean
};

