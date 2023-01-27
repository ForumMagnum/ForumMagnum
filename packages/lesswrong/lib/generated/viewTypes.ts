type AdvisorRequestsViewName = "requestsByUser";
type BansViewName = never
type BooksViewName = never
type ChaptersViewName = "SequenceChapters";
type ClientIdsViewName = never
type CollectionsViewName = never
type CommentApprovalsViewName = never
type CommentModeratorActionsViewName = "activeCommentModeratorActions";
type CommentsViewName = "commentReplies"|"postCommentsDeleted"|"allCommentsDeleted"|"postCommentsTop"|"afPostCommentsTop"|"postCommentsOld"|"postCommentsNew"|"postCommentsBest"|"postLWComments"|"profileRecentComments"|"allRecentComments"|"recentComments"|"afSubmissions"|"recentDiscussionThread"|"afRecentDiscussionThread"|"postsItemComments"|"sunshineNewCommentsList"|"questionAnswers"|"legacyIdComment"|"sunshineNewUsersComments"|"defaultModeratorResponses"|"repliesToAnswer"|"topShortform"|"shortform"|"repliesToCommentThread"|"shortformLatestChildren"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"reviews"|"tagDiscussionComments"|"tagSubforumComments"|"latestSubforumDiscussion"|"moderatorComments"|"commentsByIds"|"alignmentSuggestedComments"|"rss";
type ConversationsViewName = "moderatorConversations"|"userConversations"|"userGroupUntitledConversations";
type DatabaseMetadataViewName = never
type DebouncerEventsViewName = never
type EmailTokensViewName = never
type FeaturedResourcesViewName = "activeResources";
type GardenCodesViewName = "usersPrivateGardenCodes"|"publicGardenCodes"|"gardenCodeByCode";
type ImagesViewName = never
type LWEventsViewName = "adminView"|"postVisits"|"emailHistory"|"gatherTownUsers";
type LegacyDataViewName = never
type LocalgroupsViewName = "userOrganizesGroups"|"userActiveGroups"|"userInactiveGroups"|"all"|"nearby"|"single"|"local"|"online";
type MessagesViewName = "messagesConversation"|"conversationPreview";
type MigrationsViewName = never
type ModerationTemplatesViewName = "moderationTemplatesPage"|"moderationTemplatesQuickview";
type ModeratorActionsViewName = "userModeratorActions";
type NotificationsViewName = "userNotifications"|"unreadUserNotifications"|"adminAlertNotifications";
type PetrovDayLaunchsViewName = never
type PodcastEpisodesViewName = "episodeByExternalId";
type PodcastsViewName = never
type PostRelationsViewName = "allPostRelations";
type PostsViewName = "userPosts"|"magic"|"top"|"new"|"recentComments"|"old"|"timeframe"|"daily"|"tagRelevance"|"frontpage"|"frontpage-rss"|"curated"|"curated-rss"|"community"|"community-rss"|"meta-rss"|"rss"|"topQuestions"|"recentQuestionActivity"|"scheduled"|"drafts"|"all_drafts"|"unlisted"|"userAFSubmissions"|"slugPost"|"legacyIdPost"|"recentDiscussionThreadsList"|"afRecentDiscussionThreadsList"|"2018reviewRecentDiscussionThreadsList"|"2019reviewRecentDiscussionThreadsList"|"globalEvents"|"nearbyEvents"|"events"|"eventsInTimeRange"|"upcomingEvents"|"pastEvents"|"tbdEvents"|"nonEventGroupPosts"|"postsWithBannedUsers"|"communityResourcePosts"|"sunshineNewPosts"|"sunshineNewUsersPosts"|"sunshineCuratedSuggestions"|"pingbackPosts"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"voting2019"|"stickied"|"nominatablePostsByVote"|"reviewVoting"|"reviewQuickPage"|"reviewFinalVoting"|"myBookmarkedPosts"|"alignmentSuggestedPosts";
type RSSFeedsViewName = "usersFeed";
type ReadStatusesViewName = never
type ReportsViewName = "allReports"|"unclaimedReports"|"claimedReports"|"adminClaimedReports"|"sunshineSidebarReports"|"closedReports";
type ReviewVotesViewName = "reviewVotesFromUser"|"reviewVotesForPost"|"reviewVotesForPostAndUser"|"reviewVotesAdminDashboard";
type RevisionsViewName = "revisionsByUser"|"revisionsOnDocument";
type SequencesViewName = "userProfile"|"userProfilePrivate"|"userProfileAll"|"curatedSequences"|"communitySequences";
type SpotlightsViewName = "mostRecentlyPromotedSpotlights"|"spotlightsPage";
type SubscriptionsViewName = "subscriptionState"|"subscriptionsOfType";
type TagFlagsViewName = "allTagFlags";
type TagRelsViewName = "postsWithTag"|"tagsOnPost";
type TagsViewName = "allTagsAlphabetical"|"userTags"|"currentUserSubforums"|"allPagesByNewest"|"allTagsHierarchical"|"tagBySlug"|"coreTags"|"coreAndSubforumTags"|"newTags"|"unreviewedTags"|"suggestedFilterTags"|"allLWWikiTags"|"unprocessedLWWikiTags"|"tagsByTagFlag"|"allPublicTags";
type UserMostValuablePostsViewName = "currentUserMostValuablePosts"|"currentUserPost";
type UserTagRelsViewName = "single";
type UsersViewName = "usersProfile"|"LWSunshinesList"|"LWTrustLevel1List"|"LWUsersAdmin"|"usersWithBannedUsers"|"sunshineNewUsers"|"allUsers"|"usersMapLocations"|"tagCommunityMembers"|"reviewAdminUsers"|"usersWithPaymentInfo"|"walledGardenInvitees"|"alignmentSuggestedUsers";
type VotesViewName = "tagVotes"|"userPostVotes";

interface ViewTermsByCollectionName {
  AdvisorRequests: AdvisorRequestsViewTerms
  Bans: ViewTermsBase
  Books: ViewTermsBase
  Chapters: ChaptersViewTerms
  ClientIds: ViewTermsBase
  Collections: ViewTermsBase
  CommentApprovals: ViewTermsBase
  CommentModeratorActions: CommentModeratorActionsViewTerms
  Comments: CommentsViewTerms
  Conversations: ConversationsViewTerms
  DatabaseMetadata: ViewTermsBase
  DebouncerEvents: ViewTermsBase
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
  PetrovDayLaunchs: ViewTermsBase
  PodcastEpisodes: PodcastEpisodesViewTerms
  Podcasts: ViewTermsBase
  PostRelations: PostRelationsViewTerms
  Posts: PostsViewTerms
  RSSFeeds: RSSFeedsViewTerms
  ReadStatuses: ViewTermsBase
  Reports: ReportsViewTerms
  ReviewVotes: ReviewVotesViewTerms
  Revisions: RevisionsViewTerms
  Sequences: SequencesViewTerms
  Spotlights: SpotlightsViewTerms
  Subscriptions: SubscriptionsViewTerms
  TagFlags: TagFlagsViewTerms
  TagRels: TagRelsViewTerms
  Tags: TagsViewTerms
  UserMostValuablePosts: UserMostValuablePostsViewTerms
  UserTagRels: UserTagRelsViewTerms
  Users: UsersViewTerms
  Votes: VotesViewTerms
}


type NameOfCollectionWithViews = "AdvisorRequests"|"Chapters"|"CommentModeratorActions"|"Comments"|"Conversations"|"FeaturedResources"|"GardenCodes"|"LWEvents"|"Localgroups"|"Messages"|"ModerationTemplates"|"ModeratorActions"|"Notifications"|"PodcastEpisodes"|"PostRelations"|"Posts"|"RSSFeeds"|"Reports"|"ReviewVotes"|"Revisions"|"Sequences"|"Spotlights"|"Subscriptions"|"TagFlags"|"TagRels"|"Tags"|"UserMostValuablePosts"|"UserTagRels"|"Users"|"Votes"
