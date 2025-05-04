// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import { isAnyTest, isIntegrationTest, isMigrations } from '@/lib/executionEnvironment';
import sortBy from 'lodash/sortBy';

// Collection imports
import { AdvisorRequests } from './advisorRequests/collection';
import { ArbitalCaches } from './arbitalCache/collection';
import { ArbitalTagContentRels } from './arbitalTagContentRels/collection';
import { AutomatedContentEvaluations } from './automatedContentEvaluations/collection';
import { Bans } from './bans/collection';
import { Books } from './books/collection';
import { Chapters } from './chapters/collection';
import { CkEditorUserSessions } from './ckEditorUserSessions/collection';
import { ClientIds } from './clientIds/collection';
import { Collections } from './collections/collection';
import { CommentModeratorActions } from './commentModeratorActions/collection';
import { Comments } from './comments/collection';
import { Conversations } from './conversations/collection';
import { CronHistories } from './cronHistories/collection';
import { CurationEmails } from './curationEmails/collection';
import { CurationNotices } from './curationNotices/collection';
import { DatabaseMetadata } from './databaseMetadata/collection';
import { DebouncerEvents } from './debouncerEvents/collection';
import { DialogueChecks } from './dialogueChecks/collection';
import { DialogueMatchPreferences } from './dialogueMatchPreferences/collection';
import { DigestPosts } from './digestPosts/collection';
import { Digests } from './digests/collection';
import { ElectionCandidates } from './electionCandidates/collection';
import { ElectionVotes } from './electionVotes/collection';
import { ElicitQuestionPredictions } from './elicitQuestionPredictions/collection';
import { ElicitQuestions } from './elicitQuestions/collection';
import { EmailTokens } from './emailTokens/collection';
import { FeaturedResources } from './featuredResources/collection';
import { FieldChanges } from './fieldChanges/collection';
import { ForumEvents } from './forumEvents/collection';
import { GardenCodes } from './gardencodes/collection';
import { GoogleServiceAccountSessions } from './googleServiceAccountSessions/collection';
import { Images } from './images/collection';
import { JargonTerms } from './jargonTerms/collection';
import { LegacyData } from './legacyData/collection';
import { LlmConversations } from './llmConversations/collection';
import { LlmMessages } from './llmMessages/collection';
import { Localgroups } from './localgroups/collection';
import { LWEvents } from './lwevents/collection';
import { ManifoldProbabilitiesCaches } from './manifoldProbabilitiesCaches/collection';
import { Messages } from './messages/collection';
import { Migrations } from './migrations/collection';
import { ModerationTemplates } from './moderationTemplates/collection';
import { ModeratorActions } from './moderatorActions/collection';
import { MultiDocuments } from './multiDocuments/collection';
import { Notifications } from './notifications/collection';
import { PageCache } from './pagecache/collection';
import { PetrovDayActions } from './petrovDayActions/collection';
import { PetrovDayLaunchs } from './petrovDayLaunchs/collection';
import { PodcastEpisodes } from './podcastEpisodes/collection';
import { Podcasts } from './podcasts/collection';
import { PostEmbeddings } from './postEmbeddings/collection';
import { PostRecommendations } from './postRecommendations/collection';
import { PostRelations } from './postRelations/collection';
import { PostViewTimes } from './postViewTimes/collection';
import { PostViews } from './postViews/collection';
import { Posts } from './posts/collection';
import { ReadStatuses } from './readStatus/collection';
import { RecommendationsCaches } from './recommendationsCaches/collection';
import { Reports } from './reports/collection';
import { ReviewVotes } from './reviewVotes/collection';
import { ReviewWinnerArts } from './reviewWinnerArts/collection';
import { ReviewWinners } from './reviewWinners/collection';
import { Revisions } from './revisions/collection';
import { RSSFeeds } from './rssfeeds/collection';
import { Sequences } from './sequences/collection';
import { Sessions } from './sessions/collection';
import { SideCommentCaches } from './sideCommentCaches/collection';
import { SplashArtCoordinates } from './splashArtCoordinates/collection';
import { Spotlights } from './spotlights/collection';
import { Subscriptions } from './subscriptions/collection';
import { SurveyQuestions } from './surveyQuestions/collection';
import { SurveyResponses } from './surveyResponses/collection';
import { SurveySchedules } from './surveySchedules/collection';
import { Surveys } from './surveys/collection';
import { TagFlags } from './tagFlags/collection';
import { TagRels } from './tagRels/collection';
import { Tags } from './tags/collection';
import { Tweets } from './tweets/collection';
import { TypingIndicators } from './typingIndicators/collection';
import { UltraFeedEvents } from './ultraFeedEvents/collection';
import { UserEAGDetails } from './userEAGDetails/collection';
import { UserJobAds } from './userJobAds/collection';
import { UserMostValuablePosts } from './userMostValuablePosts/collection';
import { UserRateLimits } from './userRateLimits/collection';
import { UserTagRels } from './userTagRels/collection';
import { UserActivities } from './useractivities/collection';
import { Users } from './users/collection';
import { Votes } from './votes/collection';

function getTestCollections() {
  let testCollections: Record<never, never>;
  if (isAnyTest && !isIntegrationTest && !isMigrations) {
    ({ testCollections } = require('../sql/tests/testHelpers'));
  } else {
    testCollections = {};
  }
  return testCollections;
}

function getTestCollectionsByTypeName() {
  const testCollections = getTestCollections();
  return Object.fromEntries(Object.entries(testCollections).map(([, collection]) => [(collection as CollectionBase<AnyBecauseHard>).typeName, collection]));
}

// TODO: maybe put this behind a proxy like `getAllRepos` for performance?
const allCollections = {
  AdvisorRequests, ArbitalCaches, ArbitalTagContentRels, AutomatedContentEvaluations, Bans, Books, Chapters, CkEditorUserSessions, ClientIds, Collections,
  CommentModeratorActions, Comments, Conversations, CronHistories, CurationEmails, CurationNotices, DatabaseMetadata, DebouncerEvents, DialogueChecks, DialogueMatchPreferences,
  DigestPosts, Digests, ElectionCandidates, ElectionVotes, ElicitQuestionPredictions, ElicitQuestions, EmailTokens, FeaturedResources, FieldChanges, ForumEvents,
  GardenCodes, GoogleServiceAccountSessions, Images, JargonTerms, LWEvents, LegacyData, LlmConversations, LlmMessages, Localgroups,
  ManifoldProbabilitiesCaches, Messages, Migrations, ModerationTemplates, ModeratorActions, MultiDocuments, Notifications, PageCache, PetrovDayActions, PetrovDayLaunchs,
  PodcastEpisodes, Podcasts, PostEmbeddings, PostRecommendations, PostRelations, PostViewTimes, PostViews, Posts, RSSFeeds, ReadStatuses,
  RecommendationsCaches, Reports, ReviewVotes, ReviewWinnerArts, ReviewWinners, Revisions, Sequences, Sessions, SideCommentCaches, SplashArtCoordinates,
  Spotlights, Subscriptions, SurveyQuestions, SurveyResponses, SurveySchedules, Surveys, TagFlags, TagRels, Tags, Tweets,
  TypingIndicators, UltraFeedEvents, UserActivities, UserEAGDetails, UserJobAds, UserMostValuablePosts, UserRateLimits, UserTagRels, Users, Votes
} satisfies CollectionsByName;

const collectionsByLowercaseName = Object.fromEntries(
  Object.values(allCollections).map((collection) => [collection.collectionName.toLowerCase(), collection]),
);

const collectionsByTypeName = Object.fromEntries(
  Object.values(allCollections).map((collection) => [collection.typeName, collection]),
);

export function getCollection<N extends CollectionNameString>(name: N): CollectionBase<N> {
  const collectionsWithTestCollections = { ...allCollections, ...getTestCollections() };
  return collectionsWithTestCollections[name] as CollectionBase<N>;
}

export function getAllCollections(): Array<CollectionBase<CollectionNameString>> {
  const collectionsWithTestCollections = { ...allCollections, ...getTestCollections() };
  return sortBy(Object.values(collectionsWithTestCollections), (c) => c.collectionName);
}

export function getAllCollectionsByName() {
  const collectionsWithTestCollections = { ...allCollections, ...getTestCollections() };
  return collectionsWithTestCollections;
}

export function getCollectionByTypeName(typeName: string): CollectionBase<AnyBecauseHard> {
  const collectionsWithTestCollectionsByTypeName = { ...collectionsByTypeName, ...getTestCollectionsByTypeName() };
  const collection = collectionsWithTestCollectionsByTypeName[typeName] as CollectionBase<AnyBecauseHard>;
  if (!collection) {
    throw new Error(`Invalid typeName: ${typeName}`);
  }
  return collection;
}

export function getVoteableCollections(): CollectionBase<VoteableCollectionName>[] {
  return getAllCollections().filter((c): c is CollectionBase<VoteableCollectionName> => c.isVoteable());
}

export function isValidCollectionName(name: string): name is CollectionNameString {
  if (name in allCollections)
    return true;
  // Case-insensitive search fallback, similar to getCollection.
  return !!getAllCollections().find(
    (collection) => name === collection.collectionName || name === collection.collectionName.toLowerCase()
  );
};
