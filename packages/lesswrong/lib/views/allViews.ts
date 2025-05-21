// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import { CollectionViewSet } from './collectionViewSet';

// Collection imports
import { AdvisorRequestsViews } from '../collections/advisorRequests/views';
import { BookmarksViews } from '../collections/bookmarks/views';
import { ChaptersViews } from '../collections/chapters/views';
import { ClientIdsViews } from '../collections/clientIds/views';
import { CollectionsViews } from '../collections/collections/views';
import { CommentsViews } from '../collections/comments/views';
import { CommentModeratorActionsViews } from '../collections/commentModeratorActions/views';
import { ConversationsViews } from '../collections/conversations/views';
import { CurationNoticesViews } from '../collections/curationNotices/views';
import { DialogueChecksViews } from '../collections/dialogueChecks/views';
import { DialogueMatchPreferencesViews } from '../collections/dialogueMatchPreferences/views';
import { DigestsViews } from '../collections/digests/views';
import { ElectionCandidatesViews } from '../collections/electionCandidates/views';
import { ElectionVotesViews } from '../collections/electionVotes/views';
import { FeaturedResourcesViews } from '../collections/featuredResources/views';
import { FieldChangesViews } from '../collections/fieldChanges/views';
import { ForumEventsViews } from '../collections/forumEvents/views';
import { GardenCodesViews } from '../collections/gardencodes/views';
import { GoogleServiceAccountSessionsViews } from '../collections/googleServiceAccountSessions/views';
import { JargonTermsViews } from '../collections/jargonTerms/views';
import { LlmConversationsViews } from '../collections/llmConversations/views';
import { LocalgroupsViews } from '../collections/localgroups/views';
import { LWEventsViews } from '../collections/lwevents/views';
import { MessagesViews } from '../collections/messages/views';
import { ModerationTemplatesViews } from '../collections/moderationTemplates/views';
import { ModeratorActionsViews } from '../collections/moderatorActions/views';
import { MultiDocumentsViews } from '../collections/multiDocuments/views';
import { NotificationsViews } from '../collections/notifications/views';
import { PetrovDayActionsViews } from '../collections/petrovDayActions/views';
import { PodcastEpisodesViews } from '../collections/podcastEpisodes/views';
import { PostsViews } from '../collections/posts/views';
import { PostRelationsViews } from '../collections/postRelations/views';
import { ReportsViews } from '../collections/reports/views';
import { ReviewVotesViews } from '../collections/reviewVotes/views';
import { ReviewWinnerArtsViews } from '../collections/reviewWinnerArts/views';
import { ReviewWinnersViews } from '../collections/reviewWinners/views';
import { RevisionsViews } from '../collections/revisions/views';
import { RSSFeedsViews } from '../collections/rssfeeds/views';
import { SequencesViews } from '../collections/sequences/views';
import { SpotlightsViews } from '../collections/spotlights/views';
import { SubscriptionsViews } from '../collections/subscriptions/views';
import { SurveysViews } from '../collections/surveys/views';
import { SurveySchedulesViews } from '../collections/surveySchedules/views';
import { TagsViews } from '../collections/tags/views';
import { TagFlagsViews } from '../collections/tagFlags/views';
import { TagRelsViews } from '../collections/tagRels/views';
import { UltraFeedEventsViews } from '../collections/ultraFeedEvents/views';
import { UsersViews } from '../collections/users/views';
import { UserEAGDetailsViews } from '../collections/userEAGDetails/views';
import { UserJobAdsViews } from '../collections/userJobAds/views';
import { UserMostValuablePostsViews } from '../collections/userMostValuablePosts/views';
import { UserRateLimitsViews } from '../collections/userRateLimits/views';
import { UserTagRelsViews } from '../collections/userTagRels/views';
import { VotesViews } from '../collections/votes/views';

export const allViews = {
  AdvisorRequests: AdvisorRequestsViews,
  ArbitalCaches: new CollectionViewSet('ArbitalCaches', {}),
  ArbitalTagContentRels: new CollectionViewSet('ArbitalTagContentRels', {}),
  AutomatedContentEvaluations: new CollectionViewSet('AutomatedContentEvaluations', {}),
  Bans: new CollectionViewSet('Bans', {}),
  Bookmarks: BookmarksViews,
  Books: new CollectionViewSet('Books', {}),
  Chapters: ChaptersViews,
  CkEditorUserSessions: new CollectionViewSet('CkEditorUserSessions', {}),
  ClientIds: ClientIdsViews,
  Collections: CollectionsViews,
  Comments: CommentsViews,
  CommentModeratorActions: CommentModeratorActionsViews,
  Conversations: ConversationsViews,
  CronHistories: new CollectionViewSet('CronHistories', {}),
  CurationEmails: new CollectionViewSet('CurationEmails', {}),
  CurationNotices: CurationNoticesViews,
  DatabaseMetadata: new CollectionViewSet('DatabaseMetadata', {}),
  DebouncerEvents: new CollectionViewSet('DebouncerEvents', {}),
  DialogueChecks: DialogueChecksViews,
  DialogueMatchPreferences: DialogueMatchPreferencesViews,
  DigestPosts: new CollectionViewSet('DigestPosts', {}),
  Digests: DigestsViews,
  ElectionCandidates: ElectionCandidatesViews,
  ElectionVotes: ElectionVotesViews,
  ElicitQuestionPredictions: new CollectionViewSet('ElicitQuestionPredictions', {}),
  ElicitQuestions: new CollectionViewSet('ElicitQuestions', {}),
  EmailTokens: new CollectionViewSet('EmailTokens', {}),
  FeaturedResources: FeaturedResourcesViews,
  FieldChanges: FieldChangesViews,
  ForumEvents: ForumEventsViews,
  GardenCodes: GardenCodesViews,
  GoogleServiceAccountSessions: GoogleServiceAccountSessionsViews,
  Images: new CollectionViewSet('Images', {}),
  JargonTerms: JargonTermsViews,
  LegacyData: new CollectionViewSet('LegacyData', {}),
  LlmConversations: LlmConversationsViews,
  LlmMessages: new CollectionViewSet('LlmMessages', {}),
  Localgroups: LocalgroupsViews,
  LWEvents: LWEventsViews,
  ManifoldProbabilitiesCaches: new CollectionViewSet('ManifoldProbabilitiesCaches', {}),
  Messages: MessagesViews,
  Migrations: new CollectionViewSet('Migrations', {}),
  ModerationTemplates: ModerationTemplatesViews,
  ModeratorActions: ModeratorActionsViews,
  MultiDocuments: MultiDocumentsViews,
  Notifications: NotificationsViews,
  PageCache: new CollectionViewSet('PageCache', {}),
  PetrovDayActions: PetrovDayActionsViews,
  PetrovDayLaunchs: new CollectionViewSet('PetrovDayLaunchs', {}),
  PodcastEpisodes: PodcastEpisodesViews,
  Podcasts: new CollectionViewSet('Podcasts', {}),
  Posts: PostsViews,
  PostEmbeddings: new CollectionViewSet('PostEmbeddings', {}),
  PostRecommendations: new CollectionViewSet('PostRecommendations', {}),
  PostRelations: PostRelationsViews,
  PostViewTimes: new CollectionViewSet('PostViewTimes', {}),
  PostViews: new CollectionViewSet('PostViews', {}),
  ReadStatuses: new CollectionViewSet('ReadStatuses', {}),
  RecommendationsCaches: new CollectionViewSet('RecommendationsCaches', {}),
  Reports: ReportsViews,
  ReviewVotes: ReviewVotesViews,
  ReviewWinnerArts: ReviewWinnerArtsViews,
  ReviewWinners: ReviewWinnersViews,
  Revisions: RevisionsViews,
  RSSFeeds: RSSFeedsViews,
  Sequences: SequencesViews,
  Sessions: new CollectionViewSet('Sessions', {}),
  SideCommentCaches: new CollectionViewSet('SideCommentCaches', {}),
  SplashArtCoordinates: new CollectionViewSet('SplashArtCoordinates', {}),
  Spotlights: SpotlightsViews,
  Subscriptions: SubscriptionsViews,
  Surveys: SurveysViews,
  SurveyQuestions: new CollectionViewSet('SurveyQuestions', {}),
  SurveyResponses: new CollectionViewSet('SurveyResponses', {}),
  SurveySchedules: SurveySchedulesViews,
  Tags: TagsViews,
  TagFlags: TagFlagsViews,
  TagRels: TagRelsViews,
  Tweets: new CollectionViewSet('Tweets', {}),
  TypingIndicators: new CollectionViewSet('TypingIndicators', {}),
  UltraFeedEvents: UltraFeedEventsViews,
  Users: UsersViews,
  UserEAGDetails: UserEAGDetailsViews,
  UserJobAds: UserJobAdsViews,
  UserMostValuablePosts: UserMostValuablePostsViews,
  UserRateLimits: UserRateLimitsViews,
  UserTagRels: UserTagRelsViews,
  UserActivities: new CollectionViewSet('UserActivities', {}),
  Votes: VotesViews,
};
