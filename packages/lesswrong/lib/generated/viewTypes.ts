type AdvisorRequestsViewName = "requestsByUser";
type BansViewName = never
type BooksViewName = never
type ChaptersViewName = "SequenceChapters";
type ClientIdsViewName = "getClientId";
type CollectionsViewName = never
type CommentModeratorActionsViewName = "activeCommentModeratorActions";
type CommentsViewName = "commentReplies"|"postCommentsDeleted"|"allCommentsDeleted"|"checkedByModGPT"|"postCommentsTop"|"postCommentsRecentReplies"|"postCommentsMagic"|"afPostCommentsTop"|"postCommentsOld"|"postCommentsNew"|"postCommentsBest"|"postLWComments"|"profileRecentComments"|"allRecentComments"|"recentComments"|"afSubmissions"|"rejected"|"recentDiscussionThread"|"afRecentDiscussionThread"|"postsItemComments"|"sunshineNewCommentsList"|"questionAnswers"|"legacyIdComment"|"sunshineNewUsersComments"|"defaultModeratorResponses"|"repliesToAnswer"|"answersAndReplies"|"topShortform"|"shortform"|"shortformFrontpage"|"repliesToCommentThread"|"shortformLatestChildren"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"reviews"|"tagDiscussionComments"|"tagSubforumComments"|"latestSubforumDiscussion"|"moderatorComments"|"debateResponses"|"recentDebateResponses"|"oneReplyInThreadByUser"|"alignmentSuggestedComments"|"rss";
type ConversationsViewName = "moderatorConversations"|"userConversations"|"userConversationsAll"|"userGroupUntitledConversations";
type CronHistoriesViewName = never
type DatabaseMetadataViewName = never
type DebouncerEventsViewName = never
type DialogueChecksViewName = "userDialogueChecks";
type DialogueMatchPreferencesViewName = "dialogueMatchPreferences";
type DigestPostsViewName = never
type DigestsViewName = "findByNum"|"all";
type ElectionCandidatesViewName = never
type ElectionVotesViewName = never
type ElicitQuestionPredictionsViewName = never
type ElicitQuestionsViewName = never
type EmailTokensViewName = never
type FeaturedResourcesViewName = "activeResources";
type GardenCodesViewName = "usersPrivateGardenCodes"|"publicGardenCodes"|"gardenCodeByCode";
type ImagesViewName = never
type LWEventsViewName = "adminView"|"postVisits"|"emailHistory"|"gatherTownUsers"|"postEverPublished";
type LegacyDataViewName = never
type LocalgroupsViewName = "userOrganizesGroups"|"userActiveGroups"|"userInactiveGroups"|"all"|"nearby"|"single"|"local"|"online";
type MessagesViewName = "messagesConversation"|"conversationPreview";
type MigrationsViewName = never
type ModerationTemplatesViewName = "moderationTemplatesPage"|"moderationTemplatesList";
type ModeratorActionsViewName = "userModeratorActions"|"restrictionModerationActions";
type NotificationsViewName = "userNotifications"|"unreadUserNotifications"|"adminAlertNotifications";
type PageCacheViewName = never
type PetrovDayLaunchsViewName = never
type PodcastEpisodesViewName = "episodeByExternalId";
type PodcastsViewName = never
type PostEmbeddingsViewName = never
type PostRecommendationsViewName = never
type PostRelationsViewName = "allPostRelations";
type PostsViewName = "userPosts"|"magic"|"top"|"new"|"recentComments"|"old"|"timeframe"|"daily"|"tagRelevance"|"frontpage"|"frontpage-rss"|"curated"|"curated-rss"|"community"|"community-rss"|"meta-rss"|"rss"|"topQuestions"|"recentQuestionActivity"|"scheduled"|"rejected"|"drafts"|"all_drafts"|"unlisted"|"userAFSubmissions"|"slugPost"|"legacyIdPost"|"recentDiscussionThreadsList"|"afRecentDiscussionThreadsList"|"2018reviewRecentDiscussionThreadsList"|"2019reviewRecentDiscussionThreadsList"|"globalEvents"|"nearbyEvents"|"events"|"eventsInTimeRange"|"upcomingEvents"|"pastEvents"|"tbdEvents"|"nonEventGroupPosts"|"postsWithBannedUsers"|"communityResourcePosts"|"sunshineNewPosts"|"sunshineNewUsersPosts"|"sunshineCuratedSuggestions"|"pingbackPosts"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"voting2019"|"stickied"|"nominatablePostsByVote"|"reviewVoting"|"reviewQuickPage"|"reviewFinalVoting"|"myBookmarkedPosts"|"alignmentSuggestedPosts";
type RSSFeedsViewName = "usersFeed";
type ReadStatusesViewName = never
type ReportsViewName = "allReports"|"unclaimedReports"|"claimedReports"|"adminClaimedReports"|"sunshineSidebarReports"|"closedReports";
type ReviewVotesViewName = "reviewVotesFromUser"|"reviewVotesForPost"|"reviewVotesForPostAndUser"|"reviewVotesAdminDashboard";
type RevisionsViewName = "revisionsByUser"|"revisionsOnDocument";
type SequencesViewName = "userProfile"|"userProfilePrivate"|"userProfileAll"|"curatedSequences"|"communitySequences";
type SessionsViewName = never
type SpotlightsViewName = "mostRecentlyPromotedSpotlights"|"spotlightsPage"|"spotlightForSequence";
type SubscriptionsViewName = "subscriptionState"|"subscriptionsOfType";
type TagFlagsViewName = "allTagFlags";
type TagRelsViewName = "postsWithTag"|"tagsOnPost";
type TagsViewName = "allTagsAlphabetical"|"userTags"|"currentUserSubforums"|"allPagesByNewest"|"allTagsHierarchical"|"tagBySlug"|"coreTags"|"postTypeTags"|"coreAndSubforumTags"|"newTags"|"unreviewedTags"|"suggestedFilterTags"|"allLWWikiTags"|"unprocessedLWWikiTags"|"tagsByTagFlag"|"allPublicTags";
type TypingIndicatorsViewName = never
type UserActivitiesViewName = never
type UserMostValuablePostsViewName = "currentUserMostValuablePosts"|"currentUserPost";
type UserRateLimitsViewName = "userRateLimits"|"activeUserRateLimits";
type UserTagRelsViewName = "single";
type UsersViewName = "usersByUserIds"|"usersProfile"|"LWSunshinesList"|"LWTrustLevel1List"|"LWUsersAdmin"|"usersWithBannedUsers"|"sunshineNewUsers"|"recentlyActive"|"allUsers"|"usersMapLocations"|"tagCommunityMembers"|"reviewAdminUsers"|"usersWithPaymentInfo"|"walledGardenInvitees"|"usersWithOptedInToDialogueFacilitation"|"alignmentSuggestedUsers";
type VotesViewName = "tagVotes"|"userPostVotes"|"userVotes";

interface ViewTermsByCollectionName {
  AdvisorRequests: AdvisorRequestsViewTerms
  Bans: ViewTermsBase
  Books: ViewTermsBase
  Chapters: ChaptersViewTerms
  ClientIds: ClientIdsViewTerms
  Collections: CollectionsViewTerms
  CommentModeratorActions: CommentModeratorActionsViewTerms
  Comments: CommentsViewTerms
  Conversations: ConversationsViewTerms
  CronHistories: ViewTermsBase
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
  GardenCodes: GardenCodesViewTerms
  Images: ViewTermsBase
  LWEvents: LWEventsViewTerms
  LegacyData: ViewTermsBase
  Localgroups: LocalgroupsViewTerms
  Messages: MessagesViewTerms
  Migrations: ViewTermsBase
  ModerationTemplates: ModerationTemplatesViewTerms
  ModeratorActions: ModeratorActionsViewTerms
  Notifications: NotificationsViewTerms
  PageCache: ViewTermsBase
  PetrovDayLaunchs: ViewTermsBase
  PodcastEpisodes: PodcastEpisodesViewTerms
  Podcasts: ViewTermsBase
  PostEmbeddings: ViewTermsBase
  PostRecommendations: ViewTermsBase
  PostRelations: PostRelationsViewTerms
  Posts: PostsViewTerms
  RSSFeeds: RSSFeedsViewTerms
  ReadStatuses: ViewTermsBase
  Reports: ReportsViewTerms
  ReviewVotes: ReviewVotesViewTerms
  Revisions: RevisionsViewTerms
  Sequences: SequencesViewTerms
  Sessions: ViewTermsBase
  Spotlights: SpotlightsViewTerms
  Subscriptions: SubscriptionsViewTerms
  TagFlags: TagFlagsViewTerms
  TagRels: TagRelsViewTerms
  Tags: TagsViewTerms
  TypingIndicators: ViewTermsBase
  UserActivities: ViewTermsBase
  UserMostValuablePosts: UserMostValuablePostsViewTerms
  UserRateLimits: UserRateLimitsViewTerms
  UserTagRels: UserTagRelsViewTerms
  Users: UsersViewTerms
  Votes: VotesViewTerms
}


type NameOfCollectionWithViews = "AdvisorRequests"|"Chapters"|"ClientIds"|"CommentModeratorActions"|"Comments"|"Conversations"|"DialogueChecks"|"DialogueMatchPreferences"|"Digests"|"FeaturedResources"|"GardenCodes"|"LWEvents"|"Localgroups"|"Messages"|"ModerationTemplates"|"ModeratorActions"|"Notifications"|"PodcastEpisodes"|"PostRelations"|"Posts"|"RSSFeeds"|"Reports"|"ReviewVotes"|"Revisions"|"Sequences"|"Spotlights"|"Subscriptions"|"TagFlags"|"TagRels"|"Tags"|"UserMostValuablePosts"|"UserRateLimits"|"UserTagRels"|"Users"|"Votes"
