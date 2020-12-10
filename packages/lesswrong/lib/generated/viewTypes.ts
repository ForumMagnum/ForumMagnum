type DatabaseMetadataViewName = never
type UsersViewName = "usersAdmin"|"usersProfile"|"LWSunshinesList"|"LWTrustLevel1List"|"LWUsersAdmin"|"usersWithBannedUsers"|"sunshineNewUsers"|"allUsers"|"usersMapLocations"|"areWeNuked"|"walledGardenInvitees"|"alignmentSuggestedUsers";
type VotesViewName = "tagVotes";
type CommentsViewName = "commentReplies"|"postCommentsDeleted"|"allCommentsDeleted"|"postCommentsTop"|"postCommentsOld"|"postCommentsNew"|"postCommentsBest"|"postLWComments"|"allRecentComments"|"recentComments"|"recentDiscussionThread"|"afRecentDiscussionThread"|"postsItemComments"|"sunshineNewCommentsList"|"questionAnswers"|"legacyIdComment"|"sunshineNewUsersComments"|"repliesToAnswer"|"topShortform"|"shortform"|"repliesToCommentThread"|"shortformLatestChildren"|"nominations2018"|"nominations2019"|"reviews2018"|"reviews2019"|"commentsOnTag"|"alignmentSuggestedComments"|"rss";
type PostRelationsViewName = "allPostRelations";
type TagRelsViewName = "postsWithTag"|"tagsOnPost";
type PostsViewName = "userPosts"|"magic"|"top"|"new"|"recentComments"|"old"|"timeframe"|"daily"|"tagRelevance"|"frontpage"|"frontpage-rss"|"curated"|"curated-rss"|"community"|"community-rss"|"meta-rss"|"rss"|"topQuestions"|"recentQuestionActivity"|"scheduled"|"drafts"|"all_drafts"|"unlisted"|"slugPost"|"legacyIdPost"|"recentDiscussionThreadsList"|"afRecentDiscussionThreadsList"|"2018reviewRecentDiscussionThreadsList"|"2019reviewRecentDiscussionThreadsList"|"shortformDiscussionThreadsList"|"onlineEvents"|"nearbyEvents"|"events"|"pastEvents"|"upcomingEvents"|"groupPosts"|"postsWithBannedUsers"|"communityResourcePosts"|"sunshineNewPosts"|"sunshineNewUsersPosts"|"sunshineCuratedSuggestions"|"pingbackPosts"|"nominations2018"|"nominations2019"|"reviews2018"|"tagProgressUntagged"|"personalTagProgressUntagged"|"tagProgressPosts"|"personalTagProgressPosts"|"alignmentSuggestedPosts";
type RSSFeedsViewName = "usersFeed";
type SequencesViewName = "userProfile"|"userProfileAll"|"curatedSequences"|"communitySequences";
type TagsViewName = "allTagsAlphabetical"|"userTags"|"allPagesByNewest"|"allTagsHierarchical"|"tagBySlug"|"coreTags"|"newTags"|"unreviewedTags"|"suggestedFilterTags"|"allLWWikiTags"|"unprocessedLWWikiTags"|"tagsByTagFlag";
type RevisionsViewName = "revisionsOnDocument";
type NotificationsViewName = "userNotifications"|"unreadUserNotifications";
type ConversationsViewName = "userConversations";
type MessagesViewName = "messagesConversation"|"conversationPreview";
type ReportsViewName = "allReports"|"unclaimedReports"|"claimedReports"|"adminClaimedReports"|"sunshineSidebarReports"|"closedReports";
type LWEventsViewName = "adminView"|"postVisits"|"emailHistory"|"gatherTownUsers";
type TagFlagsViewName = "allTagFlags";
type GardenCodesViewName = "userGardenCodes"|"semipublicGardenCodes"|"gardenCodeByCode";
type MigrationsViewName = never
type DebouncerEventsViewName = never
type ReadStatusesViewName = never
type BansViewName = never
type ChaptersViewName = "SequenceChapters";
type BooksViewName = never
type CollectionsViewName = never
type ReviewVotesViewName = "reviewVotesFromUser"|"reviewVotesForPost"|"reviewVotesForPostAndUser";
type LocalgroupsViewName = "userInactiveGroups"|"all"|"nearby"|"single";
type SubscriptionsViewName = "subscriptionState"|"subscriptionsOfType";
type PetrovDayLaunchsViewName = never
type LegacyDataViewName = never
type EmailTokensViewName = never

interface ViewTermsByCollectionName {
  DatabaseMetadata: never
  Users: UsersViewTerms
  Votes: VotesViewTerms
  Comments: CommentsViewTerms
  PostRelations: PostRelationsViewTerms
  TagRels: TagRelsViewTerms
  Posts: PostsViewTerms
  RSSFeeds: RSSFeedsViewTerms
  Sequences: SequencesViewTerms
  Tags: TagsViewTerms
  Revisions: RevisionsViewTerms
  Notifications: NotificationsViewTerms
  Conversations: ConversationsViewTerms
  Messages: MessagesViewTerms
  Reports: ReportsViewTerms
  LWEvents: LWEventsViewTerms
  TagFlags: TagFlagsViewTerms
  GardenCodes: GardenCodesViewTerms
  Migrations: never
  DebouncerEvents: never
  ReadStatuses: never
  Bans: never
  Chapters: ChaptersViewTerms
  Books: never
  Collections: never
  ReviewVotes: ReviewVotesViewTerms
  Localgroups: LocalgroupsViewTerms
  Subscriptions: SubscriptionsViewTerms
  PetrovDayLaunchs: never
  LegacyData: never
  EmailTokens: never
}


type NameOfCollectionWithViews = "Users"|"Votes"|"Comments"|"PostRelations"|"TagRels"|"Posts"|"RSSFeeds"|"Sequences"|"Tags"|"Revisions"|"Notifications"|"Conversations"|"Messages"|"Reports"|"LWEvents"|"TagFlags"|"GardenCodes"|"Chapters"|"ReviewVotes"|"Localgroups"|"Subscriptions"
