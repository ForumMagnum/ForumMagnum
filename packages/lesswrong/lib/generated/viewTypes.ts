type BansViewName = never
type BooksViewName = never
type ChaptersViewName = "SequenceChapters";
type CollectionsViewName = never
type CommentsViewName = "commentReplies"|"postCommentsDeleted"|"allCommentsDeleted"|"postCommentsTop"|"afPostCommentsTop"|"postCommentsOld"|"postCommentsNew"|"postCommentsBest"|"postLWComments"|"allRecentComments"|"recentComments"|"afSubmissions"|"recentDiscussionThread"|"afRecentDiscussionThread"|"postsItemComments"|"sunshineNewCommentsList"|"questionAnswers"|"legacyIdComment"|"sunshineNewUsersComments"|"defaultModeratorResponses"|"repliesToAnswer"|"topShortform"|"shortform"|"repliesToCommentThread"|"shortformLatestChildren"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"reviews"|"commentsOnTag"|"moderatorComments"|"alignmentSuggestedComments"|"rss";
type ConversationsViewName = "userConversations"|"userGroupUntitledConversations";
type DatabaseMetadataViewName = never
type DebouncerEventsViewName = never
type EmailTokensViewName = never
type FeaturedResourcesViewName = "activeResources";
type GardenCodesViewName = "usersPrivateGardenCodes"|"publicGardenCodes"|"gardenCodeByCode";
type LWEventsViewName = "adminView"|"postVisits"|"emailHistory"|"gatherTownUsers";
type LegacyDataViewName = never
type LocalgroupsViewName = "userOrganizesGroups"|"userActiveGroups"|"userInactiveGroups"|"all"|"nearby"|"single"|"local"|"online";
type MessagesViewName = "messagesConversation"|"conversationPreview";
type MigrationsViewName = never
type NotificationsViewName = "userNotifications"|"unreadUserNotifications"|"adminAlertNotifications";
type PetrovDayLaunchsViewName = never
type PostRelationsViewName = "allPostRelations";
type PostsViewName = "userPosts"|"magic"|"top"|"new"|"recentComments"|"old"|"timeframe"|"daily"|"tagRelevance"|"frontpage"|"frontpage-rss"|"curated"|"curated-rss"|"community"|"community-rss"|"meta-rss"|"rss"|"topQuestions"|"recentQuestionActivity"|"scheduled"|"drafts"|"all_drafts"|"unlisted"|"userAFSubmissions"|"slugPost"|"legacyIdPost"|"recentDiscussionThreadsList"|"afRecentDiscussionThreadsList"|"2018reviewRecentDiscussionThreadsList"|"2019reviewRecentDiscussionThreadsList"|"globalEvents"|"nearbyEvents"|"events"|"eventsInTimeRange"|"upcomingEvents"|"pastEvents"|"tbdEvents"|"nonEventGroupPosts"|"postsWithBannedUsers"|"communityResourcePosts"|"sunshineNewPosts"|"sunshineNewUsersPosts"|"sunshineCuratedSuggestions"|"pingbackPosts"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"voting2019"|"stickied"|"nominatablePostsByVote"|"reviewVoting"|"reviewFinalVoting"|"myBookmarkedPosts"|"alignmentSuggestedPosts";
type RSSFeedsViewName = "usersFeed";
type ReadStatusesViewName = never
type ReportsViewName = "allReports"|"unclaimedReports"|"claimedReports"|"adminClaimedReports"|"sunshineSidebarReports"|"closedReports";
type ReviewVotesViewName = "reviewVotesFromUser"|"reviewVotesForPost"|"reviewVotesForPostAndUser"|"reviewVotesAdminDashboard";
type RevisionsViewName = "revisionsByUser"|"revisionsOnDocument";
type SequencesViewName = "userProfile"|"userProfilePrivate"|"userProfileAll"|"curatedSequences"|"communitySequences";
type SubscriptionsViewName = "subscriptionState"|"subscriptionsOfType";
type TagFlagsViewName = "allTagFlags";
type TagRelsViewName = "postsWithTag"|"tagsOnPost";
type TagReportsViewName = never
type TagsViewName = "allTagsAlphabetical"|"userTags"|"allPagesByNewest"|"allTagsHierarchical"|"tagBySlug"|"coreTags"|"newTags"|"unreviewedTags"|"suggestedFilterTags"|"allLWWikiTags"|"unprocessedLWWikiTags"|"tagsByTagFlag"|"allPublicTags";
type UsersViewName = "usersProfile"|"LWSunshinesList"|"LWTrustLevel1List"|"LWUsersAdmin"|"usersWithBannedUsers"|"sunshineNewUsers"|"allUsers"|"usersMapLocations"|"reviewAdminUsers"|"usersWithPaymentInfo"|"walledGardenInvitees"|"alignmentSuggestedUsers";
type VotesViewName = "tagVotes"|"userPostVotes";

interface ViewTermsByCollectionName {
  Bans: ViewTermsBase
  Books: ViewTermsBase
  Chapters: ChaptersViewTerms
  Collections: ViewTermsBase
  Comments: CommentsViewTerms
  Conversations: ConversationsViewTerms
  DatabaseMetadata: ViewTermsBase
  DebouncerEvents: ViewTermsBase
  EmailTokens: ViewTermsBase
  FeaturedResources: FeaturedResourcesViewTerms
  GardenCodes: GardenCodesViewTerms
  LWEvents: LWEventsViewTerms
  LegacyData: ViewTermsBase
  Localgroups: LocalgroupsViewTerms
  Messages: MessagesViewTerms
  Migrations: ViewTermsBase
  Notifications: NotificationsViewTerms
  PetrovDayLaunchs: ViewTermsBase
  PostRelations: PostRelationsViewTerms
  Posts: PostsViewTerms
  RSSFeeds: RSSFeedsViewTerms
  ReadStatuses: ViewTermsBase
  Reports: ReportsViewTerms
  ReviewVotes: ReviewVotesViewTerms
  Revisions: RevisionsViewTerms
  Sequences: SequencesViewTerms
  Subscriptions: SubscriptionsViewTerms
  TagFlags: TagFlagsViewTerms
  TagRels: TagRelsViewTerms
  TagReports: ViewTermsBase
  Tags: TagsViewTerms
  Users: UsersViewTerms
  Votes: VotesViewTerms
}


type NameOfCollectionWithViews = "Chapters"|"Comments"|"Conversations"|"FeaturedResources"|"GardenCodes"|"LWEvents"|"Localgroups"|"Messages"|"Notifications"|"PostRelations"|"Posts"|"RSSFeeds"|"Reports"|"ReviewVotes"|"Revisions"|"Sequences"|"Subscriptions"|"TagFlags"|"TagRels"|"Tags"|"Users"|"Votes"
