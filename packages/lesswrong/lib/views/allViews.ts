// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import { CollectionViewSet } from './collectionViewSet';

// Collection imports
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
import { FieldChangesViews } from '../collections/fieldChanges/views';
import { GoogleServiceAccountSessionsViews } from '../collections/googleServiceAccountSessions/views';
import { HomePageDesignsViews } from '../collections/homePageDesigns/views';
import { IframeWidgetSrcdocsViews } from '../collections/iframeWidgetSrcdocs/views';
import { JargonTermsViews } from '../collections/jargonTerms/views';
import { LlmConversationsViews } from '../collections/llmConversations/views';
import { LocalgroupsViews } from '../collections/localgroups/views';
import { LWEventsViews } from '../collections/lwevents/views';
import { MessagesViews } from '../collections/messages/views';
import { ModerationTemplatesViews } from '../collections/moderationTemplates/views';
import { ModeratorActionsViews } from '../collections/moderatorActions/views';
import { MultiDocumentsViews } from '../collections/multiDocuments/views';
import { NotificationsViews } from '../collections/notifications/views';
import { OAuthAccessTokensViews } from '../collections/oAuthAccessTokens/views';
import { OAuthAuthorizationCodesViews } from '../collections/oAuthAuthorizationCodes/views';
import { OAuthClientsViews } from '../collections/oAuthClients/views';
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
import { TagsViews } from '../collections/tags/views';
import { TagFlagsViews } from '../collections/tagFlags/views';
import { TagRelsViews } from '../collections/tagRels/views';
import { TypoSuggestionsViews } from '../collections/typoSuggestions/views';
import { UltraFeedEventsViews } from '../collections/ultraFeedEvents/views';
import { UsersViews } from '../collections/users/views';
import { UserMostValuablePostsViews } from '../collections/userMostValuablePosts/views';
import { UserRateLimitsViews } from '../collections/userRateLimits/views';
import { UserTagRelsViews } from '../collections/userTagRels/views';
import { VotesViews } from '../collections/votes/views';
import { YjsDocumentsViews } from '../collections/yjsDocuments/views';

export const allViews = {
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
  CommentEmbeddings: new CollectionViewSet('CommentEmbeddings', {}),
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
  ElicitQuestionPredictions: new CollectionViewSet('ElicitQuestionPredictions', {}),
  ElicitQuestions: new CollectionViewSet('ElicitQuestions', {}),
  EmailTokens: new CollectionViewSet('EmailTokens', {}),
  FieldChanges: FieldChangesViews,
  GoogleServiceAccountSessions: GoogleServiceAccountSessionsViews,
  HomePageDesigns: HomePageDesignsViews,
  IframeWidgetSrcdocs: IframeWidgetSrcdocsViews,
  Images: new CollectionViewSet('Images', {}),
  JargonTerms: JargonTermsViews,
  LegacyData: new CollectionViewSet('LegacyData', {}),
  LinkPreviewCaches: new CollectionViewSet('LinkPreviewCaches', {}),
  LlmConversations: LlmConversationsViews,
  LlmMessages: new CollectionViewSet('LlmMessages', {}),
  Localgroups: LocalgroupsViews,
  LoginTokens: new CollectionViewSet('LoginTokens', {}),
  LWEvents: LWEventsViews,
  ManifoldProbabilitiesCaches: new CollectionViewSet('ManifoldProbabilitiesCaches', {}),
  MailgunValidations: new CollectionViewSet('MailgunValidations', {}),
  Messages: MessagesViews,
  Migrations: new CollectionViewSet('Migrations', {}),
  ModerationTemplates: ModerationTemplatesViews,
  ModeratorActions: ModeratorActionsViews,
  MultiDocuments: MultiDocumentsViews,
  Notifications: NotificationsViews,
  OAuthAccessTokens: OAuthAccessTokensViews,
  OAuthAuthorizationCodes: OAuthAuthorizationCodesViews,
  OAuthClients: OAuthClientsViews,
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
  Tags: TagsViews,
  TagFlags: TagFlagsViews,
  TagRels: TagRelsViews,
  Tweets: new CollectionViewSet('Tweets', {}),
  TypingIndicators: new CollectionViewSet('TypingIndicators', {}),
  TypoSuggestions: TypoSuggestionsViews,
  UltraFeedEvents: UltraFeedEventsViews,
  Users: UsersViews,
  UserMostValuablePosts: UserMostValuablePostsViews,
  UserRateLimits: UserRateLimitsViews,
  UserTagRels: UserTagRelsViews,
  UserActivities: new CollectionViewSet('UserActivities', {}),
  Votes: VotesViews,
  YjsDocuments: YjsDocumentsViews,
};
