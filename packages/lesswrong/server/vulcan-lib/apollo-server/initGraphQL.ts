// Generate GraphQL-syntax schemas from resolvers &c that were set up with
// addGraphQLResolvers &c.

import gql from 'graphql-tag'; 
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLSchema } from 'graphql';
import GraphQLJSON from '@/lib/vendor/graphql-type-json';
import GraphQLDate from './graphql-date';
import { getVoteGraphql } from '@/server/votingGraphQL';
import { graphqlTypeDefs as notificationTypeDefs, graphqlQueries as notificationQueries } from '@/server/notificationBatching';
import { graphqlTypeDefs as arbitalLinkedPagesTypeDefs } from '@/lib/collections/helpers/arbitalLinkedPagesField';
import { graphqlTypeDefs as additionalPostsTypeDefs } from "@/lib/collections/posts/graphqlTypeDefs";
import { graphqlTypeDefs as additionalTagsTypeDefs } from "@/lib/collections/tags/graphqlTypeDefs";
import { graphqlTypeDefs as additionalUsersTypeDefs } from "@/lib/collections/users/graphqlTypeDefs";
import { graphqlTypeDefs as recommendationsTypeDefs, graphqlQueries as recommendationsQueries } from '@/server/recommendations';
import { graphqlTypeDefs as userResolversTypeDefs, graphqlMutations as userResolversMutations, graphqlQueries as userResolversQueries } from '@/server/resolvers/userResolvers';
import { graphqlTypeDefs as commentTypeDefs, graphqlMutations as commentMutations, graphqlQueries as commentQueries } from '@/server/resolvers/commentResolvers'
import { karmaChangesTypeDefs, karmaChangesFieldResolvers } from '@/server/collections/users/karmaChangesGraphQL';
import { analyticsGraphQLQueries, analyticsGraphQLTypeDefs } from '@/server/resolvers/analyticsResolvers';
import { arbitalGraphQLTypeDefs, arbitalGraphQLQueries } from '@/server/resolvers/arbitalPageData';
import { crossSiteLinkPreviewGraphQLQueries, crossSiteLinkPreviewGraphQLTypeDefs } from '@/server/resolvers/linkPreviewResolver';
import { elicitPredictionsGraphQLTypeDefs, elicitPredictionsGraphQLQueries, elicitPredictionsGraphQLFieldResolvers, elicitPredictionsGraphQLMutations } from '@/server/resolvers/elicitPredictions';
import { notificationResolversGqlTypeDefs, notificationResolversGqlQueries, notificationResolversGqlMutations } from '@/server/resolvers/notificationResolvers'
import { lightcone2024FundraiserGraphQLTypeDefs, lightcone2024FundraiserGraphQLQueries } from '@/server/resolvers/lightcone2024FundraiserResolvers';
import { petrovDay2024GraphQLQueries, petrovDay2024GraphQLTypeDefs } from '@/server/resolvers/petrovDay2024Resolvers';
import { petrovDayLaunchGraphQLMutations, petrovDayLaunchGraphQLQueries, petrovDayLaunchGraphQLTypeDefs } from '@/server/resolvers/petrovDayResolvers';
import { reviewVoteGraphQLMutations, reviewVoteGraphQLTypeDefs, reviewVoteGraphQLQueries } from '@/server/resolvers/reviewVoteResolvers';
import { postGqlQueries, postGqlMutations, postGqlTypeDefs } from '@/server/resolvers/postResolvers'
import { alignmentForumMutations, alignmentForumTypeDefs } from '@/server/resolvers/alignmentForumMutations'
import { allTagsActivityFeedGraphQLQueries, allTagsActivityFeedGraphQLTypeDefs } from '@/server/resolvers/allTagsActivityFeed';
import { recentDiscussionFeedGraphQLQueries, recentDiscussionFeedGraphQLTypeDefs } from '@/server/resolvers/recentDiscussionFeed';
import { ultraFeedGraphQLQueries, ultraFeedGraphQLTypeDefs } from '@/server/resolvers/ultraFeedResolver';
import { ultraFeedSubscriptionsQueries, ultraFeedSubscriptionsTypeDefs } from '@/server/resolvers/ultraFeedSubscriptionsResolver';
import { tagHistoryFeedGraphQLQueries, tagHistoryFeedGraphQLTypeDefs } from '@/server/resolvers/tagHistoryFeed';
import { userContentFeedGraphQLQueries, userContentFeedGraphQLTypeDefs } from '@/server/resolvers/userContentFeedResolver';
import { tagGraphQLTypeDefs, tagResolversGraphQLMutations, tagResolversGraphQLQueries } from '@/server/resolvers/tagResolvers';
import { conversationGqlMutations, conversationGqlTypeDefs } from '@/server/resolvers/conversationResolvers'
import { databaseSettingsGqlTypeDefs, databaseSettingsGqlMutations } from '@/server/resolvers/databaseSettingsResolvers'
import { siteGraphQLQueries, siteGraphQLTypeDefs } from '../site';
import { loginDataGraphQLMutations, loginDataGraphQLTypeDefs } from './authentication';
import { dialogueMessageGqlQueries, dialogueMessageGqlTypeDefs } from '@/server/resolvers/dialogueMessageResolvers';
import { ckEditorCallbacksGraphQLMutations, ckEditorCallbacksGraphQLTypeDefs, getLinkSharedPostGraphQLQueries } from '@/server/ckEditor/ckEditorCallbacks';
import { migrationsDashboardGraphQLQueries, migrationsDashboardGraphQLTypeDefs } from '@/server/manualMigrations/migrationsDashboardGraphql';
import { reviewWinnerGraphQLQueries, reviewWinnerGraphQLTypeDefs } from '@/server/resolvers/reviewWinnerResolvers';
import { importUrlAsDraftPostGqlMutation, importUrlAsDraftPostTypeDefs } from '@/server/resolvers/importUrlAsDraftPost';
import { revisionResolversGraphQLQueries, revisionResolversGraphQLMutations, revisionResolversGraphQLTypeDefs } from '@/server/resolvers/revisionResolvers';
import { moderationGqlMutations, moderationGqlQueries, moderationGqlTypeDefs } from '@/server/resolvers/moderationResolvers';
import { multiDocumentMutations, multiDocumentTypeDefs } from '@/server/resolvers/multiDocumentResolvers';
import { spotlightGqlMutations, spotlightGqlQueries, spotlightGqlTypeDefs } from '@/server/resolvers/spotlightResolvers';
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
import { reviewResultsGqlQueries, reviewResultsGqlTypeDefs } from '@/server/resolvers/reviewResultsResolvers';
import { recommendationsGqlMutations, recommendationsGqlTypeDefs } from '@/server/recommendations/mutations';
import { extraPostResolversGraphQLMutations, extraPostResolversGraphQLTypeDefs } from '@/server/posts/graphql';
import { generateCoverImagesForPostGraphQLMutations, generateCoverImagesForPostGraphQLTypeDefs, flipSplashArtImageGraphQLMutations, flipSplashArtImageGraphQLTypeDefs, upscaleReviewWinnerArtGraphQLMutations, upscaleReviewWinnerArtGraphQLTypeDefs } from '@/server/resolvers/aiArtResolvers/coverImageMutations';
import { elicitQuestionPredictionsGraphQLTypeDefs } from '@/lib/collections/elicitQuestionPredictions/newSchema';
import { booksResolversTypeDefs, booksResolversQueries } from '@/server/resolvers/booksResolvers';
import { sequencesResolversTypeDefs, sequencesResolversQueries } from '@/server/resolvers/sequencesResolvers';
import { reviewPredictionGraphQLTypeDefs, reviewPredictionGraphQLQueries } from '@/server/resolvers/reviewPredictionResolvers';
import { graphqlMutations as adminEmailSenderGraphQLMutations, graphqlQueries as adminEmailSenderGraphQLQueries, graphqlTypeDefs as adminEmailSenderGraphQLTypeDefs } from "@/server/resolvers/adminEmailSenderResolvers";

// Collection imports
import { graphqlArbitalCachesQueryTypeDefs, arbitalCachesGqlFieldResolvers } from "@/server/collections/arbitalCache/queries";
import { graphqlArbitalTagContentRelQueryTypeDefs, arbitalTagContentRelGqlQueryHandlers, arbitalTagContentRelGqlFieldResolvers } from "@/server/collections/arbitalTagContentRels/queries";
import { graphqlAutomatedContentEvaluationQueryTypeDefs, automatedContentEvaluationGqlFieldResolvers } from "@/server/collections/automatedContentEvaluations/queries";
import { graphqlBanQueryTypeDefs, banGqlQueryHandlers, banGqlFieldResolvers } from "@/server/collections/bans/queries";
import { graphqlBookmarkQueryTypeDefs, bookmarkGqlFieldResolvers, bookmarkGqlQueryHandlers } from "@/server/collections/bookmarks/queries";
import { graphqlBookQueryTypeDefs, bookGqlQueryHandlers, bookGqlFieldResolvers } from "@/server/collections/books/queries";
import { graphqlChapterQueryTypeDefs, chapterGqlQueryHandlers, chapterGqlFieldResolvers } from "@/server/collections/chapters/queries";
import { graphqlCkEditorUserSessionQueryTypeDefs, ckEditorUserSessionGqlQueryHandlers, ckEditorUserSessionGqlFieldResolvers } from "@/server/collections/ckEditorUserSessions/queries";
import { graphqlClientIdQueryTypeDefs, clientIdGqlQueryHandlers, clientIdGqlFieldResolvers } from "@/server/collections/clientIds/queries";
import { graphqlCollectionQueryTypeDefs, collectionGqlQueryHandlers, collectionGqlFieldResolvers } from "@/server/collections/collections/queries";
import { graphqlCommentEmbeddingQueryTypeDefs, commentEmbeddingGqlFieldResolvers } from "@/server/collections/commentEmbeddings/queries";
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
import { graphqlElicitQuestionPredictionQueryTypeDefs, elicitQuestionPredictionGqlQueryHandlers, elicitQuestionPredictionGqlFieldResolvers } from "@/server/collections/elicitQuestionPredictions/queries";
import { graphqlElicitQuestionQueryTypeDefs, elicitQuestionGqlQueryHandlers, elicitQuestionGqlFieldResolvers } from "@/server/collections/elicitQuestions/queries";
import { graphqlEmailTokensQueryTypeDefs, emailTokensGqlFieldResolvers } from "@/server/collections/emailTokens/queries";
import { graphqlFieldChangeQueryTypeDefs, fieldChangeGqlFieldResolvers } from "@/server/collections/fieldChanges/queries";
import { graphqlGoogleServiceAccountSessionQueryTypeDefs, googleServiceAccountSessionGqlQueryHandlers, googleServiceAccountSessionGqlFieldResolvers } from "@/server/collections/googleServiceAccountSessions/queries";
import { graphqlHomePageDesignQueryTypeDefs, homePageDesignGqlQueryHandlers, homePageDesignGqlFieldResolvers } from "@/server/collections/homePageDesigns/queries";
import { graphqlIframeWidgetSrcdocQueryTypeDefs, iframeWidgetSrcdocGqlQueryHandlers, iframeWidgetSrcdocGqlFieldResolvers } from "@/server/collections/iframeWidgetSrcdocs/queries";
import { graphqlImagesQueryTypeDefs, imagesGqlFieldResolvers } from "@/server/collections/images/queries";
import { graphqlJargonTermQueryTypeDefs, jargonTermGqlQueryHandlers, jargonTermGqlFieldResolvers } from "@/server/collections/jargonTerms/queries";
import { graphqlLweventQueryTypeDefs, lweventGqlQueryHandlers, lweventGqlFieldResolvers } from "@/server/collections/lwevents/queries";
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
import { graphqlOAuthAccessTokenQueryTypeDefs, oAuthAccessTokenGqlFieldResolvers } from "@/server/collections/oAuthAccessTokens/queries";
import { graphqlOAuthAuthorizationCodeQueryTypeDefs, oAuthAuthorizationCodeGqlFieldResolvers } from "@/server/collections/oAuthAuthorizationCodes/queries";
import { graphqlOAuthClientQueryTypeDefs, oAuthClientGqlFieldResolvers } from "@/server/collections/oAuthClients/queries";
import { graphqlPetrovDayActionQueryTypeDefs, petrovDayActionGqlQueryHandlers, petrovDayActionGqlFieldResolvers } from "@/server/collections/petrovDayActions/queries";
import { graphqlPetrovDayLaunchQueryTypeDefs, petrovDayLaunchGqlFieldResolvers } from "@/server/collections/petrovDayLaunchs/queries";
import { graphqlPodcastEpisodeQueryTypeDefs, podcastEpisodeGqlQueryHandlers, podcastEpisodeGqlFieldResolvers } from "@/server/collections/podcastEpisodes/queries";
import { graphqlPodcastQueryTypeDefs, podcastGqlQueryHandlers, podcastGqlFieldResolvers } from "@/server/collections/podcasts/queries";
import { graphqlPostRecommendationQueryTypeDefs, postRecommendationGqlFieldResolvers } from "@/server/collections/postRecommendations/queries";
import { graphqlPostRelationQueryTypeDefs, postRelationGqlQueryHandlers, postRelationGqlFieldResolvers } from "@/server/collections/postRelations/queries";
import { graphqlPostQueryTypeDefs, postGqlQueryHandlers, postGqlFieldResolvers } from "@/server/collections/posts/queries";
import { graphqlRssfeedQueryTypeDefs, rssfeedGqlQueryHandlers, rssfeedGqlFieldResolvers } from "@/server/collections/rssfeeds/queries";
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
import { graphqlTagFlagQueryTypeDefs, tagFlagGqlQueryHandlers, tagFlagGqlFieldResolvers } from "@/server/collections/tagFlags/queries";
import { graphqlTagRelQueryTypeDefs, tagRelGqlQueryHandlers, tagRelGqlFieldResolvers } from "@/server/collections/tagRels/queries";
import { graphqlTagQueryTypeDefs, tagGqlQueryHandlers, tagGqlFieldResolvers } from "@/server/collections/tags/queries";
import { graphqlTweetQueryTypeDefs, tweetGqlFieldResolvers } from "@/server/collections/tweets/queries";
import { graphqlTypingIndicatorQueryTypeDefs, typingIndicatorGqlQueryHandlers, typingIndicatorGqlFieldResolvers } from "@/server/collections/typingIndicators/queries";
import { graphqlUltraFeedEventQueryTypeDefs, ultraFeedEventGqlFieldResolvers } from "@/server/collections/ultraFeedEvents/queries";
import { graphqlUserActivityQueryTypeDefs, userActivityGqlFieldResolvers } from "@/server/collections/useractivities/queries";
import { graphqlUserMostValuablePostQueryTypeDefs, userMostValuablePostGqlQueryHandlers, userMostValuablePostGqlFieldResolvers } from "@/server/collections/userMostValuablePosts/queries";
import { graphqlUserRateLimitQueryTypeDefs, userRateLimitGqlQueryHandlers, userRateLimitGqlFieldResolvers } from "@/server/collections/userRateLimits/queries";
import { graphqlUserTagRelQueryTypeDefs, userTagRelGqlQueryHandlers, userTagRelGqlFieldResolvers } from "@/server/collections/userTagRels/queries";
import { graphqlUserQueryTypeDefs, userGqlQueryHandlers, userGqlFieldResolvers } from "@/server/collections/users/queries";
import { graphqlVoteQueryTypeDefs, voteGqlQueryHandlers, voteGqlFieldResolvers } from "@/server/collections/votes/queries";
import { bookmarkGqlTypeDefs, bookmarkGqlMutations } from '@/server/collections/bookmarks/mutations';
import { createBookGqlMutation, updateBookGqlMutation, graphqlBookTypeDefs } from "@/server/collections/books/mutations";
import { createChapterGqlMutation, updateChapterGqlMutation, graphqlChapterTypeDefs } from "@/server/collections/chapters/mutations";
import { createCollectionGqlMutation, updateCollectionGqlMutation, graphqlCollectionTypeDefs } from "@/server/collections/collections/mutations";
import { createCommentModeratorActionGqlMutation, updateCommentModeratorActionGqlMutation, graphqlCommentModeratorActionTypeDefs } from "@/server/collections/commentModeratorActions/mutations";
import { createCommentGqlMutation, updateCommentGqlMutation, graphqlCommentTypeDefs } from "@/server/collections/comments/mutations";
import { createConversationGqlMutation, updateConversationGqlMutation, graphqlConversationTypeDefs } from "@/server/collections/conversations/mutations";
import { createCurationNoticeGqlMutation, updateCurationNoticeGqlMutation, graphqlCurationNoticeTypeDefs } from "@/server/collections/curationNotices/mutations";
import { createElicitQuestionGqlMutation, updateElicitQuestionGqlMutation, graphqlElicitQuestionTypeDefs } from "@/server/collections/elicitQuestions/mutations";
import { homePageDesignGqlMutations, graphqlHomePageDesignMutationTypeDefs } from "@/server/collections/homePageDesigns/mutations";
import { graphqlTypoSuggestionQueryTypeDefs, typoSuggestionGqlQueryHandlers, typoSuggestionGqlFieldResolvers } from "@/server/collections/typoSuggestions/queries";
import { graphqlTypoSuggestionMutationTypeDefs, typoSuggestionGqlMutations } from "@/server/resolvers/typoSuggestionResolvers";
import { createJargonTermGqlMutation, updateJargonTermGqlMutation, graphqlJargonTermTypeDefs } from "@/server/collections/jargonTerms/mutations";
import { createLWEventGqlMutation, graphqlLWEventTypeDefs } from "@/server/collections/lwevents/mutations";
import { graphqlYjsDocumentQueryTypeDefs, yjsDocumentGqlFieldResolvers } from "@/server/collections/yjsDocuments/queries";
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
import { createTagFlagGqlMutation, updateTagFlagGqlMutation, graphqlTagFlagTypeDefs } from "@/server/collections/tagFlags/mutations";
import { createTagGqlMutation, updateTagGqlMutation, graphqlTagTypeDefs } from "@/server/collections/tags/mutations";
import { createUltraFeedEventGqlMutation, updateUltraFeedEventGqlMutation, graphqlUltraFeedEventTypeDefs } from "@/server/collections/ultraFeedEvents/mutations";
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

const emptyViewInput = gql`
  input EmptyViewInput {
    _: Boolean @deprecated(reason: "GraphQL doesn't support empty input types, so we need to provide a field.  Don't pass anything in, it doesn't do anything.")
  }
`;

const { graphqlVoteTypeDefs: postVoteTypeDefs, graphqlVoteMutations: postVoteMutations } = getVoteGraphql('Posts');
const { graphqlVoteTypeDefs: commentVoteTypeDefs, graphqlVoteMutations: commentVoteMutations } = getVoteGraphql('Comments');
const { graphqlVoteTypeDefs: messageVoteTypeDefs, graphqlVoteMutations: messageVoteMutations } = getVoteGraphql('Messages');
const { graphqlVoteTypeDefs: tagRelVoteTypeDefs, graphqlVoteMutations: tagRelVoteMutations } = getVoteGraphql('TagRels');
const { graphqlVoteTypeDefs: revisionVoteTypeDefs, graphqlVoteMutations: revisionVoteMutations } = getVoteGraphql('Revisions');
const { graphqlVoteTypeDefs: tagVoteTypeDefs, graphqlVoteMutations: tagVoteMutations } = getVoteGraphql('Tags');
const { graphqlVoteTypeDefs: multiDocumentVoteTypeDefs, graphqlVoteMutations: multiDocumentVoteMutations } = getVoteGraphql('MultiDocuments');

export const getTypeDefs = () => gql`
  type Query
  type Mutation
  scalar JSON
  scalar Date
  
  # Graphql doesn't allow union types that include scalars, which is necessary
  # to accurately represent the data field the ContentType simple schema.
  # Defining a custom scalar seems to allow it to pass through any data type,
  # but this doesn't seem much more permissive than ContentType was originally.
  scalar ContentTypeData
  type ContentType {
    type: String!
    data: ContentTypeData!
    yjsState: String
  }

  ${selectorInput}
  ${emptyViewInput}
  ${notificationTypeDefs}
  ${arbitalLinkedPagesTypeDefs}
  ${additionalPostsTypeDefs}
  ${additionalTagsTypeDefs}
  ${additionalUsersTypeDefs}
  ${recommendationsTypeDefs}
  ${userResolversTypeDefs}
  # # Vote typedefs
  ${postVoteTypeDefs}
  ${commentVoteTypeDefs}
  ${messageVoteTypeDefs}
  ${tagRelVoteTypeDefs}
  ${revisionVoteTypeDefs}
  ${tagVoteTypeDefs}
  ${multiDocumentVoteTypeDefs}
  ${commentTypeDefs}
  # # End vote typedefs
  ${karmaChangesTypeDefs}
  ${analyticsGraphQLTypeDefs}
  ${arbitalGraphQLTypeDefs}
  ${crossSiteLinkPreviewGraphQLTypeDefs}
  ${elicitPredictionsGraphQLTypeDefs}
  ${notificationResolversGqlTypeDefs}
  ${lightcone2024FundraiserGraphQLTypeDefs}
  ${petrovDay2024GraphQLTypeDefs}
  ${petrovDayLaunchGraphQLTypeDefs}
  ${reviewVoteGraphQLTypeDefs}
  ${postGqlTypeDefs}
  ${alignmentForumTypeDefs}
  ${allTagsActivityFeedGraphQLTypeDefs}
  ${recentDiscussionFeedGraphQLTypeDefs}
  ${tagHistoryFeedGraphQLTypeDefs}
  ${userContentFeedGraphQLTypeDefs}
  ${conversationGqlTypeDefs}
  ${tagGraphQLTypeDefs}
  ${databaseSettingsGqlTypeDefs}
  ${siteGraphQLTypeDefs}
  ${loginDataGraphQLTypeDefs}
  ${dialogueMessageGqlTypeDefs}
  ${ckEditorCallbacksGraphQLTypeDefs}
  ${migrationsDashboardGraphQLTypeDefs}
  ${reviewWinnerGraphQLTypeDefs}
  ${importUrlAsDraftPostTypeDefs}
  ${revisionResolversGraphQLTypeDefs}
  ${moderationGqlTypeDefs}
  ${multiDocumentTypeDefs}
  ${spotlightGqlTypeDefs}
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
  ${reviewResultsGqlTypeDefs}
  ${recommendationsGqlTypeDefs}
  ${extraPostResolversGraphQLTypeDefs}
  ${ultraFeedGraphQLTypeDefs}
  ${ultraFeedSubscriptionsTypeDefs}
  ${generateCoverImagesForPostGraphQLTypeDefs}
  ${flipSplashArtImageGraphQLTypeDefs}
  ${upscaleReviewWinnerArtGraphQLTypeDefs}
  ${elicitQuestionPredictionsGraphQLTypeDefs}
  ${booksResolversTypeDefs}
  ${sequencesResolversTypeDefs}
  ${reviewPredictionGraphQLTypeDefs}
  ${adminEmailSenderGraphQLTypeDefs}
  ## CRUD Query typedefs
  ${graphqlArbitalCachesQueryTypeDefs}
  ${graphqlArbitalTagContentRelQueryTypeDefs}
  ${graphqlAutomatedContentEvaluationQueryTypeDefs}
  ${graphqlBanQueryTypeDefs}
  ${graphqlBookmarkQueryTypeDefs}
  ${graphqlBookQueryTypeDefs}
  ${graphqlChapterQueryTypeDefs}
  ${graphqlCkEditorUserSessionQueryTypeDefs}
  ${graphqlClientIdQueryTypeDefs}
  ${graphqlCollectionQueryTypeDefs}
  ${graphqlCommentEmbeddingQueryTypeDefs}
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
  ${graphqlElicitQuestionPredictionQueryTypeDefs}
  ${graphqlElicitQuestionQueryTypeDefs}
  ${graphqlEmailTokensQueryTypeDefs}
  ${graphqlFieldChangeQueryTypeDefs}
  ${graphqlGoogleServiceAccountSessionQueryTypeDefs}
  ${graphqlHomePageDesignQueryTypeDefs}
  ${graphqlTypoSuggestionQueryTypeDefs}
  ${graphqlIframeWidgetSrcdocQueryTypeDefs}
  ${graphqlImagesQueryTypeDefs}
  ${graphqlJargonTermQueryTypeDefs}
  ${graphqlLweventQueryTypeDefs}
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
  ${graphqlOAuthAccessTokenQueryTypeDefs}
  ${graphqlOAuthAuthorizationCodeQueryTypeDefs}
  ${graphqlOAuthClientQueryTypeDefs}
  ${graphqlPetrovDayActionQueryTypeDefs}
  ${graphqlPetrovDayLaunchQueryTypeDefs}
  ${graphqlPodcastEpisodeQueryTypeDefs}
  ${graphqlPodcastQueryTypeDefs}
  ${graphqlPostRecommendationQueryTypeDefs}
  ${graphqlPostRelationQueryTypeDefs}
  ${graphqlPostQueryTypeDefs}
  ${graphqlRssfeedQueryTypeDefs}
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
  ${graphqlTagFlagQueryTypeDefs}
  ${graphqlTagRelQueryTypeDefs}
  ${graphqlTagQueryTypeDefs}
  ${graphqlTweetQueryTypeDefs}
  ${graphqlTypingIndicatorQueryTypeDefs}
  ${graphqlUltraFeedEventQueryTypeDefs}
  ${graphqlUserActivityQueryTypeDefs}
  ${graphqlUserMostValuablePostQueryTypeDefs}
  ${graphqlUserRateLimitQueryTypeDefs}
  ${graphqlUserTagRelQueryTypeDefs}
  ${graphqlUserQueryTypeDefs}
  ${graphqlVoteQueryTypeDefs}
  ${graphqlYjsDocumentQueryTypeDefs}
  ## CRUD Mutation and input typedefs
  ${graphqlBookTypeDefs}
  ${graphqlChapterTypeDefs}
  ${graphqlCollectionTypeDefs}
  ${graphqlCommentModeratorActionTypeDefs}
  ${graphqlCommentTypeDefs}
  ${graphqlConversationTypeDefs}
  ${graphqlCurationNoticeTypeDefs}
  ${graphqlElicitQuestionTypeDefs}
  ${graphqlHomePageDesignMutationTypeDefs}
  ${graphqlTypoSuggestionMutationTypeDefs}
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
  ${graphqlTagFlagTypeDefs}
  ${graphqlTagTypeDefs}
  ${graphqlUltraFeedEventTypeDefs}
  ${graphqlUserMostValuablePostTypeDefs}
  ${graphqlUserRateLimitTypeDefs}
  ${graphqlUserTagRelTypeDefs}
  ${graphqlUserTypeDefs}
`


const getResolvers = () => ({
  JSON: GraphQLJSON,
  Date: GraphQLDate,
  Query: {
    ...userResolversQueries,
    ...recommendationsQueries,
    ...notificationQueries,
    ...commentQueries,
    ...analyticsGraphQLQueries,
    ...arbitalGraphQLQueries,
    ...crossSiteLinkPreviewGraphQLQueries,
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
    ...tagHistoryFeedGraphQLQueries,
    ...userContentFeedGraphQLQueries,
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
    ...reviewResultsGqlQueries,
    ...tagResolversGraphQLQueries,
    ...ultraFeedGraphQLQueries,
    ...ultraFeedSubscriptionsQueries,
    ...spotlightGqlQueries,
    ...booksResolversQueries,
    ...sequencesResolversQueries,
    ...reviewPredictionGraphQLQueries,
    ...adminEmailSenderGraphQLQueries,

    // CRUD Query Handlers
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
    ...elicitQuestionPredictionGqlQueryHandlers,
    ...elicitQuestionGqlQueryHandlers,
    ...googleServiceAccountSessionGqlQueryHandlers,
    ...homePageDesignGqlQueryHandlers,
    ...typoSuggestionGqlQueryHandlers,
    ...iframeWidgetSrcdocGqlQueryHandlers,
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
    ...tagFlagGqlQueryHandlers,
    ...tagRelGqlQueryHandlers,
    ...tagGqlQueryHandlers,
    ...typingIndicatorGqlQueryHandlers,
    ...userMostValuablePostGqlQueryHandlers,
    ...userRateLimitGqlQueryHandlers,
    ...userTagRelGqlQueryHandlers,
    ...userGqlQueryHandlers,
    ...voteGqlQueryHandlers,
    ...bookmarkGqlQueryHandlers,
  },
  Mutation: {
    ...userResolversMutations,
    ...postVoteMutations,
    ...commentVoteMutations,
    ...messageVoteMutations,
    ...tagRelVoteMutations,
    ...revisionVoteMutations,
    ...tagVoteMutations,
    ...multiDocumentVoteMutations,
    ...commentMutations,
    ...notificationResolversGqlMutations,
    ...elicitPredictionsGraphQLMutations,
    ...petrovDayLaunchGraphQLMutations,
    ...reviewVoteGraphQLMutations,
    ...postGqlMutations,
    ...alignmentForumMutations,
    ...conversationGqlMutations,
    ...databaseSettingsGqlMutations,
    ...ckEditorCallbacksGraphQLMutations,
    ...importUrlAsDraftPostGqlMutation,
    ...revisionResolversGraphQLMutations,
    ...moderationGqlMutations,
    ...multiDocumentMutations,
    ...spotlightGqlMutations,
    ...tagResolversGraphQLMutations,
    ...bookmarkGqlMutations,
    ...homePageDesignGqlMutations,
    ...typoSuggestionGqlMutations,
    ...hidePostGqlMutations,
    ...markAsUnreadMutations,
    ...cronGraphQLMutations,
    ...partiallyReadSequencesMutations,
    ...jargonTermsGraphQLMutations,
    ...generateCoverImagesForPostGraphQLMutations,
    ...flipSplashArtImageGraphQLMutations,
    ...upscaleReviewWinnerArtGraphQLMutations,
    ...rsvpToEventsMutations,
    ...tagsGqlMutations,
    ...analyticsEventGraphQLMutations,
    ...elasticGqlMutations,
    ...emailTokensGraphQLMutations,
    ...fmCrosspostGraphQLMutations,
    ...recommendationsGqlMutations,
    ...extraPostResolversGraphQLMutations,
    ...loginDataGraphQLMutations,
    ...adminEmailSenderGraphQLMutations,

    // CRUD Mutation Handlers
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
    createElicitQuestion: createElicitQuestionGqlMutation,
    updateElicitQuestion: updateElicitQuestionGqlMutation,
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
    createTagFlag: createTagFlagGqlMutation,
    updateTagFlag: updateTagFlagGqlMutation,
    createTag: createTagGqlMutation,
    updateTag: updateTagGqlMutation,
    createUltraFeedEvent: createUltraFeedEventGqlMutation,
    updateUltraFeedEvent: updateUltraFeedEventGqlMutation,
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
  ...arbitalCachesGqlFieldResolvers,
  ...arbitalTagContentRelGqlFieldResolvers,
  ...automatedContentEvaluationGqlFieldResolvers,
  ...banGqlFieldResolvers,
  ...bookGqlFieldResolvers,
  ...bookmarkGqlFieldResolvers,
  ...chapterGqlFieldResolvers,
  ...ckEditorUserSessionGqlFieldResolvers,
  ...clientIdGqlFieldResolvers,
  ...collectionGqlFieldResolvers,
  ...commentEmbeddingGqlFieldResolvers,
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
  ...elicitQuestionPredictionGqlFieldResolvers,
  ...elicitQuestionGqlFieldResolvers,
  ...emailTokensGqlFieldResolvers,
  ...fieldChangeGqlFieldResolvers,
  ...googleServiceAccountSessionGqlFieldResolvers,
  ...homePageDesignGqlFieldResolvers,
  ...typoSuggestionGqlFieldResolvers,
  ...iframeWidgetSrcdocGqlFieldResolvers,
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
  ...oAuthAccessTokenGqlFieldResolvers,
  ...oAuthAuthorizationCodeGqlFieldResolvers,
  ...oAuthClientGqlFieldResolvers,
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
  ...tagFlagGqlFieldResolvers,
  ...tagRelGqlFieldResolvers,
  ...tagGqlFieldResolvers,
  ...tweetGqlFieldResolvers,
  ...typingIndicatorGqlFieldResolvers,
  ...ultraFeedEventGqlFieldResolvers,
  ...userActivityGqlFieldResolvers,
  ...userMostValuablePostGqlFieldResolvers,
  ...userRateLimitGqlFieldResolvers,
  ...userTagRelGqlFieldResolvers,
  ...userGqlFieldResolvers,
  ...voteGqlFieldResolvers,
  ...yjsDocumentGqlFieldResolvers,
} satisfies {
  JSON: typeof GraphQLJSON,
  Date: typeof GraphQLDate,
  Query: Record<string, (root: void, args: any, context: ResolverContext, info: GraphQLResolveInfo) => any>,
  Mutation: Record<string, (root: void, args: any, context: ResolverContext) => any>,
  KarmaChanges: { updateFrequency: (root: void, args: any, context: ResolverContext) => any },
  ElicitUser: { lwUser: (root: void, args: any, context: ResolverContext) => any },
});

export type SchemaGraphQLFieldArgument = {name: string, type: string|GraphQLScalarType|null}
export type SchemaGraphQLFieldDescription = {
  description?: string
  name: string
  args?: SchemaGraphQLFieldArgument[]|string|null|undefined
  type: string|GraphQLScalarType|null
  directive?: string
  required?: boolean
};

let _executableSchema: GraphQLSchema|null = null;
export function getExecutableSchema() {
  if (!_executableSchema) {
    _executableSchema = makeExecutableSchema({ typeDefs: getTypeDefs(), resolvers: getResolvers() });
  }
  return _executableSchema;
}


