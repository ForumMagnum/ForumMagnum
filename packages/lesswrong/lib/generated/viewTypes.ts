type AdvisorRequestsViewName = "requestsByUser";
type ArbitalCachesViewName = never
type ArbitalTagContentRelsViewName = never
type BansViewName = never
type BooksViewName = never
type ChaptersViewName = "SequenceChapters";
type CkEditorUserSessionsViewName = never
type ClientIdsViewName = "getClientId";
type CollectionsViewName = never
type CommentModeratorActionsViewName = "activeCommentModeratorActions";
type CommentsViewName = "commentReplies"|"postCommentsDeleted"|"allCommentsDeleted"|"checkedByModGPT"|"postCommentsTop"|"postCommentsRecentReplies"|"postCommentsMagic"|"afPostCommentsTop"|"postCommentsOld"|"postCommentsNew"|"postCommentsBest"|"postLWComments"|"profileRecentComments"|"profileComments"|"allRecentComments"|"recentComments"|"afSubmissions"|"rejected"|"recentDiscussionThread"|"afRecentDiscussionThread"|"postsItemComments"|"sunshineNewCommentsList"|"questionAnswers"|"legacyIdComment"|"sunshineNewUsersComments"|"defaultModeratorResponses"|"repliesToAnswer"|"answersAndReplies"|"topShortform"|"shortform"|"shortformFrontpage"|"repliesToCommentThread"|"shortformLatestChildren"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"reviews"|"tagDiscussionComments"|"tagSubforumComments"|"latestSubforumDiscussion"|"moderatorComments"|"debateResponses"|"recentDebateResponses"|"forumEventComments"|"alignmentSuggestedComments"|"rss";
type ConversationsViewName = "moderatorConversations"|"userConversations"|"userConversationsAll"|"userGroupUntitledConversations";
type CronHistoriesViewName = never
type CurationEmailsViewName = never
type CurationNoticesViewName = "curationNoticesPage";
type DatabaseMetadataViewName = never
type DebouncerEventsViewName = never
type DialogueChecksViewName = "userDialogueChecks"|"userTargetDialogueChecks";
type DialogueMatchPreferencesViewName = "dialogueMatchPreferences";
type DigestPostsViewName = never
type DigestsViewName = "findByNum"|"all";
type ElectionCandidatesViewName = never
type ElectionVotesViewName = "allSubmittedVotes";
type ElicitQuestionPredictionsViewName = never
type ElicitQuestionsViewName = never
type EmailTokensViewName = never
type FeaturedResourcesViewName = "activeResources";
type ForumEventsViewName = "upcomingForumEvents"|"pastForumEvents"|"currentForumEvent";
type GardenCodesViewName = "usersPrivateGardenCodes"|"publicGardenCodes"|"gardenCodeByCode";
type GoogleServiceAccountSessionsViewName = never
type ImagesViewName = never
type JargonTermsViewName = "postEditorJargonTerms"|"glossaryEditAll"|"postsApprovedJargon";
type LWEventsViewName = "adminView"|"postVisits"|"emailHistory"|"gatherTownUsers"|"postEverPublished";
type LegacyDataViewName = never
type LlmConversationsViewName = "llmConversationsWithUser"|"llmConversationsAll";
type LlmMessagesViewName = never
type LocalgroupsViewName = "userOrganizesGroups"|"userActiveGroups"|"userInactiveGroups"|"all"|"nearby"|"single"|"local"|"online";
type ManifoldProbabilitiesCachesViewName = never
type MessagesViewName = "messagesConversation"|"conversationPreview";
type MigrationsViewName = never
type ModerationTemplatesViewName = "moderationTemplatesPage"|"moderationTemplatesList";
type ModeratorActionsViewName = "userModeratorActions"|"restrictionModerationActions";
type MultiDocumentsViewName = "lensBySlug"|"summariesByParentId"|"pingbackLensPages";
type NotificationsViewName = "userNotifications"|"unreadUserNotifications"|"adminAlertNotifications";
type PageCacheViewName = never
type PetrovDayActionsViewName = "getAction"|"launchDashboard"|"adminConsole"|"warningConsole";
type PetrovDayLaunchsViewName = never
type PodcastEpisodesViewName = "episodeByExternalId";
type PodcastsViewName = never
type PostEmbeddingsViewName = never
type PostRecommendationsViewName = never
type PostRelationsViewName = "allPostRelations";
type PostViewTimesViewName = never
type PostViewsViewName = never
type PostsViewName = "userPosts"|"magic"|"top"|"new"|"recentComments"|"old"|"timeframe"|"daily"|"tagRelevance"|"frontpage"|"frontpage-rss"|"curated"|"curated-rss"|"community"|"community-rss"|"meta-rss"|"rss"|"topQuestions"|"recentQuestionActivity"|"scheduled"|"rejected"|"drafts"|"all_drafts"|"unlisted"|"userAFSubmissions"|"slugPost"|"legacyIdPost"|"recentDiscussionThreadsList"|"afRecentDiscussionThreadsList"|"2018reviewRecentDiscussionThreadsList"|"2019reviewRecentDiscussionThreadsList"|"globalEvents"|"nearbyEvents"|"events"|"eventsInTimeRange"|"upcomingEvents"|"pastEvents"|"tbdEvents"|"nonEventGroupPosts"|"postsWithBannedUsers"|"communityResourcePosts"|"sunshineNewPosts"|"sunshineNewUsersPosts"|"sunshineCuratedSuggestions"|"hasEverDialogued"|"pingbackPosts"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"voting2019"|"stickied"|"nominatablePostsByVote"|"reviewVoting"|"frontpageReviewWidget"|"reviewQuickPage"|"reviewFinalVoting"|"myBookmarkedPosts"|"alignmentSuggestedPosts";
type RSSFeedsViewName = "usersFeed";
type ReadStatusesViewName = never
type RecommendationsCachesViewName = never
type ReportsViewName = "allReports"|"unclaimedReports"|"claimedReports"|"adminClaimedReports"|"sunshineSidebarReports"|"closedReports";
type ReviewVotesViewName = "reviewVotesFromUser"|"reviewVotesForPost"|"reviewVotesForPostAndUser"|"reviewVotesAdminDashboard";
type ReviewWinnerArtsViewName = "postArt";
type ReviewWinnersViewName = "reviewWinnerSingle";
type RevisionsViewName = "revisionsByUser"|"revisionsOnDocument";
type SequencesViewName = "userProfile"|"userProfilePrivate"|"userProfileAll"|"curatedSequences"|"communitySequences";
type SessionsViewName = never
type SideCommentCachesViewName = never
type SplashArtCoordinatesViewName = never
type SpotlightsViewName = "mostRecentlyPromotedSpotlights"|"spotlightsPage"|"spotlightsPageDraft"|"spotlightsByDocumentIds";
type SubscriptionsViewName = "subscriptionState"|"subscriptionsOfType"|"membersOfGroup";
type SurveyQuestionsViewName = never
type SurveyResponsesViewName = never
type SurveySchedulesViewName = "surveySchedulesByCreatedAt";
type SurveysViewName = "surveysByCreatedAt";
type TagFlagsViewName = "allTagFlags";
type TagRelsViewName = "postsWithTag"|"tagsOnPost";
type TagsViewName = "tagsByTagIds"|"allTagsAlphabetical"|"userTags"|"currentUserSubforums"|"allPagesByNewest"|"allTagsHierarchical"|"tagBySlug"|"tagsBySlugs"|"coreTags"|"postTypeTags"|"coreAndSubforumTags"|"newTags"|"unreviewedTags"|"suggestedFilterTags"|"allLWWikiTags"|"unprocessedLWWikiTags"|"tagsByTagFlag"|"allPublicTags"|"allArbitalTags"|"pingbackWikiPages";
type TweetsViewName = never
type TypingIndicatorsViewName = never
type UserActivitiesViewName = never
type UserEAGDetailsViewName = "dataByUser";
type UserJobAdsViewName = "adsByUser";
type UserMostValuablePostsViewName = "currentUserMostValuablePosts"|"currentUserPost";
type UserRateLimitsViewName = "userRateLimits"|"activeUserRateLimits";
type UserTagRelsViewName = "single";
type UsersViewName = "usersByUserIds"|"usersProfile"|"LWSunshinesList"|"LWTrustLevel1List"|"LWUsersAdmin"|"usersWithBannedUsers"|"sunshineNewUsers"|"recentlyActive"|"allUsers"|"usersMapLocations"|"tagCommunityMembers"|"reviewAdminUsers"|"usersWithPaymentInfo"|"walledGardenInvitees"|"usersWithOptedInToDialogueFacilitation"|"alignmentSuggestedUsers";
type VotesViewName = "tagVotes"|"userPostVotes"|"userVotes";

interface ViewTermsByCollectionName {
  AdvisorRequests: AdvisorRequestsViewTerms
  ArbitalCaches: ViewTermsBase
  ArbitalTagContentRels: ViewTermsBase
  Bans: ViewTermsBase
  Books: ViewTermsBase
  Chapters: ChaptersViewTerms
  CkEditorUserSessions: ViewTermsBase
  ClientIds: ClientIdsViewTerms
  Collections: CollectionsViewTerms
  CommentModeratorActions: CommentModeratorActionsViewTerms
  Comments: CommentsViewTerms
  Conversations: ConversationsViewTerms
  CronHistories: ViewTermsBase
  CurationEmails: ViewTermsBase
  CurationNotices: CurationNoticesViewTerms
  DatabaseMetadata: ViewTermsBase
  DebouncerEvents: ViewTermsBase
  DialogueChecks: DialogueChecksViewTerms
  DialogueMatchPreferences: DialogueMatchPreferencesViewTerms
  DigestPosts: ViewTermsBase
  Digests: DigestsViewTerms
  ElectionCandidates: ElectionCandidatesViewTerms
  ElectionVotes: ElectionVotesViewTerms
  ElicitQuestionPredictions: ViewTermsBase
  ElicitQuestions: ViewTermsBase
  EmailTokens: ViewTermsBase
  FeaturedResources: FeaturedResourcesViewTerms
  ForumEvents: ForumEventsViewTerms
  GardenCodes: GardenCodesViewTerms
  GoogleServiceAccountSessions: GoogleServiceAccountSessionsViewTerms
  Images: ViewTermsBase
  JargonTerms: JargonTermsViewTerms
  LWEvents: LWEventsViewTerms
  LegacyData: ViewTermsBase
  LlmConversations: LlmConversationsViewTerms
  LlmMessages: ViewTermsBase
  Localgroups: LocalgroupsViewTerms
  ManifoldProbabilitiesCaches: ViewTermsBase
  Messages: MessagesViewTerms
  Migrations: ViewTermsBase
  ModerationTemplates: ModerationTemplatesViewTerms
  ModeratorActions: ModeratorActionsViewTerms
  MultiDocuments: MultiDocumentsViewTerms
  Notifications: NotificationsViewTerms
  PageCache: ViewTermsBase
  PetrovDayActions: PetrovDayActionsViewTerms
  PetrovDayLaunchs: ViewTermsBase
  PodcastEpisodes: PodcastEpisodesViewTerms
  Podcasts: ViewTermsBase
  PostEmbeddings: ViewTermsBase
  PostRecommendations: ViewTermsBase
  PostRelations: PostRelationsViewTerms
  PostViewTimes: ViewTermsBase
  PostViews: ViewTermsBase
  Posts: PostsViewTerms
  RSSFeeds: RSSFeedsViewTerms
  ReadStatuses: ViewTermsBase
  RecommendationsCaches: ViewTermsBase
  Reports: ReportsViewTerms
  ReviewVotes: ReviewVotesViewTerms
  ReviewWinnerArts: ReviewWinnerArtsViewTerms
  ReviewWinners: ReviewWinnersViewTerms
  Revisions: RevisionsViewTerms
  Sequences: SequencesViewTerms
  Sessions: ViewTermsBase
  SideCommentCaches: ViewTermsBase
  SplashArtCoordinates: ViewTermsBase
  Spotlights: SpotlightsViewTerms
  Subscriptions: SubscriptionsViewTerms
  SurveyQuestions: ViewTermsBase
  SurveyResponses: ViewTermsBase
  SurveySchedules: SurveySchedulesViewTerms
  Surveys: SurveysViewTerms
  TagFlags: TagFlagsViewTerms
  TagRels: TagRelsViewTerms
  Tags: TagsViewTerms
  Tweets: ViewTermsBase
  TypingIndicators: ViewTermsBase
  UserActivities: ViewTermsBase
  UserEAGDetails: UserEAGDetailsViewTerms
  UserJobAds: UserJobAdsViewTerms
  UserMostValuablePosts: UserMostValuablePostsViewTerms
  UserRateLimits: UserRateLimitsViewTerms
  UserTagRels: UserTagRelsViewTerms
  Users: UsersViewTerms
  Votes: VotesViewTerms
}


type NameOfCollectionWithViews = "AdvisorRequests"|"Chapters"|"ClientIds"|"CommentModeratorActions"|"Comments"|"Conversations"|"CurationNotices"|"DialogueChecks"|"DialogueMatchPreferences"|"Digests"|"ElectionVotes"|"FeaturedResources"|"ForumEvents"|"GardenCodes"|"JargonTerms"|"LWEvents"|"LlmConversations"|"Localgroups"|"Messages"|"ModerationTemplates"|"ModeratorActions"|"MultiDocuments"|"Notifications"|"PetrovDayActions"|"PodcastEpisodes"|"PostRelations"|"Posts"|"RSSFeeds"|"Reports"|"ReviewVotes"|"ReviewWinnerArts"|"ReviewWinners"|"Revisions"|"Sequences"|"Spotlights"|"Subscriptions"|"SurveySchedules"|"Surveys"|"TagFlags"|"TagRels"|"Tags"|"UserEAGDetails"|"UserJobAds"|"UserMostValuablePosts"|"UserRateLimits"|"UserTagRels"|"Users"|"Votes"
