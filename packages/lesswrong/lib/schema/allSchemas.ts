// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import SimpleSchema from 'simpl-schema';
import { isAnyTest, isCodegen } from '../executionEnvironment';
import { collectionNameToTypeName } from '../generated/collectionTypeNames';

// Collection imports
import { default as AdvisorRequests } from '../collections/advisorRequests/schema';
import { default as ArbitalCaches } from '../collections/arbitalCache/schema';
import { default as ArbitalTagContentRels } from '../collections/arbitalTagContentRels/schema';
import { default as Bans } from '../collections/bans/schema';
import { default as Books } from '../collections/books/schema';
import { default as Chapters } from '../collections/chapters/schema';
import { default as CkEditorUserSessions } from '../collections/ckEditorUserSessions/schema';
import { default as ClientIds } from '../collections/clientIds/schema';
import { default as Collections } from '../collections/collections/schema';
import { default as CommentModeratorActions } from '../collections/commentModeratorActions/schema';
import { default as Comments } from '../collections/comments/schema';
import { default as Conversations } from '../collections/conversations/schema';
import { default as CronHistories } from '../collections/cronHistories/schema';
import { default as CurationEmails } from '../collections/curationEmails/schema';
import { default as CurationNotices } from '../collections/curationNotices/schema';
import { default as DatabaseMetadata } from '../collections/databaseMetadata/schema';
import { default as DebouncerEvents } from '../collections/debouncerEvents/schema';
import { default as DialogueChecks } from '../collections/dialogueChecks/schema';
import { default as DialogueMatchPreferences } from '../collections/dialogueMatchPreferences/schema';
import { default as DigestPosts } from '../collections/digestPosts/schema';
import { default as Digests } from '../collections/digests/schema';
import { default as ElectionCandidates } from '../collections/electionCandidates/schema';
import { default as ElectionVotes } from '../collections/electionVotes/schema';
import { default as ElicitQuestionPredictions } from '../collections/elicitQuestionPredictions/schema';
import { default as ElicitQuestions } from '../collections/elicitQuestions/schema';
import { default as EmailTokens } from '../collections/emailTokens/schema';
import { default as FeaturedResources } from '../collections/featuredResources/schema';
import { default as ForumEvents } from '../collections/forumEvents/schema';
import { default as GardenCodes } from '../collections/gardencodes/schema';
import { default as GoogleServiceAccountSessions } from '../collections/googleServiceAccountSessions/schema';
import { default as Images } from '../collections/images/schema';
import { default as JargonTerms } from '../collections/jargonTerms/schema';
import { default as LegacyData } from '../collections/legacyData/schema';
import { default as LlmConversations } from '../collections/llmConversations/schema';
import { default as LlmMessages } from '../collections/llmMessages/schema';
import { default as Localgroups } from '../collections/localgroups/schema';
import { default as LWEvents } from '../collections/lwevents/schema';
import { default as ManifoldProbabilitiesCaches } from '../collections/manifoldProbabilitiesCaches/schema';
import { default as Messages } from '../collections/messages/schema';
import { default as Migrations } from '../collections/migrations/schema';
import { default as ModerationTemplates } from '../collections/moderationTemplates/schema';
import { default as ModeratorActions } from '../collections/moderatorActions/schema';
import { default as MultiDocuments } from '../collections/multiDocuments/schema';
import { default as Notifications } from '../collections/notifications/schema';
import { default as PageCache } from '../collections/pagecache/schema';
import { default as PetrovDayActions } from '../collections/petrovDayActions/schema';
import { default as PetrovDayLaunchs } from '../collections/petrovDayLaunchs/schema';
import { default as PodcastEpisodes } from '../collections/podcastEpisodes/schema';
import { default as Podcasts } from '../collections/podcasts/schema';
import { default as PostEmbeddings } from '../collections/postEmbeddings/schema';
import { default as PostRecommendations } from '../collections/postRecommendations/schema';
import { default as PostRelations } from '../collections/postRelations/schema';
import { default as PostViewTimes } from '../collections/postViewTimes/schema';
import { default as PostViews } from '../collections/postViews/schema';
import { default as Posts } from '../collections/posts/schema';
import { default as ReadStatuses } from '../collections/readStatus/schema';
import { default as RecommendationsCaches } from '../collections/recommendationsCaches/schema';
import { default as Reports } from '../collections/reports/schema';
import { default as ReviewVotes } from '../collections/reviewVotes/schema';
import { default as ReviewWinnerArts } from '../collections/reviewWinnerArts/schema';
import { default as ReviewWinners } from '../collections/reviewWinners/schema';
import { default as Revisions } from '../collections/revisions/schema';
import { default as RSSFeeds } from '../collections/rssfeeds/schema';
import { default as Sequences } from '../collections/sequences/schema';
import { default as Sessions } from '../collections/sessions/schema';
import { default as SideCommentCaches } from '../collections/sideCommentCaches/schema';
import { default as SplashArtCoordinates } from '../collections/splashArtCoordinates/schema';
import { default as Spotlights } from '../collections/spotlights/schema';
import { default as Subscriptions } from '../collections/subscriptions/schema';
import { default as SurveyQuestions } from '../collections/surveyQuestions/schema';
import { default as SurveyResponses } from '../collections/surveyResponses/schema';
import { default as SurveySchedules } from '../collections/surveySchedules/schema';
import { default as Surveys } from '../collections/surveys/schema';
import { default as TagFlags } from '../collections/tagFlags/schema';
import { default as TagRels } from '../collections/tagRels/schema';
import { default as Tags } from '../collections/tags/schema';
import { default as Tweets } from '../collections/tweets/schema';
import { default as TypingIndicators } from '../collections/typingIndicators/schema';
import { default as UserEAGDetails } from '../collections/userEAGDetails/schema';
import { default as UserJobAds } from '../collections/userJobAds/schema';
import { default as UserMostValuablePosts } from '../collections/userMostValuablePosts/schema';
import { default as UserRateLimits } from '../collections/userRateLimits/schema';
import { default as UserTagRels } from '../collections/userTagRels/schema';
import { default as UserActivities } from '../collections/useractivities/schema';
import { default as Users } from '../collections/users/schema';
import { default as Votes } from '../collections/votes/schema';

let testSchemas: Record<never, never>;
if (isAnyTest || isCodegen) {
  // TODO: does this need fixing to avoid esbuild headaches?
  // Seems like no, but it might be a footgun.
  ({ testSchemas } = require('../../server/sql/tests/testSchemas'));
} else {
  testSchemas = {};
}

export const allSchemas = {
  AdvisorRequests, ArbitalCaches, ArbitalTagContentRels, Bans, Books,
  Chapters, CkEditorUserSessions, ClientIds, Collections, CommentModeratorActions,
  Comments, Conversations, CronHistories, CurationEmails, CurationNotices,
  DatabaseMetadata, DebouncerEvents, DialogueChecks, DialogueMatchPreferences,
  DigestPosts, Digests, ElectionCandidates, ElectionVotes, ElicitQuestionPredictions,
  ElicitQuestions, EmailTokens, FeaturedResources, ForumEvents, GardenCodes,
  GoogleServiceAccountSessions, Images, JargonTerms, LegacyData, LlmConversations,
  LlmMessages, Localgroups, LWEvents, ManifoldProbabilitiesCaches, Messages,
  Migrations, ModerationTemplates, ModeratorActions, MultiDocuments, Notifications,
  PageCache, PetrovDayActions, PetrovDayLaunchs, PodcastEpisodes, Podcasts,
  PostEmbeddings, PostRecommendations, PostRelations, PostViewTimes, PostViews,
  Posts, ReadStatuses, RecommendationsCaches, Reports, ReviewVotes,
  ReviewWinnerArts, ReviewWinners, Revisions, RSSFeeds,
  Sequences, Sessions, SideCommentCaches, SplashArtCoordinates,
  Spotlights, Subscriptions, SurveyQuestions, SurveyResponses,
  SurveySchedules, Surveys, TagFlags, TagRels, Tags,
  Tweets, TypingIndicators, UserEAGDetails, UserJobAds,
  UserMostValuablePosts, UserRateLimits, UserTagRels, UserActivities,
  Users, Votes, ...testSchemas,
} satisfies Record<CollectionNameString, SchemaType<CollectionNameString>>;

export function getSchema<N extends CollectionNameString>(collectionName: N): SchemaType<N> {
  return allSchemas[collectionName] as SchemaType<N>;
}

const allSimpleSchemas: Record<CollectionNameString, SimpleSchema> = new Proxy({} as Record<CollectionNameString, SimpleSchema>, {
  get<N extends CollectionNameString>(target: Partial<Record<CollectionNameString, SimpleSchema>>, collectionName: N) {
    if (!target[collectionName]) {
      if (!(collectionName in allSchemas)) {
        throw new Error(`Invalid collection name: ${collectionName}`);
      }
      target[collectionName] = new SimpleSchema(allSchemas[collectionName] as AnyBecauseHard);
    }

    return target[collectionName];
  }
});

export function getSimpleSchema<N extends CollectionNameString>(collectionName: N): SimpleSchemaType<N> {
  return allSimpleSchemas[collectionName] as SimpleSchemaType<N>;
}

export function apolloCacheVoteablePossibleTypes() {
  return {
    Voteable: Object.entries(allSchemas)
      .filter(([_, schema]) => 'score' in schema && 'currentUserVote' in schema)
      .map(([collectionName]) => collectionNameToTypeName[collectionName as CollectionNameString]),
  }
}
