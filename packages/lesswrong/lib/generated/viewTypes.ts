type DatabaseMetadataViewName = never
type UsersViewName = "usersAdmin"|"usersProfile"|"LWSunshinesList"|"LWTrustLevel1List"|"LWUsersAdmin"|"usersWithBannedUsers"|"sunshineNewUsers"|"allUsers"|"usersMapLocations"|"areWeNuked"|"walledGardenInvitees"|"alignmentSuggestedUsers";
type NotificationsViewName = "userNotifications"|"unreadUserNotifications";
type ConversationsViewName = "userConversations";
type MessagesViewName = "messagesConversation"|"conversationPreview";
type RSSFeedsViewName = "usersFeed";
type ReportsViewName = "allReports"|"unclaimedReports"|"claimedReports"|"adminClaimedReports"|"sunshineSidebarReports"|"closedReports";
type LWEventsViewName = "adminView"|"postVisits"|"emailHistory"|"gatherTownUsers";
type TagFlagsViewName = "allTagFlags";
type GardenCodesViewName = "userGardenCodes"|"semipublicGardenCodes";
type MigrationsViewName = never
type DebouncerEventsViewName = never
type ReadStatusesViewName = never
type BansViewName = never
type SequencesViewName = "userProfile"|"userProfileAll"|"curatedSequences"|"communitySequences";
type ChaptersViewName = "SequenceChapters";
type BooksViewName = never
type CollectionsViewName = never
type ReviewVotesViewName = "reviewVotesFromUser"|"reviewVotesForPost"|"reviewVotesForPostAndUser";
type PostRelationsViewName = "allPostRelations";
type TagRelsViewName = "postsWithTag"|"tagsOnPost";
type TagsViewName = "allTagsAlphabetical"|"userTags"|"allPagesByNewest"|"allTagsHierarchical"|"tagBySlug"|"coreTags"|"newTags"|"unreviewedTags"|"suggestedFilterTags"|"allLWWikiTags"|"unprocessedLWWikiTags"|"tagsByTagFlag";
type CommentsViewName = "commentReplies"|"postCommentsDeleted"|"allCommentsDeleted"|"postCommentsTop"|"postCommentsOld"|"postCommentsNew"|"postCommentsBest"|"postLWComments"|"allRecentComments"|"recentComments"|"recentDiscussionThread"|"afRecentDiscussionThread"|"postsItemComments"|"sunshineNewCommentsList"|"questionAnswers"|"legacyIdComment"|"sunshineNewUsersComments"|"repliesToAnswer"|"topShortform"|"shortform"|"repliesToCommentThread"|"shortformLatestChildren"|"nominations2018"|"reviews2018"|"commentsOnTag"|"alignmentSuggestedComments"|"rss";
type PostsViewName = "userPosts"|"magic"|"top"|"new"|"recentComments"|"old"|"timeframe"|"daily"|"tagRelevance"|"frontpage"|"frontpage-rss"|"curated"|"curated-rss"|"community"|"community-rss"|"meta-rss"|"rss"|"topQuestions"|"recentQuestionActivity"|"scheduled"|"drafts"|"all_drafts"|"unlisted"|"slugPost"|"legacyIdPost"|"recentDiscussionThreadsList"|"afRecentDiscussionThreadsList"|"2018reviewRecentDiscussionThreadsList"|"shortformDiscussionThreadsList"|"onlineEvents"|"nearbyEvents"|"events"|"pastEvents"|"upcomingEvents"|"groupPosts"|"postsWithBannedUsers"|"communityResourcePosts"|"sunshineNewPosts"|"sunshineNewUsersPosts"|"sunshineCuratedSuggestions"|"pingbackPosts"|"nominations2018"|"reviews2018"|"tagProgressUntagged"|"personalTagProgressUntagged"|"tagProgressPosts"|"personalTagProgressPosts"|"alignmentSuggestedPosts";
type LocalgroupsViewName = "userInactiveGroups"|"all"|"nearby"|"single";
type SubscriptionsViewName = "subscriptionState"|"subscriptionsOfType";
type VotesViewName = "tagVotes";
type RevisionsViewName = "revisionsOnDocument";
type PetrovDayLaunchsViewName = never
type LegacyDataViewName = never
type EmailTokensViewName = never

interface ViewTermsByCollectionName {
  DatabaseMetadata: never
  Users: UsersViewTerms
  Notifications: NotificationsViewTerms
  Conversations: ConversationsViewTerms
  Messages: MessagesViewTerms
  RSSFeeds: RSSFeedsViewTerms
  Reports: ReportsViewTerms
  LWEvents: LWEventsViewTerms
  TagFlags: TagFlagsViewTerms
  GardenCodes: GardenCodesViewTerms
  Migrations: never
  DebouncerEvents: never
  ReadStatuses: never
  Bans: never
  Sequences: SequencesViewTerms
  Chapters: ChaptersViewTerms
  Books: never
  Collections: never
  ReviewVotes: ReviewVotesViewTerms
  PostRelations: PostRelationsViewTerms
  TagRels: TagRelsViewTerms
  Tags: TagsViewTerms
  Comments: CommentsViewTerms
  Posts: PostsViewTerms
  Localgroups: LocalgroupsViewTerms
  Subscriptions: SubscriptionsViewTerms
  Votes: VotesViewTerms
  Revisions: RevisionsViewTerms
  PetrovDayLaunchs: never
  LegacyData: never
  EmailTokens: never
}


type NameOfCollectionWithViews = "Users"|"Notifications"|"Conversations"|"Messages"|"RSSFeeds"|"Reports"|"LWEvents"|"TagFlags"|"GardenCodes"|"Sequences"|"Chapters"|"ReviewVotes"|"PostRelations"|"TagRels"|"Tags"|"Comments"|"Posts"|"Localgroups"|"Subscriptions"|"Votes"|"Revisions"
