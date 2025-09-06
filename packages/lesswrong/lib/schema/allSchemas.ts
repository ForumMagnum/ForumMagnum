// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import { isAnyTest } from '../executionEnvironment';

// Collection imports
import { default as AdvisorRequests } from '../collections/advisorRequests/newSchema';
import { default as ArbitalCaches } from '../collections/arbitalCache/newSchema';
import { default as ArbitalTagContentRels } from '../collections/arbitalTagContentRels/newSchema';
import { default as AutomatedContentEvaluations } from '../collections/automatedContentEvaluations/newSchema';
import { default as Bans } from '../collections/bans/newSchema';
import { default as Bookmarks } from '../collections/bookmarks/newSchema';
import { default as Books } from '../collections/books/newSchema';
import { default as Chapters } from '../collections/chapters/newSchema';
import { default as CkEditorUserSessions } from '../collections/ckEditorUserSessions/newSchema';
import { default as ClientIds } from '../collections/clientIds/newSchema';
import { default as Collections } from '../collections/collections/newSchema';
import { default as CommentModeratorActions } from '../collections/commentModeratorActions/newSchema';
import { default as Comments } from '../collections/comments/newSchema';
import { default as Conversations } from '../collections/conversations/newSchema';
import { default as CronHistories } from '../collections/cronHistories/newSchema';
import { default as CurationEmails } from '../collections/curationEmails/newSchema';
import { default as CurationNotices } from '../collections/curationNotices/newSchema';
import { default as DatabaseMetadata } from '../collections/databaseMetadata/newSchema';
import { default as DebouncerEvents } from '../collections/debouncerEvents/newSchema';
import { default as DialogueChecks } from '../collections/dialogueChecks/newSchema';
import { default as DialogueMatchPreferences } from '../collections/dialogueMatchPreferences/newSchema';
import { default as DigestPosts } from '../collections/digestPosts/newSchema';
import { default as Digests } from '../collections/digests/newSchema';
import { default as ElectionCandidates } from '../collections/electionCandidates/newSchema';
import { default as ElectionVotes } from '../collections/electionVotes/newSchema';
import { default as ElicitQuestionPredictions } from '../collections/elicitQuestionPredictions/newSchema';
import { default as ElicitQuestions } from '../collections/elicitQuestions/newSchema';
import { default as EmailTokens } from '../collections/emailTokens/newSchema';
import { default as FeaturedResources } from '../collections/featuredResources/newSchema';
import { default as FieldChanges } from '../collections/fieldChanges/newSchema';
import { default as ForumEvents } from '../collections/forumEvents/newSchema';
import { default as GardenCodes } from '../collections/gardencodes/newSchema';
import { default as GoogleServiceAccountSessions } from '../collections/googleServiceAccountSessions/newSchema';
import { default as Images } from '../collections/images/newSchema';
import { default as JargonTerms } from '../collections/jargonTerms/newSchema';
import { default as LegacyData } from '../collections/legacyData/newSchema';
import { default as LlmConversations } from '../collections/llmConversations/newSchema';
import { default as LlmMessages } from '../collections/llmMessages/newSchema';
import { default as Localgroups } from '../collections/localgroups/newSchema';
import { default as LWEvents } from '../collections/lwevents/newSchema';
import { default as ManifoldProbabilitiesCaches } from '../collections/manifoldProbabilitiesCaches/newSchema';
import { default as Messages } from '../collections/messages/newSchema';
import { default as Migrations } from '../collections/migrations/newSchema';
import { default as ModerationTemplates } from '../collections/moderationTemplates/newSchema';
import { default as ModeratorActions } from '../collections/moderatorActions/newSchema';
import { default as MultiDocuments } from '../collections/multiDocuments/newSchema';
import { default as Notifications } from '../collections/notifications/newSchema';
import { default as PageCache } from '../collections/pagecache/newSchema';
import { default as PetrovDayActions } from '../collections/petrovDayActions/newSchema';
import { default as PetrovDayLaunchs } from '../collections/petrovDayLaunchs/newSchema';
import { default as PodcastEpisodes } from '../collections/podcastEpisodes/newSchema';
import { default as Podcasts } from '../collections/podcasts/newSchema';
import { default as PostEmbeddings } from '../collections/postEmbeddings/newSchema';
import { default as PostRecommendations } from '../collections/postRecommendations/newSchema';
import { default as PostRelations } from '../collections/postRelations/newSchema';
import { default as PostViewTimes } from '../collections/postViewTimes/newSchema';
import { default as PostViews } from '../collections/postViews/newSchema';
import { default as Posts } from '../collections/posts/newSchema';
import { default as ReadStatuses } from '../collections/readStatus/newSchema';
import { default as RecommendationsCaches } from '../collections/recommendationsCaches/newSchema';
import { default as Reports } from '../collections/reports/newSchema';
import { default as ReviewVotes } from '../collections/reviewVotes/newSchema';
import { default as ReviewWinnerArts } from '../collections/reviewWinnerArts/newSchema';
import { default as ReviewWinners } from '../collections/reviewWinners/newSchema';
import { default as Revisions } from '../collections/revisions/newSchema';
import { default as RSSFeeds } from '../collections/rssfeeds/newSchema';
import { default as Sequences } from '../collections/sequences/newSchema';
import { default as Sessions } from '../collections/sessions/newSchema';
import { default as SideCommentCaches } from '../collections/sideCommentCaches/newSchema';
import { default as SplashArtCoordinates } from '../collections/splashArtCoordinates/newSchema';
import { default as Spotlights } from '../collections/spotlights/newSchema';
import { default as Subscriptions } from '../collections/subscriptions/newSchema';
import { default as SurveyQuestions } from '../collections/surveyQuestions/newSchema';
import { default as SurveyResponses } from '../collections/surveyResponses/newSchema';
import { default as SurveySchedules } from '../collections/surveySchedules/newSchema';
import { default as Surveys } from '../collections/surveys/newSchema';
import { default as TagFlags } from '../collections/tagFlags/newSchema';
import { default as TagRels } from '../collections/tagRels/newSchema';
import { default as Tags } from '../collections/tags/newSchema';
import { default as Tweets } from '../collections/tweets/newSchema';
import { default as TypingIndicators } from '../collections/typingIndicators/newSchema';
import { default as UltraFeedEvents } from '../collections/ultraFeedEvents/newSchema';
import { default as UserEAGDetails } from '../collections/userEAGDetails/newSchema';
import { default as UserJobAds } from '../collections/userJobAds/newSchema';
import { default as UserMostValuablePosts } from '../collections/userMostValuablePosts/newSchema';
import { default as UserRateLimits } from '../collections/userRateLimits/newSchema';
import { default as UserTagRels } from '../collections/userTagRels/newSchema';
import { default as UserActivities } from '../collections/useractivities/newSchema';
import { default as Users } from '../collections/users/newSchema';
import { default as Votes } from '../collections/votes/newSchema';

let testSchemas: Record<never, never>;
if (isAnyTest || bundleIsCodegen) {
  // TODO: does this need fixing to avoid esbuild headaches?
  // Seems like no, but it might be a footgun.
  ({ testSchemas } = require('../../server/sql/tests/testSchemas'));
} else {
  testSchemas = {};
}

export const allSchemas = {
  AdvisorRequests, ArbitalCaches, ArbitalTagContentRels, AutomatedContentEvaluations, Bans, Bookmarks, Books, Chapters, CkEditorUserSessions, ClientIds, Collections,
  CommentModeratorActions, Comments, Conversations, CronHistories, CurationEmails, CurationNotices, DatabaseMetadata, DebouncerEvents, DialogueChecks, DialogueMatchPreferences,
  DigestPosts, Digests, ElectionCandidates, ElectionVotes, ElicitQuestionPredictions, ElicitQuestions, EmailTokens, FeaturedResources, FieldChanges, ForumEvents,
  GardenCodes, GoogleServiceAccountSessions, Images, JargonTerms, LWEvents, LegacyData, LlmConversations, LlmMessages, Localgroups,
  ManifoldProbabilitiesCaches, Messages, Migrations, ModerationTemplates, ModeratorActions, MultiDocuments, Notifications, PageCache, PetrovDayActions, PetrovDayLaunchs,
  PodcastEpisodes, Podcasts, PostEmbeddings, PostRecommendations, PostRelations, PostViewTimes, PostViews, Posts, RSSFeeds, ReadStatuses,
  RecommendationsCaches, Reports, ReviewVotes, ReviewWinnerArts, ReviewWinners, Revisions, Sequences, Sessions, SideCommentCaches, SplashArtCoordinates,
  Spotlights, Subscriptions, SurveyQuestions, SurveyResponses, SurveySchedules, Surveys, TagFlags, TagRels, Tags, Tweets,
  TypingIndicators, UltraFeedEvents, UserActivities, UserEAGDetails, UserJobAds, UserMostValuablePosts, UserRateLimits, UserTagRels,
  Users, Votes, ...testSchemas,
} satisfies Record<CollectionNameString, Record<string, CollectionFieldSpecification<CollectionNameString>>>;

export function getAllSchemas() {
  return allSchemas;
}

export function getSchema<N extends CollectionNameString>(collectionName: N): Record<string, CollectionFieldSpecification<N>> {
  return allSchemas[collectionName] as Record<string, CollectionFieldSpecification<N>>;
}


