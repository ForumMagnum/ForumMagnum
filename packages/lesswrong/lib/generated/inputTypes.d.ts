interface Query {
  EmailPreview: Array<EmailPreview | null> | null;
  ContinueReading: Array<RecommendResumeSequence> | null;
  Recommendations: Array<Post> | null;
  UserReadsPerCoreTag: Array<UserCoreTagReads>;
  GetRandomUser: User | null;
  IsDisplayNameTaken: boolean;
  GetUserBySlug: User | null;
  NetKarmaChangesForAuthorsOverPeriod: Array<NetKarmaChangesForAuthorsOverPeriod>;
  AirtableLeaderboards: Array<AirtableLeaderboardResult>;
  SuggestedFeedSubscriptionUsers: SuggestedFeedSubscriptionUsersResult | null;
  CommentsWithReacts: CommentsWithReactsResult | null;
  PopularComments: PopularCommentsResult | null;
  PostAnalytics: PostAnalyticsResult;
  MultiPostAnalytics: MultiPostAnalyticsResult;
  AnalyticsSeries: Array<AnalyticsSeriesValue | null> | null;
  ArbitalPageData: ArbitalPageData | null;
  ElicitBlockData: ElicitBlockData | null;
  unreadNotificationCounts: NotificationCounts;
  NotificationDisplays: NotificationDisplaysResult | null;
  Lightcone2024FundraiserStripeAmounts: Array<number> | null;
  PetrovDay2024CheckNumberOfIncoming: PetrovDay2024CheckNumberOfIncomingData | null;
  petrov2024checkIfNuked: boolean | null;
  PetrovDayCheckIfIncoming: PetrovDayCheckIfIncomingData | null;
  GivingSeasonHearts: Array<GivingSeasonHeart>;
  UsersReadPostsOfTargetUser: Array<Post> | null;
  UserReadHistory: UserReadHistoryResult | null;
  PostsUserCommentedOn: UserReadHistoryResult | null;
  PostIsCriticism: boolean | null;
  DigestPlannerData: Array<DigestPlannerPost>;
  DigestPosts: Array<Post> | null;
  CanAccessGoogleDoc: boolean | null;
  DigestHighlights: DigestHighlightsResult | null;
  DigestPostsThisWeek: DigestPostsThisWeekResult | null;
  CuratedAndPopularThisWeek: CuratedAndPopularThisWeekResult | null;
  RecentlyActiveDialogues: RecentlyActiveDialoguesResult | null;
  MyDialogues: MyDialoguesResult | null;
  CrossedKarmaThreshold: CrossedKarmaThresholdResult | null;
  RecombeeLatestPosts: RecombeeLatestPostsResult | null;
  RecombeeHybridPosts: RecombeeHybridPostsResult | null;
  PostsWithActiveDiscussion: PostsWithActiveDiscussionResult | null;
  PostsBySubscribedAuthors: PostsBySubscribedAuthorsResult | null;
  PostsWithApprovedJargon: PostsWithApprovedJargonResult | null;
  AllTagsActivityFeed: AllTagsActivityFeedQueryResults;
  RecentDiscussionFeed: RecentDiscussionFeedQueryResults;
  SubscribedFeed: SubscribedFeedQueryResults;
  TagHistoryFeed: TagHistoryFeedQueryResults;
  SubforumMagicFeed: SubforumMagicFeedQueryResults;
  SubforumTopFeed: SubforumTopFeedQueryResults;
  SubforumRecentCommentsFeed: SubforumRecentCommentsFeedQueryResults;
  SubforumNewFeed: SubforumNewFeedQueryResults;
  SubforumOldFeed: SubforumOldFeedQueryResults;
  CurrentFrontpageSurvey: SurveySchedule | null;
  TagUpdatesInTimeBlock: Array<TagUpdates>;
  TagUpdatesByUser: Array<TagUpdates> | null;
  RandomTag: Tag;
  ActiveTagCount: number;
  TagPreview: TagPreviewWithSummaries | null;
  TagsByCoreTagId: TagWithTotalCount;
  UserWrappedDataByYear: WrappedDataByYear | null;
  SiteData: Site | null;
  latestDialogueMessages: Array<string> | null;
  getLinkSharedPost: Post | null;
  MigrationsDashboard: MigrationsDashboardData | null;
  GetAllReviewWinners: Array<Post>;
  convertDocument: any;
  latestGoogleDocMetadata: any;
  moderatorViewIPAddress: ModeratorIPAddressInfo | null;
  currentSpotlight: Spotlight | null;
  RssPostChanges: RssPostChangeInfo;
  AdminMetadata: string | null;
  currentUser: User | null;
  SearchSynonyms: Array<string>;
  getCrosspost: any;
  RevisionsDiff: string | null;
  UltraFeed: UltraFeedQueryResults;
  UltraFeedSubscriptions: UltraFeedQueryResults;
  advisorRequest: SingleAdvisorRequestOutput | null;
  advisorRequests: MultiAdvisorRequestOutput | null;
  arbitalTagContentRel: SingleArbitalTagContentRelOutput | null;
  arbitalTagContentRels: MultiArbitalTagContentRelOutput | null;
  ban: SingleBanOutput | null;
  bans: MultiBanOutput | null;
  bookmark: SingleBookmarkOutput | null;
  bookmarks: MultiBookmarkOutput | null;
  book: SingleBookOutput | null;
  books: MultiBookOutput | null;
  chapter: SingleChapterOutput | null;
  chapters: MultiChapterOutput | null;
  ckEditorUserSession: SingleCkEditorUserSessionOutput | null;
  ckEditorUserSessions: MultiCkEditorUserSessionOutput | null;
  clientId: SingleClientIdOutput | null;
  clientIds: MultiClientIdOutput | null;
  collection: SingleCollectionOutput | null;
  collections: MultiCollectionOutput | null;
  commentModeratorAction: SingleCommentModeratorActionOutput | null;
  commentModeratorActions: MultiCommentModeratorActionOutput | null;
  comment: SingleCommentOutput | null;
  comments: MultiCommentOutput | null;
  conversation: SingleConversationOutput | null;
  conversations: MultiConversationOutput | null;
  curationNotice: SingleCurationNoticeOutput | null;
  curationNotices: MultiCurationNoticeOutput | null;
  dialogueCheck: SingleDialogueCheckOutput | null;
  dialogueChecks: MultiDialogueCheckOutput | null;
  dialogueMatchPreference: SingleDialogueMatchPreferenceOutput | null;
  dialogueMatchPreferences: MultiDialogueMatchPreferenceOutput | null;
  digestPost: SingleDigestPostOutput | null;
  digestPosts: MultiDigestPostOutput | null;
  digest: SingleDigestOutput | null;
  digests: MultiDigestOutput | null;
  electionCandidate: SingleElectionCandidateOutput | null;
  electionCandidates: MultiElectionCandidateOutput | null;
  electionVote: SingleElectionVoteOutput | null;
  electionVotes: MultiElectionVoteOutput | null;
  elicitQuestionPrediction: SingleElicitQuestionPredictionOutput | null;
  elicitQuestionPredictions: MultiElicitQuestionPredictionOutput | null;
  elicitQuestion: SingleElicitQuestionOutput | null;
  elicitQuestions: MultiElicitQuestionOutput | null;
  featuredResource: SingleFeaturedResourceOutput | null;
  featuredResources: MultiFeaturedResourceOutput | null;
  fieldChange: SingleFieldChangeOutput | null;
  fieldChanges: MultiFieldChangeOutput | null;
  forumEvent: SingleForumEventOutput | null;
  forumEvents: MultiForumEventOutput | null;
  gardenCode: SingleGardenCodeOutput | null;
  gardenCodes: MultiGardenCodeOutput | null;
  googleServiceAccountSession: SingleGoogleServiceAccountSessionOutput | null;
  googleServiceAccountSessions: MultiGoogleServiceAccountSessionOutput | null;
  jargonTerm: SingleJargonTermOutput | null;
  jargonTerms: MultiJargonTermOutput | null;
  lWEvent: SingleLWEventOutput | null;
  lWEvents: MultiLWEventOutput | null;
  llmConversation: SingleLlmConversationOutput | null;
  llmConversations: MultiLlmConversationOutput | null;
  localgroup: SingleLocalgroupOutput | null;
  localgroups: MultiLocalgroupOutput | null;
  message: SingleMessageOutput | null;
  messages: MultiMessageOutput | null;
  moderationTemplate: SingleModerationTemplateOutput | null;
  moderationTemplates: MultiModerationTemplateOutput | null;
  moderatorAction: SingleModeratorActionOutput | null;
  moderatorActions: MultiModeratorActionOutput | null;
  multiDocument: SingleMultiDocumentOutput | null;
  multiDocuments: MultiMultiDocumentOutput | null;
  notification: SingleNotificationOutput | null;
  notifications: MultiNotificationOutput | null;
  petrovDayAction: SinglePetrovDayActionOutput | null;
  petrovDayActions: MultiPetrovDayActionOutput | null;
  podcastEpisode: SinglePodcastEpisodeOutput | null;
  podcastEpisodes: MultiPodcastEpisodeOutput | null;
  podcast: SinglePodcastOutput | null;
  podcasts: MultiPodcastOutput | null;
  postRelation: SinglePostRelationOutput | null;
  postRelations: MultiPostRelationOutput | null;
  post: SinglePostOutput | null;
  posts: MultiPostOutput | null;
  rSSFeed: SingleRSSFeedOutput | null;
  rSSFeeds: MultiRSSFeedOutput | null;
  report: SingleReportOutput | null;
  reports: MultiReportOutput | null;
  reviewVote: SingleReviewVoteOutput | null;
  reviewVotes: MultiReviewVoteOutput | null;
  reviewWinnerArt: SingleReviewWinnerArtOutput | null;
  reviewWinnerArts: MultiReviewWinnerArtOutput | null;
  reviewWinner: SingleReviewWinnerOutput | null;
  reviewWinners: MultiReviewWinnerOutput | null;
  revision: SingleRevisionOutput | null;
  revisions: MultiRevisionOutput | null;
  sequence: SingleSequenceOutput | null;
  sequences: MultiSequenceOutput | null;
  splashArtCoordinate: SingleSplashArtCoordinateOutput | null;
  splashArtCoordinates: MultiSplashArtCoordinateOutput | null;
  spotlight: SingleSpotlightOutput | null;
  spotlights: MultiSpotlightOutput | null;
  subscription: SingleSubscriptionOutput | null;
  subscriptions: MultiSubscriptionOutput | null;
  surveyQuestion: SingleSurveyQuestionOutput | null;
  surveyQuestions: MultiSurveyQuestionOutput | null;
  surveyResponse: SingleSurveyResponseOutput | null;
  surveyResponses: MultiSurveyResponseOutput | null;
  surveySchedule: SingleSurveyScheduleOutput | null;
  surveySchedules: MultiSurveyScheduleOutput | null;
  survey: SingleSurveyOutput | null;
  surveys: MultiSurveyOutput | null;
  tagFlag: SingleTagFlagOutput | null;
  tagFlags: MultiTagFlagOutput | null;
  tagRel: SingleTagRelOutput | null;
  tagRels: MultiTagRelOutput | null;
  tag: SingleTagOutput | null;
  tags: MultiTagOutput | null;
  typingIndicator: SingleTypingIndicatorOutput | null;
  typingIndicators: MultiTypingIndicatorOutput | null;
  ultraFeedEvent: SingleUltraFeedEventOutput | null;
  ultraFeedEvents: MultiUltraFeedEventOutput | null;
  userEAGDetail: SingleUserEAGDetailOutput | null;
  userEAGDetails: MultiUserEAGDetailOutput | null;
  userJobAd: SingleUserJobAdOutput | null;
  userJobAds: MultiUserJobAdOutput | null;
  userMostValuablePost: SingleUserMostValuablePostOutput | null;
  userMostValuablePosts: MultiUserMostValuablePostOutput | null;
  userRateLimit: SingleUserRateLimitOutput | null;
  userRateLimits: MultiUserRateLimitOutput | null;
  userTagRel: SingleUserTagRelOutput | null;
  userTagRels: MultiUserTagRelOutput | null;
  user: SingleUserOutput | null;
  users: MultiUserOutput | null;
  vote: SingleVoteOutput | null;
  votes: MultiVoteOutput | null;
}

interface Mutation {
  dismissRecommendation: boolean | null;
  NewUserCompleteProfile: NewUserCompletedProfile | null;
  UserExpandFrontpageSection: boolean | null;
  UserUpdateSubforumMembership: User | null;
  setVotePost: Post | null;
  performVotePost: VoteResultPost | null;
  setVoteComment: Comment | null;
  performVoteComment: VoteResultComment | null;
  setVoteTagRel: TagRel | null;
  performVoteTagRel: VoteResultTagRel | null;
  setVoteRevision: Revision | null;
  performVoteRevision: VoteResultRevision | null;
  setVoteElectionCandidate: ElectionCandidate | null;
  performVoteElectionCandidate: VoteResultElectionCandidate | null;
  setVoteTag: Tag | null;
  performVoteTag: VoteResultTag | null;
  setVoteMultiDocument: MultiDocument | null;
  performVoteMultiDocument: VoteResultMultiDocument | null;
  moderateComment: Comment | null;
  MakeElicitPrediction: ElicitBlockData | null;
  MarkAllNotificationsAsRead: boolean | null;
  sendNewDialogueMessageNotification: boolean;
  PetrovDayLaunchMissile: PetrovDayLaunchMissileData | null;
  submitReviewVote: Post | null;
  AddGivingSeasonHeart: Array<GivingSeasonHeart>;
  RemoveGivingSeasonHeart: Array<GivingSeasonHeart>;
  ImportGoogleDoc: Post | null;
  revokeGoogleServiceAccountTokens: boolean;
  alignmentComment: Comment | null;
  alignmentPost: Post | null;
  markConversationRead: boolean;
  sendEventTriggeredDM: boolean;
  initiateConversation: Conversation | null;
  editSurvey: Survey | null;
  mergeTags: boolean | null;
  promoteLensToMain: boolean | null;
  RefreshDbSettings: boolean | null;
  login: LoginReturnData | null;
  signup: LoginReturnData | null;
  logout: LoginReturnData | null;
  resetPassword: string | null;
  AddForumEventVote: boolean | null;
  RemoveForumEventVote: boolean | null;
  RemoveForumEventSticker: boolean | null;
  unlockPost: Post | null;
  revertPostToRevision: Post | null;
  importUrlAsDraftPost: ExternalPostImportData;
  revertTagToRevision: Tag | null;
  autosaveRevision: Revision | null;
  lockThread: boolean;
  unlockThread: boolean;
  reorderSummaries: boolean | null;
  publishAndDeDuplicateSpotlight: Spotlight | null;
  toggleBookmark: ToggleBookmarkOutput | null;
  setIsHidden: User;
  markAsReadOrUnread: boolean | null;
  markPostCommentsRead: boolean | null;
  resyncRssFeed: boolean;
  updateContinueReading: boolean | null;
  getNewJargonTerms: Array<JargonTerm | null> | null;
  RSVPToEvent: Post | null;
  CancelRSVPToEvent: Post | null;
  addOrUpvoteTag: TagRel | null;
  addTags: boolean | null;
  analyticsEvent: boolean | null;
  UpdateSearchSynonyms: Array<string>;
  useEmailToken: any;
  connectCrossposter: string | null;
  unlinkCrossposter: string | null;
  observeRecommendation: boolean | null;
  clickRecommendation: boolean | null;
  increasePostViewCount: number | null;
  generateCoverImagesForPost: Array<ReviewWinnerArt | null> | null;
  flipSplashArtImage: boolean | null;
  createAdvisorRequest: AdvisorRequestOutput | null;
  updateAdvisorRequest: AdvisorRequestOutput | null;
  createBook: BookOutput | null;
  updateBook: BookOutput | null;
  createChapter: ChapterOutput | null;
  updateChapter: ChapterOutput | null;
  createCollection: CollectionOutput | null;
  updateCollection: CollectionOutput | null;
  createCommentModeratorAction: CommentModeratorActionOutput | null;
  updateCommentModeratorAction: CommentModeratorActionOutput | null;
  createComment: CommentOutput | null;
  updateComment: CommentOutput | null;
  createConversation: ConversationOutput | null;
  updateConversation: ConversationOutput | null;
  createCurationNotice: CurationNoticeOutput | null;
  updateCurationNotice: CurationNoticeOutput | null;
  createDigestPost: DigestPostOutput | null;
  updateDigestPost: DigestPostOutput | null;
  createDigest: DigestOutput | null;
  updateDigest: DigestOutput | null;
  createElectionCandidate: ElectionCandidateOutput | null;
  updateElectionCandidate: ElectionCandidateOutput | null;
  createElectionVote: ElectionVoteOutput | null;
  updateElectionVote: ElectionVoteOutput | null;
  createElicitQuestion: ElicitQuestionOutput | null;
  updateElicitQuestion: ElicitQuestionOutput | null;
  createForumEvent: ForumEventOutput | null;
  updateForumEvent: ForumEventOutput | null;
  createJargonTerm: JargonTermOutput | null;
  updateJargonTerm: JargonTermOutput | null;
  createLWEvent: LWEventOutput | null;
  updateLlmConversation: LlmConversationOutput | null;
  createLocalgroup: LocalgroupOutput | null;
  updateLocalgroup: LocalgroupOutput | null;
  createMessage: MessageOutput | null;
  updateMessage: MessageOutput | null;
  createModerationTemplate: ModerationTemplateOutput | null;
  updateModerationTemplate: ModerationTemplateOutput | null;
  createModeratorAction: ModeratorActionOutput | null;
  updateModeratorAction: ModeratorActionOutput | null;
  createMultiDocument: MultiDocumentOutput | null;
  updateMultiDocument: MultiDocumentOutput | null;
  updateNotification: NotificationOutput | null;
  createPetrovDayAction: PetrovDayActionOutput | null;
  createPodcastEpisode: PodcastEpisodeOutput | null;
  createPost: PostOutput | null;
  updatePost: PostOutput | null;
  createRSSFeed: RSSFeedOutput | null;
  updateRSSFeed: RSSFeedOutput | null;
  createReport: ReportOutput | null;
  updateReport: ReportOutput | null;
  updateRevision: RevisionOutput | null;
  createSequence: SequenceOutput | null;
  updateSequence: SequenceOutput | null;
  createSplashArtCoordinate: SplashArtCoordinateOutput | null;
  createSpotlight: SpotlightOutput | null;
  updateSpotlight: SpotlightOutput | null;
  createSubscription: SubscriptionOutput | null;
  createSurveyQuestion: SurveyQuestionOutput | null;
  updateSurveyQuestion: SurveyQuestionOutput | null;
  createSurveyResponse: SurveyResponseOutput | null;
  updateSurveyResponse: SurveyResponseOutput | null;
  createSurveySchedule: SurveyScheduleOutput | null;
  updateSurveySchedule: SurveyScheduleOutput | null;
  createSurvey: SurveyOutput | null;
  updateSurvey: SurveyOutput | null;
  createTagFlag: TagFlagOutput | null;
  updateTagFlag: TagFlagOutput | null;
  createTag: TagOutput | null;
  updateTag: TagOutput | null;
  createUltraFeedEvent: UltraFeedEventOutput | null;
  updateUltraFeedEvent: UltraFeedEventOutput | null;
  createUserEAGDetail: UserEAGDetailOutput | null;
  updateUserEAGDetail: UserEAGDetailOutput | null;
  createUserJobAd: UserJobAdOutput | null;
  updateUserJobAd: UserJobAdOutput | null;
  createUserMostValuablePost: UserMostValuablePostOutput | null;
  updateUserMostValuablePost: UserMostValuablePostOutput | null;
  createUserRateLimit: UserRateLimitOutput | null;
  updateUserRateLimit: UserRateLimitOutput | null;
  createUserTagRel: UserTagRelOutput | null;
  updateUserTagRel: UserTagRelOutput | null;
  createUser: UserOutput | null;
  updateUser: UserOutput | null;
}

interface ContentType {
  type: string;
  data: ContentTypeData;
}

interface SelectorInput {
  _id?: string | null;
  documentId?: string | null;
}

interface EmptyViewInput {
  _?: boolean | null;
}

interface EmailPreview {
  to: string | null;
  subject: string | null;
  html: string | null;
  text: string | null;
}

interface ArbitalLinkedPage {
  _id: string;
  name: string;
  slug: string;
}

interface ArbitalLinkedPages {
  faster: Array<ArbitalLinkedPage>;
  slower: Array<ArbitalLinkedPage>;
  moreTechnical: Array<ArbitalLinkedPage>;
  lessTechnical: Array<ArbitalLinkedPage>;
  requirements: Array<ArbitalLinkedPage>;
  teaches: Array<ArbitalLinkedPage>;
  parents: Array<ArbitalLinkedPage>;
  children: Array<ArbitalLinkedPage>;
}

interface SocialPreviewType {
  _id: string;
  imageId: string | null;
  imageUrl: string;
  text: string | null;
}

interface CoauthorStatusInput {
  userId: string;
  confirmed: boolean;
  requested: boolean;
}

interface SocialPreviewInput {
  imageId?: string | null;
  text?: string | null;
}

interface CrosspostInput {
  isCrosspost: boolean;
  hostedHere?: boolean | null;
  foreignPostId?: string | null;
}

interface CoauthorStatusOutput {
  userId: string;
  confirmed: boolean;
  requested: boolean;
}

interface SocialPreviewOutput {
  imageId: string | null;
  text: string | null;
}

interface CrosspostOutput {
  isCrosspost: boolean;
  hostedHere: boolean | null;
  foreignPostId: string | null;
}

interface TagContributor {
  user: User | null;
  contributionScore: number;
  currentAttributionCharCount: number | null;
  numCommits: number;
  voteCount: number;
}

interface TagContributorsList {
  contributors: Array<TagContributor>;
  totalCount: number;
}

interface UserLikingTag {
  userId: string;
  displayName: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface ExpandedFrontpageSectionsSettingsInput {
  community?: boolean | null;
  recommendations?: boolean | null;
  quickTakes?: boolean | null;
  quickTakesCommunity?: boolean | null;
  popularComments?: boolean | null;
}

interface ExpandedFrontpageSectionsSettingsOutput {
  community: boolean | null;
  recommendations: boolean | null;
  quickTakes: boolean | null;
  quickTakesCommunity: boolean | null;
  popularComments: boolean | null;
}

interface PartiallyReadSequenceItemInput {
  sequenceId?: string | null;
  collectionId?: string | null;
  lastReadPostId: string;
  nextPostId: string;
  numRead: number;
  numTotal: number;
  lastReadTime?: Date | null;
}

interface PartiallyReadSequenceItemOutput {
  sequenceId: string | null;
  collectionId: string | null;
  lastReadPostId: string | null;
  nextPostId: string | null;
  numRead: number | null;
  numTotal: number | null;
  lastReadTime: Date | null;
}

interface PostMetadataInput {
  postId: string;
}

interface PostMetadataOutput {
  postId: string;
}

interface RecommendationAlgorithmSettingsInput {
  method: string;
  count: number;
  scoreOffset: number;
  scoreExponent: number;
  personalBlogpostModifier: number;
  frontpageModifier: number;
  curatedModifier: number;
  onlyUnread: boolean;
}

interface RecommendationSettingsInput {
  frontpage: RecommendationAlgorithmSettingsInput;
  frontpageEA: RecommendationAlgorithmSettingsInput;
  recommendationspage: RecommendationAlgorithmSettingsInput;
}

interface RecommendResumeSequence {
  sequence: Sequence | null;
  collection: Collection | null;
  nextPost: Post;
  numRead: number | null;
  numTotal: number | null;
  lastReadTime: Date | null;
}

interface CommentCountTag {
  name: string;
  comment_count: number;
}

interface TopCommentedTagUser {
  _id: ID;
  username: string;
  displayName: string;
  total_power: number;
  tag_comment_counts: Array<CommentCountTag>;
}

interface UpvotedUser {
  _id: ID;
  username: string;
  displayName: string;
  total_power: number;
  power_values: string;
  vote_counts: number;
  total_agreement: number;
  agreement_values: string;
  recently_active_matchmaking: boolean;
}

interface UserDialogueUsefulData {
  dialogueUsers: Array<User | null> | null;
  topUsers: Array<UpvotedUser | null> | null;
  activeDialogueMatchSeekers: Array<User | null> | null;
}

interface NewUserCompletedProfile {
  username: string | null;
  slug: string | null;
  displayName: string | null;
  subscribedToDigest: boolean | null;
  usernameUnset: boolean | null;
}

interface UserCoreTagReads {
  tagId: string;
  userReadCount: number;
}

interface NetKarmaChangesForAuthorsOverPeriod {
  userId: string | null;
  netKarma: number | null;
}

interface AirtableLeaderboardResult {
  name: string;
  leaderboardAmount: number | null;
}

interface SuggestedFeedSubscriptionUsersResult {
  results: Array<User>;
}

interface VoteResultPost {
  document: Post;
  showVotingPatternWarning: boolean;
}

interface VoteResultComment {
  document: Comment;
  showVotingPatternWarning: boolean;
}

interface VoteResultTagRel {
  document: TagRel;
  showVotingPatternWarning: boolean;
}

interface VoteResultRevision {
  document: Revision;
  showVotingPatternWarning: boolean;
}

interface VoteResultElectionCandidate {
  document: ElectionCandidate;
  showVotingPatternWarning: boolean;
}

interface VoteResultTag {
  document: Tag;
  showVotingPatternWarning: boolean;
}

interface VoteResultMultiDocument {
  document: MultiDocument;
  showVotingPatternWarning: boolean;
}

interface CommentsWithReactsResult {
  results: Array<Comment>;
}

interface PopularCommentsResult {
  results: Array<Comment>;
}

interface PostKarmaChange {
  _id: string;
  collectionName: string;
  scoreChange: number;
  postId: string;
  title: string | null;
  slug: string;
  addedReacts: Array<ReactionChange> | null;
  eaAddedReacts: any;
}

interface CommentKarmaChange {
  _id: string;
  collectionName: string;
  scoreChange: number;
  commentId: string | null;
  description: string | null;
  postId: string | null;
  postTitle: string | null;
  postSlug: string | null;
  tagSlug: string | null;
  tagName: string | null;
  tagCommentType: TagCommentType | null;
  tagId: string | null;
  addedReacts: Array<ReactionChange> | null;
  eaAddedReacts: any;
}

interface RevisionsKarmaChange {
  _id: string;
  collectionName: string;
  scoreChange: number;
  tagId: string | null;
  tagSlug: string | null;
  tagName: string | null;
  addedReacts: Array<ReactionChange> | null;
  eaAddedReacts: any;
}

interface ReactionChange {
  reactionType: string;
  userId: string | null;
}

interface KarmaChangesSimple {
  posts: Array<PostKarmaChange>;
  comments: Array<CommentKarmaChange>;
  tagRevisions: Array<RevisionsKarmaChange>;
}

interface KarmaChanges {
  totalChange: number;
  startDate: Date | null;
  endDate: Date | null;
  nextBatchDate: Date | null;
  updateFrequency: string;
  posts: Array<PostKarmaChange>;
  comments: Array<CommentKarmaChange>;
  tagRevisions: Array<RevisionsKarmaChange>;
  todaysKarmaChanges: KarmaChangesSimple | null;
  thisWeeksKarmaChanges: KarmaChangesSimple | null;
}

interface UniqueClientViewsSeries {
  uniqueClientViews: number | null;
  date: Date | null;
}

interface PostAnalyticsResult {
  allViews: number | null;
  uniqueClientViews: number | null;
  uniqueClientViews10Sec: number | null;
  medianReadingTime: number | null;
  uniqueClientViews5Min: number | null;
  uniqueClientViewsSeries: Array<UniqueClientViewsSeries | null> | null;
}

interface PostAnalytics2Result {
  _id: string | null;
  title: string | null;
  slug: string | null;
  postedAt: Date | null;
  views: number | null;
  uniqueViews: number | null;
  reads: number | null;
  meanReadingTime: number | null;
  karma: number | null;
  comments: number | null;
}

interface MultiPostAnalyticsResult {
  posts: Array<PostAnalytics2Result | null> | null;
  totalCount: number;
}

interface AnalyticsSeriesValue {
  date: Date | null;
  views: number | null;
  reads: number | null;
  karma: number | null;
  comments: number | null;
}

interface ArbitalPageData {
  html: string | null;
  title: string | null;
}

interface ElicitUser {
  isQuestionCreator: boolean | null;
  displayName: string | null;
  _id: string | null;
  sourceUserId: string | null;
  lwUser: User | null;
}

interface ElicitPrediction {
  _id: string | null;
  predictionId: string | null;
  prediction: number | null;
  createdAt: Date | null;
  notes: string | null;
  creator: ElicitUser | null;
  sourceUrl: string | null;
  sourceId: string | null;
  binaryQuestionId: string | null;
}

interface ElicitBlockData {
  _id: string | null;
  title: string | null;
  notes: string | null;
  resolvesBy: Date | null;
  resolution: boolean | null;
  predictions: Array<ElicitPrediction> | null;
}

interface NotificationCounts {
  checkedAt: Date;
  unreadNotifications: number;
  unreadPrivateMessages: number;
  faviconBadgeNumber: number;
}

interface NotificationDisplaysResult {
  results: Array<any>;
}

interface PetrovDay2024CheckNumberOfIncomingData {
  count: number | null;
}

interface PetrovDayCheckIfIncomingData {
  launched: boolean | null;
  createdAt: Date | null;
}

interface PetrovDayLaunchMissileData {
  launchCode: string | null;
  createdAt: Date | null;
}

interface GivingSeasonHeart {
  userId: string;
  displayName: string;
  x: number;
  y: number;
  theta: number;
}

interface UserReadHistoryResult {
  posts: Array<Post> | null;
}

interface PostsUserCommentedOnResult {
  posts: Array<Post> | null;
}

interface PostReviewFilter {
  startDate: Date | null;
  endDate: Date | null;
  minKarma: number | null;
  showEvents: boolean | null;
}

interface PostReviewSort {
  karma: boolean | null;
}

interface DigestPlannerPost {
  post: Post;
  digestPost: DigestPost | null;
  rating: number;
}

interface RecombeeRecommendedPost {
  post: Post;
  scenario: string | null;
  recommId: string | null;
  generatedAt: Date | null;
  curated: boolean | null;
  stickied: boolean | null;
}

interface VertexRecommendedPost {
  post: Post;
  attributionId: string | null;
}

interface PostWithApprovedJargon {
  post: Post;
  jargonTerms: Array<JargonTerm>;
}

interface DigestHighlightsResult {
  results: Array<Post>;
}

interface DigestPostsThisWeekResult {
  results: Array<Post>;
}

interface CuratedAndPopularThisWeekResult {
  results: Array<Post>;
}

interface RecentlyActiveDialoguesResult {
  results: Array<Post>;
}

interface MyDialoguesResult {
  results: Array<Post>;
}

interface CrossedKarmaThresholdResult {
  results: Array<Post>;
}

interface RecombeeLatestPostsResult {
  results: Array<RecombeeRecommendedPost>;
}

interface RecombeeHybridPostsResult {
  results: Array<RecombeeRecommendedPost>;
}

interface PostsWithActiveDiscussionResult {
  results: Array<Post>;
}

interface PostsBySubscribedAuthorsResult {
  results: Array<Post>;
}

interface PostsWithApprovedJargonResult {
  results: Array<PostWithApprovedJargon>;
}

interface AllTagsActivityFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<AllTagsActivityFeedEntry> | null;
}

interface AllTagsActivityFeedEntry {
  type: AllTagsActivityFeedEntryType;
  tagCreated: Tag | null;
  tagRevision: Revision | null;
  tagDiscussionComment: Comment | null;
}

interface RecentDiscussionFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<RecentDiscussionFeedEntry> | null;
  sessionId: string | null;
}

interface RecentDiscussionFeedEntry {
  type: RecentDiscussionFeedEntryType;
  postCommented: Post | null;
  shortformCommented: Post | null;
  tagDiscussed: Tag | null;
  tagRevised: Revision | null;
}

interface SubscribedPostAndComments {
  _id: string;
  post: Post;
  comments: Array<Comment> | null;
  expandCommentIds: Array<string> | null;
  postIsFromSubscribedUser: boolean;
}

interface SubscribedFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<SubscribedFeedEntry> | null;
}

interface SubscribedFeedEntry {
  type: SubscribedFeedEntryType;
  postCommented: SubscribedPostAndComments | null;
}

interface TagHistoryFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<TagHistoryFeedEntry> | null;
}

interface TagHistoryFeedEntry {
  type: TagHistoryFeedEntryType;
  tagCreated: Tag | null;
  tagApplied: TagRel | null;
  tagRevision: Revision | null;
  tagDiscussionComment: Comment | null;
  lensRevision: Revision | null;
  summaryRevision: Revision | null;
  wikiMetadataChanged: FieldChange | null;
  lensOrSummaryMetadataChanged: FieldChange | null;
}

interface SubforumMagicFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<SubforumMagicFeedEntry> | null;
}

interface SubforumMagicFeedEntry {
  type: SubforumMagicFeedEntryType;
  tagSubforumPosts: Post | null;
  tagSubforumComments: Comment | null;
  tagSubforumStickyComments: Comment | null;
}

interface SubforumTopFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<SubforumTopFeedEntry> | null;
}

interface SubforumTopFeedEntry {
  type: SubforumTopFeedEntryType;
  tagSubforumPosts: Post | null;
  tagSubforumComments: Comment | null;
  tagSubforumStickyComments: Comment | null;
}

interface SubforumRecentCommentsFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<SubforumRecentCommentsFeedEntry> | null;
}

interface SubforumRecentCommentsFeedEntry {
  type: SubforumRecentCommentsFeedEntryType;
  tagSubforumPosts: Post | null;
  tagSubforumComments: Comment | null;
  tagSubforumStickyComments: Comment | null;
}

interface SubforumNewFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<SubforumNewFeedEntry> | null;
}

interface SubforumNewFeedEntry {
  type: SubforumNewFeedEntryType;
  tagSubforumPosts: Post | null;
  tagSubforumComments: Comment | null;
  tagSubforumStickyComments: Comment | null;
}

interface SubforumOldFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<SubforumOldFeedEntry> | null;
}

interface SubforumOldFeedEntry {
  type: SubforumOldFeedEntryType;
  tagSubforumPosts: Post | null;
  tagSubforumComments: Comment | null;
  tagSubforumStickyComments: Comment | null;
}

interface SurveyQuestionInfo {
  _id: string | null;
  question: string;
  format: string;
}

interface DocumentDeletion {
  userId: string | null;
  documentId: string;
  netChange: DocumentDeletionNetChange;
  type: MultiDocumentType | null;
  docFields: MultiDocument | null;
  createdAt: Date;
}

interface TagUpdates {
  tag: Tag;
  revisionIds: Array<string>;
  commentCount: number;
  commentIds: Array<string>;
  lastRevisedAt: Date | null;
  lastCommentedAt: Date | null;
  added: number;
  removed: number;
  users: Array<User>;
  documentDeletions: Array<DocumentDeletion>;
}

interface TagPreviewWithSummaries {
  tag: Tag;
  lens: MultiDocument | null;
  summaries: Array<MultiDocument>;
}

interface TagWithTotalCount {
  tags: Array<Tag>;
  totalCount: number;
}

interface MostReadTopic {
  slug: string | null;
  name: string | null;
  shortName: string | null;
  count: number | null;
}

interface TagReadLikelihoodRatio {
  tagId: string | null;
  tagName: string | null;
  tagShortName: string | null;
  userReadCount: number | null;
  readLikelihoodRatio: number | null;
}

interface MostReadAuthor {
  _id: string | null;
  slug: string | null;
  displayName: string | null;
  profileImageId: string | null;
  count: number | null;
  engagementPercentile: number | null;
}

interface TopCommentContents {
  html: string | null;
}

interface TopComment {
  _id: string | null;
  postedAt: Date | null;
  postId: string | null;
  postTitle: string | null;
  postSlug: string | null;
  baseScore: number | null;
  extendedScore: any;
  contents: TopCommentContents | null;
}

interface MostReceivedReact {
  name: string | null;
  count: number | null;
}

interface CombinedKarmaVals {
  date: Date;
  postKarma: number;
  commentKarma: number;
}

interface WrappedDataByYear {
  engagementPercentile: number | null;
  postsReadCount: number | null;
  totalSeconds: number | null;
  daysVisited: Array<string | null> | null;
  mostReadTopics: Array<MostReadTopic | null> | null;
  relativeMostReadCoreTopics: Array<TagReadLikelihoodRatio | null> | null;
  mostReadAuthors: Array<MostReadAuthor | null> | null;
  topPosts: Array<Post | null> | null;
  postCount: number | null;
  authorPercentile: number | null;
  topComment: TopComment | null;
  commentCount: number | null;
  commenterPercentile: number | null;
  topShortform: Comment | null;
  shortformCount: number | null;
  shortformPercentile: number | null;
  karmaChange: number | null;
  combinedKarmaVals: Array<CombinedKarmaVals | null> | null;
  mostReceivedReacts: Array<MostReceivedReact | null> | null;
  personality: string;
}

interface Site {
  title: string | null;
  url: string | null;
  logoUrl: string | null;
}

interface LoginReturnData {
  token: string | null;
}

interface MigrationsDashboardData {
  migrations: Array<MigrationStatus> | null;
}

interface MigrationStatus {
  name: string;
  dateWritten: string | null;
  runs: Array<MigrationRun> | null;
  lastRun: string | null;
}

interface MigrationRun {
  name: string;
  started: Date;
  finished: Date | null;
  succeeded: boolean | null;
}

interface ExternalPost {
  _id: string;
  slug: string | null;
  title: string | null;
  url: string | null;
  postedAt: Date | null;
  createdAt: Date | null;
  userId: string | null;
  modifiedAt: Date | null;
  draft: boolean | null;
  content: string | null;
  coauthorUserIds: Array<string> | null;
}

interface ExternalPostImportData {
  alreadyExists: boolean | null;
  post: ExternalPost | null;
}

interface AutosaveContentType {
  type: string | null;
  value: ContentTypeData | null;
}

interface ModeratorIPAddressInfo {
  ip: string;
  userIds: Array<string>;
}

interface ToggleBookmarkInput {
  documentId: string;
  collectionName: string;
}

interface ToggleBookmarkOutput {
  data: Bookmark | null;
}

interface RssPostChangeInfo {
  isChanged: boolean;
  newHtml: string;
  htmlDiff: string;
}

interface FeedSpotlightMetaInfo {
  sources: Array<string>;
  servedEventId: string;
}

interface FeedPost {
  _id: string;
  postMetaInfo: any;
  post: Post;
}

interface FeedCommentThread {
  _id: string;
  commentMetaInfos: any;
  comments: Array<Comment>;
  post: Post | null;
  isOnReadPost: boolean | null;
  postSources: Array<string> | null;
}

interface FeedSpotlightItem {
  _id: string;
  spotlight: Spotlight | null;
  post: Post | null;
  spotlightMetaInfo: FeedSpotlightMetaInfo | null;
}

interface FeedSubscriptionSuggestions {
  _id: string;
  suggestedUsers: Array<User>;
}

interface UltraFeedQueryResults {
  cutoff: Date | null;
  endOffset: number;
  results: Array<UltraFeedEntry> | null;
  sessionId: string | null;
}

interface UltraFeedEntry {
  type: UltraFeedEntryType;
  feedCommentThread: FeedCommentThread | null;
  feedPost: FeedPost | null;
  feedSpotlight: FeedSpotlightItem | null;
  feedSubscriptionSuggestions: FeedSubscriptionSuggestions | null;
}

interface ElicitQuestionPredictionCreator {
  _id: string;
  displayName: string;
  isQuestionCreator: boolean;
  sourceUserId: string | null;
}

interface AdvisorRequest {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  interestedInMetaculus: boolean | null;
  jobAds: any;
}

interface SingleAdvisorRequestInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleAdvisorRequestOutput {
  result: AdvisorRequest | null;
}

interface AdvisorRequestsRequestsByUserInput {
  userId?: string | null;
}

interface AdvisorRequestSelector {
  default: EmptyViewInput | null;
  requestsByUser: AdvisorRequestsRequestsByUserInput | null;
}

interface MultiAdvisorRequestInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiAdvisorRequestOutput {
  results: Array<AdvisorRequest>;
  totalCount: number | null;
}

interface ArbitalCaches {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface ArbitalTagContentRel {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  parentDocumentId: string;
  childDocumentId: string;
  parentCollectionName: string;
  childCollectionName: string;
  type: string;
  level: number;
  isStrong: boolean;
}

interface SingleArbitalTagContentRelInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleArbitalTagContentRelOutput {
  result: ArbitalTagContentRel | null;
}

interface ArbitalTagContentRelSelector {
  default: EmptyViewInput | null;
}

interface MultiArbitalTagContentRelInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiArbitalTagContentRelOutput {
  results: Array<ArbitalTagContentRel>;
  totalCount: number | null;
}

interface AutomatedContentEvaluation {
  _id: string;
  createdAt: Date;
  revisionId: string;
  score: number | null;
  sentenceScores: Array<SentenceScore> | null;
  aiChoice: string | null;
  aiReasoning: string | null;
  aiCoT: string | null;
}

interface SentenceScore {
  sentence: string;
  score: number;
}

interface Ban {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  expirationDate: Date | null;
  userId: string;
  user: User | null;
  ip: string | null;
  reason: string | null;
  comment: string;
  properties: any;
}

interface SingleBanInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleBanOutput {
  result: Ban | null;
}

interface BanSelector {
  default: EmptyViewInput | null;
}

interface MultiBanInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiBanOutput {
  results: Array<Ban>;
  totalCount: number | null;
}

interface Bookmark {
  _id: string;
  createdAt: Date;
  documentId: string;
  collectionName: string;
  userId: string;
  post: Post | null;
  comment: Comment | null;
  lastUpdated: Date;
  active: boolean;
}

interface SingleBookmarkInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  allowNull?: boolean | null;
}

interface SingleBookmarkOutput {
  result: Bookmark | null;
}

interface BookmarksUserDocumentBookmarkInput {
  userId?: string | null;
  documentId?: string | null;
  collectionName?: string | null;
}

interface BookmarkSelector {
  myBookmarkedPosts: EmptyViewInput | null;
  myBookmarks: EmptyViewInput | null;
  userDocumentBookmark: BookmarksUserDocumentBookmarkInput | null;
}

interface MultiBookmarkInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiBookmarkOutput {
  results: Array<Bookmark>;
  totalCount: number | null;
}

interface Book {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  postedAt: Date | null;
  title: string | null;
  subtitle: string | null;
  tocTitle: string | null;
  collectionId: string;
  number: number | null;
  postIds: Array<string>;
  posts: Array<Post>;
  sequenceIds: Array<string>;
  sequences: Array<Sequence>;
  displaySequencesAsGrid: boolean | null;
  hideProgressBar: boolean | null;
  showChapters: boolean | null;
}

interface SingleBookInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleBookOutput {
  result: Book | null;
}

interface BookSelector {
  default: EmptyViewInput | null;
}

interface MultiBookInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiBookOutput {
  results: Array<Book>;
  totalCount: number | null;
}

interface Chapter {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  title: string | null;
  subtitle: string | null;
  number: number | null;
  sequenceId: string | null;
  sequence: Sequence | null;
  postIds: Array<string>;
  posts: Array<Post>;
}

interface SingleChapterInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleChapterOutput {
  result: Chapter | null;
}

interface ChaptersSequenceChaptersInput {
  sequenceId?: string | null;
  limit?: string | null;
}

interface ChapterSelector {
  default: EmptyViewInput | null;
  SequenceChapters: ChaptersSequenceChaptersInput | null;
}

interface MultiChapterInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiChapterOutput {
  results: Array<Chapter>;
  totalCount: number | null;
}

interface CkEditorUserSession {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  documentId: string | null;
  userId: string | null;
  endedAt: Date | null;
  endedBy: string | null;
}

interface SingleCkEditorUserSessionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleCkEditorUserSessionOutput {
  result: CkEditorUserSession | null;
}

interface CkEditorUserSessionSelector {
  default: EmptyViewInput | null;
}

interface MultiCkEditorUserSessionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiCkEditorUserSessionOutput {
  results: Array<CkEditorUserSession>;
  totalCount: number | null;
}

interface ClientId {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  clientId: string | null;
  firstSeenReferrer: string | null;
  firstSeenLandingPage: string | null;
  userIds: Array<string> | null;
  users: Array<User> | null;
  invalidated: boolean | null;
  lastSeenAt: Date | null;
  timesSeen: number | null;
}

interface SingleClientIdInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleClientIdOutput {
  result: ClientId | null;
}

interface ClientIdsGetClientIdInput {
  clientId?: string | null;
}

interface ClientIdSelector {
  default: EmptyViewInput | null;
  getClientId: ClientIdsGetClientIdInput | null;
}

interface MultiClientIdInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiClientIdOutput {
  results: Array<ClientId>;
  totalCount: number | null;
}

interface Collection {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  userId: string;
  user: User | null;
  title: string;
  slug: string;
  books: Array<Book>;
  postsCount: number;
  readPostsCount: number;
  gridImageId: string | null;
  firstPageLink: string;
  hideStartReadingButton: boolean | null;
  noindex: boolean;
}

interface SingleCollectionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleCollectionOutput {
  result: Collection | null;
}

interface CollectionDefaultViewInput {
  collectionIds?: Array<string> | null;
}

interface CollectionSelector {
  default: CollectionDefaultViewInput | null;
}

interface MultiCollectionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiCollectionOutput {
  results: Array<Collection>;
  totalCount: number | null;
}

interface CommentModeratorAction {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  commentId: string | null;
  comment: Comment | null;
  type: string | null;
  endedAt: Date | null;
  active: boolean | null;
}

interface SingleCommentModeratorActionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleCommentModeratorActionOutput {
  result: CommentModeratorAction | null;
}

interface CommentModeratorActionsActiveCommentModeratorActionsInput {
  limit?: string | null;
}

interface CommentModeratorActionSelector {
  default: EmptyViewInput | null;
  activeCommentModeratorActions: CommentModeratorActionsActiveCommentModeratorActionsInput | null;
}

interface MultiCommentModeratorActionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiCommentModeratorActionOutput {
  results: Array<CommentModeratorAction>;
  totalCount: number | null;
}

interface Comment {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  pingbacks: any;
  parentCommentId: string | null;
  parentComment: Comment | null;
  topLevelCommentId: string | null;
  topLevelComment: Comment | null;
  postedAt: Date;
  lastEditedAt: Date | null;
  author: string | null;
  postId: string | null;
  post: Post | null;
  tagId: string | null;
  tag: Tag | null;
  forumEventId: string | null;
  forumEvent: ForumEvent | null;
  forumEventMetadata: any;
  tagCommentType: TagCommentType;
  subforumStickyPriority: number | null;
  userId: string | null;
  user: User | null;
  userIP: string | null;
  userAgent: string | null;
  referrer: string | null;
  authorIsUnreviewed: boolean;
  pageUrl: string | null;
  pageUrlRelative: string | null;
  answer: boolean;
  parentAnswerId: string | null;
  parentAnswer: Comment | null;
  directChildrenCount: number;
  descendentCount: number;
  latestChildren: Array<Comment>;
  shortform: boolean | null;
  shortformFrontpage: boolean;
  nominatedForReview: string | null;
  reviewingForReview: string | null;
  lastSubthreadActivity: Date | null;
  postVersion: string | null;
  promoted: boolean | null;
  promotedByUserId: string | null;
  promotedByUser: User | null;
  promotedAt: Date | null;
  hideKarma: boolean | null;
  wordCount: number | null;
  htmlBody: string | null;
  votingSystem: string;
  legacy: boolean;
  legacyId: string | null;
  legacyPoll: boolean;
  legacyParentId: string | null;
  draft: boolean;
  retracted: boolean;
  deleted: boolean;
  deletedPublic: boolean;
  deletedReason: string | null;
  deletedDate: Date | null;
  deletedByUserId: string | null;
  deletedByUser: User | null;
  spam: boolean;
  repliesBlockedUntil: Date | null;
  needsReview: boolean | null;
  reviewedByUserId: string | null;
  reviewedByUser: User | null;
  hideAuthor: boolean;
  moderatorHat: boolean;
  hideModeratorHat: boolean | null;
  isPinnedOnProfile: boolean;
  title: string | null;
  relevantTagIds: Array<string>;
  relevantTags: Array<Tag>;
  debateResponse: boolean | null;
  rejected: boolean;
  modGPTAnalysis: string | null;
  modGPTRecommendation: string | null;
  rejectedReason: string | null;
  rejectedByUserId: string | null;
  rejectedByUser: User | null;
  emojiReactors: any;
  af: boolean;
  suggestForAlignmentUserIds: Array<string>;
  suggestForAlignmentUsers: Array<User>;
  reviewForAlignmentUserId: string | null;
  afDate: Date | null;
  moveToAlignmentUserId: string | null;
  moveToAlignmentUser: User | null;
  agentFoundationsId: string | null;
  originalDialogueId: string | null;
  originalDialogue: Post | null;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  allVotes: Array<Vote> | null;
  voteCount: number;
  baseScore: number | null;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SingleCommentInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  allowNull?: boolean | null;
}

interface SingleCommentOutput {
  result: Comment | null;
}

interface CommentDefaultViewInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
}

interface CommentsCommentRepliesInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  parentCommentId?: string | null;
}

interface CommentsPostCommentsDeletedInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsAllCommentsDeletedInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsCheckedByModGPTInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsPostCommentsTopInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsPostCommentsRecentRepliesInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsPostCommentsMagicInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsAfPostCommentsTopInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsPostCommentsOldInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsPostCommentsNewInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsPostCommentsBestInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsPostLWCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsProfileRecentCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  limit?: string | null;
}

interface CommentsProfileCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  sortBy?: string | null;
  drafts?: string | null;
  limit?: string | null;
}

interface CommentsAllRecentCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  sortBy?: string | null;
  limit?: string | null;
}

interface CommentsRecentCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  sortBy?: string | null;
  limit?: string | null;
}

interface CommentsAfSubmissionsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  limit?: string | null;
}

interface CommentsRejectedInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  limit?: string | null;
}

interface CommentsRecentDiscussionThreadInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  limit?: string | null;
}

interface CommentsAfRecentDiscussionThreadInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  limit?: string | null;
}

interface CommentsPostsItemCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  after?: string | null;
  limit?: string | null;
}

interface CommentsSunshineNewCommentsListInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  limit?: string | null;
}

interface CommentsQuestionAnswersInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  sortBy?: string | null;
}

interface CommentsLegacyIdCommentInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  legacyId?: string | null;
}

interface CommentsSunshineNewUsersCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsDefaultModeratorResponsesInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  tagId?: string | null;
}

interface CommentsRepliesToAnswerInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  parentAnswerId?: string | null;
}

interface CommentsAnswersAndRepliesInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  sortBy?: string | null;
}

interface CommentsTopShortformInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  before?: string | null;
  after?: string | null;
  shortformFrontpage?: boolean | null;
}

interface CommentsShortformInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsShortformFrontpageInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  maxAgeDays?: number | null;
  showCommunity?: boolean | null;
  relevantTagId?: string | null;
}

interface CommentsRepliesToCommentThreadInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  topLevelCommentId?: string | null;
}

interface CommentsRepliesToCommentThreadIncludingRootInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  topLevelCommentId: string;
}

interface CommentsShortformLatestChildrenInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  topLevelCommentId?: string | null;
}

interface CommentsNominations2018Input {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  sortBy?: CommentSortingMode | null;
}

interface CommentsNominations2019Input {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  sortBy?: CommentSortingMode | null;
}

interface CommentsReviews2018Input {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  sortBy?: CommentSortingMode | null;
}

interface CommentsReviews2019Input {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  sortBy?: CommentSortingMode | null;
}

interface CommentsReviewsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  reviewYear?: number | null;
  sortBy?: string | null;
}

interface CommentsTagDiscussionCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  tagId?: string | null;
}

interface CommentsTagSubforumCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsLatestSubforumDiscussionInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  profileTagIds?: string | null;
}

interface CommentsModeratorCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsDebateResponsesInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsRecentDebateResponsesInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  limit?: string | null;
}

interface CommentsForumEventCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  forumEventId?: string | null;
}

interface CommentsAlignmentSuggestedCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
}

interface CommentsRssInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
}

interface CommentsDraftCommentsInput {
  userId?: string | null;
  commentIds?: Array<string> | null;
  minimumKarma?: number | null;
  authorIsUnreviewed?: boolean | null;
  postId?: string | null;
  drafts?: string | null;
}

interface CommentSelector {
  default: CommentDefaultViewInput | null;
  commentReplies: CommentsCommentRepliesInput | null;
  postCommentsDeleted: CommentsPostCommentsDeletedInput | null;
  allCommentsDeleted: CommentsAllCommentsDeletedInput | null;
  checkedByModGPT: CommentsCheckedByModGPTInput | null;
  postCommentsTop: CommentsPostCommentsTopInput | null;
  postCommentsRecentReplies: CommentsPostCommentsRecentRepliesInput | null;
  postCommentsMagic: CommentsPostCommentsMagicInput | null;
  afPostCommentsTop: CommentsAfPostCommentsTopInput | null;
  postCommentsOld: CommentsPostCommentsOldInput | null;
  postCommentsNew: CommentsPostCommentsNewInput | null;
  postCommentsBest: CommentsPostCommentsBestInput | null;
  postLWComments: CommentsPostLWCommentsInput | null;
  profileRecentComments: CommentsProfileRecentCommentsInput | null;
  profileComments: CommentsProfileCommentsInput | null;
  allRecentComments: CommentsAllRecentCommentsInput | null;
  recentComments: CommentsRecentCommentsInput | null;
  afSubmissions: CommentsAfSubmissionsInput | null;
  rejected: CommentsRejectedInput | null;
  recentDiscussionThread: CommentsRecentDiscussionThreadInput | null;
  afRecentDiscussionThread: CommentsAfRecentDiscussionThreadInput | null;
  postsItemComments: CommentsPostsItemCommentsInput | null;
  sunshineNewCommentsList: CommentsSunshineNewCommentsListInput | null;
  questionAnswers: CommentsQuestionAnswersInput | null;
  legacyIdComment: CommentsLegacyIdCommentInput | null;
  sunshineNewUsersComments: CommentsSunshineNewUsersCommentsInput | null;
  defaultModeratorResponses: CommentsDefaultModeratorResponsesInput | null;
  repliesToAnswer: CommentsRepliesToAnswerInput | null;
  answersAndReplies: CommentsAnswersAndRepliesInput | null;
  topShortform: CommentsTopShortformInput | null;
  shortform: CommentsShortformInput | null;
  shortformFrontpage: CommentsShortformFrontpageInput | null;
  repliesToCommentThread: CommentsRepliesToCommentThreadInput | null;
  shortformLatestChildren: CommentsShortformLatestChildrenInput | null;
  repliesToCommentThreadIncludingRoot: CommentsRepliesToCommentThreadIncludingRootInput | null;
  nominations2018: CommentsNominations2018Input | null;
  nominations2019: CommentsNominations2019Input | null;
  reviews2018: CommentsReviews2018Input | null;
  reviews2019: CommentsReviews2019Input | null;
  reviews: CommentsReviewsInput | null;
  tagDiscussionComments: CommentsTagDiscussionCommentsInput | null;
  tagSubforumComments: CommentsTagSubforumCommentsInput | null;
  latestSubforumDiscussion: CommentsLatestSubforumDiscussionInput | null;
  moderatorComments: CommentsModeratorCommentsInput | null;
  debateResponses: CommentsDebateResponsesInput | null;
  recentDebateResponses: CommentsRecentDebateResponsesInput | null;
  forumEventComments: CommentsForumEventCommentsInput | null;
  alignmentSuggestedComments: CommentsAlignmentSuggestedCommentsInput | null;
  rss: CommentsRssInput | null;
  draftComments: CommentsDraftCommentsInput | null;
}

interface MultiCommentInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiCommentOutput {
  results: Array<Comment>;
  totalCount: number | null;
}

interface Conversation {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  title: string | null;
  participantIds: Array<string> | null;
  participants: Array<User> | null;
  latestActivity: Date | null;
  af: boolean | null;
  messageCount: number;
  moderator: boolean | null;
  archivedByIds: Array<string>;
  archivedBy: Array<User>;
  latestMessage: Message | null;
  hasUnreadMessages: boolean | null;
}

interface SingleConversationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleConversationOutput {
  result: Conversation | null;
}

interface ConversationsModeratorConversationsInput {
  showArchive?: boolean | null;
  userId?: string | null;
}

interface ConversationsUserConversationsInput {
  showArchive?: boolean | null;
  userId?: string | null;
}

interface ConversationsUserConversationsAllInput {
  showArchive?: boolean | null;
  userId?: string | null;
}

interface ConversationsUserGroupUntitledConversationsInput {
  moderator?: string | null;
  participantIds?: string | null;
  userId?: string | null;
}

interface ConversationSelector {
  default: EmptyViewInput | null;
  moderatorConversations: ConversationsModeratorConversationsInput | null;
  userConversations: ConversationsUserConversationsInput | null;
  userConversationsAll: ConversationsUserConversationsAllInput | null;
  userGroupUntitledConversations: ConversationsUserGroupUntitledConversationsInput | null;
}

interface MultiConversationInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiConversationOutput {
  results: Array<Conversation>;
  totalCount: number | null;
}

interface CronHistory {
  _id: string | null;
  intendedAt: Date | null;
  name: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  result: any;
}

interface CurationEmail {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  postId: string | null;
}

interface CurationNotice {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  userId: string;
  user: User | null;
  commentId: string | null;
  comment: Comment | null;
  postId: string;
  post: Post | null;
  deleted: boolean;
}

interface SingleCurationNoticeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleCurationNoticeOutput {
  result: CurationNotice | null;
}

interface CurationNoticeSelector {
  default: EmptyViewInput | null;
  curationNoticesPage: EmptyViewInput | null;
}

interface MultiCurationNoticeInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiCurationNoticeOutput {
  results: Array<CurationNotice>;
  totalCount: number | null;
}

interface DatabaseMetadata {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface DebouncerEvents {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface DialogueCheck {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  targetUserId: string | null;
  checked: boolean | null;
  checkedAt: Date | null;
  hideInRecommendations: boolean | null;
  matchPreference: DialogueMatchPreference | null;
  reciprocalMatchPreference: DialogueMatchPreference | null;
}

interface SingleDialogueCheckInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleDialogueCheckOutput {
  result: DialogueCheck | null;
}

interface DialogueChecksUserDialogueChecksInput {
  userId?: string | null;
}

interface DialogueChecksUserTargetDialogueChecksInput {
  userId?: string | null;
  targetUserIds?: string | null;
}

interface DialogueCheckSelector {
  default: EmptyViewInput | null;
  userDialogueChecks: DialogueChecksUserDialogueChecksInput | null;
  userTargetDialogueChecks: DialogueChecksUserTargetDialogueChecksInput | null;
}

interface MultiDialogueCheckInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiDialogueCheckOutput {
  results: Array<DialogueCheck>;
  totalCount: number | null;
}

interface DialogueMatchPreference {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  dialogueCheckId: string | null;
  dialogueCheck: DialogueCheck | null;
  topicPreferences: Array<any> | null;
  topicNotes: string | null;
  syncPreference: string | null;
  asyncPreference: string | null;
  formatNotes: string | null;
  calendlyLink: string | null;
  generatedDialogueId: string | null;
  deleted: boolean;
}

interface SingleDialogueMatchPreferenceInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleDialogueMatchPreferenceOutput {
  result: DialogueMatchPreference | null;
}

interface DialogueMatchPreferencesDialogueMatchPreferencesInput {
  dialogueCheckId?: string | null;
}

interface DialogueMatchPreferenceSelector {
  default: EmptyViewInput | null;
  dialogueMatchPreferences: DialogueMatchPreferencesDialogueMatchPreferencesInput | null;
}

interface MultiDialogueMatchPreferenceInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiDialogueMatchPreferenceOutput {
  results: Array<DialogueMatchPreference>;
  totalCount: number | null;
}

interface DigestPost {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  digestId: string;
  digest: Digest;
  postId: string;
  post: Post | null;
  emailDigestStatus: string | null;
  onsiteDigestStatus: string | null;
}

interface SingleDigestPostInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleDigestPostOutput {
  result: DigestPost | null;
}

interface DigestPostSelector {
  default: EmptyViewInput | null;
}

interface MultiDigestPostInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiDigestPostOutput {
  results: Array<DigestPost>;
  totalCount: number | null;
}

interface Digest {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  num: number;
  startDate: Date;
  endDate: Date | null;
  publishedDate: Date | null;
  onsiteImageId: string | null;
  onsitePrimaryColor: string | null;
}

interface SingleDigestInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleDigestOutput {
  result: Digest | null;
}

interface DigestsFindByNumInput {
  num?: number | null;
}

interface DigestSelector {
  default: EmptyViewInput | null;
  findByNum: DigestsFindByNumInput | null;
  all: EmptyViewInput | null;
}

interface MultiDigestInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiDigestOutput {
  results: Array<Digest>;
  totalCount: number | null;
}

interface ElectionCandidate {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  electionName: string;
  name: string;
  logoSrc: string;
  href: string;
  fundraiserLink: string | null;
  gwwcLink: string | null;
  gwwcId: string | null;
  description: string;
  userId: string;
  user: User | null;
  postCount: number;
  tagId: string;
  tag: Tag | null;
  isElectionFundraiser: boolean;
  amountRaised: number | null;
  targetAmount: number | null;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  voteCount: number;
  baseScore: number;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SingleElectionCandidateInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleElectionCandidateOutput {
  result: ElectionCandidate | null;
}

interface ElectionCandidateDefaultViewInput {
  electionName?: string | null;
  sortBy?: string | null;
}

interface ElectionCandidateSelector {
  default: ElectionCandidateDefaultViewInput | null;
}

interface MultiElectionCandidateInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiElectionCandidateOutput {
  results: Array<ElectionCandidate>;
  totalCount: number | null;
}

interface ElectionVote {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  electionName: string | null;
  userId: string | null;
  user: User | null;
  compareState: any;
  vote: any;
  submittedAt: Date | null;
  submissionComments: any;
  userExplanation: string | null;
  userOtherComments: string | null;
}

interface SingleElectionVoteInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleElectionVoteOutput {
  result: ElectionVote | null;
}

interface ElectionVoteDefaultViewInput {
  electionName?: string | null;
  userId?: string | null;
}

interface ElectionVotesAllSubmittedVotesInput {
  electionName?: string | null;
  userId?: string | null;
}

interface ElectionVoteSelector {
  default: ElectionVoteDefaultViewInput | null;
  allSubmittedVotes: ElectionVotesAllSubmittedVotesInput | null;
}

interface MultiElectionVoteInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiElectionVoteOutput {
  results: Array<ElectionVote>;
  totalCount: number | null;
}

interface ElicitQuestionPrediction {
  _id: string;
  predictionId: string | null;
  prediction: number | null;
  createdAt: Date;
  notes: string | null;
  creator: ElicitQuestionPredictionCreator;
  userId: string | null;
  user: User | null;
  sourceUrl: string | null;
  sourceId: string | null;
  binaryQuestionId: string;
  question: ElicitQuestion;
  isDeleted: boolean;
}

interface SingleElicitQuestionPredictionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleElicitQuestionPredictionOutput {
  result: ElicitQuestionPrediction | null;
}

interface ElicitQuestionPredictionSelector {
  default: EmptyViewInput | null;
}

interface MultiElicitQuestionPredictionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiElicitQuestionPredictionOutput {
  results: Array<ElicitQuestionPrediction>;
  totalCount: number | null;
}

interface ElicitQuestion {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  title: string;
  notes: string | null;
  resolution: string | null;
  resolvesBy: Date | null;
}

interface SingleElicitQuestionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleElicitQuestionOutput {
  result: ElicitQuestion | null;
}

interface ElicitQuestionSelector {
  default: EmptyViewInput | null;
}

interface MultiElicitQuestionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiElicitQuestionOutput {
  results: Array<ElicitQuestion>;
  totalCount: number | null;
}

interface EmailTokens {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface FeaturedResource {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  title: string;
  body: string | null;
  ctaText: string;
  ctaUrl: string;
  expiresAt: Date;
}

interface SingleFeaturedResourceInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleFeaturedResourceOutput {
  result: FeaturedResource | null;
}

interface FeaturedResourceSelector {
  default: EmptyViewInput | null;
  activeResources: EmptyViewInput | null;
}

interface MultiFeaturedResourceInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiFeaturedResourceOutput {
  results: Array<FeaturedResource>;
  totalCount: number | null;
}

interface FieldChange {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  changeGroup: string | null;
  documentId: string | null;
  fieldName: string | null;
  oldValue: any;
  newValue: any;
}

interface SingleFieldChangeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleFieldChangeOutput {
  result: FieldChange | null;
}

interface FieldChangeSelector {
  default: EmptyViewInput | null;
}

interface MultiFieldChangeInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
}

interface MultiFieldChangeOutput {
  results: Array<FieldChange>;
  totalCount: number | null;
}

interface ForumEvent {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  frontpageDescription: Revision | null;
  frontpageDescription_latest: string | null;
  frontpageDescriptionMobile: Revision | null;
  frontpageDescriptionMobile_latest: string | null;
  postPageDescription: Revision | null;
  postPageDescription_latest: string | null;
  title: string;
  startDate: Date;
  endDate: Date | null;
  darkColor: string;
  lightColor: string;
  bannerTextColor: string;
  contrastColor: string | null;
  tagId: string | null;
  tag: Tag | null;
  postId: string | null;
  post: Post | null;
  commentId: string | null;
  comment: Comment | null;
  bannerImageId: string | null;
  includesPoll: boolean;
  isGlobal: boolean;
  eventFormat: ForumEventFormat;
  pollQuestion: Revision | null;
  pollQuestion_latest: string | null;
  pollAgreeWording: string | null;
  pollDisagreeWording: string | null;
  maxStickersPerUser: number;
  customComponent: ForumEventCustomComponent | null;
  commentPrompt: string | null;
  publicData: any;
  voteCount: number;
}

interface SingleForumEventInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleForumEventOutput {
  result: ForumEvent | null;
}

interface ForumEventsUpcomingForumEventsInput {
  limit?: string | null;
}

interface ForumEventsPastForumEventsInput {
  limit?: string | null;
}

interface ForumEventsCurrentAndRecentForumEventsInput {
  limit?: string | null;
}

interface ForumEventSelector {
  default: EmptyViewInput | null;
  upcomingForumEvents: ForumEventsUpcomingForumEventsInput | null;
  pastForumEvents: ForumEventsPastForumEventsInput | null;
  currentForumEvent: EmptyViewInput | null;
  currentAndRecentForumEvents: ForumEventsCurrentAndRecentForumEventsInput | null;
}

interface MultiForumEventInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiForumEventOutput {
  results: Array<ForumEvent>;
  totalCount: number | null;
}

interface GardenCode {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  pingbacks: any;
  slug: string;
  code: string;
  title: string;
  userId: string;
  user: User | null;
  startTime: Date | null;
  endTime: Date;
  fbLink: string | null;
  type: string;
  hidden: boolean;
  deleted: boolean;
  afOnly: boolean;
}

interface SingleGardenCodeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleGardenCodeOutput {
  result: GardenCode | null;
}

interface GardenCodeDefaultViewInput {
  types?: string | null;
  userId?: string | null;
  code?: string | null;
}

interface GardenCodesUsersPrivateGardenCodesInput {
  types?: string | null;
  userId?: string | null;
  code?: string | null;
}

interface GardenCodesPublicGardenCodesInput {
  types?: string | null;
  userId?: string | null;
  code?: string | null;
}

interface GardenCodesGardenCodeByCodeInput {
  types?: string | null;
  userId?: string | null;
  code?: string | null;
}

interface GardenCodeSelector {
  default: GardenCodeDefaultViewInput | null;
  usersPrivateGardenCodes: GardenCodesUsersPrivateGardenCodesInput | null;
  publicGardenCodes: GardenCodesPublicGardenCodesInput | null;
  gardenCodeByCode: GardenCodesGardenCodeByCodeInput | null;
}

interface MultiGardenCodeInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiGardenCodeOutput {
  results: Array<GardenCode>;
  totalCount: number | null;
}

interface GoogleServiceAccountSession {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  email: string | null;
  refreshToken: string | null;
  estimatedExpiry: Date | null;
  active: boolean | null;
  revoked: boolean | null;
}

interface SingleGoogleServiceAccountSessionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleGoogleServiceAccountSessionOutput {
  result: GoogleServiceAccountSession | null;
}

interface GoogleServiceAccountSessionSelector {
  default: EmptyViewInput | null;
}

interface MultiGoogleServiceAccountSessionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiGoogleServiceAccountSessionOutput {
  results: Array<GoogleServiceAccountSession>;
  totalCount: number | null;
}

interface Images {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface JargonTerm {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  postId: string;
  post: Post | null;
  term: string;
  humansAndOrAIEdited: string | null;
  approved: boolean;
  deleted: boolean;
  altTerms: Array<string>;
}

interface SingleJargonTermInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleJargonTermOutput {
  result: JargonTerm | null;
}

interface JargonTermsPostEditorJargonTermsInput {
  postId?: string | null;
}

interface JargonTermsPostsApprovedJargonInput {
  postIds?: string | null;
}

interface JargonTermSelector {
  default: EmptyViewInput | null;
  postEditorJargonTerms: JargonTermsPostEditorJargonTermsInput | null;
  glossaryEditAll: EmptyViewInput | null;
  postsApprovedJargon: JargonTermsPostsApprovedJargonInput | null;
}

interface MultiJargonTermInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiJargonTermOutput {
  results: Array<JargonTerm>;
  totalCount: number | null;
}

interface LWEvent {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  userId: string | null;
  user: User | null;
  name: string | null;
  documentId: string | null;
  important: boolean | null;
  properties: any;
  intercom: boolean | null;
}

interface SingleLWEventInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleLWEventOutput {
  result: LWEvent | null;
}

interface LWEventsAdminViewInput {
  name?: string | null;
}

interface LWEventsPostVisitsInput {
  postId?: string | null;
  userId?: string | null;
  limit?: string | null;
}

interface LWEventsEmailHistoryInput {
  userId?: string | null;
}

interface LWEventSelector {
  default: EmptyViewInput | null;
  adminView: LWEventsAdminViewInput | null;
  postVisits: LWEventsPostVisitsInput | null;
  emailHistory: LWEventsEmailHistoryInput | null;
  gatherTownUsers: EmptyViewInput | null;
}

interface MultiLWEventInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiLWEventOutput {
  results: Array<LWEvent>;
  totalCount: number | null;
}

interface LegacyData {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface LlmConversation {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  title: string | null;
  model: string | null;
  systemPrompt: string | null;
  lastUpdatedAt: Date | null;
  messages: Array<LlmMessage> | null;
  deleted: boolean | null;
  totalCharacterCount: number | null;
}

interface SingleLlmConversationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleLlmConversationOutput {
  result: LlmConversation | null;
}

interface LlmConversationsLlmConversationsWithUserInput {
  userId?: string | null;
}

interface LlmConversationsLlmConversationsAllInput {
  showDeleted?: boolean | null;
}

interface LlmConversationSelector {
  default: EmptyViewInput | null;
  llmConversationsWithUser: LlmConversationsLlmConversationsWithUserInput | null;
  llmConversationsAll: LlmConversationsLlmConversationsAllInput | null;
}

interface MultiLlmConversationInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiLlmConversationOutput {
  results: Array<LlmConversation>;
  totalCount: number | null;
}

interface LlmMessage {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  conversationId: string | null;
  role: string | null;
  content: string | null;
}

interface Localgroup {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  name: string;
  nameInAnotherLanguage: string | null;
  organizerIds: Array<string>;
  organizers: Array<User>;
  lastActivity: Date;
  types: Array<string>;
  categories: Array<string> | null;
  isOnline: boolean;
  mongoLocation: any;
  googleLocation: any;
  location: string | null;
  contactInfo: string | null;
  facebookLink: string | null;
  facebookPageLink: string | null;
  meetupLink: string | null;
  slackLink: string | null;
  website: string | null;
  bannerImageId: string | null;
  inactive: boolean;
  deleted: boolean;
}

interface SingleLocalgroupInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleLocalgroupOutput {
  result: Localgroup | null;
}

interface LocalgroupDefaultViewInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
}

interface LocalgroupsUserOrganizesGroupsInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
  userId?: string | null;
}

interface LocalgroupsUserActiveGroupsInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
  userId?: string | null;
}

interface LocalgroupsUserInactiveGroupsInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
  userId?: string | null;
}

interface LocalgroupsAllInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
}

interface LocalgroupsNearbyInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
  lng?: number | null;
  lat?: number | null;
}

interface LocalgroupsSingleInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
  groupId?: string | null;
}

interface LocalgroupsLocalInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
}

interface LocalgroupsOnlineInput {
  filters?: Array<string> | null;
  includeInactive?: boolean | null;
}

interface LocalgroupSelector {
  default: LocalgroupDefaultViewInput | null;
  userOrganizesGroups: LocalgroupsUserOrganizesGroupsInput | null;
  userActiveGroups: LocalgroupsUserActiveGroupsInput | null;
  userInactiveGroups: LocalgroupsUserInactiveGroupsInput | null;
  all: LocalgroupsAllInput | null;
  nearby: LocalgroupsNearbyInput | null;
  single: LocalgroupsSingleInput | null;
  local: LocalgroupsLocalInput | null;
  online: LocalgroupsOnlineInput | null;
}

interface MultiLocalgroupInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiLocalgroupOutput {
  results: Array<Localgroup>;
  totalCount: number | null;
}

interface ManifoldProbabilitiesCache {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  marketId: string;
  probability: number;
  isResolved: boolean;
  year: number;
  lastUpdated: Date;
  url: string | null;
}

interface Message {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  userId: string | null;
  user: User | null;
  conversationId: string | null;
  conversation: Conversation | null;
  noEmail: boolean | null;
}

interface SingleMessageInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleMessageOutput {
  result: Message | null;
}

interface MessagesMessagesConversationInput {
  conversationId?: string | null;
}

interface MessagesConversationPreviewInput {
  conversationId?: string | null;
}

interface MessageSelector {
  default: EmptyViewInput | null;
  messagesConversation: MessagesMessagesConversationInput | null;
  conversationPreview: MessagesConversationPreviewInput | null;
}

interface MultiMessageInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiMessageOutput {
  results: Array<Message>;
  totalCount: number | null;
}

interface Migration {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface ModerationTemplate {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  name: string;
  collectionName: ModerationTemplateType;
  order: number;
  deleted: boolean;
}

interface SingleModerationTemplateInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleModerationTemplateOutput {
  result: ModerationTemplate | null;
}

interface ModerationTemplatesModerationTemplatesListInput {
  collectionName?: string | null;
}

interface ModerationTemplateSelector {
  default: EmptyViewInput | null;
  moderationTemplatesPage: EmptyViewInput | null;
  moderationTemplatesList: ModerationTemplatesModerationTemplatesListInput | null;
}

interface MultiModerationTemplateInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiModerationTemplateOutput {
  results: Array<ModerationTemplate>;
  totalCount: number | null;
}

interface ModeratorAction {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string;
  user: User | null;
  type: ModeratorActionType;
  endedAt: Date | null;
  active: boolean;
}

interface SingleModeratorActionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleModeratorActionOutput {
  result: ModeratorAction | null;
}

interface ModeratorActionsUserModeratorActionsInput {
  userIds?: Array<string> | null;
}

interface ModeratorActionSelector {
  default: EmptyViewInput | null;
  userModeratorActions: ModeratorActionsUserModeratorActionsInput | null;
  restrictionModerationActions: EmptyViewInput | null;
}

interface MultiModeratorActionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiModeratorActionOutput {
  results: Array<ModeratorAction>;
  totalCount: number | null;
}

interface MultiDocument {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  pingbacks: any;
  slug: string;
  oldSlugs: Array<string>;
  title: string | null;
  preview: string | null;
  tabTitle: string;
  tabSubtitle: string | null;
  userId: string;
  user: User | null;
  parentDocumentId: string;
  parentTag: Tag | null;
  parentLens: MultiDocument | null;
  collectionName: MultiDocumentCollectionName;
  fieldName: MultiDocumentFieldName;
  index: number;
  tableOfContents: any;
  contributors: TagContributorsList | null;
  contributionStats: any;
  arbitalLinkedPages: ArbitalLinkedPages | null;
  htmlWithContributorAnnotations: string | null;
  summaries: Array<MultiDocument>;
  textLastUpdatedAt: Date | null;
  deleted: boolean;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  voteCount: number;
  baseScore: number;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SingleMultiDocumentInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleMultiDocumentOutput {
  result: MultiDocument | null;
}

interface MultiDocumentDefaultViewInput {
  excludedDocumentIds?: Array<string> | null;
}

interface MultiDocumentsLensBySlugInput {
  excludedDocumentIds?: Array<string> | null;
  slug?: string | null;
}

interface MultiDocumentsSummariesByParentIdInput {
  excludedDocumentIds?: Array<string> | null;
  parentDocumentId?: string | null;
}

interface MultiDocumentsPingbackLensPagesInput {
  excludedDocumentIds?: Array<string> | null;
  documentId?: string | null;
}

interface MultiDocumentSelector {
  default: MultiDocumentDefaultViewInput | null;
  lensBySlug: MultiDocumentsLensBySlugInput | null;
  summariesByParentId: MultiDocumentsSummariesByParentIdInput | null;
  pingbackLensPages: MultiDocumentsPingbackLensPagesInput | null;
}

interface MultiMultiDocumentInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiMultiDocumentOutput {
  results: Array<MultiDocument>;
  totalCount: number | null;
}

interface Notification {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  userId: string | null;
  documentId: string | null;
  documentType: string | null;
  extraData: any;
  link: string | null;
  title: string | null;
  message: string | null;
  type: string | null;
  deleted: boolean | null;
  viewed: boolean | null;
  emailed: boolean | null;
  waitingForBatch: boolean | null;
}

interface SingleNotificationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleNotificationOutput {
  result: Notification | null;
}

interface NotificationsUserNotificationsInput {
  userId?: string | null;
  type?: string | null;
  viewed?: string | null;
}

interface NotificationsUnreadUserNotificationsInput {
  userId?: string | null;
  type?: string | null;
  lastViewedDate?: string | null;
}

interface NotificationsAdminAlertNotificationsInput {
  type?: string | null;
}

interface NotificationSelector {
  default: EmptyViewInput | null;
  userNotifications: NotificationsUserNotificationsInput | null;
  unreadUserNotifications: NotificationsUnreadUserNotificationsInput | null;
  adminAlertNotifications: NotificationsAdminAlertNotificationsInput | null;
}

interface MultiNotificationInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiNotificationOutput {
  results: Array<Notification>;
  totalCount: number | null;
}

interface PageCacheEntry {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface PetrovDayAction {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  actionType: string;
  data: any;
  userId: string | null;
}

interface SinglePetrovDayActionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SinglePetrovDayActionOutput {
  result: PetrovDayAction | null;
}

interface PetrovDayActionsGetActionInput {
  userId?: string | null;
  actionType?: string | null;
}

interface PetrovDayActionsLaunchDashboardInput {
  side?: string | null;
}

interface PetrovDayActionsWarningConsoleInput {
  side?: string | null;
}

interface PetrovDayActionSelector {
  default: EmptyViewInput | null;
  getAction: PetrovDayActionsGetActionInput | null;
  launchDashboard: PetrovDayActionsLaunchDashboardInput | null;
  adminConsole: EmptyViewInput | null;
  warningConsole: PetrovDayActionsWarningConsoleInput | null;
}

interface MultiPetrovDayActionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiPetrovDayActionOutput {
  results: Array<PetrovDayAction>;
  totalCount: number | null;
}

interface PetrovDayLaunch {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  launchCode: string;
  hashedLaunchCode: string | null;
  userId: string | null;
}

interface PodcastEpisode {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  podcastId: string;
  podcast: Podcast;
  title: string;
  episodeLink: string;
  externalEpisodeId: string;
}

interface SinglePodcastEpisodeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SinglePodcastEpisodeOutput {
  result: PodcastEpisode | null;
}

interface PodcastEpisodeByExternalIdInput {
  externalEpisodeId?: string | null;
  _id?: string | null;
}

interface PodcastEpisodeSelector {
  default: EmptyViewInput | null;
  episodeByExternalId: PodcastEpisodeByExternalIdInput | null;
}

interface MultiPodcastEpisodeInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiPodcastEpisodeOutput {
  results: Array<PodcastEpisode>;
  totalCount: number | null;
}

interface Podcast {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  title: string;
  applePodcastLink: string | null;
  spotifyPodcastLink: string | null;
}

interface SinglePodcastInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SinglePodcastOutput {
  result: Podcast | null;
}

interface PodcastSelector {
  default: EmptyViewInput | null;
}

interface MultiPodcastInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiPodcastOutput {
  results: Array<Podcast>;
  totalCount: number | null;
}

interface PostRecommendation {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  clientId: string | null;
  postId: string | null;
  post: Post | null;
  strategyName: string | null;
  strategySettings: any;
  recommendationCount: number | null;
  lastRecommendedAt: Date | null;
  clickedAt: Date | null;
}

interface PostRelation {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  type: string;
  sourcePostId: string;
  sourcePost: Post | null;
  targetPostId: string;
  targetPost: Post | null;
  order: number | null;
}

interface SinglePostRelationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SinglePostRelationOutput {
  result: PostRelation | null;
}

interface PostRelationsAllPostRelationsInput {
  postId?: string | null;
}

interface PostRelationSelector {
  default: EmptyViewInput | null;
  allPostRelations: PostRelationsAllPostRelationsInput | null;
}

interface MultiPostRelationInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiPostRelationOutput {
  results: Array<PostRelation>;
  totalCount: number | null;
}

interface Post {
  _id: string;
  schemaVersion: number;
  createdAt: Date | null;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  revisions: Array<Revision> | null;
  version: string | null;
  pingbacks: any;
  moderationGuidelines: Revision | null;
  moderationGuidelines_latest: string | null;
  customHighlight: Revision | null;
  customHighlight_latest: string | null;
  slug: string;
  postedAt: Date;
  modifiedAt: Date | null;
  url: string | null;
  postCategory: PostCategory;
  title: string;
  viewCount: number | null;
  lastCommentedAt: Date;
  clickCount: number | null;
  deletedDraft: boolean;
  status: number;
  isFuture: boolean;
  sticky: boolean;
  stickyPriority: number;
  userIP: string | null;
  userAgent: string | null;
  referrer: string | null;
  author: string | null;
  userId: string | null;
  user: User | null;
  domain: string | null;
  pageUrl: string;
  pageUrlRelative: string | null;
  linkUrl: string | null;
  postedAtFormatted: string | null;
  emailShareUrl: string | null;
  twitterShareUrl: string | null;
  facebookShareUrl: string | null;
  socialPreviewImageUrl: string | null;
  question: boolean;
  authorIsUnreviewed: boolean;
  readTimeMinutesOverride: number | null;
  readTimeMinutes: number;
  wordCount: number | null;
  htmlBody: string | null;
  submitToFrontpage: boolean;
  hiddenRelatedQuestion: boolean;
  originalPostRelationSourceId: string | null;
  sourcePostRelations: Array<PostRelation>;
  targetPostRelations: Array<PostRelation>;
  shortform: boolean;
  canonicalSource: string | null;
  nominationCount2018: number;
  nominationCount2019: number;
  reviewCount2018: number;
  reviewCount2019: number;
  reviewCount: number;
  reviewVoteCount: number;
  positiveReviewVoteCount: number;
  manifoldReviewMarketId: string | null;
  annualReviewMarketProbability: number | null;
  annualReviewMarketIsResolved: boolean | null;
  annualReviewMarketYear: number | null;
  annualReviewMarketUrl: string | null;
  glossary: Array<JargonTerm>;
  reviewVoteScoreAF: number;
  reviewVotesAF: Array<number>;
  reviewVoteScoreHighKarma: number;
  reviewVotesHighKarma: Array<number>;
  reviewVoteScoreAllKarma: number;
  reviewVotesAllKarma: Array<number>;
  finalReviewVoteScoreHighKarma: number;
  finalReviewVotesHighKarma: Array<number>;
  finalReviewVoteScoreAllKarma: number;
  finalReviewVotesAllKarma: Array<number>;
  finalReviewVoteScoreAF: number;
  finalReviewVotesAF: Array<number>;
  lastCommentPromotedAt: Date | null;
  tagRel: TagRel | null;
  tags: Array<Tag>;
  tagRelevance: any;
  lastPromotedComment: Comment | null;
  bestAnswer: Comment | null;
  noIndex: boolean;
  rsvps: Array<any> | null;
  rsvpCounts: any;
  activateRSVPs: boolean | null;
  nextDayReminderSent: boolean;
  onlyVisibleToLoggedIn: boolean;
  onlyVisibleToEstablishedAccounts: boolean;
  hideFromRecentDiscussions: boolean;
  currentUserReviewVote: ReviewVote | null;
  reviewWinner: ReviewWinner | null;
  spotlight: Spotlight | null;
  votingSystem: string | null;
  myEditorAccess: string;
  podcastEpisodeId: string | null;
  podcastEpisode: PodcastEpisode | null;
  forceAllowType3Audio: boolean;
  legacy: boolean;
  legacyId: string | null;
  legacySpam: boolean;
  feedId: string | null;
  feed: RSSFeed | null;
  feedLink: string | null;
  lastVisitedAt: Date | null;
  isRead: boolean | null;
  curatedDate: Date | null;
  metaDate: Date | null;
  suggestForCuratedUserIds: Array<string> | null;
  suggestForCuratedUsernames: string | null;
  frontpageDate: Date | null;
  autoFrontpage: string | null;
  collectionTitle: string | null;
  coauthorStatuses: Array<CoauthorStatusOutput> | null;
  coauthorUserIds: Array<string>;
  coauthors: Array<User> | null;
  hasCoauthorPermission: boolean;
  socialPreviewImageId: string | null;
  socialPreviewImageAutoUrl: string | null;
  socialPreview: SocialPreviewOutput | null;
  socialPreviewData: SocialPreviewType;
  fmCrosspost: CrosspostOutput | null;
  canonicalSequenceId: string | null;
  canonicalSequence: Sequence | null;
  canonicalCollectionSlug: string | null;
  canonicalCollection: Collection | null;
  canonicalBookId: string | null;
  canonicalBook: Book | null;
  canonicalNextPostSlug: string | null;
  canonicalPrevPostSlug: string | null;
  nextPost: Post | null;
  prevPost: Post | null;
  sequence: Sequence | null;
  unlisted: boolean;
  disableRecommendation: boolean;
  defaultRecommendation: boolean;
  hideFromPopularComments: boolean | null;
  draft: boolean | null;
  wasEverUndrafted: boolean | null;
  meta: boolean;
  hideFrontpageComments: boolean;
  maxBaseScore: number;
  scoreExceeded2Date: Date | null;
  scoreExceeded30Date: Date | null;
  scoreExceeded45Date: Date | null;
  scoreExceeded75Date: Date | null;
  scoreExceeded125Date: Date | null;
  scoreExceeded200Date: Date | null;
  bannedUserIds: Array<string> | null;
  commentsLocked: boolean | null;
  commentsLockedToAccountsCreatedAfter: Date | null;
  organizerIds: Array<string> | null;
  organizers: Array<User> | null;
  groupId: string | null;
  group: Localgroup | null;
  eventType: string | null;
  isEvent: boolean;
  reviewedByUserId: string | null;
  reviewedByUser: User | null;
  reviewForCuratedUserId: string | null;
  startTime: Date | null;
  localStartTime: Date | null;
  endTime: Date | null;
  localEndTime: Date | null;
  eventRegistrationLink: string | null;
  joinEventLink: string | null;
  onlineEvent: boolean;
  globalEvent: boolean;
  mongoLocation: any;
  googleLocation: any;
  location: string | null;
  contactInfo: string | null;
  facebookLink: string | null;
  meetupLink: string | null;
  website: string | null;
  eventImageId: string | null;
  types: Array<string> | null;
  metaSticky: boolean;
  sharingSettings: any;
  shareWithUsers: Array<string> | null;
  usersSharedWith: Array<User> | null;
  linkSharingKey: string | null;
  linkSharingKeyUsedBy: Array<string> | null;
  commentSortOrder: string | null;
  hideAuthor: boolean;
  tableOfContents: any;
  tableOfContentsRevision: any;
  sideComments: any;
  sideCommentsCache: SideCommentCache | null;
  sideCommentVisibility: string | null;
  disableSidenotes: boolean;
  moderationStyle: string | null;
  ignoreRateLimits: boolean | null;
  hideCommentKarma: boolean;
  commentCount: number;
  topLevelCommentCount: number;
  recentComments: Array<Comment> | null;
  languageModelSummary: string | null;
  debate: boolean;
  collabEditorDialogue: boolean;
  totalDialogueResponseCount: number;
  mostRecentPublishedDialogueResponseDate: Date | null;
  unreadDebateResponseCount: number;
  emojiReactors: any;
  commentEmojiReactors: any;
  rejected: boolean;
  rejectedReason: string | null;
  rejectedByUserId: string | null;
  rejectedByUser: User | null;
  dialogTooltipPreview: string | null;
  dialogueMessageContents: string | null;
  firstVideoAttribsForPreview: any;
  subforumTagId: string | null;
  subforumTag: Tag | null;
  af: boolean;
  afDate: Date | null;
  afCommentCount: number;
  afLastCommentedAt: Date | null;
  afSticky: boolean;
  suggestForAlignmentUserIds: Array<string>;
  suggestForAlignmentUsers: Array<User>;
  reviewForAlignmentUserId: string | null;
  agentFoundationsId: string | null;
  swrCachingEnabled: boolean | null;
  generateDraftJargon: boolean | null;
  curationNotices: Array<CurationNotice> | null;
  reviews: Array<Comment> | null;
  automatedContentEvaluations: AutomatedContentEvaluation | null;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  voteCount: number;
  baseScore: number;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SinglePostInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  allowNull?: boolean | null;
}

interface SinglePostOutput {
  result: Post | null;
}

interface PostDefaultViewInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsUserPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsMagicInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  meta?: boolean | null;
  forum?: boolean | null;
  limit?: number | null;
}

interface PostsTopInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  meta?: boolean | null;
  forum?: boolean | null;
}

interface PostsNewInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  meta?: boolean | null;
  forum?: boolean | null;
}

interface PostsRecentCommentsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsOldInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsTimeframeInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  limit?: number | null;
}

interface PostsDailyInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsTagRelevanceInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  tagId?: string | null;
}

interface PostsFrontpageInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsFrontpageRssInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsCuratedInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsCuratedRssInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsCommunityInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsCommunityRssInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsMetaRssInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsRssInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  meta?: boolean | null;
  forum?: boolean | null;
}

interface PostsTopQuestionsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsRecentQuestionActivityInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsScheduledInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsRejectedInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsDraftsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  includeDraftEvents?: boolean | null;
  includeArchived?: boolean | null;
  includeShared?: boolean | null;
  sortDraftsBy?: string | null;
}

interface PostsAll_draftsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsUnlistedInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsUserAFSubmissionsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsSlugPostInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  slug?: string | null;
}

interface PostsLegacyIdPostInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  legacyId?: string | null;
}

interface PostsRecentDiscussionThreadsListInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  limit?: string | null;
}

interface PostsAfRecentDiscussionThreadsListInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  limit?: string | null;
}

interface PostsReviewRecentDiscussionThreadsList2018Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  limit?: string | null;
}

interface PostsReviewRecentDiscussionThreadsList2019Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  limit?: string | null;
}

interface PostsGlobalEventsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  onlineEvent?: boolean | null;
  eventType?: Array<string> | null;
  filters?: Array<string> | null;
}

interface PostsNearbyEventsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  onlineEvent?: boolean | null;
  eventType?: Array<string> | null;
  lng?: number | null;
  lat?: number | null;
  distance?: number | null;
  filters?: Array<string> | null;
}

interface PostsEventsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  globalEvent?: boolean | null;
  onlineEvent?: boolean | null;
  filters?: Array<string> | null;
}

interface PostsEventsInTimeRangeInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsUpcomingEventsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsPastEventsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsTbdEventsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsNonEventGroupPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsPostsWithBannedUsersInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsCommunityResourcePostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsSunshineNewPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsSunshineNewUsersPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsSunshineCuratedSuggestionsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  audioOnly?: boolean | null;
}

interface PostsHasEverDialoguedInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsPingbackPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  postId?: string | null;
}

interface PostsNominations2018Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  sortByMost?: boolean | null;
}

interface PostsNominations2019Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  sortByMost?: boolean | null;
}

interface PostsReviews2018Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  sortBy?: string | null;
}

interface PostsReviews2019Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  sortBy?: string | null;
}

interface PostsVoting2019Input {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  sortBy?: string | null;
}

interface PostsStickiedInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  forum?: boolean | null;
}

interface PostsNominatablePostsByVoteInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  requiredUnnominated?: boolean | null;
  requiredFrontpage?: boolean | null;
}

interface PostsReviewVotingInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  reviewPhase?: string | null;
}

interface PostsFrontpageReviewWidgetInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  reviewYear?: number | null;
  reviewPhase?: string | null;
}

interface PostsReviewQuickPageInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsReviewFinalVotingInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsMyBookmarkedPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
  limit?: string | null;
}

interface PostsAlignmentSuggestedPostsInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostsCurrentOpenThreadInput {
  postIds?: Array<string> | null;
  notPostIds?: Array<string> | null;
  groupId?: string | null;
  af?: boolean | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  exactPostIds?: Array<string> | null;
  hideCommunity?: boolean | null;
  karmaThreshold?: number | null;
  excludeEvents?: boolean | null;
  userId?: string | null;
  includeRelatedQuestions?: string | null;
  filter?: string | null;
  view?: string | null;
  filterSettings?: any;
  sortedBy?: string | null;
  after?: string | null;
  before?: string | null;
  timeField?: string | null;
  curatedAfter?: string | null;
}

interface PostSelector {
  default: PostDefaultViewInput | null;
  userPosts: PostsUserPostsInput | null;
  magic: PostsMagicInput | null;
  top: PostsTopInput | null;
  new: PostsNewInput | null;
  recentComments: PostsRecentCommentsInput | null;
  old: PostsOldInput | null;
  timeframe: PostsTimeframeInput | null;
  daily: PostsDailyInput | null;
  tagRelevance: PostsTagRelevanceInput | null;
  frontpage: PostsFrontpageInput | null;
  frontpageRss: PostsFrontpageRssInput | null;
  curated: PostsCuratedInput | null;
  curatedRss: PostsCuratedRssInput | null;
  community: PostsCommunityInput | null;
  communityRss: PostsCommunityRssInput | null;
  metaRss: PostsMetaRssInput | null;
  rss: PostsRssInput | null;
  topQuestions: PostsTopQuestionsInput | null;
  recentQuestionActivity: PostsRecentQuestionActivityInput | null;
  scheduled: PostsScheduledInput | null;
  rejected: PostsRejectedInput | null;
  drafts: PostsDraftsInput | null;
  all_drafts: PostsAll_draftsInput | null;
  unlisted: PostsUnlistedInput | null;
  userAFSubmissions: PostsUserAFSubmissionsInput | null;
  slugPost: PostsSlugPostInput | null;
  legacyIdPost: PostsLegacyIdPostInput | null;
  recentDiscussionThreadsList: PostsRecentDiscussionThreadsListInput | null;
  afRecentDiscussionThreadsList: PostsAfRecentDiscussionThreadsListInput | null;
  reviewRecentDiscussionThreadsList2018: PostsReviewRecentDiscussionThreadsList2018Input | null;
  reviewRecentDiscussionThreadsList2019: PostsReviewRecentDiscussionThreadsList2019Input | null;
  globalEvents: PostsGlobalEventsInput | null;
  nearbyEvents: PostsNearbyEventsInput | null;
  events: PostsEventsInput | null;
  eventsInTimeRange: PostsEventsInTimeRangeInput | null;
  upcomingEvents: PostsUpcomingEventsInput | null;
  pastEvents: PostsPastEventsInput | null;
  tbdEvents: PostsTbdEventsInput | null;
  nonEventGroupPosts: PostsNonEventGroupPostsInput | null;
  postsWithBannedUsers: PostsPostsWithBannedUsersInput | null;
  communityResourcePosts: PostsCommunityResourcePostsInput | null;
  sunshineNewPosts: PostsSunshineNewPostsInput | null;
  sunshineNewUsersPosts: PostsSunshineNewUsersPostsInput | null;
  sunshineCuratedSuggestions: PostsSunshineCuratedSuggestionsInput | null;
  hasEverDialogued: PostsHasEverDialoguedInput | null;
  pingbackPosts: PostsPingbackPostsInput | null;
  nominations2018: PostsNominations2018Input | null;
  nominations2019: PostsNominations2019Input | null;
  reviews2018: PostsReviews2018Input | null;
  reviews2019: PostsReviews2019Input | null;
  voting2019: PostsVoting2019Input | null;
  stickied: PostsStickiedInput | null;
  nominatablePostsByVote: PostsNominatablePostsByVoteInput | null;
  reviewVoting: PostsReviewVotingInput | null;
  frontpageReviewWidget: PostsFrontpageReviewWidgetInput | null;
  reviewQuickPage: PostsReviewQuickPageInput | null;
  reviewFinalVoting: PostsReviewFinalVotingInput | null;
  myBookmarkedPosts: PostsMyBookmarkedPostsInput | null;
  alignmentSuggestedPosts: PostsAlignmentSuggestedPostsInput | null;
  currentOpenThread: PostsCurrentOpenThreadInput | null;
}

interface MultiPostInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiPostOutput {
  results: Array<Post>;
  totalCount: number | null;
}

interface RSSFeed {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string;
  user: User | null;
  ownedByUser: boolean;
  displayFullContent: boolean;
  nickname: string;
  url: string;
  status: string | null;
  rawFeed: any;
  setCanonicalUrl: boolean;
  importAsDraft: boolean;
}

interface SingleRSSFeedInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleRSSFeedOutput {
  result: RSSFeed | null;
}

interface RSSFeedsUsersFeedInput {
  userId?: string | null;
}

interface RSSFeedSelector {
  default: EmptyViewInput | null;
  usersFeed: RSSFeedsUsersFeedInput | null;
}

interface MultiRSSFeedInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiRSSFeedOutput {
  results: Array<RSSFeed>;
  totalCount: number | null;
}

interface ReadStatus {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface RecommendationsCache {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  postId: string | null;
  source: string | null;
  scenario: string | null;
  attributionId: string | null;
  ttlMs: number | null;
}

interface Report {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string;
  user: User | null;
  reportedUserId: string | null;
  reportedUser: User | null;
  commentId: string | null;
  comment: Comment | null;
  postId: string | null;
  post: Post | null;
  link: string;
  claimedUserId: string | null;
  claimedUser: User | null;
  description: string | null;
  closedAt: Date | null;
  markedAsSpam: boolean | null;
  reportedAsSpam: boolean | null;
}

interface SingleReportInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleReportOutput {
  result: Report | null;
}

interface ReportsAdminClaimedReportsInput {
  userId?: string | null;
}

interface ReportSelector {
  default: EmptyViewInput | null;
  allReports: EmptyViewInput | null;
  unclaimedReports: EmptyViewInput | null;
  claimedReports: EmptyViewInput | null;
  adminClaimedReports: ReportsAdminClaimedReportsInput | null;
  sunshineSidebarReports: EmptyViewInput | null;
  closedReports: EmptyViewInput | null;
}

interface MultiReportInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiReportOutput {
  results: Array<Report>;
  totalCount: number | null;
}

interface ReviewVote {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string;
  user: User | null;
  postId: string;
  post: Post | null;
  qualitativeScore: number;
  quadraticScore: number;
  comment: string | null;
  year: string;
  dummy: boolean;
  reactions: Array<string> | null;
}

interface SingleReviewVoteInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleReviewVoteOutput {
  result: ReviewVote | null;
}

interface ReviewVotesReviewVotesFromUserInput {
  userId?: string | null;
  year?: string | null;
}

interface ReviewVotesReviewVotesAdminDashboardInput {
  year?: number | null;
}

interface ReviewVotesReviewVotesForPostAndUserInput {
  postId?: string | null;
  userId?: string | null;
}

interface ReviewVoteSelector {
  default: EmptyViewInput | null;
  reviewVotesFromUser: ReviewVotesReviewVotesFromUserInput | null;
  reviewVotesForPost: EmptyViewInput | null;
  reviewVotesForPostAndUser: ReviewVotesReviewVotesForPostAndUserInput | null;
  reviewVotesAdminDashboard: ReviewVotesReviewVotesAdminDashboardInput | null;
}

interface MultiReviewVoteInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiReviewVoteOutput {
  results: Array<ReviewVote>;
  totalCount: number | null;
}

interface ReviewWinnerArt {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  postId: string;
  splashArtImagePrompt: string;
  splashArtImageUrl: string;
  activeSplashArtCoordinates: SplashArtCoordinate | null;
}

interface SingleReviewWinnerArtInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleReviewWinnerArtOutput {
  result: ReviewWinnerArt | null;
}

interface ReviewWinnerArtsPostArtInput {
  postId?: string | null;
}

interface ReviewWinnerArtsAllForYearInput {
  year?: number | null;
}

interface ReviewWinnerArtSelector {
  default: EmptyViewInput | null;
  postArt: ReviewWinnerArtsPostArtInput | null;
  allForYear: ReviewWinnerArtsAllForYearInput | null;
}

interface MultiReviewWinnerArtInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiReviewWinnerArtOutput {
  results: Array<ReviewWinnerArt>;
  totalCount: number | null;
}

interface ReviewWinner {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  postId: string;
  post: Post | null;
  reviewWinnerArt: ReviewWinnerArt | null;
  competitorCount: number | null;
  reviewYear: number;
  category: string;
  curatedOrder: number | null;
  reviewRanking: number;
  isAI: boolean | null;
}

interface SingleReviewWinnerInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleReviewWinnerOutput {
  result: ReviewWinner | null;
}

interface ReviewWinnersReviewWinnerSingleInput {
  category?: string | null;
  reviewYear?: string | null;
  reviewRanking?: string | null;
}

interface ReviewWinnerSelector {
  default: EmptyViewInput | null;
  reviewWinnerSingle: ReviewWinnersReviewWinnerSingleInput | null;
  bestOfLessWrongAnnouncement: EmptyViewInput | null;
}

interface MultiReviewWinnerInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiReviewWinnerOutput {
  results: Array<ReviewWinner>;
  totalCount: number | null;
}

interface Revision {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  documentId: string | null;
  collectionName: string | null;
  fieldName: string | null;
  editedAt: Date;
  updateType: string | null;
  version: string;
  commitMessage: string | null;
  userId: string | null;
  user: User | null;
  draft: boolean | null;
  originalContents: ContentType;
  html: string | null;
  markdown: string | null;
  ckEditorMarkup: string | null;
  wordCount: number;
  htmlHighlight: string;
  htmlHighlightStartingAtHash: string;
  plaintextDescription: string;
  plaintextMainText: string;
  hasFootnotes: boolean | null;
  changeMetrics: any;
  googleDocMetadata: any;
  skipAttributions: boolean;
  tag: Tag | null;
  post: Post | null;
  lens: MultiDocument | null;
  summary: MultiDocument | null;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  voteCount: number;
  baseScore: number;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SingleRevisionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleRevisionOutput {
  result: Revision | null;
}

interface RevisionsRevisionsByUserInput {
  userId?: string | null;
}

interface RevisionsRevisionsOnDocumentInput {
  documentId?: string | null;
  fieldName?: string | null;
  before?: string | null;
  after?: string | null;
}

interface RevisionsRevisionByVersionNumberInput {
  documentId?: string | null;
  version?: string | null;
  fieldName?: string | null;
}

interface RevisionSelector {
  default: EmptyViewInput | null;
  revisionsByUser: RevisionsRevisionsByUserInput | null;
  revisionsOnDocument: RevisionsRevisionsOnDocumentInput | null;
  revisionByVersionNumber: RevisionsRevisionByVersionNumberInput | null;
}

interface MultiRevisionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiRevisionOutput {
  results: Array<Revision>;
  totalCount: number | null;
}

interface Sequence {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  lastUpdated: Date;
  userId: string;
  user: User | null;
  title: string;
  bannerImageId: string | null;
  gridImageId: string | null;
  hideFromAuthorPage: boolean;
  draft: boolean;
  isDeleted: boolean;
  curatedOrder: number | null;
  userProfileOrder: number | null;
  canonicalCollectionSlug: string | null;
  canonicalCollection: Collection | null;
  hidden: boolean;
  noindex: boolean;
  postsCount: number;
  readPostsCount: number;
  chapters: Array<Chapter>;
  af: boolean;
}

interface SingleSequenceInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  allowNull?: boolean | null;
}

interface SingleSequenceOutput {
  result: Sequence | null;
}

interface SequenceDefaultViewInput {
  sequenceIds?: Array<string> | null;
}

interface SequencesUserProfileInput {
  sequenceIds?: Array<string> | null;
  userId?: string | null;
}

interface SequencesUserProfilePrivateInput {
  sequenceIds?: Array<string> | null;
  userId?: string | null;
}

interface SequencesUserProfileAllInput {
  sequenceIds?: Array<string> | null;
  userId?: string | null;
}

interface SequencesCuratedSequencesInput {
  sequenceIds?: Array<string> | null;
  userId?: string | null;
}

interface SequencesCommunitySequencesInput {
  sequenceIds?: Array<string> | null;
  userId?: string | null;
}

interface SequenceSelector {
  default: SequenceDefaultViewInput | null;
  userProfile: SequencesUserProfileInput | null;
  userProfilePrivate: SequencesUserProfilePrivateInput | null;
  userProfileAll: SequencesUserProfileAllInput | null;
  curatedSequences: SequencesCuratedSequencesInput | null;
  communitySequences: SequencesCommunitySequencesInput | null;
}

interface MultiSequenceInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSequenceOutput {
  results: Array<Sequence>;
  totalCount: number | null;
}

interface Session {
  _id: string | null;
  session: any;
  expires: Date | null;
  lastModified: Date | null;
}

interface SideCommentCache {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  postId: string | null;
  annotatedHtml: string | null;
  commentsByBlock: any;
  version: number | null;
}

interface SplashArtCoordinate {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  reviewWinnerArtId: string | null;
  reviewWinnerArt: ReviewWinnerArt | null;
  leftXPct: number;
  leftYPct: number;
  leftHeightPct: number;
  leftWidthPct: number;
  leftFlipped: boolean;
  middleXPct: number;
  middleYPct: number;
  middleHeightPct: number;
  middleWidthPct: number;
  middleFlipped: boolean;
  rightXPct: number;
  rightYPct: number;
  rightHeightPct: number;
  rightWidthPct: number;
  rightFlipped: boolean;
}

interface SingleSplashArtCoordinateInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSplashArtCoordinateOutput {
  result: SplashArtCoordinate | null;
}

interface SplashArtCoordinateSelector {
  default: EmptyViewInput | null;
}

interface MultiSplashArtCoordinateInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSplashArtCoordinateOutput {
  results: Array<SplashArtCoordinate>;
  totalCount: number | null;
}

interface Spotlight {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  description: Revision | null;
  description_latest: string | null;
  documentId: string;
  document: Post | null;
  post: Post | null;
  sequence: Sequence | null;
  tag: Tag | null;
  documentType: SpotlightDocumentType;
  position: number;
  duration: number;
  customTitle: string | null;
  customSubtitle: string | null;
  subtitleUrl: string | null;
  headerTitle: string | null;
  headerTitleLeftColor: string | null;
  headerTitleRightColor: string | null;
  lastPromotedAt: Date;
  spotlightSplashImageUrl: string | null;
  draft: boolean;
  deletedDraft: boolean;
  showAuthor: boolean;
  imageFade: boolean;
  imageFadeColor: string | null;
  spotlightImageId: string | null;
  spotlightDarkImageId: string | null;
  sequenceChapters: Array<Chapter> | null;
}

interface SingleSpotlightInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSpotlightOutput {
  result: Spotlight | null;
}

interface SpotlightsMostRecentlyPromotedSpotlightsInput {
  limit?: number | null;
}

interface SpotlightsSpotlightsPageInput {
  limit?: number | null;
}

interface SpotlightsSpotlightsPageDraftInput {
  limit?: number | null;
}

interface SpotlightsSpotlightsByDocumentIdsInput {
  documentIds?: string | null;
}

interface SpotlightsSpotlightsByIdInput {
  spotlightIds?: string | null;
}

interface SpotlightSelector {
  default: EmptyViewInput | null;
  mostRecentlyPromotedSpotlights: SpotlightsMostRecentlyPromotedSpotlightsInput | null;
  spotlightsPage: SpotlightsSpotlightsPageInput | null;
  spotlightsPageDraft: SpotlightsSpotlightsPageDraftInput | null;
  spotlightsByDocumentIds: SpotlightsSpotlightsByDocumentIdsInput | null;
  spotlightsById: SpotlightsSpotlightsByIdInput | null;
}

interface MultiSpotlightInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSpotlightOutput {
  results: Array<Spotlight>;
  totalCount: number | null;
}

interface Subscription {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  state: string | null;
  documentId: string | null;
  collectionName: string | null;
  deleted: boolean | null;
  type: string | null;
}

interface SingleSubscriptionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSubscriptionOutput {
  result: Subscription | null;
}

interface SubscriptionsSubscriptionStateInput {
  documentId?: string | null;
  userId?: string | null;
  type?: string | null;
  collectionName?: string | null;
}

interface SubscriptionsSubscriptionsOfTypeInput {
  userId?: string | null;
  collectionName?: string | null;
  subscriptionType?: string | null;
}

interface SubscriptionsMembersOfGroupInput {
  documentId?: string | null;
}

interface SubscriptionSelector {
  default: EmptyViewInput | null;
  subscriptionState: SubscriptionsSubscriptionStateInput | null;
  subscriptionsOfType: SubscriptionsSubscriptionsOfTypeInput | null;
  membersOfGroup: SubscriptionsMembersOfGroupInput | null;
}

interface MultiSubscriptionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSubscriptionOutput {
  results: Array<Subscription>;
  totalCount: number | null;
}

interface SurveyQuestion {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  surveyId: string;
  survey: Survey;
  question: string;
  format: SurveyQuestionFormat;
  order: number;
}

interface SingleSurveyQuestionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSurveyQuestionOutput {
  result: SurveyQuestion | null;
}

interface SurveyQuestionSelector {
  default: EmptyViewInput | null;
}

interface MultiSurveyQuestionInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSurveyQuestionOutput {
  results: Array<SurveyQuestion>;
  totalCount: number | null;
}

interface SurveyResponse {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  surveyId: string | null;
  survey: Survey | null;
  surveyScheduleId: string | null;
  surveySchedule: SurveySchedule | null;
  userId: string | null;
  user: User | null;
  clientId: string | null;
  client: ClientId | null;
  response: any;
}

interface SingleSurveyResponseInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSurveyResponseOutput {
  result: SurveyResponse | null;
}

interface SurveyResponseSelector {
  default: EmptyViewInput | null;
}

interface MultiSurveyResponseInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSurveyResponseOutput {
  results: Array<SurveyResponse>;
  totalCount: number | null;
}

interface SurveySchedule {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  surveyId: string;
  survey: Survey | null;
  name: string | null;
  impressionsLimit: number | null;
  maxVisitorPercentage: number | null;
  minKarma: number | null;
  maxKarma: number | null;
  target: SurveyScheduleTarget | null;
  startDate: Date | null;
  endDate: Date | null;
  deactivated: boolean | null;
  clientIds: Array<string> | null;
  clients: Array<ClientId> | null;
}

interface SingleSurveyScheduleInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSurveyScheduleOutput {
  result: SurveySchedule | null;
}

interface SurveyScheduleSelector {
  default: EmptyViewInput | null;
  surveySchedulesByCreatedAt: EmptyViewInput | null;
}

interface MultiSurveyScheduleInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSurveyScheduleOutput {
  results: Array<SurveySchedule>;
  totalCount: number | null;
}

interface Survey {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  name: string;
  questions: Array<SurveyQuestion>;
}

interface SingleSurveyInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleSurveyOutput {
  result: Survey | null;
}

interface SurveySelector {
  default: EmptyViewInput | null;
  surveysByCreatedAt: EmptyViewInput | null;
}

interface MultiSurveyInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiSurveyOutput {
  results: Array<Survey>;
  totalCount: number | null;
}

interface TagFlag {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  contents: Revision | null;
  contents_latest: string | null;
  slug: string;
  name: string;
  deleted: boolean;
  order: number | null;
}

interface SingleTagFlagInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleTagFlagOutput {
  result: TagFlag | null;
}

interface TagFlagSelector {
  default: EmptyViewInput | null;
  allTagFlags: EmptyViewInput | null;
}

interface MultiTagFlagInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiTagFlagOutput {
  results: Array<TagFlag>;
  totalCount: number | null;
}

interface TagRel {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  tagId: string;
  tag: Tag | null;
  postId: string;
  post: Post | null;
  deleted: boolean;
  userId: string | null;
  user: User | null;
  currentUserCanVote: boolean;
  autoApplied: boolean;
  backfilled: boolean;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  voteCount: number;
  baseScore: number;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SingleTagRelInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleTagRelOutput {
  result: TagRel | null;
}

interface TagRelsPostsWithTagInput {
  tagId?: string | null;
}

interface TagRelsTagsOnPostInput {
  postId?: string | null;
}

interface TagRelSelector {
  default: EmptyViewInput | null;
  postsWithTag: TagRelsPostsWithTagInput | null;
  tagsOnPost: TagRelsTagsOnPostInput | null;
}

interface MultiTagRelInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiTagRelOutput {
  results: Array<TagRel>;
  totalCount: number | null;
}

interface Tag {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  description: Revision | null;
  description_latest: string | null;
  pingbacks: any;
  subforumWelcomeText: Revision | null;
  subforumWelcomeText_latest: string | null;
  moderationGuidelines: Revision | null;
  moderationGuidelines_latest: string | null;
  slug: string;
  oldSlugs: Array<string>;
  name: string;
  shortName: string | null;
  subtitle: string | null;
  core: boolean;
  isPostType: boolean;
  suggestedAsFilter: boolean;
  defaultOrder: number;
  descriptionTruncationCount: number;
  postCount: number;
  userId: string | null;
  user: User | null;
  adminOnly: boolean;
  canEditUserIds: Array<string> | null;
  charsAdded: number | null;
  charsRemoved: number | null;
  deleted: boolean;
  lastCommentedAt: Date | null;
  lastSubforumCommentAt: Date | null;
  needsReview: boolean;
  reviewedByUserId: string | null;
  reviewedByUser: User | null;
  wikiGrade: number;
  recentComments: Array<Comment>;
  wikiOnly: boolean;
  bannerImageId: string | null;
  squareImageId: string | null;
  tagFlagsIds: Array<string>;
  tagFlags: Array<TagFlag>;
  lesswrongWikiImportRevision: string | null;
  lesswrongWikiImportSlug: string | null;
  lesswrongWikiImportCompleted: boolean | null;
  lastVisitedAt: Date | null;
  isRead: boolean | null;
  tableOfContents: any;
  htmlWithContributorAnnotations: string | null;
  contributors: TagContributorsList;
  contributionStats: any;
  introSequenceId: string | null;
  sequence: Sequence | null;
  postsDefaultSortOrder: string | null;
  canVoteOnRels: Array<TagRelVoteGroup> | null;
  isSubforum: boolean;
  subforumUnreadMessagesCount: number | null;
  subforumModeratorIds: Array<string>;
  subforumModerators: Array<User>;
  subforumIntroPostId: string | null;
  subforumIntroPost: Post | null;
  parentTagId: string | null;
  parentTag: Tag | null;
  subTagIds: Array<string>;
  subTags: Array<Tag>;
  autoTagModel: string | null;
  autoTagPrompt: string | null;
  noindex: boolean;
  lenses: Array<MultiDocument>;
  lensesIncludingDeleted: Array<MultiDocument>;
  isPlaceholderPage: boolean;
  summaries: Array<MultiDocument>;
  textLastUpdatedAt: Date | null;
  isArbitalImport: boolean | null;
  arbitalLinkedPages: ArbitalLinkedPages | null;
  coreTagId: string | null;
  maxScore: number | null;
  usersWhoLiked: Array<UserLikingTag>;
  forceAllowType3Audio: boolean;
  currentUserVote: string | null;
  currentUserExtendedVote: any;
  voteCount: number;
  baseScore: number;
  extendedScore: any;
  score: number;
  afBaseScore: number | null;
  afExtendedScore: any;
  afVoteCount: number | null;
}

interface SingleTagInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleTagOutput {
  result: Tag | null;
}

interface TagDefaultViewInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsTagsByTagIdsInput {
  excludedTagIds?: Array<string> | null;
  tagIds: Array<string>;
}

interface TagsAllTagsAlphabeticalInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsUserTagsInput {
  excludedTagIds?: Array<string> | null;
  userId?: string | null;
}

interface TagsCurrentUserSubforumsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsAllPagesByNewestInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsAllTagsHierarchicalInput {
  excludedTagIds?: Array<string> | null;
  wikiGrade?: string | null;
}

interface TagsTagBySlugInput {
  excludedTagIds?: Array<string> | null;
  slug?: string | null;
}

interface TagsTagsBySlugsInput {
  excludedTagIds?: Array<string> | null;
  slugs: Array<string>;
}

interface TagsCoreTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsPostTypeTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsCoreAndSubforumTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsNewTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsUnreviewedTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsSuggestedFilterTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsAllLWWikiTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsUnprocessedLWWikiTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsTagsByTagFlagInput {
  excludedTagIds?: Array<string> | null;
  tagFlagId?: string | null;
}

interface TagsAllPublicTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsAllArbitalTagsInput {
  excludedTagIds?: Array<string> | null;
}

interface TagsPingbackWikiPagesInput {
  excludedTagIds?: Array<string> | null;
  tagId?: string | null;
}

interface TagSelector {
  default: TagDefaultViewInput | null;
  tagsByTagIds: TagsTagsByTagIdsInput | null;
  allTagsAlphabetical: TagsAllTagsAlphabeticalInput | null;
  userTags: TagsUserTagsInput | null;
  currentUserSubforums: TagsCurrentUserSubforumsInput | null;
  allPagesByNewest: TagsAllPagesByNewestInput | null;
  allTagsHierarchical: TagsAllTagsHierarchicalInput | null;
  tagBySlug: TagsTagBySlugInput | null;
  tagsBySlugs: TagsTagsBySlugsInput | null;
  coreTags: TagsCoreTagsInput | null;
  postTypeTags: TagsPostTypeTagsInput | null;
  coreAndSubforumTags: TagsCoreAndSubforumTagsInput | null;
  newTags: TagsNewTagsInput | null;
  unreviewedTags: TagsUnreviewedTagsInput | null;
  suggestedFilterTags: TagsSuggestedFilterTagsInput | null;
  allLWWikiTags: TagsAllLWWikiTagsInput | null;
  unprocessedLWWikiTags: TagsUnprocessedLWWikiTagsInput | null;
  tagsByTagFlag: TagsTagsByTagFlagInput | null;
  allPublicTags: TagsAllPublicTagsInput | null;
  allArbitalTags: TagsAllArbitalTagsInput | null;
  pingbackWikiPages: TagsPingbackWikiPagesInput | null;
}

interface MultiTagInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiTagOutput {
  results: Array<Tag>;
  totalCount: number | null;
}

interface Tweet {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface TypingIndicator {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  documentId: string | null;
  lastUpdated: Date | null;
}

interface SingleTypingIndicatorInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleTypingIndicatorOutput {
  result: TypingIndicator | null;
}

interface TypingIndicatorSelector {
  default: EmptyViewInput | null;
}

interface MultiTypingIndicatorInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiTypingIndicatorOutput {
  results: Array<TypingIndicator>;
  totalCount: number | null;
}

interface UltraFeedEvent {
  _id: string;
  createdAt: Date;
  documentId: string | null;
  collectionName: UltraFeedEventCollectionName | null;
  eventType: UltraFeedEventEventType | null;
  userId: string | null;
  event: any;
  feedItemId: string | null;
}

interface SingleUltraFeedEventInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleUltraFeedEventOutput {
  result: UltraFeedEvent | null;
}

interface UltraFeedEventSelector {
  default: EmptyViewInput | null;
}

interface MultiUltraFeedEventInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
}

interface MultiUltraFeedEventOutput {
  results: Array<UltraFeedEvent>;
  totalCount: number | null;
}

interface UserActivity {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
}

interface UserEAGDetail {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  careerStage: Array<string> | null;
  countryOrRegion: string | null;
  nearestCity: string | null;
  willingnessToRelocate: any;
  experiencedIn: Array<string> | null;
  interestedIn: Array<string> | null;
  lastUpdated: Date | null;
}

interface SingleUserEAGDetailInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleUserEAGDetailOutput {
  result: UserEAGDetail | null;
}

interface UserEAGDetailsDataByUserInput {
  userId?: string | null;
}

interface UserEAGDetailSelector {
  default: EmptyViewInput | null;
  dataByUser: UserEAGDetailsDataByUserInput | null;
}

interface MultiUserEAGDetailInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiUserEAGDetailOutput {
  results: Array<UserEAGDetail>;
  totalCount: number | null;
}

interface UserJobAd {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  jobName: string | null;
  adState: string | null;
  reminderSetAt: Date | null;
  lastUpdated: Date | null;
}

interface SingleUserJobAdInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleUserJobAdOutput {
  result: UserJobAd | null;
}

interface UserJobAdsAdsByUserInput {
  userId?: string | null;
}

interface UserJobAdSelector {
  default: EmptyViewInput | null;
  adsByUser: UserJobAdsAdsByUserInput | null;
}

interface MultiUserJobAdInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiUserJobAdOutput {
  results: Array<UserJobAd>;
  totalCount: number | null;
}

interface UserMostValuablePost {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string | null;
  user: User | null;
  postId: string | null;
  post: Post | null;
  deleted: boolean | null;
}

interface SingleUserMostValuablePostInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleUserMostValuablePostOutput {
  result: UserMostValuablePost | null;
}

interface UserMostValuablePostsCurrentUserPostInput {
  postId?: string | null;
}

interface UserMostValuablePostSelector {
  default: EmptyViewInput | null;
  currentUserMostValuablePosts: EmptyViewInput | null;
  currentUserPost: UserMostValuablePostsCurrentUserPostInput | null;
}

interface MultiUserMostValuablePostInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiUserMostValuablePostOutput {
  results: Array<UserMostValuablePost>;
  totalCount: number | null;
}

interface UserRateLimit {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  userId: string;
  user: User | null;
  type: UserRateLimitType;
  intervalUnit: UserRateLimitIntervalUnit;
  intervalLength: number;
  actionsPerInterval: number;
  endedAt: Date;
}

interface SingleUserRateLimitInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleUserRateLimitOutput {
  result: UserRateLimit | null;
}

interface UserRateLimitsUserRateLimitsInput {
  active?: boolean | null;
  userIds?: Array<string> | null;
}

interface UserRateLimitSelector {
  default: EmptyViewInput | null;
  userRateLimits: UserRateLimitsUserRateLimitsInput | null;
  activeUserRateLimits: EmptyViewInput | null;
}

interface MultiUserRateLimitInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiUserRateLimitOutput {
  results: Array<UserRateLimit>;
  totalCount: number | null;
}

interface UserTagRel {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  tagId: string;
  tag: Tag | null;
  userId: string;
  user: User | null;
  subforumShowUnreadInSidebar: boolean | null;
  subforumEmailNotifications: boolean | null;
  subforumHideIntroPost: boolean | null;
}

interface SingleUserTagRelInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleUserTagRelOutput {
  result: UserTagRel | null;
}

interface UserTagRelsSingleInput {
  userId?: string | null;
  tagId?: string | null;
}

interface UserTagRelSelector {
  default: EmptyViewInput | null;
  single: UserTagRelsSingleInput | null;
}

interface MultiUserTagRelInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiUserTagRelOutput {
  results: Array<UserTagRel>;
  totalCount: number | null;
}

interface User {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  moderationGuidelines: Revision | null;
  moderationGuidelines_latest: string | null;
  howOthersCanHelpMe: Revision | null;
  howOthersCanHelpMe_latest: string | null;
  howICanHelpOthers: Revision | null;
  howICanHelpOthers_latest: string | null;
  slug: string;
  oldSlugs: Array<string>;
  biography: Revision | null;
  biography_latest: string | null;
  username: string | null;
  emails: Array<any> | null;
  isAdmin: boolean;
  profile: any;
  services: any;
  hasAuth0Id: boolean | null;
  displayName: string;
  previousDisplayName: string | null;
  email: string | null;
  noindex: boolean;
  groups: Array<string> | null;
  pageUrl: string | null;
  pagePath: string | null;
  editUrl: string | null;
  lwWikiImport: boolean | null;
  theme: any;
  lastUsedTimezone: string | null;
  whenConfirmationEmailSent: Date | null;
  legacy: boolean | null;
  commentSorting: string | null;
  sortDraftsBy: string | null;
  reactPaletteStyle: ReactPaletteStyle | null;
  noKibitz: boolean | null;
  showHideKarmaOption: boolean | null;
  showPostAuthorCard: boolean | null;
  hideIntercom: boolean;
  markDownPostEditor: boolean;
  hideElicitPredictions: boolean | null;
  hideAFNonMemberInitialWarning: boolean | null;
  noSingleLineComments: boolean;
  noCollapseCommentsPosts: boolean;
  noCollapseCommentsFrontpage: boolean;
  hideCommunitySection: boolean;
  expandedFrontpageSections: ExpandedFrontpageSectionsSettingsOutput | null;
  showCommunityInRecentDiscussion: boolean;
  hidePostsRecommendations: boolean;
  petrovOptOut: boolean;
  optedOutOfSurveys: boolean | null;
  postGlossariesPinned: boolean | null;
  generateJargonForDrafts: boolean | null;
  generateJargonForPublishedPosts: boolean | null;
  acceptedTos: boolean | null;
  hideNavigationSidebar: boolean | null;
  currentFrontpageFilter: string | null;
  frontpageSelectedTab: string | null;
  frontpageFilterSettings: any;
  hideFrontpageFilterSettingsDesktop: boolean | null;
  allPostsTimeframe: string | null;
  allPostsFilter: string | null;
  allPostsSorting: string | null;
  allPostsShowLowKarma: boolean | null;
  allPostsIncludeEvents: boolean | null;
  allPostsHideCommunity: boolean | null;
  allPostsOpenSettings: boolean | null;
  draftsListSorting: string | null;
  draftsListShowArchived: boolean | null;
  draftsListShowShared: boolean | null;
  lastNotificationsCheck: Date | null;
  karma: number;
  goodHeartTokens: number | null;
  moderationStyle: string | null;
  moderatorAssistance: boolean | null;
  collapseModerationGuidelines: boolean | null;
  bannedUserIds: Array<string> | null;
  bannedPersonalUserIds: Array<string> | null;
  bookmarkedPostsMetadata: Array<PostMetadataOutput> | null;
  bookmarksCount: number | null;
  hasAnyBookmarks: boolean | null;
  bookmarkedPosts: Array<Post> | null;
  hiddenPostsMetadata: Array<PostMetadataOutput> | null;
  hiddenPosts: Array<Post> | null;
  legacyId: string | null;
  deleted: boolean;
  permanentDeletionRequestedAt: Date | null;
  voteBanned: boolean | null;
  nullifyVotes: boolean | null;
  deleteContent: boolean | null;
  banned: Date | null;
  IPs: Array<string> | null;
  auto_subscribe_to_my_posts: boolean;
  auto_subscribe_to_my_comments: boolean;
  autoSubscribeAsOrganizer: boolean;
  notificationCommentsOnSubscribedPost: any;
  notificationShortformContent: any;
  notificationRepliesToMyComments: any;
  notificationRepliesToSubscribedComments: any;
  notificationSubscribedUserPost: any;
  notificationSubscribedUserComment: any;
  notificationPostsInGroups: any;
  notificationSubscribedTagPost: any;
  notificationSubscribedSequencePost: any;
  notificationPrivateMessage: any;
  notificationSharedWithMe: any;
  notificationAlignmentSubmissionApproved: any;
  notificationEventInRadius: any;
  notificationKarmaPowersGained: any;
  notificationRSVPs: any;
  notificationGroupAdministration: any;
  notificationCommentsOnDraft: any;
  notificationPostsNominatedReview: any;
  notificationSubforumUnread: any;
  notificationNewMention: any;
  notificationDialogueMessages: any;
  notificationPublishedDialogueMessages: any;
  notificationAddedAsCoauthor: any;
  notificationDebateCommentsOnSubscribedPost: any;
  notificationDebateReplies: any;
  notificationDialogueMatch: any;
  notificationNewDialogueChecks: any;
  notificationYourTurnMatchForm: any;
  hideDialogueFacilitation: boolean | null;
  revealChecksToAdmins: boolean | null;
  optedInToDialogueFacilitation: boolean | null;
  showDialoguesList: boolean | null;
  showMyDialogues: boolean | null;
  showMatches: boolean | null;
  showRecommendedPartners: boolean | null;
  hideActiveDialogueUsers: boolean | null;
  karmaChangeNotifierSettings: any;
  karmaChangeLastOpened: Date | null;
  karmaChangeBatchStart: Date | null;
  emailSubscribedToCurated: boolean | null;
  subscribedToDigest: boolean | null;
  subscribedToNewsletter: boolean | null;
  unsubscribeFromAll: boolean | null;
  hideSubscribePoke: boolean | null;
  hideMeetupsPoke: boolean | null;
  hideHomeRHS: boolean | null;
  frontpagePostCount: number;
  sequenceCount: number;
  sequenceDraftCount: number;
  mongoLocation: any;
  googleLocation: any;
  location: string | null;
  mapLocation: any;
  mapLocationLatLng: LatLng | null;
  mapLocationSet: boolean | null;
  mapMarkerText: string | null;
  htmlMapMarkerText: string | null;
  nearbyEventsNotifications: boolean;
  nearbyEventsNotificationsLocation: any;
  nearbyEventsNotificationsMongoLocation: any;
  nearbyEventsNotificationsRadius: number | null;
  nearbyPeopleNotificationThreshold: number | null;
  hideFrontpageMap: boolean | null;
  hideTaggingProgressBar: boolean | null;
  hideFrontpageBookAd: boolean | null;
  hideFrontpageBook2019Ad: boolean | null;
  hideFrontpageBook2020Ad: boolean | null;
  sunshineNotes: string | null;
  sunshineFlagged: boolean | null;
  needsReview: boolean | null;
  sunshineSnoozed: boolean | null;
  snoozedUntilContentCount: number | null;
  reviewedByUserId: string | null;
  reviewedByUser: User | null;
  isReviewed: boolean | null;
  reviewedAt: Date | null;
  spamRiskScore: number;
  afKarma: number;
  voteCount: number | null;
  smallUpvoteCount: number | null;
  smallDownvoteCount: number | null;
  bigUpvoteCount: number | null;
  bigDownvoteCount: number | null;
  voteReceivedCount: number | null;
  smallUpvoteReceivedCount: number | null;
  smallDownvoteReceivedCount: number | null;
  bigUpvoteReceivedCount: number | null;
  bigDownvoteReceivedCount: number | null;
  usersContactedBeforeReview: Array<string> | null;
  fullName: string | null;
  shortformFeedId: string | null;
  shortformFeed: Post | null;
  viewUnreviewedComments: boolean | null;
  partiallyReadSequences: Array<PartiallyReadSequenceItemOutput> | null;
  hasContinueReading: boolean | null;
  beta: boolean | null;
  reviewVotesQuadratic: boolean | null;
  reviewVotesQuadratic2019: boolean | null;
  reviewVoteCount: number | null;
  reviewVotesQuadratic2020: boolean | null;
  petrovPressedButtonDate: Date | null;
  petrovLaunchCodeDate: Date | null;
  defaultToCKEditor: boolean | null;
  signUpReCaptchaRating: number | null;
  noExpandUnreadCommentsReview: boolean;
  postCount: number;
  maxPostCount: number;
  posts: Array<Post> | null;
  commentCount: number;
  maxCommentCount: number;
  tagRevisionCount: number;
  abTestKey: string | null;
  abTestOverrides: any;
  walledGardenInvite: boolean | null;
  hideWalledGardenUI: boolean | null;
  walledGardenPortalOnboarded: boolean | null;
  taggingDashboardCollapsed: boolean | null;
  usernameUnset: boolean | null;
  paymentEmail: string | null;
  paymentInfo: string | null;
  profileUpdatedAt: Date;
  profileImageId: string | null;
  jobTitle: string | null;
  organization: string | null;
  careerStage: Array<string> | null;
  website: string | null;
  bio: string | null;
  htmlBio: string;
  fmCrosspostUserId: string | null;
  linkedinProfileURL: string | null;
  facebookProfileURL: string | null;
  blueskyProfileURL: string | null;
  twitterProfileURL: string | null;
  twitterProfileURLAdmin: string | null;
  githubProfileURL: string | null;
  profileTagIds: Array<string>;
  profileTags: Array<Tag>;
  organizerOfGroupIds: Array<string>;
  organizerOfGroups: Array<Localgroup>;
  programParticipation: Array<string> | null;
  postingDisabled: boolean | null;
  allCommentingDisabled: boolean | null;
  commentingOnOtherUsersDisabled: boolean | null;
  conversationsDisabled: boolean | null;
  associatedClientId: ClientId | null;
  associatedClientIds: Array<ClientId> | null;
  altAccountsDetected: boolean | null;
  acknowledgedNewUserGuidelines: boolean | null;
  moderatorActions: Array<ModeratorAction> | null;
  subforumPreferredLayout: SubforumPreferredLayout | null;
  hideJobAdUntil: Date | null;
  criticismTipsDismissed: boolean | null;
  hideFromPeopleDirectory: boolean;
  allowDatadogSessionReplay: boolean;
  afPostCount: number;
  afCommentCount: number;
  afSequenceCount: number;
  afSequenceDraftCount: number;
  reviewForAlignmentForumUserId: string | null;
  afApplicationText: string | null;
  afSubmittedApplication: boolean | null;
  rateLimitNextAbleToComment: any;
  rateLimitNextAbleToPost: any;
  recentKarmaInfo: any;
  hideSunshineSidebar: boolean | null;
  inactiveSurveyEmailSentAt: Date | null;
  userSurveyEmailSentAt: Date | null;
  karmaChanges: KarmaChanges | null;
  recommendationSettings: any;
}

interface UserSelectorUniqueInput {
  _id?: string | null;
  documentId?: string | null;
  slug?: string | null;
}

interface SingleUserInput {
  selector?: UserSelectorUniqueInput | null;
  resolverArgs?: any;
}

interface SingleUserOutput {
  result: User | null;
}

interface UsersUsersByUserIdsInput {
  userIds?: Array<string> | null;
}

interface UsersUsersProfileInput {
  userId?: string | null;
  slug?: string | null;
}

interface UsersTagCommunityMembersInput {
  hasBio?: boolean | null;
  profileTagId?: string | null;
}

interface UserSelector {
  default: EmptyViewInput | null;
  usersByUserIds: UsersUsersByUserIdsInput | null;
  usersProfile: UsersUsersProfileInput | null;
  LWSunshinesList: EmptyViewInput | null;
  LWTrustLevel1List: EmptyViewInput | null;
  LWUsersAdmin: EmptyViewInput | null;
  usersWithBannedUsers: EmptyViewInput | null;
  sunshineNewUsers: EmptyViewInput | null;
  recentlyActive: EmptyViewInput | null;
  allUsers: EmptyViewInput | null;
  usersMapLocations: EmptyViewInput | null;
  tagCommunityMembers: UsersTagCommunityMembersInput | null;
  reviewAdminUsers: EmptyViewInput | null;
  usersWithPaymentInfo: EmptyViewInput | null;
  usersWithOptedInToDialogueFacilitation: EmptyViewInput | null;
  alignmentSuggestedUsers: EmptyViewInput | null;
  usersTopKarma: EmptyViewInput | null;
}

interface MultiUserInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiUserOutput {
  results: Array<User>;
  totalCount: number | null;
}

interface Vote {
  _id: string;
  schemaVersion: number;
  createdAt: Date;
  legacyData: any;
  documentId: string;
  collectionName: string;
  userId: string | null;
  authorIds: Array<string> | null;
  authorId: string | null;
  voteType: VoteType;
  extendedVoteType: any;
  power: number | null;
  afPower: number | null;
  cancelled: boolean;
  isUnvote: boolean;
  votedAt: Date | null;
  tagRel: TagRel | null;
  comment: Comment | null;
  post: Post | null;
  documentIsAf: boolean;
  silenceNotification: boolean;
}

interface SingleVoteInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
}

interface SingleVoteOutput {
  result: Vote | null;
}

interface VotesUserPostVotesInput {
  collectionName?: string | null;
  voteType?: VoteType | null;
  after?: string | null;
  before?: string | null;
}

interface VotesUserVotesInput {
  collectionNames: Array<string>;
}

interface VoteSelector {
  default: EmptyViewInput | null;
  tagVotes: EmptyViewInput | null;
  userPostVotes: VotesUserPostVotesInput | null;
  userVotes: VotesUserVotesInput | null;
}

interface MultiVoteInput {
  terms?: any;
  resolverArgs?: any;
  enableTotal?: boolean | null;
  enableCache?: boolean | null;
}

interface MultiVoteOutput {
  results: Array<Vote>;
  totalCount: number | null;
}

interface CreateAdvisorRequestDataInput {
  legacyData?: any;
  userId: string;
  interestedInMetaculus?: boolean | null;
  jobAds?: any;
}

interface CreateAdvisorRequestInput {
  data: CreateAdvisorRequestDataInput;
}

interface UpdateAdvisorRequestDataInput {
  legacyData?: any;
  userId?: string | null;
  interestedInMetaculus?: boolean | null;
  jobAds?: any;
}

interface UpdateAdvisorRequestInput {
  selector: SelectorInput;
  data: UpdateAdvisorRequestDataInput;
}

interface AdvisorRequestOutput {
  data: AdvisorRequest | null;
}

interface CreateBookDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  title?: string | null;
  subtitle?: string | null;
  tocTitle?: string | null;
  collectionId: string;
  number?: number | null;
  postIds?: Array<string> | null;
  sequenceIds?: Array<string> | null;
  displaySequencesAsGrid?: boolean | null;
  hideProgressBar?: boolean | null;
  showChapters?: boolean | null;
}

interface CreateBookInput {
  data: CreateBookDataInput;
}

interface UpdateBookDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  title?: string | null;
  subtitle?: string | null;
  tocTitle?: string | null;
  collectionId?: string | null;
  number?: number | null;
  postIds?: Array<string> | null;
  sequenceIds?: Array<string> | null;
  displaySequencesAsGrid?: boolean | null;
  hideProgressBar?: boolean | null;
  showChapters?: boolean | null;
}

interface UpdateBookInput {
  selector: SelectorInput;
  data: UpdateBookDataInput;
}

interface BookOutput {
  data: Book | null;
}

interface CreateChapterDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  title?: string | null;
  subtitle?: string | null;
  number?: number | null;
  sequenceId?: string | null;
  postIds: Array<string>;
}

interface CreateChapterInput {
  data: CreateChapterDataInput;
}

interface UpdateChapterDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  title?: string | null;
  subtitle?: string | null;
  number?: number | null;
  sequenceId?: string | null;
  postIds?: Array<string> | null;
}

interface UpdateChapterInput {
  selector: SelectorInput;
  data: UpdateChapterDataInput;
}

interface ChapterOutput {
  data: Chapter | null;
}

interface CreateCollectionDataInput {
  createdAt: Date;
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  title: string;
  slug: string;
  gridImageId?: string | null;
  firstPageLink?: string | null;
  hideStartReadingButton?: boolean | null;
  noindex?: boolean | null;
}

interface CreateCollectionInput {
  data: CreateCollectionDataInput;
}

interface UpdateCollectionDataInput {
  createdAt?: Date | null;
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  title?: string | null;
  slug?: string | null;
  gridImageId?: string | null;
  firstPageLink?: string | null;
  hideStartReadingButton?: boolean | null;
  noindex?: boolean | null;
}

interface UpdateCollectionInput {
  selector: SelectorInput;
  data: UpdateCollectionDataInput;
}

interface CollectionOutput {
  data: Collection | null;
}

interface CreateCommentModeratorActionDataInput {
  legacyData?: any;
  commentId?: string | null;
  type: string;
  endedAt?: Date | null;
}

interface CreateCommentModeratorActionInput {
  data: CreateCommentModeratorActionDataInput;
}

interface UpdateCommentModeratorActionDataInput {
  legacyData?: any;
  commentId?: string | null;
  type?: string | null;
  endedAt?: Date | null;
}

interface UpdateCommentModeratorActionInput {
  selector: SelectorInput;
  data: UpdateCommentModeratorActionDataInput;
}

interface CommentModeratorActionOutput {
  data: CommentModeratorAction | null;
}

interface CreateCommentDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  parentCommentId?: string | null;
  topLevelCommentId?: string | null;
  postId?: string | null;
  tagId?: string | null;
  forumEventId?: string | null;
  forumEventMetadata?: any;
  tagCommentType?: TagCommentType | null;
  subforumStickyPriority?: number | null;
  userId?: string | null;
  authorIsUnreviewed?: boolean | null;
  answer?: boolean | null;
  parentAnswerId?: string | null;
  shortform?: boolean | null;
  shortformFrontpage?: boolean | null;
  nominatedForReview?: string | null;
  reviewingForReview?: string | null;
  promotedByUserId?: string | null;
  hideKarma?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacyPoll?: boolean | null;
  legacyParentId?: string | null;
  draft?: boolean | null;
  retracted?: boolean | null;
  deleted?: boolean | null;
  deletedPublic?: boolean | null;
  deletedReason?: string | null;
  deletedDate?: Date | null;
  deletedByUserId?: string | null;
  spam?: boolean | null;
  needsReview?: boolean | null;
  reviewedByUserId?: string | null;
  moderatorHat?: boolean | null;
  hideModeratorHat?: boolean | null;
  isPinnedOnProfile?: boolean | null;
  title?: string | null;
  relevantTagIds?: Array<string> | null;
  debateResponse?: boolean | null;
  rejected?: boolean | null;
  modGPTAnalysis?: string | null;
  modGPTRecommendation?: string | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  af?: boolean | null;
  afDate?: Date | null;
  agentFoundationsId?: string | null;
  originalDialogueId?: string | null;
}

interface CreateCommentInput {
  data: CreateCommentDataInput;
}

interface UpdateCommentDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  postedAt?: Date | null;
  postId?: string | null;
  tagId?: string | null;
  subforumStickyPriority?: number | null;
  authorIsUnreviewed?: boolean | null;
  answer?: boolean | null;
  shortform?: boolean | null;
  shortformFrontpage?: boolean | null;
  nominatedForReview?: string | null;
  reviewingForReview?: string | null;
  promoted?: boolean | null;
  promotedByUserId?: string | null;
  hideKarma?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacyPoll?: boolean | null;
  legacyParentId?: string | null;
  draft?: boolean | null;
  retracted?: boolean | null;
  deleted?: boolean | null;
  deletedPublic?: boolean | null;
  deletedReason?: string | null;
  deletedDate?: Date | null;
  deletedByUserId?: string | null;
  spam?: boolean | null;
  repliesBlockedUntil?: Date | null;
  needsReview?: boolean | null;
  reviewedByUserId?: string | null;
  hideAuthor?: boolean | null;
  moderatorHat?: boolean | null;
  hideModeratorHat?: boolean | null;
  isPinnedOnProfile?: boolean | null;
  title?: string | null;
  relevantTagIds?: Array<string> | null;
  debateResponse?: boolean | null;
  rejected?: boolean | null;
  modGPTAnalysis?: string | null;
  modGPTRecommendation?: string | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  af?: boolean | null;
  suggestForAlignmentUserIds?: Array<string> | null;
  reviewForAlignmentUserId?: string | null;
  afDate?: Date | null;
  moveToAlignmentUserId?: string | null;
  agentFoundationsId?: string | null;
  originalDialogueId?: string | null;
}

interface UpdateCommentInput {
  selector: SelectorInput;
  data: UpdateCommentDataInput;
}

interface CommentOutput {
  data: Comment | null;
}

interface CreateConversationDataInput {
  legacyData?: any;
  title?: string | null;
  participantIds?: Array<string> | null;
  af?: boolean | null;
  moderator?: boolean | null;
  archivedByIds?: Array<string> | null;
}

interface CreateConversationInput {
  data: CreateConversationDataInput;
}

interface UpdateConversationDataInput {
  legacyData?: any;
  title?: string | null;
  participantIds?: Array<string> | null;
  af?: boolean | null;
  moderator?: boolean | null;
  archivedByIds?: Array<string> | null;
}

interface UpdateConversationInput {
  selector: SelectorInput;
  data: UpdateConversationDataInput;
}

interface ConversationOutput {
  data: Conversation | null;
}

interface CreateCurationNoticeDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  userId: string;
  commentId?: string | null;
  postId: string;
}

interface CreateCurationNoticeInput {
  data: CreateCurationNoticeDataInput;
}

interface UpdateCurationNoticeDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  commentId?: string | null;
  deleted?: boolean | null;
}

interface UpdateCurationNoticeInput {
  selector: SelectorInput;
  data: UpdateCurationNoticeDataInput;
}

interface CurationNoticeOutput {
  data: CurationNotice | null;
}

interface CreateDigestPostDataInput {
  legacyData?: any;
  digestId: string;
  postId: string;
  emailDigestStatus?: string | null;
  onsiteDigestStatus?: string | null;
}

interface CreateDigestPostInput {
  data: CreateDigestPostDataInput;
}

interface UpdateDigestPostDataInput {
  legacyData?: any;
  digestId?: string | null;
  postId?: string | null;
  emailDigestStatus?: string | null;
  onsiteDigestStatus?: string | null;
}

interface UpdateDigestPostInput {
  selector: SelectorInput;
  data: UpdateDigestPostDataInput;
}

interface DigestPostOutput {
  data: DigestPost | null;
}

interface CreateDigestDataInput {
  legacyData?: any;
  num: number;
  startDate: Date;
  endDate?: Date | null;
  publishedDate?: Date | null;
  onsiteImageId?: string | null;
  onsitePrimaryColor?: string | null;
}

interface CreateDigestInput {
  data: CreateDigestDataInput;
}

interface UpdateDigestDataInput {
  legacyData?: any;
  num?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  publishedDate?: Date | null;
  onsiteImageId?: string | null;
  onsitePrimaryColor?: string | null;
}

interface UpdateDigestInput {
  selector: SelectorInput;
  data: UpdateDigestDataInput;
}

interface DigestOutput {
  data: Digest | null;
}

interface CreateElectionCandidateDataInput {
  legacyData?: any;
  electionName: string;
  name: string;
  logoSrc: string;
  href: string;
  fundraiserLink?: string | null;
  gwwcLink?: string | null;
  gwwcId?: string | null;
  description: string;
  userId?: string | null;
  tagId: string;
  isElectionFundraiser?: boolean | null;
  amountRaised?: number | null;
  targetAmount?: number | null;
}

interface CreateElectionCandidateInput {
  data: CreateElectionCandidateDataInput;
}

interface UpdateElectionCandidateDataInput {
  legacyData?: any;
  electionName?: string | null;
  name?: string | null;
  logoSrc?: string | null;
  href?: string | null;
  fundraiserLink?: string | null;
  gwwcLink?: string | null;
  gwwcId?: string | null;
  description?: string | null;
  userId?: string | null;
  tagId?: string | null;
  isElectionFundraiser?: boolean | null;
  amountRaised?: number | null;
  targetAmount?: number | null;
}

interface UpdateElectionCandidateInput {
  selector: SelectorInput;
  data: UpdateElectionCandidateDataInput;
}

interface ElectionCandidateOutput {
  data: ElectionCandidate | null;
}

interface CreateElectionVoteDataInput {
  legacyData?: any;
  electionName: string;
  userId: string;
  compareState?: any;
  vote?: any;
  submittedAt?: Date | null;
  submissionComments?: any;
  userExplanation?: string | null;
  userOtherComments?: string | null;
}

interface CreateElectionVoteInput {
  data: CreateElectionVoteDataInput;
}

interface UpdateElectionVoteDataInput {
  legacyData?: any;
  electionName?: string | null;
  userId?: string | null;
  compareState?: any;
  vote?: any;
  submittedAt?: Date | null;
  submissionComments?: any;
  userExplanation?: string | null;
  userOtherComments?: string | null;
}

interface UpdateElectionVoteInput {
  selector: SelectorInput;
  data: UpdateElectionVoteDataInput;
}

interface ElectionVoteOutput {
  data: ElectionVote | null;
}

interface CreateElicitQuestionDataInput {
  legacyData?: any;
  title: string;
  notes?: string | null;
  resolution?: string | null;
  resolvesBy?: Date | null;
}

interface CreateElicitQuestionInput {
  data: CreateElicitQuestionDataInput;
}

interface UpdateElicitQuestionDataInput {
  legacyData?: any;
  title?: string | null;
  notes?: string | null;
  resolution?: string | null;
  resolvesBy?: Date | null;
}

interface UpdateElicitQuestionInput {
  selector: SelectorInput;
  data: UpdateElicitQuestionDataInput;
}

interface ElicitQuestionOutput {
  data: ElicitQuestion | null;
}

interface CreateForumEventDataInput {
  legacyData?: any;
  frontpageDescription?: CreateRevisionDataInput | null;
  frontpageDescriptionMobile?: CreateRevisionDataInput | null;
  postPageDescription?: CreateRevisionDataInput | null;
  title: string;
  startDate: Date;
  endDate?: Date | null;
  darkColor?: string | null;
  lightColor?: string | null;
  bannerTextColor?: string | null;
  contrastColor?: string | null;
  tagId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  bannerImageId?: string | null;
  includesPoll?: boolean | null;
  isGlobal?: boolean | null;
  eventFormat?: ForumEventFormat | null;
  pollQuestion?: CreateRevisionDataInput | null;
  pollAgreeWording?: string | null;
  pollDisagreeWording?: string | null;
  maxStickersPerUser?: number | null;
  customComponent?: ForumEventCustomComponent | null;
  commentPrompt?: string | null;
  publicData?: any;
}

interface CreateForumEventInput {
  data: CreateForumEventDataInput;
}

interface UpdateForumEventDataInput {
  legacyData?: any;
  frontpageDescription?: CreateRevisionDataInput | null;
  frontpageDescriptionMobile?: CreateRevisionDataInput | null;
  postPageDescription?: CreateRevisionDataInput | null;
  title?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  darkColor?: string | null;
  lightColor?: string | null;
  bannerTextColor?: string | null;
  contrastColor?: string | null;
  tagId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  bannerImageId?: string | null;
  includesPoll?: boolean | null;
  isGlobal?: boolean | null;
  eventFormat?: ForumEventFormat | null;
  pollQuestion?: CreateRevisionDataInput | null;
  pollAgreeWording?: string | null;
  pollDisagreeWording?: string | null;
  maxStickersPerUser?: number | null;
  customComponent?: ForumEventCustomComponent | null;
  commentPrompt?: string | null;
  publicData?: any;
}

interface UpdateForumEventInput {
  selector: SelectorInput;
  data: UpdateForumEventDataInput;
}

interface ForumEventOutput {
  data: ForumEvent | null;
}

interface CreateJargonTermDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  postId: string;
  term: string;
  approved?: boolean | null;
  deleted?: boolean | null;
  altTerms: Array<string>;
}

interface CreateJargonTermInput {
  data: CreateJargonTermDataInput;
}

interface UpdateJargonTermDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  term?: string | null;
  approved?: boolean | null;
  deleted?: boolean | null;
  altTerms?: Array<string> | null;
}

interface UpdateJargonTermInput {
  selector: SelectorInput;
  data: UpdateJargonTermDataInput;
}

interface JargonTermOutput {
  data: JargonTerm | null;
}

interface CreateLWEventDataInput {
  legacyData?: any;
  userId?: string | null;
  name: string;
  documentId?: string | null;
  important?: boolean | null;
  properties?: any;
  intercom?: boolean | null;
}

interface CreateLWEventInput {
  data: CreateLWEventDataInput;
}

interface LWEventOutput {
  data: LWEvent | null;
}

interface UpdateLlmConversationDataInput {
  legacyData?: any;
  userId?: string | null;
  title?: string | null;
  model?: string | null;
  systemPrompt?: string | null;
  deleted?: boolean | null;
}

interface UpdateLlmConversationInput {
  selector: SelectorInput;
  data: UpdateLlmConversationDataInput;
}

interface LlmConversationOutput {
  data: LlmConversation | null;
}

interface CreateLocalgroupDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  name: string;
  nameInAnotherLanguage?: string | null;
  organizerIds: Array<string>;
  lastActivity?: Date | null;
  types: Array<string>;
  categories?: Array<string> | null;
  isOnline?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  facebookPageLink?: string | null;
  meetupLink?: string | null;
  slackLink?: string | null;
  website?: string | null;
  bannerImageId?: string | null;
  inactive?: boolean | null;
  deleted?: boolean | null;
}

interface CreateLocalgroupInput {
  data: CreateLocalgroupDataInput;
}

interface UpdateLocalgroupDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  name?: string | null;
  nameInAnotherLanguage?: string | null;
  organizerIds?: Array<string> | null;
  lastActivity?: Date | null;
  types?: Array<string> | null;
  categories?: Array<string> | null;
  isOnline?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  facebookPageLink?: string | null;
  meetupLink?: string | null;
  slackLink?: string | null;
  website?: string | null;
  bannerImageId?: string | null;
  inactive?: boolean | null;
  deleted?: boolean | null;
}

interface UpdateLocalgroupInput {
  selector: SelectorInput;
  data: UpdateLocalgroupDataInput;
}

interface LocalgroupOutput {
  data: Localgroup | null;
}

interface CreateMessageDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  userId?: string | null;
  conversationId: string;
  noEmail?: boolean | null;
}

interface CreateMessageInput {
  data: CreateMessageDataInput;
}

interface UpdateMessageDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
}

interface UpdateMessageInput {
  selector: SelectorInput;
  data: UpdateMessageDataInput;
}

interface MessageOutput {
  data: Message | null;
}

interface CreateModerationTemplateDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  name: string;
  collectionName: ModerationTemplateType;
  order?: number | null;
}

interface CreateModerationTemplateInput {
  data: CreateModerationTemplateDataInput;
}

interface UpdateModerationTemplateDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  name?: string | null;
  collectionName?: ModerationTemplateType | null;
  order?: number | null;
  deleted?: boolean | null;
}

interface UpdateModerationTemplateInput {
  selector: SelectorInput;
  data: UpdateModerationTemplateDataInput;
}

interface ModerationTemplateOutput {
  data: ModerationTemplate | null;
}

interface CreateModeratorActionDataInput {
  legacyData?: any;
  userId?: string | null;
  type: ModeratorActionType;
  endedAt?: Date | null;
}

interface CreateModeratorActionInput {
  data: CreateModeratorActionDataInput;
}

interface UpdateModeratorActionDataInput {
  legacyData?: any;
  userId?: string | null;
  type?: ModeratorActionType | null;
  endedAt?: Date | null;
}

interface UpdateModeratorActionInput {
  selector: SelectorInput;
  data: UpdateModeratorActionDataInput;
}

interface ModeratorActionOutput {
  data: ModeratorAction | null;
}

interface CreateMultiDocumentDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  slug?: string | null;
  title?: string | null;
  tabTitle: string;
  tabSubtitle?: string | null;
  userId?: string | null;
  parentDocumentId: string;
  collectionName: MultiDocumentCollectionName;
  fieldName: MultiDocumentFieldName;
}

interface CreateMultiDocumentInput {
  data: CreateMultiDocumentDataInput;
}

interface UpdateMultiDocumentDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  slug?: string | null;
  title?: string | null;
  tabTitle?: string | null;
  tabSubtitle?: string | null;
  index?: number | null;
  deleted?: boolean | null;
}

interface UpdateMultiDocumentInput {
  selector: SelectorInput;
  data: UpdateMultiDocumentDataInput;
}

interface MultiDocumentOutput {
  data: MultiDocument | null;
}

interface UpdateNotificationDataInput {
  legacyData?: any;
  viewed?: boolean | null;
}

interface UpdateNotificationInput {
  selector: SelectorInput;
  data: UpdateNotificationDataInput;
}

interface NotificationOutput {
  data: Notification | null;
}

interface CreatePetrovDayActionDataInput {
  legacyData?: any;
  actionType: string;
  data?: any;
  userId: string;
}

interface CreatePetrovDayActionInput {
  data: CreatePetrovDayActionDataInput;
}

interface PetrovDayActionOutput {
  data: PetrovDayAction | null;
}

interface CreatePodcastEpisodeDataInput {
  legacyData?: any;
  podcastId?: string | null;
  title: string;
  episodeLink: string;
  externalEpisodeId: string;
}

interface CreatePodcastEpisodeInput {
  data: CreatePodcastEpisodeDataInput;
}

interface PodcastEpisodeOutput {
  data: PodcastEpisode | null;
}

interface CreatePostDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  moderationGuidelines?: CreateRevisionDataInput | null;
  customHighlight?: CreateRevisionDataInput | null;
  slug?: string | null;
  postedAt?: Date | null;
  url?: string | null;
  postCategory?: PostCategory | null;
  title: string;
  status?: number | null;
  sticky?: boolean | null;
  stickyPriority?: number | null;
  userId?: string | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  readTimeMinutesOverride?: number | null;
  submitToFrontpage?: boolean | null;
  hiddenRelatedQuestion?: boolean | null;
  originalPostRelationSourceId?: string | null;
  shortform?: boolean | null;
  canonicalSource?: string | null;
  manifoldReviewMarketId?: string | null;
  tagRelevance?: any;
  noIndex?: boolean | null;
  activateRSVPs?: boolean | null;
  nextDayReminderSent?: boolean | null;
  onlyVisibleToLoggedIn?: boolean | null;
  onlyVisibleToEstablishedAccounts?: boolean | null;
  hideFromRecentDiscussions?: boolean | null;
  podcastEpisodeId?: string | null;
  forceAllowType3Audio?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacySpam?: boolean | null;
  feedId?: string | null;
  feedLink?: string | null;
  curatedDate?: Date | null;
  metaDate?: Date | null;
  suggestForCuratedUserIds?: Array<string> | null;
  frontpageDate?: Date | null;
  autoFrontpage?: string | null;
  collectionTitle?: string | null;
  coauthorStatuses?: Array<CoauthorStatusInput> | null;
  coauthorUserIds?: Array<string> | null;
  hasCoauthorPermission?: boolean | null;
  socialPreviewImageId?: string | null;
  socialPreviewImageAutoUrl?: string | null;
  socialPreview?: SocialPreviewInput | null;
  fmCrosspost?: CrosspostInput | null;
  canonicalSequenceId?: string | null;
  canonicalCollectionSlug?: string | null;
  canonicalBookId?: string | null;
  canonicalNextPostSlug?: string | null;
  canonicalPrevPostSlug?: string | null;
  unlisted?: boolean | null;
  disableRecommendation?: boolean | null;
  defaultRecommendation?: boolean | null;
  hideFromPopularComments?: boolean | null;
  draft?: boolean | null;
  wasEverUndrafted?: boolean | null;
  meta?: boolean | null;
  hideFrontpageComments?: boolean | null;
  bannedUserIds?: Array<string> | null;
  commentsLocked?: boolean | null;
  commentsLockedToAccountsCreatedAfter?: Date | null;
  organizerIds?: Array<string> | null;
  groupId?: string | null;
  eventType?: string | null;
  isEvent?: boolean | null;
  reviewedByUserId?: string | null;
  reviewForCuratedUserId?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  eventRegistrationLink?: string | null;
  joinEventLink?: string | null;
  onlineEvent?: boolean | null;
  globalEvent?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  meetupLink?: string | null;
  website?: string | null;
  eventImageId?: string | null;
  types?: Array<string> | null;
  metaSticky?: boolean | null;
  sharingSettings?: any;
  shareWithUsers?: Array<string> | null;
  commentSortOrder?: string | null;
  hideAuthor?: boolean | null;
  sideCommentVisibility?: string | null;
  disableSidenotes?: boolean | null;
  moderationStyle?: string | null;
  ignoreRateLimits?: boolean | null;
  hideCommentKarma?: boolean | null;
  collabEditorDialogue?: boolean | null;
  rejected?: boolean | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  subforumTagId?: string | null;
  af?: boolean | null;
  afDate?: Date | null;
  afSticky?: boolean | null;
  suggestForAlignmentUserIds?: Array<string> | null;
  reviewForAlignmentUserId?: string | null;
  agentFoundationsId?: string | null;
  swrCachingEnabled?: boolean | null;
  generateDraftJargon?: boolean | null;
}

interface CreatePostInput {
  data: CreatePostDataInput;
}

interface UpdatePostDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  moderationGuidelines?: CreateRevisionDataInput | null;
  customHighlight?: CreateRevisionDataInput | null;
  slug?: string | null;
  postedAt?: Date | null;
  url?: string | null;
  postCategory?: PostCategory | null;
  title?: string | null;
  deletedDraft?: boolean | null;
  status?: number | null;
  sticky?: boolean | null;
  stickyPriority?: number | null;
  userId?: string | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  readTimeMinutesOverride?: number | null;
  submitToFrontpage?: boolean | null;
  hiddenRelatedQuestion?: boolean | null;
  shortform?: boolean | null;
  canonicalSource?: string | null;
  manifoldReviewMarketId?: string | null;
  tagRelevance?: any;
  noIndex?: boolean | null;
  activateRSVPs?: boolean | null;
  nextDayReminderSent?: boolean | null;
  onlyVisibleToLoggedIn?: boolean | null;
  onlyVisibleToEstablishedAccounts?: boolean | null;
  hideFromRecentDiscussions?: boolean | null;
  votingSystem?: string | null;
  podcastEpisodeId?: string | null;
  forceAllowType3Audio?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacySpam?: boolean | null;
  feedId?: string | null;
  feedLink?: string | null;
  curatedDate?: Date | null;
  metaDate?: Date | null;
  suggestForCuratedUserIds?: Array<string> | null;
  frontpageDate?: Date | null;
  autoFrontpage?: string | null;
  collectionTitle?: string | null;
  coauthorStatuses?: Array<CoauthorStatusInput> | null;
  coauthorUserIds?: Array<string> | null;
  hasCoauthorPermission?: boolean | null;
  socialPreviewImageId?: string | null;
  socialPreviewImageAutoUrl?: string | null;
  socialPreview?: SocialPreviewInput | null;
  fmCrosspost?: CrosspostInput | null;
  canonicalSequenceId?: string | null;
  canonicalCollectionSlug?: string | null;
  canonicalBookId?: string | null;
  canonicalNextPostSlug?: string | null;
  canonicalPrevPostSlug?: string | null;
  unlisted?: boolean | null;
  disableRecommendation?: boolean | null;
  defaultRecommendation?: boolean | null;
  hideFromPopularComments?: boolean | null;
  draft?: boolean | null;
  wasEverUndrafted?: boolean | null;
  meta?: boolean | null;
  hideFrontpageComments?: boolean | null;
  bannedUserIds?: Array<string> | null;
  commentsLocked?: boolean | null;
  commentsLockedToAccountsCreatedAfter?: Date | null;
  organizerIds?: Array<string> | null;
  groupId?: string | null;
  eventType?: string | null;
  isEvent?: boolean | null;
  reviewedByUserId?: string | null;
  reviewForCuratedUserId?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  eventRegistrationLink?: string | null;
  joinEventLink?: string | null;
  onlineEvent?: boolean | null;
  globalEvent?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  meetupLink?: string | null;
  website?: string | null;
  eventImageId?: string | null;
  types?: Array<string> | null;
  metaSticky?: boolean | null;
  sharingSettings?: any;
  shareWithUsers?: Array<string> | null;
  linkSharingKey?: string | null;
  commentSortOrder?: string | null;
  hideAuthor?: boolean | null;
  sideCommentVisibility?: string | null;
  disableSidenotes?: boolean | null;
  moderationStyle?: string | null;
  ignoreRateLimits?: boolean | null;
  hideCommentKarma?: boolean | null;
  collabEditorDialogue?: boolean | null;
  rejected?: boolean | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  subforumTagId?: string | null;
  af?: boolean | null;
  afDate?: Date | null;
  afSticky?: boolean | null;
  suggestForAlignmentUserIds?: Array<string> | null;
  reviewForAlignmentUserId?: string | null;
  agentFoundationsId?: string | null;
  swrCachingEnabled?: boolean | null;
  generateDraftJargon?: boolean | null;
}

interface UpdatePostInput {
  selector: SelectorInput;
  data: UpdatePostDataInput;
}

interface PostOutput {
  data: Post | null;
}

interface CreateRSSFeedDataInput {
  legacyData?: any;
  userId?: string | null;
  ownedByUser?: boolean | null;
  displayFullContent?: boolean | null;
  nickname: string;
  url: string;
  rawFeed?: any;
  setCanonicalUrl?: boolean | null;
  importAsDraft?: boolean | null;
}

interface CreateRSSFeedInput {
  data: CreateRSSFeedDataInput;
}

interface UpdateRSSFeedDataInput {
  legacyData?: any;
  userId?: string | null;
  ownedByUser?: boolean | null;
  displayFullContent?: boolean | null;
  nickname?: string | null;
  url?: string | null;
  status?: string | null;
  rawFeed?: any;
  setCanonicalUrl?: boolean | null;
  importAsDraft?: boolean | null;
}

interface UpdateRSSFeedInput {
  selector: SelectorInput;
  data: UpdateRSSFeedDataInput;
}

interface RSSFeedOutput {
  data: RSSFeed | null;
}

interface CreateReportDataInput {
  legacyData?: any;
  userId?: string | null;
  reportedUserId?: string | null;
  commentId?: string | null;
  postId?: string | null;
  link: string;
  claimedUserId?: string | null;
  description?: string | null;
  reportedAsSpam?: boolean | null;
}

interface CreateReportInput {
  data: CreateReportDataInput;
}

interface UpdateReportDataInput {
  createdAt?: Date | null;
  legacyData?: any;
  claimedUserId?: string | null;
  description?: string | null;
  closedAt?: Date | null;
  markedAsSpam?: boolean | null;
  reportedAsSpam?: boolean | null;
}

interface UpdateReportInput {
  selector: SelectorInput;
  data: UpdateReportDataInput;
}

interface ReportOutput {
  data: Report | null;
}

interface ContentTypeInput {
  type: string;
  data: ContentTypeData;
}

interface CreateRevisionDataInput {
  originalContents: ContentTypeInput;
  commitMessage?: string | null;
  updateType?: string | null;
  dataWithDiscardedSuggestions?: any;
  googleDocMetadata?: any;
}

interface UpdateRevisionDataInput {
  legacyData?: any;
  skipAttributions?: boolean | null;
}

interface UpdateRevisionInput {
  selector: SelectorInput;
  data: UpdateRevisionDataInput;
}

interface RevisionOutput {
  data: Revision | null;
}

interface CreateSequenceDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  lastUpdated?: Date | null;
  userId?: string | null;
  title: string;
  bannerImageId?: string | null;
  gridImageId?: string | null;
  hideFromAuthorPage?: boolean | null;
  draft?: boolean | null;
  isDeleted?: boolean | null;
  curatedOrder?: number | null;
  userProfileOrder?: number | null;
  canonicalCollectionSlug?: string | null;
  hidden?: boolean | null;
  noindex?: boolean | null;
  af?: boolean | null;
}

interface CreateSequenceInput {
  data: CreateSequenceDataInput;
}

interface UpdateSequenceDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  lastUpdated?: Date | null;
  userId?: string | null;
  title?: string | null;
  bannerImageId?: string | null;
  gridImageId?: string | null;
  hideFromAuthorPage?: boolean | null;
  draft?: boolean | null;
  isDeleted?: boolean | null;
  curatedOrder?: number | null;
  userProfileOrder?: number | null;
  canonicalCollectionSlug?: string | null;
  hidden?: boolean | null;
  noindex?: boolean | null;
  af?: boolean | null;
}

interface UpdateSequenceInput {
  selector: SelectorInput;
  data: UpdateSequenceDataInput;
}

interface SequenceOutput {
  data: Sequence | null;
}

interface CreateSplashArtCoordinateDataInput {
  legacyData?: any;
  reviewWinnerArtId: string;
  leftXPct: number;
  leftYPct: number;
  leftHeightPct: number;
  leftWidthPct: number;
  leftFlipped?: boolean | null;
  middleXPct: number;
  middleYPct: number;
  middleHeightPct: number;
  middleWidthPct: number;
  middleFlipped?: boolean | null;
  rightXPct: number;
  rightYPct: number;
  rightHeightPct: number;
  rightWidthPct: number;
  rightFlipped: boolean;
}

interface CreateSplashArtCoordinateInput {
  data: CreateSplashArtCoordinateDataInput;
}

interface SplashArtCoordinateOutput {
  data: SplashArtCoordinate | null;
}

interface CreateSpotlightDataInput {
  legacyData?: any;
  description?: CreateRevisionDataInput | null;
  documentId: string;
  documentType: SpotlightDocumentType;
  position?: number | null;
  duration: number;
  customTitle?: string | null;
  customSubtitle?: string | null;
  subtitleUrl?: string | null;
  headerTitle?: string | null;
  headerTitleLeftColor?: string | null;
  headerTitleRightColor?: string | null;
  lastPromotedAt: Date;
  spotlightSplashImageUrl?: string | null;
  draft?: boolean | null;
  showAuthor?: boolean | null;
  imageFade?: boolean | null;
  imageFadeColor?: string | null;
  spotlightImageId?: string | null;
  spotlightDarkImageId?: string | null;
}

interface CreateSpotlightInput {
  data: CreateSpotlightDataInput;
}

interface UpdateSpotlightDataInput {
  legacyData?: any;
  description?: CreateRevisionDataInput | null;
  documentId?: string | null;
  documentType?: SpotlightDocumentType | null;
  position?: number | null;
  duration?: number | null;
  customTitle?: string | null;
  customSubtitle?: string | null;
  subtitleUrl?: string | null;
  headerTitle?: string | null;
  headerTitleLeftColor?: string | null;
  headerTitleRightColor?: string | null;
  lastPromotedAt?: Date | null;
  spotlightSplashImageUrl?: string | null;
  draft?: boolean | null;
  deletedDraft?: boolean | null;
  showAuthor?: boolean | null;
  imageFade?: boolean | null;
  imageFadeColor?: string | null;
  spotlightImageId?: string | null;
  spotlightDarkImageId?: string | null;
}

interface UpdateSpotlightInput {
  selector: SelectorInput;
  data: UpdateSpotlightDataInput;
}

interface SpotlightOutput {
  data: Spotlight | null;
}

interface CreateSubscriptionDataInput {
  legacyData?: any;
  state: string;
  documentId: string;
  collectionName: string;
  type: string;
}

interface CreateSubscriptionInput {
  data: CreateSubscriptionDataInput;
}

interface SubscriptionOutput {
  data: Subscription | null;
}

interface CreateSurveyQuestionDataInput {
  legacyData?: any;
  surveyId: string;
  question: string;
  format: SurveyQuestionFormat;
  order: number;
}

interface CreateSurveyQuestionInput {
  data: CreateSurveyQuestionDataInput;
}

interface UpdateSurveyQuestionDataInput {
  legacyData?: any;
  surveyId?: string | null;
  question?: string | null;
  format?: SurveyQuestionFormat | null;
  order?: number | null;
}

interface UpdateSurveyQuestionInput {
  selector: SelectorInput;
  data: UpdateSurveyQuestionDataInput;
}

interface SurveyQuestionOutput {
  data: SurveyQuestion | null;
}

interface CreateSurveyResponseDataInput {
  legacyData?: any;
  surveyId: string;
  surveyScheduleId: string;
  userId: string;
  clientId: string;
  response?: any;
}

interface CreateSurveyResponseInput {
  data: CreateSurveyResponseDataInput;
}

interface UpdateSurveyResponseDataInput {
  legacyData?: any;
  surveyId?: string | null;
  surveyScheduleId?: string | null;
  userId?: string | null;
  clientId?: string | null;
  response?: any;
}

interface UpdateSurveyResponseInput {
  selector: SelectorInput;
  data: UpdateSurveyResponseDataInput;
}

interface SurveyResponseOutput {
  data: SurveyResponse | null;
}

interface CreateSurveyScheduleDataInput {
  legacyData?: any;
  surveyId: string;
  name: string;
  impressionsLimit?: number | null;
  maxVisitorPercentage?: number | null;
  minKarma?: number | null;
  maxKarma?: number | null;
  target: SurveyScheduleTarget;
  startDate?: Date | null;
  endDate?: Date | null;
  deactivated?: boolean | null;
  clientIds?: Array<string> | null;
}

interface CreateSurveyScheduleInput {
  data: CreateSurveyScheduleDataInput;
}

interface UpdateSurveyScheduleDataInput {
  legacyData?: any;
  surveyId?: string | null;
  name?: string | null;
  impressionsLimit?: number | null;
  maxVisitorPercentage?: number | null;
  minKarma?: number | null;
  maxKarma?: number | null;
  target?: SurveyScheduleTarget | null;
  startDate?: Date | null;
  endDate?: Date | null;
  deactivated?: boolean | null;
  clientIds?: Array<string> | null;
}

interface UpdateSurveyScheduleInput {
  selector: SelectorInput;
  data: UpdateSurveyScheduleDataInput;
}

interface SurveyScheduleOutput {
  data: SurveySchedule | null;
}

interface CreateSurveyDataInput {
  legacyData?: any;
  name: string;
}

interface CreateSurveyInput {
  data: CreateSurveyDataInput;
}

interface UpdateSurveyDataInput {
  legacyData?: any;
  name?: string | null;
}

interface UpdateSurveyInput {
  selector: SelectorInput;
  data: UpdateSurveyDataInput;
}

interface SurveyOutput {
  data: Survey | null;
}

interface CreateTagFlagDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  slug?: string | null;
  name: string;
  deleted?: boolean | null;
  order?: number | null;
}

interface CreateTagFlagInput {
  data: CreateTagFlagDataInput;
}

interface UpdateTagFlagDataInput {
  legacyData?: any;
  contents?: CreateRevisionDataInput | null;
  slug?: string | null;
  name?: string | null;
  deleted?: boolean | null;
  order?: number | null;
}

interface UpdateTagFlagInput {
  selector: SelectorInput;
  data: UpdateTagFlagDataInput;
}

interface TagFlagOutput {
  data: TagFlag | null;
}

interface CreateTagDataInput {
  legacyData?: any;
  description?: CreateRevisionDataInput | null;
  subforumWelcomeText?: CreateRevisionDataInput | null;
  moderationGuidelines?: CreateRevisionDataInput | null;
  slug?: string | null;
  name: string;
  shortName?: string | null;
  subtitle?: string | null;
  core?: boolean | null;
  isPostType?: boolean | null;
  suggestedAsFilter?: boolean | null;
  defaultOrder?: number | null;
  descriptionTruncationCount?: number | null;
  adminOnly?: boolean | null;
  canEditUserIds?: Array<string> | null;
  reviewedByUserId?: string | null;
  wikiGrade?: number | null;
  wikiOnly?: boolean | null;
  bannerImageId?: string | null;
  squareImageId?: string | null;
  tagFlagsIds?: Array<string> | null;
  introSequenceId?: string | null;
  postsDefaultSortOrder?: string | null;
  canVoteOnRels?: Array<TagRelVoteGroup> | null;
  isSubforum?: boolean | null;
  subforumModeratorIds?: Array<string> | null;
  subforumIntroPostId?: string | null;
  parentTagId?: string | null;
  subTagIds?: Array<string> | null;
  autoTagModel?: string | null;
  autoTagPrompt?: string | null;
  coreTagId?: string | null;
  forceAllowType3Audio?: boolean | null;
}

interface CreateTagInput {
  data: CreateTagDataInput;
}

interface UpdateTagDataInput {
  legacyData?: any;
  description?: CreateRevisionDataInput | null;
  subforumWelcomeText?: CreateRevisionDataInput | null;
  moderationGuidelines?: CreateRevisionDataInput | null;
  slug?: string | null;
  name?: string | null;
  shortName?: string | null;
  subtitle?: string | null;
  core?: boolean | null;
  isPostType?: boolean | null;
  suggestedAsFilter?: boolean | null;
  defaultOrder?: number | null;
  descriptionTruncationCount?: number | null;
  adminOnly?: boolean | null;
  canEditUserIds?: Array<string> | null;
  deleted?: boolean | null;
  needsReview?: boolean | null;
  reviewedByUserId?: string | null;
  wikiGrade?: number | null;
  wikiOnly?: boolean | null;
  bannerImageId?: string | null;
  squareImageId?: string | null;
  tagFlagsIds?: Array<string> | null;
  introSequenceId?: string | null;
  postsDefaultSortOrder?: string | null;
  canVoteOnRels?: Array<TagRelVoteGroup> | null;
  isSubforum?: boolean | null;
  subforumModeratorIds?: Array<string> | null;
  subforumIntroPostId?: string | null;
  parentTagId?: string | null;
  subTagIds?: Array<string> | null;
  autoTagModel?: string | null;
  autoTagPrompt?: string | null;
  noindex?: boolean | null;
  isPlaceholderPage?: boolean | null;
  coreTagId?: string | null;
  forceAllowType3Audio?: boolean | null;
}

interface UpdateTagInput {
  selector: SelectorInput;
  data: UpdateTagDataInput;
}

interface TagOutput {
  data: Tag | null;
}

interface CreateUltraFeedEventDataInput {
  documentId: string;
  collectionName: UltraFeedEventCollectionName;
  eventType: UltraFeedEventEventType;
  userId?: string | null;
  event?: any;
  feedItemId?: string | null;
}

interface CreateUltraFeedEventInput {
  data: CreateUltraFeedEventDataInput;
}

interface UpdateUltraFeedEventDataInput {
  event?: any;
}

interface UltraFeedEventOutput {
  data: UltraFeedEvent | null;
}

interface CreateUserEAGDetailDataInput {
  legacyData?: any;
  lastUpdated?: Date | null;
}

interface CreateUserEAGDetailInput {
  data: CreateUserEAGDetailDataInput;
}

interface UpdateUserEAGDetailDataInput {
  legacyData?: any;
  careerStage?: Array<string> | null;
  countryOrRegion?: string | null;
  nearestCity?: string | null;
  willingnessToRelocate?: any;
  experiencedIn?: Array<string> | null;
  interestedIn?: Array<string> | null;
  lastUpdated?: Date | null;
}

interface UpdateUserEAGDetailInput {
  selector: SelectorInput;
  data: UpdateUserEAGDetailDataInput;
}

interface UserEAGDetailOutput {
  data: UserEAGDetail | null;
}

interface CreateUserJobAdDataInput {
  legacyData?: any;
  userId: string;
  jobName: string;
  adState: string;
  reminderSetAt?: Date | null;
  lastUpdated?: Date | null;
}

interface CreateUserJobAdInput {
  data: CreateUserJobAdDataInput;
}

interface UpdateUserJobAdDataInput {
  legacyData?: any;
  adState?: string | null;
  reminderSetAt?: Date | null;
  lastUpdated?: Date | null;
}

interface UpdateUserJobAdInput {
  selector: SelectorInput;
  data: UpdateUserJobAdDataInput;
}

interface UserJobAdOutput {
  data: UserJobAd | null;
}

interface CreateUserMostValuablePostDataInput {
  legacyData?: any;
  userId: string;
  postId: string;
  deleted?: boolean | null;
}

interface CreateUserMostValuablePostInput {
  data: CreateUserMostValuablePostDataInput;
}

interface UpdateUserMostValuablePostDataInput {
  legacyData?: any;
  userId?: string | null;
  postId?: string | null;
  deleted?: boolean | null;
}

interface UpdateUserMostValuablePostInput {
  selector: SelectorInput;
  data: UpdateUserMostValuablePostDataInput;
}

interface UserMostValuablePostOutput {
  data: UserMostValuablePost | null;
}

interface CreateUserRateLimitDataInput {
  legacyData?: any;
  userId: string;
  type: UserRateLimitType;
  intervalUnit: UserRateLimitIntervalUnit;
  intervalLength: number;
  actionsPerInterval: number;
  endedAt: Date;
}

interface CreateUserRateLimitInput {
  data: CreateUserRateLimitDataInput;
}

interface UpdateUserRateLimitDataInput {
  legacyData?: any;
  userId?: string | null;
  type?: UserRateLimitType | null;
  intervalUnit?: UserRateLimitIntervalUnit | null;
  intervalLength?: number | null;
  actionsPerInterval?: number | null;
  endedAt?: Date | null;
}

interface UpdateUserRateLimitInput {
  selector: SelectorInput;
  data: UpdateUserRateLimitDataInput;
}

interface UserRateLimitOutput {
  data: UserRateLimit | null;
}

interface CreateUserTagRelDataInput {
  legacyData?: any;
  tagId: string;
  userId: string;
  subforumShowUnreadInSidebar?: boolean | null;
  subforumEmailNotifications?: boolean | null;
  subforumHideIntroPost?: boolean | null;
}

interface CreateUserTagRelInput {
  data: CreateUserTagRelDataInput;
}

interface UpdateUserTagRelDataInput {
  legacyData?: any;
  subforumShowUnreadInSidebar?: boolean | null;
  subforumEmailNotifications?: boolean | null;
  subforumHideIntroPost?: boolean | null;
}

interface UpdateUserTagRelInput {
  selector: SelectorInput;
  data: UpdateUserTagRelDataInput;
}

interface UserTagRelOutput {
  data: UserTagRel | null;
}

interface CreateUserDataInput {
  legacyData?: any;
  moderationGuidelines?: CreateRevisionDataInput | null;
  howOthersCanHelpMe?: CreateRevisionDataInput | null;
  howICanHelpOthers?: CreateRevisionDataInput | null;
  slug?: string | null;
  biography?: CreateRevisionDataInput | null;
  username?: string | null;
  isAdmin?: boolean | null;
  displayName: string;
  previousDisplayName?: string | null;
  email?: string | null;
  groups?: Array<string> | null;
  theme?: any;
  lastUsedTimezone?: string | null;
  whenConfirmationEmailSent?: Date | null;
  legacy?: boolean | null;
  commentSorting?: string | null;
  noKibitz?: boolean | null;
  showHideKarmaOption?: boolean | null;
  showPostAuthorCard?: boolean | null;
  hideIntercom?: boolean | null;
  noSingleLineComments?: boolean | null;
  noCollapseCommentsPosts?: boolean | null;
  noCollapseCommentsFrontpage?: boolean | null;
  hideCommunitySection?: boolean | null;
  expandedFrontpageSections?: ExpandedFrontpageSectionsSettingsInput | null;
  showCommunityInRecentDiscussion?: boolean | null;
  hidePostsRecommendations?: boolean | null;
  petrovOptOut?: boolean | null;
  optedOutOfSurveys?: boolean | null;
  postGlossariesPinned?: boolean | null;
  acceptedTos?: boolean | null;
  hideNavigationSidebar?: boolean | null;
  currentFrontpageFilter?: string | null;
  frontpageSelectedTab?: string | null;
  frontpageFilterSettings?: any;
  hideFrontpageFilterSettingsDesktop?: boolean | null;
  allPostsTimeframe?: string | null;
  allPostsFilter?: string | null;
  allPostsSorting?: string | null;
  allPostsShowLowKarma?: boolean | null;
  allPostsIncludeEvents?: boolean | null;
  allPostsHideCommunity?: boolean | null;
  allPostsOpenSettings?: boolean | null;
  draftsListSorting?: string | null;
  draftsListShowArchived?: boolean | null;
  draftsListShowShared?: boolean | null;
  lastNotificationsCheck?: Date | null;
  moderationStyle?: string | null;
  moderatorAssistance?: boolean | null;
  collapseModerationGuidelines?: boolean | null;
  bannedUserIds?: Array<string> | null;
  bannedPersonalUserIds?: Array<string> | null;
  legacyId?: string | null;
  voteBanned?: boolean | null;
  nullifyVotes?: boolean | null;
  deleteContent?: boolean | null;
  banned?: Date | null;
  auto_subscribe_to_my_posts?: boolean | null;
  auto_subscribe_to_my_comments?: boolean | null;
  autoSubscribeAsOrganizer?: boolean | null;
  notificationCommentsOnSubscribedPost?: any;
  notificationShortformContent?: any;
  notificationRepliesToMyComments?: any;
  notificationRepliesToSubscribedComments?: any;
  notificationSubscribedUserPost?: any;
  notificationSubscribedUserComment?: any;
  notificationPostsInGroups?: any;
  notificationSubscribedTagPost?: any;
  notificationSubscribedSequencePost?: any;
  notificationPrivateMessage?: any;
  notificationSharedWithMe?: any;
  notificationAlignmentSubmissionApproved?: any;
  notificationEventInRadius?: any;
  notificationKarmaPowersGained?: any;
  notificationRSVPs?: any;
  notificationGroupAdministration?: any;
  notificationCommentsOnDraft?: any;
  notificationPostsNominatedReview?: any;
  notificationSubforumUnread?: any;
  notificationNewMention?: any;
  notificationDialogueMessages?: any;
  notificationPublishedDialogueMessages?: any;
  notificationAddedAsCoauthor?: any;
  notificationDebateCommentsOnSubscribedPost?: any;
  notificationDebateReplies?: any;
  notificationDialogueMatch?: any;
  notificationNewDialogueChecks?: any;
  notificationYourTurnMatchForm?: any;
  hideDialogueFacilitation?: boolean | null;
  revealChecksToAdmins?: boolean | null;
  optedInToDialogueFacilitation?: boolean | null;
  showDialoguesList?: boolean | null;
  showMyDialogues?: boolean | null;
  showMatches?: boolean | null;
  showRecommendedPartners?: boolean | null;
  hideActiveDialogueUsers?: boolean | null;
  karmaChangeNotifierSettings?: any;
  karmaChangeLastOpened?: Date | null;
  karmaChangeBatchStart?: Date | null;
  emailSubscribedToCurated?: boolean | null;
  subscribedToDigest?: boolean | null;
  subscribedToNewsletter?: boolean | null;
  unsubscribeFromAll?: boolean | null;
  hideSubscribePoke?: boolean | null;
  hideMeetupsPoke?: boolean | null;
  hideHomeRHS?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  mapLocation?: any;
  mapMarkerText?: string | null;
  nearbyEventsNotifications?: boolean | null;
  nearbyEventsNotificationsLocation?: any;
  nearbyEventsNotificationsRadius?: number | null;
  nearbyPeopleNotificationThreshold?: number | null;
  hideFrontpageMap?: boolean | null;
  hideTaggingProgressBar?: boolean | null;
  hideFrontpageBookAd?: boolean | null;
  hideFrontpageBook2019Ad?: boolean | null;
  hideFrontpageBook2020Ad?: boolean | null;
  reviewedByUserId?: string | null;
  shortformFeedId?: string | null;
  viewUnreviewedComments?: boolean | null;
  noExpandUnreadCommentsReview?: boolean | null;
  profileUpdatedAt?: Date | null;
  jobTitle?: string | null;
  organization?: string | null;
  careerStage?: Array<string> | null;
  website?: string | null;
  fmCrosspostUserId?: string | null;
  linkedinProfileURL?: string | null;
  facebookProfileURL?: string | null;
  blueskyProfileURL?: string | null;
  twitterProfileURL?: string | null;
  twitterProfileURLAdmin?: string | null;
  githubProfileURL?: string | null;
  profileTagIds?: Array<string> | null;
  organizerOfGroupIds?: Array<string> | null;
  programParticipation?: Array<string> | null;
  postingDisabled?: boolean | null;
  allCommentingDisabled?: boolean | null;
  commentingOnOtherUsersDisabled?: boolean | null;
  conversationsDisabled?: boolean | null;
  acknowledgedNewUserGuidelines?: boolean | null;
  subforumPreferredLayout?: SubforumPreferredLayout | null;
  hideJobAdUntil?: Date | null;
  criticismTipsDismissed?: boolean | null;
  hideFromPeopleDirectory?: boolean | null;
  allowDatadogSessionReplay?: boolean | null;
  reviewForAlignmentForumUserId?: string | null;
  afSubmittedApplication?: boolean | null;
  hideSunshineSidebar?: boolean | null;
  inactiveSurveyEmailSentAt?: Date | null;
  userSurveyEmailSentAt?: Date | null;
}

interface CreateUserInput {
  data: CreateUserDataInput;
}

interface UpdateUserDataInput {
  legacyData?: any;
  moderationGuidelines?: CreateRevisionDataInput | null;
  howOthersCanHelpMe?: CreateRevisionDataInput | null;
  howICanHelpOthers?: CreateRevisionDataInput | null;
  slug?: string | null;
  biography?: CreateRevisionDataInput | null;
  username?: string | null;
  isAdmin?: boolean | null;
  displayName?: string | null;
  previousDisplayName?: string | null;
  email?: string | null;
  noindex?: boolean | null;
  groups?: Array<string> | null;
  theme?: any;
  lastUsedTimezone?: string | null;
  whenConfirmationEmailSent?: Date | null;
  legacy?: boolean | null;
  commentSorting?: string | null;
  sortDraftsBy?: string | null;
  reactPaletteStyle?: ReactPaletteStyle | null;
  noKibitz?: boolean | null;
  showHideKarmaOption?: boolean | null;
  showPostAuthorCard?: boolean | null;
  hideIntercom?: boolean | null;
  markDownPostEditor?: boolean | null;
  hideElicitPredictions?: boolean | null;
  hideAFNonMemberInitialWarning?: boolean | null;
  noSingleLineComments?: boolean | null;
  noCollapseCommentsPosts?: boolean | null;
  noCollapseCommentsFrontpage?: boolean | null;
  hideCommunitySection?: boolean | null;
  expandedFrontpageSections?: ExpandedFrontpageSectionsSettingsInput | null;
  showCommunityInRecentDiscussion?: boolean | null;
  hidePostsRecommendations?: boolean | null;
  petrovOptOut?: boolean | null;
  optedOutOfSurveys?: boolean | null;
  postGlossariesPinned?: boolean | null;
  generateJargonForDrafts?: boolean | null;
  generateJargonForPublishedPosts?: boolean | null;
  acceptedTos?: boolean | null;
  hideNavigationSidebar?: boolean | null;
  currentFrontpageFilter?: string | null;
  frontpageSelectedTab?: string | null;
  frontpageFilterSettings?: any;
  hideFrontpageFilterSettingsDesktop?: boolean | null;
  allPostsTimeframe?: string | null;
  allPostsFilter?: string | null;
  allPostsSorting?: string | null;
  allPostsShowLowKarma?: boolean | null;
  allPostsIncludeEvents?: boolean | null;
  allPostsHideCommunity?: boolean | null;
  allPostsOpenSettings?: boolean | null;
  draftsListSorting?: string | null;
  draftsListShowArchived?: boolean | null;
  draftsListShowShared?: boolean | null;
  lastNotificationsCheck?: Date | null;
  moderationStyle?: string | null;
  moderatorAssistance?: boolean | null;
  collapseModerationGuidelines?: boolean | null;
  bannedUserIds?: Array<string> | null;
  bannedPersonalUserIds?: Array<string> | null;
  hiddenPostsMetadata?: Array<PostMetadataInput> | null;
  legacyId?: string | null;
  deleted?: boolean | null;
  permanentDeletionRequestedAt?: Date | null;
  voteBanned?: boolean | null;
  nullifyVotes?: boolean | null;
  deleteContent?: boolean | null;
  banned?: Date | null;
  auto_subscribe_to_my_posts?: boolean | null;
  auto_subscribe_to_my_comments?: boolean | null;
  autoSubscribeAsOrganizer?: boolean | null;
  notificationCommentsOnSubscribedPost?: any;
  notificationShortformContent?: any;
  notificationRepliesToMyComments?: any;
  notificationRepliesToSubscribedComments?: any;
  notificationSubscribedUserPost?: any;
  notificationSubscribedUserComment?: any;
  notificationPostsInGroups?: any;
  notificationSubscribedTagPost?: any;
  notificationSubscribedSequencePost?: any;
  notificationPrivateMessage?: any;
  notificationSharedWithMe?: any;
  notificationAlignmentSubmissionApproved?: any;
  notificationEventInRadius?: any;
  notificationKarmaPowersGained?: any;
  notificationRSVPs?: any;
  notificationGroupAdministration?: any;
  notificationCommentsOnDraft?: any;
  notificationPostsNominatedReview?: any;
  notificationSubforumUnread?: any;
  notificationNewMention?: any;
  notificationDialogueMessages?: any;
  notificationPublishedDialogueMessages?: any;
  notificationAddedAsCoauthor?: any;
  notificationDebateCommentsOnSubscribedPost?: any;
  notificationDebateReplies?: any;
  notificationDialogueMatch?: any;
  notificationNewDialogueChecks?: any;
  notificationYourTurnMatchForm?: any;
  hideDialogueFacilitation?: boolean | null;
  revealChecksToAdmins?: boolean | null;
  optedInToDialogueFacilitation?: boolean | null;
  showDialoguesList?: boolean | null;
  showMyDialogues?: boolean | null;
  showMatches?: boolean | null;
  showRecommendedPartners?: boolean | null;
  hideActiveDialogueUsers?: boolean | null;
  karmaChangeNotifierSettings?: any;
  karmaChangeLastOpened?: Date | null;
  karmaChangeBatchStart?: Date | null;
  emailSubscribedToCurated?: boolean | null;
  subscribedToDigest?: boolean | null;
  subscribedToNewsletter?: boolean | null;
  unsubscribeFromAll?: boolean | null;
  hideSubscribePoke?: boolean | null;
  hideMeetupsPoke?: boolean | null;
  hideHomeRHS?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  mapLocation?: any;
  mapMarkerText?: string | null;
  nearbyEventsNotifications?: boolean | null;
  nearbyEventsNotificationsLocation?: any;
  nearbyEventsNotificationsRadius?: number | null;
  nearbyPeopleNotificationThreshold?: number | null;
  hideFrontpageMap?: boolean | null;
  hideTaggingProgressBar?: boolean | null;
  hideFrontpageBookAd?: boolean | null;
  hideFrontpageBook2019Ad?: boolean | null;
  hideFrontpageBook2020Ad?: boolean | null;
  sunshineNotes?: string | null;
  sunshineFlagged?: boolean | null;
  needsReview?: boolean | null;
  sunshineSnoozed?: boolean | null;
  snoozedUntilContentCount?: number | null;
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
  fullName?: string | null;
  shortformFeedId?: string | null;
  viewUnreviewedComments?: boolean | null;
  partiallyReadSequences?: Array<PartiallyReadSequenceItemInput> | null;
  beta?: boolean | null;
  reviewVotesQuadratic?: boolean | null;
  reviewVotesQuadratic2019?: boolean | null;
  reviewVotesQuadratic2020?: boolean | null;
  petrovPressedButtonDate?: Date | null;
  petrovLaunchCodeDate?: Date | null;
  defaultToCKEditor?: boolean | null;
  signUpReCaptchaRating?: number | null;
  noExpandUnreadCommentsReview?: boolean | null;
  abTestKey?: string | null;
  abTestOverrides?: any;
  walledGardenInvite?: boolean | null;
  walledGardenPortalOnboarded?: boolean | null;
  taggingDashboardCollapsed?: boolean | null;
  usernameUnset?: boolean | null;
  paymentEmail?: string | null;
  paymentInfo?: string | null;
  profileUpdatedAt?: Date | null;
  profileImageId?: string | null;
  jobTitle?: string | null;
  organization?: string | null;
  careerStage?: Array<string> | null;
  website?: string | null;
  fmCrosspostUserId?: string | null;
  linkedinProfileURL?: string | null;
  facebookProfileURL?: string | null;
  blueskyProfileURL?: string | null;
  twitterProfileURL?: string | null;
  twitterProfileURLAdmin?: string | null;
  githubProfileURL?: string | null;
  profileTagIds?: Array<string> | null;
  organizerOfGroupIds?: Array<string> | null;
  programParticipation?: Array<string> | null;
  postingDisabled?: boolean | null;
  allCommentingDisabled?: boolean | null;
  commentingOnOtherUsersDisabled?: boolean | null;
  conversationsDisabled?: boolean | null;
  acknowledgedNewUserGuidelines?: boolean | null;
  subforumPreferredLayout?: SubforumPreferredLayout | null;
  hideJobAdUntil?: Date | null;
  criticismTipsDismissed?: boolean | null;
  hideFromPeopleDirectory?: boolean | null;
  allowDatadogSessionReplay?: boolean | null;
  reviewForAlignmentForumUserId?: string | null;
  afApplicationText?: string | null;
  afSubmittedApplication?: boolean | null;
  hideSunshineSidebar?: boolean | null;
  inactiveSurveyEmailSentAt?: Date | null;
  userSurveyEmailSentAt?: Date | null;
  recommendationSettings?: RecommendationSettingsInput | null;
}

interface UpdateUserInput {
  selector: SelectorInput;
  data: UpdateUserDataInput;
}

interface UserOutput {
  data: User | null;
}

interface GraphQLTypeMap {
  Query: Query;
  Mutation: Mutation;
  ContentType: ContentType;
  SelectorInput: SelectorInput;
  EmptyViewInput: EmptyViewInput;
  EmailPreview: EmailPreview;
  ArbitalLinkedPage: ArbitalLinkedPage;
  ArbitalLinkedPages: ArbitalLinkedPages;
  SocialPreviewType: SocialPreviewType;
  CoauthorStatusInput: CoauthorStatusInput;
  SocialPreviewInput: SocialPreviewInput;
  CrosspostInput: CrosspostInput;
  CoauthorStatusOutput: CoauthorStatusOutput;
  SocialPreviewOutput: SocialPreviewOutput;
  CrosspostOutput: CrosspostOutput;
  TagContributor: TagContributor;
  TagContributorsList: TagContributorsList;
  UserLikingTag: UserLikingTag;
  LatLng: LatLng;
  ExpandedFrontpageSectionsSettingsInput: ExpandedFrontpageSectionsSettingsInput;
  ExpandedFrontpageSectionsSettingsOutput: ExpandedFrontpageSectionsSettingsOutput;
  PartiallyReadSequenceItemInput: PartiallyReadSequenceItemInput;
  PartiallyReadSequenceItemOutput: PartiallyReadSequenceItemOutput;
  PostMetadataInput: PostMetadataInput;
  PostMetadataOutput: PostMetadataOutput;
  RecommendationAlgorithmSettingsInput: RecommendationAlgorithmSettingsInput;
  RecommendationSettingsInput: RecommendationSettingsInput;
  RecommendResumeSequence: RecommendResumeSequence;
  CommentCountTag: CommentCountTag;
  TopCommentedTagUser: TopCommentedTagUser;
  UpvotedUser: UpvotedUser;
  UserDialogueUsefulData: UserDialogueUsefulData;
  NewUserCompletedProfile: NewUserCompletedProfile;
  UserCoreTagReads: UserCoreTagReads;
  NetKarmaChangesForAuthorsOverPeriod: NetKarmaChangesForAuthorsOverPeriod;
  AirtableLeaderboardResult: AirtableLeaderboardResult;
  SuggestedFeedSubscriptionUsersResult: SuggestedFeedSubscriptionUsersResult;
  VoteResultPost: VoteResultPost;
  VoteResultComment: VoteResultComment;
  VoteResultTagRel: VoteResultTagRel;
  VoteResultRevision: VoteResultRevision;
  VoteResultElectionCandidate: VoteResultElectionCandidate;
  VoteResultTag: VoteResultTag;
  VoteResultMultiDocument: VoteResultMultiDocument;
  CommentsWithReactsResult: CommentsWithReactsResult;
  PopularCommentsResult: PopularCommentsResult;
  PostKarmaChange: PostKarmaChange;
  CommentKarmaChange: CommentKarmaChange;
  RevisionsKarmaChange: RevisionsKarmaChange;
  ReactionChange: ReactionChange;
  KarmaChangesSimple: KarmaChangesSimple;
  KarmaChanges: KarmaChanges;
  UniqueClientViewsSeries: UniqueClientViewsSeries;
  PostAnalyticsResult: PostAnalyticsResult;
  PostAnalytics2Result: PostAnalytics2Result;
  MultiPostAnalyticsResult: MultiPostAnalyticsResult;
  AnalyticsSeriesValue: AnalyticsSeriesValue;
  ArbitalPageData: ArbitalPageData;
  ElicitUser: ElicitUser;
  ElicitPrediction: ElicitPrediction;
  ElicitBlockData: ElicitBlockData;
  NotificationCounts: NotificationCounts;
  NotificationDisplaysResult: NotificationDisplaysResult;
  PetrovDay2024CheckNumberOfIncomingData: PetrovDay2024CheckNumberOfIncomingData;
  PetrovDayCheckIfIncomingData: PetrovDayCheckIfIncomingData;
  PetrovDayLaunchMissileData: PetrovDayLaunchMissileData;
  GivingSeasonHeart: GivingSeasonHeart;
  UserReadHistoryResult: UserReadHistoryResult;
  PostsUserCommentedOnResult: PostsUserCommentedOnResult;
  PostReviewFilter: PostReviewFilter;
  PostReviewSort: PostReviewSort;
  DigestPlannerPost: DigestPlannerPost;
  RecombeeRecommendedPost: RecombeeRecommendedPost;
  VertexRecommendedPost: VertexRecommendedPost;
  PostWithApprovedJargon: PostWithApprovedJargon;
  DigestHighlightsResult: DigestHighlightsResult;
  DigestPostsThisWeekResult: DigestPostsThisWeekResult;
  CuratedAndPopularThisWeekResult: CuratedAndPopularThisWeekResult;
  RecentlyActiveDialoguesResult: RecentlyActiveDialoguesResult;
  MyDialoguesResult: MyDialoguesResult;
  CrossedKarmaThresholdResult: CrossedKarmaThresholdResult;
  RecombeeLatestPostsResult: RecombeeLatestPostsResult;
  RecombeeHybridPostsResult: RecombeeHybridPostsResult;
  PostsWithActiveDiscussionResult: PostsWithActiveDiscussionResult;
  PostsBySubscribedAuthorsResult: PostsBySubscribedAuthorsResult;
  PostsWithApprovedJargonResult: PostsWithApprovedJargonResult;
  AllTagsActivityFeedQueryResults: AllTagsActivityFeedQueryResults;
  AllTagsActivityFeedEntry: AllTagsActivityFeedEntry;
  RecentDiscussionFeedQueryResults: RecentDiscussionFeedQueryResults;
  RecentDiscussionFeedEntry: RecentDiscussionFeedEntry;
  SubscribedPostAndComments: SubscribedPostAndComments;
  SubscribedFeedQueryResults: SubscribedFeedQueryResults;
  SubscribedFeedEntry: SubscribedFeedEntry;
  TagHistoryFeedQueryResults: TagHistoryFeedQueryResults;
  TagHistoryFeedEntry: TagHistoryFeedEntry;
  SubforumMagicFeedQueryResults: SubforumMagicFeedQueryResults;
  SubforumMagicFeedEntry: SubforumMagicFeedEntry;
  SubforumTopFeedQueryResults: SubforumTopFeedQueryResults;
  SubforumTopFeedEntry: SubforumTopFeedEntry;
  SubforumRecentCommentsFeedQueryResults: SubforumRecentCommentsFeedQueryResults;
  SubforumRecentCommentsFeedEntry: SubforumRecentCommentsFeedEntry;
  SubforumNewFeedQueryResults: SubforumNewFeedQueryResults;
  SubforumNewFeedEntry: SubforumNewFeedEntry;
  SubforumOldFeedQueryResults: SubforumOldFeedQueryResults;
  SubforumOldFeedEntry: SubforumOldFeedEntry;
  SurveyQuestionInfo: SurveyQuestionInfo;
  DocumentDeletion: DocumentDeletion;
  TagUpdates: TagUpdates;
  TagPreviewWithSummaries: TagPreviewWithSummaries;
  TagWithTotalCount: TagWithTotalCount;
  MostReadTopic: MostReadTopic;
  TagReadLikelihoodRatio: TagReadLikelihoodRatio;
  MostReadAuthor: MostReadAuthor;
  TopCommentContents: TopCommentContents;
  TopComment: TopComment;
  MostReceivedReact: MostReceivedReact;
  CombinedKarmaVals: CombinedKarmaVals;
  WrappedDataByYear: WrappedDataByYear;
  Site: Site;
  LoginReturnData: LoginReturnData;
  MigrationsDashboardData: MigrationsDashboardData;
  MigrationStatus: MigrationStatus;
  MigrationRun: MigrationRun;
  ExternalPost: ExternalPost;
  ExternalPostImportData: ExternalPostImportData;
  AutosaveContentType: AutosaveContentType;
  ModeratorIPAddressInfo: ModeratorIPAddressInfo;
  ToggleBookmarkInput: ToggleBookmarkInput;
  ToggleBookmarkOutput: ToggleBookmarkOutput;
  RssPostChangeInfo: RssPostChangeInfo;
  FeedSpotlightMetaInfo: FeedSpotlightMetaInfo;
  FeedPost: FeedPost;
  FeedCommentThread: FeedCommentThread;
  FeedSpotlightItem: FeedSpotlightItem;
  FeedSubscriptionSuggestions: FeedSubscriptionSuggestions;
  UltraFeedQueryResults: UltraFeedQueryResults;
  UltraFeedEntry: UltraFeedEntry;
  ElicitQuestionPredictionCreator: ElicitQuestionPredictionCreator;
  AdvisorRequest: AdvisorRequest;
  SingleAdvisorRequestInput: SingleAdvisorRequestInput;
  SingleAdvisorRequestOutput: SingleAdvisorRequestOutput;
  AdvisorRequestsRequestsByUserInput: AdvisorRequestsRequestsByUserInput;
  AdvisorRequestSelector: AdvisorRequestSelector;
  MultiAdvisorRequestInput: MultiAdvisorRequestInput;
  MultiAdvisorRequestOutput: MultiAdvisorRequestOutput;
  ArbitalCaches: ArbitalCaches;
  ArbitalTagContentRel: ArbitalTagContentRel;
  SingleArbitalTagContentRelInput: SingleArbitalTagContentRelInput;
  SingleArbitalTagContentRelOutput: SingleArbitalTagContentRelOutput;
  ArbitalTagContentRelSelector: ArbitalTagContentRelSelector;
  MultiArbitalTagContentRelInput: MultiArbitalTagContentRelInput;
  MultiArbitalTagContentRelOutput: MultiArbitalTagContentRelOutput;
  AutomatedContentEvaluation: AutomatedContentEvaluation;
  SentenceScore: SentenceScore;
  Ban: Ban;
  SingleBanInput: SingleBanInput;
  SingleBanOutput: SingleBanOutput;
  BanSelector: BanSelector;
  MultiBanInput: MultiBanInput;
  MultiBanOutput: MultiBanOutput;
  Bookmark: Bookmark;
  SingleBookmarkInput: SingleBookmarkInput;
  SingleBookmarkOutput: SingleBookmarkOutput;
  BookmarksUserDocumentBookmarkInput: BookmarksUserDocumentBookmarkInput;
  BookmarkSelector: BookmarkSelector;
  MultiBookmarkInput: MultiBookmarkInput;
  MultiBookmarkOutput: MultiBookmarkOutput;
  Book: Book;
  SingleBookInput: SingleBookInput;
  SingleBookOutput: SingleBookOutput;
  BookSelector: BookSelector;
  MultiBookInput: MultiBookInput;
  MultiBookOutput: MultiBookOutput;
  Chapter: Chapter;
  SingleChapterInput: SingleChapterInput;
  SingleChapterOutput: SingleChapterOutput;
  ChaptersSequenceChaptersInput: ChaptersSequenceChaptersInput;
  ChapterSelector: ChapterSelector;
  MultiChapterInput: MultiChapterInput;
  MultiChapterOutput: MultiChapterOutput;
  CkEditorUserSession: CkEditorUserSession;
  SingleCkEditorUserSessionInput: SingleCkEditorUserSessionInput;
  SingleCkEditorUserSessionOutput: SingleCkEditorUserSessionOutput;
  CkEditorUserSessionSelector: CkEditorUserSessionSelector;
  MultiCkEditorUserSessionInput: MultiCkEditorUserSessionInput;
  MultiCkEditorUserSessionOutput: MultiCkEditorUserSessionOutput;
  ClientId: ClientId;
  SingleClientIdInput: SingleClientIdInput;
  SingleClientIdOutput: SingleClientIdOutput;
  ClientIdsGetClientIdInput: ClientIdsGetClientIdInput;
  ClientIdSelector: ClientIdSelector;
  MultiClientIdInput: MultiClientIdInput;
  MultiClientIdOutput: MultiClientIdOutput;
  Collection: Collection;
  SingleCollectionInput: SingleCollectionInput;
  SingleCollectionOutput: SingleCollectionOutput;
  CollectionDefaultViewInput: CollectionDefaultViewInput;
  CollectionSelector: CollectionSelector;
  MultiCollectionInput: MultiCollectionInput;
  MultiCollectionOutput: MultiCollectionOutput;
  CommentModeratorAction: CommentModeratorAction;
  SingleCommentModeratorActionInput: SingleCommentModeratorActionInput;
  SingleCommentModeratorActionOutput: SingleCommentModeratorActionOutput;
  CommentModeratorActionsActiveCommentModeratorActionsInput: CommentModeratorActionsActiveCommentModeratorActionsInput;
  CommentModeratorActionSelector: CommentModeratorActionSelector;
  MultiCommentModeratorActionInput: MultiCommentModeratorActionInput;
  MultiCommentModeratorActionOutput: MultiCommentModeratorActionOutput;
  Comment: Comment;
  SingleCommentInput: SingleCommentInput;
  SingleCommentOutput: SingleCommentOutput;
  CommentDefaultViewInput: CommentDefaultViewInput;
  CommentsCommentRepliesInput: CommentsCommentRepliesInput;
  CommentsPostCommentsDeletedInput: CommentsPostCommentsDeletedInput;
  CommentsAllCommentsDeletedInput: CommentsAllCommentsDeletedInput;
  CommentsCheckedByModGPTInput: CommentsCheckedByModGPTInput;
  CommentsPostCommentsTopInput: CommentsPostCommentsTopInput;
  CommentsPostCommentsRecentRepliesInput: CommentsPostCommentsRecentRepliesInput;
  CommentsPostCommentsMagicInput: CommentsPostCommentsMagicInput;
  CommentsAfPostCommentsTopInput: CommentsAfPostCommentsTopInput;
  CommentsPostCommentsOldInput: CommentsPostCommentsOldInput;
  CommentsPostCommentsNewInput: CommentsPostCommentsNewInput;
  CommentsPostCommentsBestInput: CommentsPostCommentsBestInput;
  CommentsPostLWCommentsInput: CommentsPostLWCommentsInput;
  CommentsProfileRecentCommentsInput: CommentsProfileRecentCommentsInput;
  CommentsProfileCommentsInput: CommentsProfileCommentsInput;
  CommentsAllRecentCommentsInput: CommentsAllRecentCommentsInput;
  CommentsRecentCommentsInput: CommentsRecentCommentsInput;
  CommentsAfSubmissionsInput: CommentsAfSubmissionsInput;
  CommentsRejectedInput: CommentsRejectedInput;
  CommentsRecentDiscussionThreadInput: CommentsRecentDiscussionThreadInput;
  CommentsAfRecentDiscussionThreadInput: CommentsAfRecentDiscussionThreadInput;
  CommentsPostsItemCommentsInput: CommentsPostsItemCommentsInput;
  CommentsSunshineNewCommentsListInput: CommentsSunshineNewCommentsListInput;
  CommentsQuestionAnswersInput: CommentsQuestionAnswersInput;
  CommentsLegacyIdCommentInput: CommentsLegacyIdCommentInput;
  CommentsSunshineNewUsersCommentsInput: CommentsSunshineNewUsersCommentsInput;
  CommentsDefaultModeratorResponsesInput: CommentsDefaultModeratorResponsesInput;
  CommentsRepliesToAnswerInput: CommentsRepliesToAnswerInput;
  CommentsAnswersAndRepliesInput: CommentsAnswersAndRepliesInput;
  CommentsTopShortformInput: CommentsTopShortformInput;
  CommentsShortformInput: CommentsShortformInput;
  CommentsShortformFrontpageInput: CommentsShortformFrontpageInput;
  CommentsRepliesToCommentThreadInput: CommentsRepliesToCommentThreadInput;
  CommentsRepliesToCommentThreadIncludingRootInput: CommentsRepliesToCommentThreadIncludingRootInput;
  CommentsShortformLatestChildrenInput: CommentsShortformLatestChildrenInput;
  CommentsNominations2018Input: CommentsNominations2018Input;
  CommentsNominations2019Input: CommentsNominations2019Input;
  CommentsReviews2018Input: CommentsReviews2018Input;
  CommentsReviews2019Input: CommentsReviews2019Input;
  CommentsReviewsInput: CommentsReviewsInput;
  CommentsTagDiscussionCommentsInput: CommentsTagDiscussionCommentsInput;
  CommentsTagSubforumCommentsInput: CommentsTagSubforumCommentsInput;
  CommentsLatestSubforumDiscussionInput: CommentsLatestSubforumDiscussionInput;
  CommentsModeratorCommentsInput: CommentsModeratorCommentsInput;
  CommentsDebateResponsesInput: CommentsDebateResponsesInput;
  CommentsRecentDebateResponsesInput: CommentsRecentDebateResponsesInput;
  CommentsForumEventCommentsInput: CommentsForumEventCommentsInput;
  CommentsAlignmentSuggestedCommentsInput: CommentsAlignmentSuggestedCommentsInput;
  CommentsRssInput: CommentsRssInput;
  CommentsDraftCommentsInput: CommentsDraftCommentsInput;
  CommentSelector: CommentSelector;
  MultiCommentInput: MultiCommentInput;
  MultiCommentOutput: MultiCommentOutput;
  Conversation: Conversation;
  SingleConversationInput: SingleConversationInput;
  SingleConversationOutput: SingleConversationOutput;
  ConversationsModeratorConversationsInput: ConversationsModeratorConversationsInput;
  ConversationsUserConversationsInput: ConversationsUserConversationsInput;
  ConversationsUserConversationsAllInput: ConversationsUserConversationsAllInput;
  ConversationsUserGroupUntitledConversationsInput: ConversationsUserGroupUntitledConversationsInput;
  ConversationSelector: ConversationSelector;
  MultiConversationInput: MultiConversationInput;
  MultiConversationOutput: MultiConversationOutput;
  CronHistory: CronHistory;
  CurationEmail: CurationEmail;
  CurationNotice: CurationNotice;
  SingleCurationNoticeInput: SingleCurationNoticeInput;
  SingleCurationNoticeOutput: SingleCurationNoticeOutput;
  CurationNoticeSelector: CurationNoticeSelector;
  MultiCurationNoticeInput: MultiCurationNoticeInput;
  MultiCurationNoticeOutput: MultiCurationNoticeOutput;
  DatabaseMetadata: DatabaseMetadata;
  DebouncerEvents: DebouncerEvents;
  DialogueCheck: DialogueCheck;
  SingleDialogueCheckInput: SingleDialogueCheckInput;
  SingleDialogueCheckOutput: SingleDialogueCheckOutput;
  DialogueChecksUserDialogueChecksInput: DialogueChecksUserDialogueChecksInput;
  DialogueChecksUserTargetDialogueChecksInput: DialogueChecksUserTargetDialogueChecksInput;
  DialogueCheckSelector: DialogueCheckSelector;
  MultiDialogueCheckInput: MultiDialogueCheckInput;
  MultiDialogueCheckOutput: MultiDialogueCheckOutput;
  DialogueMatchPreference: DialogueMatchPreference;
  SingleDialogueMatchPreferenceInput: SingleDialogueMatchPreferenceInput;
  SingleDialogueMatchPreferenceOutput: SingleDialogueMatchPreferenceOutput;
  DialogueMatchPreferencesDialogueMatchPreferencesInput: DialogueMatchPreferencesDialogueMatchPreferencesInput;
  DialogueMatchPreferenceSelector: DialogueMatchPreferenceSelector;
  MultiDialogueMatchPreferenceInput: MultiDialogueMatchPreferenceInput;
  MultiDialogueMatchPreferenceOutput: MultiDialogueMatchPreferenceOutput;
  DigestPost: DigestPost;
  SingleDigestPostInput: SingleDigestPostInput;
  SingleDigestPostOutput: SingleDigestPostOutput;
  DigestPostSelector: DigestPostSelector;
  MultiDigestPostInput: MultiDigestPostInput;
  MultiDigestPostOutput: MultiDigestPostOutput;
  Digest: Digest;
  SingleDigestInput: SingleDigestInput;
  SingleDigestOutput: SingleDigestOutput;
  DigestsFindByNumInput: DigestsFindByNumInput;
  DigestSelector: DigestSelector;
  MultiDigestInput: MultiDigestInput;
  MultiDigestOutput: MultiDigestOutput;
  ElectionCandidate: ElectionCandidate;
  SingleElectionCandidateInput: SingleElectionCandidateInput;
  SingleElectionCandidateOutput: SingleElectionCandidateOutput;
  ElectionCandidateDefaultViewInput: ElectionCandidateDefaultViewInput;
  ElectionCandidateSelector: ElectionCandidateSelector;
  MultiElectionCandidateInput: MultiElectionCandidateInput;
  MultiElectionCandidateOutput: MultiElectionCandidateOutput;
  ElectionVote: ElectionVote;
  SingleElectionVoteInput: SingleElectionVoteInput;
  SingleElectionVoteOutput: SingleElectionVoteOutput;
  ElectionVoteDefaultViewInput: ElectionVoteDefaultViewInput;
  ElectionVotesAllSubmittedVotesInput: ElectionVotesAllSubmittedVotesInput;
  ElectionVoteSelector: ElectionVoteSelector;
  MultiElectionVoteInput: MultiElectionVoteInput;
  MultiElectionVoteOutput: MultiElectionVoteOutput;
  ElicitQuestionPrediction: ElicitQuestionPrediction;
  SingleElicitQuestionPredictionInput: SingleElicitQuestionPredictionInput;
  SingleElicitQuestionPredictionOutput: SingleElicitQuestionPredictionOutput;
  ElicitQuestionPredictionSelector: ElicitQuestionPredictionSelector;
  MultiElicitQuestionPredictionInput: MultiElicitQuestionPredictionInput;
  MultiElicitQuestionPredictionOutput: MultiElicitQuestionPredictionOutput;
  ElicitQuestion: ElicitQuestion;
  SingleElicitQuestionInput: SingleElicitQuestionInput;
  SingleElicitQuestionOutput: SingleElicitQuestionOutput;
  ElicitQuestionSelector: ElicitQuestionSelector;
  MultiElicitQuestionInput: MultiElicitQuestionInput;
  MultiElicitQuestionOutput: MultiElicitQuestionOutput;
  EmailTokens: EmailTokens;
  FeaturedResource: FeaturedResource;
  SingleFeaturedResourceInput: SingleFeaturedResourceInput;
  SingleFeaturedResourceOutput: SingleFeaturedResourceOutput;
  FeaturedResourceSelector: FeaturedResourceSelector;
  MultiFeaturedResourceInput: MultiFeaturedResourceInput;
  MultiFeaturedResourceOutput: MultiFeaturedResourceOutput;
  FieldChange: FieldChange;
  SingleFieldChangeInput: SingleFieldChangeInput;
  SingleFieldChangeOutput: SingleFieldChangeOutput;
  FieldChangeSelector: FieldChangeSelector;
  MultiFieldChangeInput: MultiFieldChangeInput;
  MultiFieldChangeOutput: MultiFieldChangeOutput;
  ForumEvent: ForumEvent;
  SingleForumEventInput: SingleForumEventInput;
  SingleForumEventOutput: SingleForumEventOutput;
  ForumEventsUpcomingForumEventsInput: ForumEventsUpcomingForumEventsInput;
  ForumEventsPastForumEventsInput: ForumEventsPastForumEventsInput;
  ForumEventsCurrentAndRecentForumEventsInput: ForumEventsCurrentAndRecentForumEventsInput;
  ForumEventSelector: ForumEventSelector;
  MultiForumEventInput: MultiForumEventInput;
  MultiForumEventOutput: MultiForumEventOutput;
  GardenCode: GardenCode;
  SingleGardenCodeInput: SingleGardenCodeInput;
  SingleGardenCodeOutput: SingleGardenCodeOutput;
  GardenCodeDefaultViewInput: GardenCodeDefaultViewInput;
  GardenCodesUsersPrivateGardenCodesInput: GardenCodesUsersPrivateGardenCodesInput;
  GardenCodesPublicGardenCodesInput: GardenCodesPublicGardenCodesInput;
  GardenCodesGardenCodeByCodeInput: GardenCodesGardenCodeByCodeInput;
  GardenCodeSelector: GardenCodeSelector;
  MultiGardenCodeInput: MultiGardenCodeInput;
  MultiGardenCodeOutput: MultiGardenCodeOutput;
  GoogleServiceAccountSession: GoogleServiceAccountSession;
  SingleGoogleServiceAccountSessionInput: SingleGoogleServiceAccountSessionInput;
  SingleGoogleServiceAccountSessionOutput: SingleGoogleServiceAccountSessionOutput;
  GoogleServiceAccountSessionSelector: GoogleServiceAccountSessionSelector;
  MultiGoogleServiceAccountSessionInput: MultiGoogleServiceAccountSessionInput;
  MultiGoogleServiceAccountSessionOutput: MultiGoogleServiceAccountSessionOutput;
  Images: Images;
  JargonTerm: JargonTerm;
  SingleJargonTermInput: SingleJargonTermInput;
  SingleJargonTermOutput: SingleJargonTermOutput;
  JargonTermsPostEditorJargonTermsInput: JargonTermsPostEditorJargonTermsInput;
  JargonTermsPostsApprovedJargonInput: JargonTermsPostsApprovedJargonInput;
  JargonTermSelector: JargonTermSelector;
  MultiJargonTermInput: MultiJargonTermInput;
  MultiJargonTermOutput: MultiJargonTermOutput;
  LWEvent: LWEvent;
  SingleLWEventInput: SingleLWEventInput;
  SingleLWEventOutput: SingleLWEventOutput;
  LWEventsAdminViewInput: LWEventsAdminViewInput;
  LWEventsPostVisitsInput: LWEventsPostVisitsInput;
  LWEventsEmailHistoryInput: LWEventsEmailHistoryInput;
  LWEventSelector: LWEventSelector;
  MultiLWEventInput: MultiLWEventInput;
  MultiLWEventOutput: MultiLWEventOutput;
  LegacyData: LegacyData;
  LlmConversation: LlmConversation;
  SingleLlmConversationInput: SingleLlmConversationInput;
  SingleLlmConversationOutput: SingleLlmConversationOutput;
  LlmConversationsLlmConversationsWithUserInput: LlmConversationsLlmConversationsWithUserInput;
  LlmConversationsLlmConversationsAllInput: LlmConversationsLlmConversationsAllInput;
  LlmConversationSelector: LlmConversationSelector;
  MultiLlmConversationInput: MultiLlmConversationInput;
  MultiLlmConversationOutput: MultiLlmConversationOutput;
  LlmMessage: LlmMessage;
  Localgroup: Localgroup;
  SingleLocalgroupInput: SingleLocalgroupInput;
  SingleLocalgroupOutput: SingleLocalgroupOutput;
  LocalgroupDefaultViewInput: LocalgroupDefaultViewInput;
  LocalgroupsUserOrganizesGroupsInput: LocalgroupsUserOrganizesGroupsInput;
  LocalgroupsUserActiveGroupsInput: LocalgroupsUserActiveGroupsInput;
  LocalgroupsUserInactiveGroupsInput: LocalgroupsUserInactiveGroupsInput;
  LocalgroupsAllInput: LocalgroupsAllInput;
  LocalgroupsNearbyInput: LocalgroupsNearbyInput;
  LocalgroupsSingleInput: LocalgroupsSingleInput;
  LocalgroupsLocalInput: LocalgroupsLocalInput;
  LocalgroupsOnlineInput: LocalgroupsOnlineInput;
  LocalgroupSelector: LocalgroupSelector;
  MultiLocalgroupInput: MultiLocalgroupInput;
  MultiLocalgroupOutput: MultiLocalgroupOutput;
  ManifoldProbabilitiesCache: ManifoldProbabilitiesCache;
  Message: Message;
  SingleMessageInput: SingleMessageInput;
  SingleMessageOutput: SingleMessageOutput;
  MessagesMessagesConversationInput: MessagesMessagesConversationInput;
  MessagesConversationPreviewInput: MessagesConversationPreviewInput;
  MessageSelector: MessageSelector;
  MultiMessageInput: MultiMessageInput;
  MultiMessageOutput: MultiMessageOutput;
  Migration: Migration;
  ModerationTemplate: ModerationTemplate;
  SingleModerationTemplateInput: SingleModerationTemplateInput;
  SingleModerationTemplateOutput: SingleModerationTemplateOutput;
  ModerationTemplatesModerationTemplatesListInput: ModerationTemplatesModerationTemplatesListInput;
  ModerationTemplateSelector: ModerationTemplateSelector;
  MultiModerationTemplateInput: MultiModerationTemplateInput;
  MultiModerationTemplateOutput: MultiModerationTemplateOutput;
  ModeratorAction: ModeratorAction;
  SingleModeratorActionInput: SingleModeratorActionInput;
  SingleModeratorActionOutput: SingleModeratorActionOutput;
  ModeratorActionsUserModeratorActionsInput: ModeratorActionsUserModeratorActionsInput;
  ModeratorActionSelector: ModeratorActionSelector;
  MultiModeratorActionInput: MultiModeratorActionInput;
  MultiModeratorActionOutput: MultiModeratorActionOutput;
  MultiDocument: MultiDocument;
  SingleMultiDocumentInput: SingleMultiDocumentInput;
  SingleMultiDocumentOutput: SingleMultiDocumentOutput;
  MultiDocumentDefaultViewInput: MultiDocumentDefaultViewInput;
  MultiDocumentsLensBySlugInput: MultiDocumentsLensBySlugInput;
  MultiDocumentsSummariesByParentIdInput: MultiDocumentsSummariesByParentIdInput;
  MultiDocumentsPingbackLensPagesInput: MultiDocumentsPingbackLensPagesInput;
  MultiDocumentSelector: MultiDocumentSelector;
  MultiMultiDocumentInput: MultiMultiDocumentInput;
  MultiMultiDocumentOutput: MultiMultiDocumentOutput;
  Notification: Notification;
  SingleNotificationInput: SingleNotificationInput;
  SingleNotificationOutput: SingleNotificationOutput;
  NotificationsUserNotificationsInput: NotificationsUserNotificationsInput;
  NotificationsUnreadUserNotificationsInput: NotificationsUnreadUserNotificationsInput;
  NotificationsAdminAlertNotificationsInput: NotificationsAdminAlertNotificationsInput;
  NotificationSelector: NotificationSelector;
  MultiNotificationInput: MultiNotificationInput;
  MultiNotificationOutput: MultiNotificationOutput;
  PageCacheEntry: PageCacheEntry;
  PetrovDayAction: PetrovDayAction;
  SinglePetrovDayActionInput: SinglePetrovDayActionInput;
  SinglePetrovDayActionOutput: SinglePetrovDayActionOutput;
  PetrovDayActionsGetActionInput: PetrovDayActionsGetActionInput;
  PetrovDayActionsLaunchDashboardInput: PetrovDayActionsLaunchDashboardInput;
  PetrovDayActionsWarningConsoleInput: PetrovDayActionsWarningConsoleInput;
  PetrovDayActionSelector: PetrovDayActionSelector;
  MultiPetrovDayActionInput: MultiPetrovDayActionInput;
  MultiPetrovDayActionOutput: MultiPetrovDayActionOutput;
  PetrovDayLaunch: PetrovDayLaunch;
  PodcastEpisode: PodcastEpisode;
  SinglePodcastEpisodeInput: SinglePodcastEpisodeInput;
  SinglePodcastEpisodeOutput: SinglePodcastEpisodeOutput;
  PodcastEpisodeByExternalIdInput: PodcastEpisodeByExternalIdInput;
  PodcastEpisodeSelector: PodcastEpisodeSelector;
  MultiPodcastEpisodeInput: MultiPodcastEpisodeInput;
  MultiPodcastEpisodeOutput: MultiPodcastEpisodeOutput;
  Podcast: Podcast;
  SinglePodcastInput: SinglePodcastInput;
  SinglePodcastOutput: SinglePodcastOutput;
  PodcastSelector: PodcastSelector;
  MultiPodcastInput: MultiPodcastInput;
  MultiPodcastOutput: MultiPodcastOutput;
  PostRecommendation: PostRecommendation;
  PostRelation: PostRelation;
  SinglePostRelationInput: SinglePostRelationInput;
  SinglePostRelationOutput: SinglePostRelationOutput;
  PostRelationsAllPostRelationsInput: PostRelationsAllPostRelationsInput;
  PostRelationSelector: PostRelationSelector;
  MultiPostRelationInput: MultiPostRelationInput;
  MultiPostRelationOutput: MultiPostRelationOutput;
  Post: Post;
  SinglePostInput: SinglePostInput;
  SinglePostOutput: SinglePostOutput;
  PostDefaultViewInput: PostDefaultViewInput;
  PostsUserPostsInput: PostsUserPostsInput;
  PostsMagicInput: PostsMagicInput;
  PostsTopInput: PostsTopInput;
  PostsNewInput: PostsNewInput;
  PostsRecentCommentsInput: PostsRecentCommentsInput;
  PostsOldInput: PostsOldInput;
  PostsTimeframeInput: PostsTimeframeInput;
  PostsDailyInput: PostsDailyInput;
  PostsTagRelevanceInput: PostsTagRelevanceInput;
  PostsFrontpageInput: PostsFrontpageInput;
  PostsFrontpageRssInput: PostsFrontpageRssInput;
  PostsCuratedInput: PostsCuratedInput;
  PostsCuratedRssInput: PostsCuratedRssInput;
  PostsCommunityInput: PostsCommunityInput;
  PostsCommunityRssInput: PostsCommunityRssInput;
  PostsMetaRssInput: PostsMetaRssInput;
  PostsRssInput: PostsRssInput;
  PostsTopQuestionsInput: PostsTopQuestionsInput;
  PostsRecentQuestionActivityInput: PostsRecentQuestionActivityInput;
  PostsScheduledInput: PostsScheduledInput;
  PostsRejectedInput: PostsRejectedInput;
  PostsDraftsInput: PostsDraftsInput;
  PostsAll_draftsInput: PostsAll_draftsInput;
  PostsUnlistedInput: PostsUnlistedInput;
  PostsUserAFSubmissionsInput: PostsUserAFSubmissionsInput;
  PostsSlugPostInput: PostsSlugPostInput;
  PostsLegacyIdPostInput: PostsLegacyIdPostInput;
  PostsRecentDiscussionThreadsListInput: PostsRecentDiscussionThreadsListInput;
  PostsAfRecentDiscussionThreadsListInput: PostsAfRecentDiscussionThreadsListInput;
  PostsReviewRecentDiscussionThreadsList2018Input: PostsReviewRecentDiscussionThreadsList2018Input;
  PostsReviewRecentDiscussionThreadsList2019Input: PostsReviewRecentDiscussionThreadsList2019Input;
  PostsGlobalEventsInput: PostsGlobalEventsInput;
  PostsNearbyEventsInput: PostsNearbyEventsInput;
  PostsEventsInput: PostsEventsInput;
  PostsEventsInTimeRangeInput: PostsEventsInTimeRangeInput;
  PostsUpcomingEventsInput: PostsUpcomingEventsInput;
  PostsPastEventsInput: PostsPastEventsInput;
  PostsTbdEventsInput: PostsTbdEventsInput;
  PostsNonEventGroupPostsInput: PostsNonEventGroupPostsInput;
  PostsPostsWithBannedUsersInput: PostsPostsWithBannedUsersInput;
  PostsCommunityResourcePostsInput: PostsCommunityResourcePostsInput;
  PostsSunshineNewPostsInput: PostsSunshineNewPostsInput;
  PostsSunshineNewUsersPostsInput: PostsSunshineNewUsersPostsInput;
  PostsSunshineCuratedSuggestionsInput: PostsSunshineCuratedSuggestionsInput;
  PostsHasEverDialoguedInput: PostsHasEverDialoguedInput;
  PostsPingbackPostsInput: PostsPingbackPostsInput;
  PostsNominations2018Input: PostsNominations2018Input;
  PostsNominations2019Input: PostsNominations2019Input;
  PostsReviews2018Input: PostsReviews2018Input;
  PostsReviews2019Input: PostsReviews2019Input;
  PostsVoting2019Input: PostsVoting2019Input;
  PostsStickiedInput: PostsStickiedInput;
  PostsNominatablePostsByVoteInput: PostsNominatablePostsByVoteInput;
  PostsReviewVotingInput: PostsReviewVotingInput;
  PostsFrontpageReviewWidgetInput: PostsFrontpageReviewWidgetInput;
  PostsReviewQuickPageInput: PostsReviewQuickPageInput;
  PostsReviewFinalVotingInput: PostsReviewFinalVotingInput;
  PostsMyBookmarkedPostsInput: PostsMyBookmarkedPostsInput;
  PostsAlignmentSuggestedPostsInput: PostsAlignmentSuggestedPostsInput;
  PostsCurrentOpenThreadInput: PostsCurrentOpenThreadInput;
  PostSelector: PostSelector;
  MultiPostInput: MultiPostInput;
  MultiPostOutput: MultiPostOutput;
  RSSFeed: RSSFeed;
  SingleRSSFeedInput: SingleRSSFeedInput;
  SingleRSSFeedOutput: SingleRSSFeedOutput;
  RSSFeedsUsersFeedInput: RSSFeedsUsersFeedInput;
  RSSFeedSelector: RSSFeedSelector;
  MultiRSSFeedInput: MultiRSSFeedInput;
  MultiRSSFeedOutput: MultiRSSFeedOutput;
  ReadStatus: ReadStatus;
  RecommendationsCache: RecommendationsCache;
  Report: Report;
  SingleReportInput: SingleReportInput;
  SingleReportOutput: SingleReportOutput;
  ReportsAdminClaimedReportsInput: ReportsAdminClaimedReportsInput;
  ReportSelector: ReportSelector;
  MultiReportInput: MultiReportInput;
  MultiReportOutput: MultiReportOutput;
  ReviewVote: ReviewVote;
  SingleReviewVoteInput: SingleReviewVoteInput;
  SingleReviewVoteOutput: SingleReviewVoteOutput;
  ReviewVotesReviewVotesFromUserInput: ReviewVotesReviewVotesFromUserInput;
  ReviewVotesReviewVotesAdminDashboardInput: ReviewVotesReviewVotesAdminDashboardInput;
  ReviewVotesReviewVotesForPostAndUserInput: ReviewVotesReviewVotesForPostAndUserInput;
  ReviewVoteSelector: ReviewVoteSelector;
  MultiReviewVoteInput: MultiReviewVoteInput;
  MultiReviewVoteOutput: MultiReviewVoteOutput;
  ReviewWinnerArt: ReviewWinnerArt;
  SingleReviewWinnerArtInput: SingleReviewWinnerArtInput;
  SingleReviewWinnerArtOutput: SingleReviewWinnerArtOutput;
  ReviewWinnerArtsPostArtInput: ReviewWinnerArtsPostArtInput;
  ReviewWinnerArtsAllForYearInput: ReviewWinnerArtsAllForYearInput;
  ReviewWinnerArtSelector: ReviewWinnerArtSelector;
  MultiReviewWinnerArtInput: MultiReviewWinnerArtInput;
  MultiReviewWinnerArtOutput: MultiReviewWinnerArtOutput;
  ReviewWinner: ReviewWinner;
  SingleReviewWinnerInput: SingleReviewWinnerInput;
  SingleReviewWinnerOutput: SingleReviewWinnerOutput;
  ReviewWinnersReviewWinnerSingleInput: ReviewWinnersReviewWinnerSingleInput;
  ReviewWinnerSelector: ReviewWinnerSelector;
  MultiReviewWinnerInput: MultiReviewWinnerInput;
  MultiReviewWinnerOutput: MultiReviewWinnerOutput;
  Revision: Revision;
  SingleRevisionInput: SingleRevisionInput;
  SingleRevisionOutput: SingleRevisionOutput;
  RevisionsRevisionsByUserInput: RevisionsRevisionsByUserInput;
  RevisionsRevisionsOnDocumentInput: RevisionsRevisionsOnDocumentInput;
  RevisionsRevisionByVersionNumberInput: RevisionsRevisionByVersionNumberInput;
  RevisionSelector: RevisionSelector;
  MultiRevisionInput: MultiRevisionInput;
  MultiRevisionOutput: MultiRevisionOutput;
  Sequence: Sequence;
  SingleSequenceInput: SingleSequenceInput;
  SingleSequenceOutput: SingleSequenceOutput;
  SequenceDefaultViewInput: SequenceDefaultViewInput;
  SequencesUserProfileInput: SequencesUserProfileInput;
  SequencesUserProfilePrivateInput: SequencesUserProfilePrivateInput;
  SequencesUserProfileAllInput: SequencesUserProfileAllInput;
  SequencesCuratedSequencesInput: SequencesCuratedSequencesInput;
  SequencesCommunitySequencesInput: SequencesCommunitySequencesInput;
  SequenceSelector: SequenceSelector;
  MultiSequenceInput: MultiSequenceInput;
  MultiSequenceOutput: MultiSequenceOutput;
  Session: Session;
  SideCommentCache: SideCommentCache;
  SplashArtCoordinate: SplashArtCoordinate;
  SingleSplashArtCoordinateInput: SingleSplashArtCoordinateInput;
  SingleSplashArtCoordinateOutput: SingleSplashArtCoordinateOutput;
  SplashArtCoordinateSelector: SplashArtCoordinateSelector;
  MultiSplashArtCoordinateInput: MultiSplashArtCoordinateInput;
  MultiSplashArtCoordinateOutput: MultiSplashArtCoordinateOutput;
  Spotlight: Spotlight;
  SingleSpotlightInput: SingleSpotlightInput;
  SingleSpotlightOutput: SingleSpotlightOutput;
  SpotlightsMostRecentlyPromotedSpotlightsInput: SpotlightsMostRecentlyPromotedSpotlightsInput;
  SpotlightsSpotlightsPageInput: SpotlightsSpotlightsPageInput;
  SpotlightsSpotlightsPageDraftInput: SpotlightsSpotlightsPageDraftInput;
  SpotlightsSpotlightsByDocumentIdsInput: SpotlightsSpotlightsByDocumentIdsInput;
  SpotlightsSpotlightsByIdInput: SpotlightsSpotlightsByIdInput;
  SpotlightSelector: SpotlightSelector;
  MultiSpotlightInput: MultiSpotlightInput;
  MultiSpotlightOutput: MultiSpotlightOutput;
  Subscription: Subscription;
  SingleSubscriptionInput: SingleSubscriptionInput;
  SingleSubscriptionOutput: SingleSubscriptionOutput;
  SubscriptionsSubscriptionStateInput: SubscriptionsSubscriptionStateInput;
  SubscriptionsSubscriptionsOfTypeInput: SubscriptionsSubscriptionsOfTypeInput;
  SubscriptionsMembersOfGroupInput: SubscriptionsMembersOfGroupInput;
  SubscriptionSelector: SubscriptionSelector;
  MultiSubscriptionInput: MultiSubscriptionInput;
  MultiSubscriptionOutput: MultiSubscriptionOutput;
  SurveyQuestion: SurveyQuestion;
  SingleSurveyQuestionInput: SingleSurveyQuestionInput;
  SingleSurveyQuestionOutput: SingleSurveyQuestionOutput;
  SurveyQuestionSelector: SurveyQuestionSelector;
  MultiSurveyQuestionInput: MultiSurveyQuestionInput;
  MultiSurveyQuestionOutput: MultiSurveyQuestionOutput;
  SurveyResponse: SurveyResponse;
  SingleSurveyResponseInput: SingleSurveyResponseInput;
  SingleSurveyResponseOutput: SingleSurveyResponseOutput;
  SurveyResponseSelector: SurveyResponseSelector;
  MultiSurveyResponseInput: MultiSurveyResponseInput;
  MultiSurveyResponseOutput: MultiSurveyResponseOutput;
  SurveySchedule: SurveySchedule;
  SingleSurveyScheduleInput: SingleSurveyScheduleInput;
  SingleSurveyScheduleOutput: SingleSurveyScheduleOutput;
  SurveyScheduleSelector: SurveyScheduleSelector;
  MultiSurveyScheduleInput: MultiSurveyScheduleInput;
  MultiSurveyScheduleOutput: MultiSurveyScheduleOutput;
  Survey: Survey;
  SingleSurveyInput: SingleSurveyInput;
  SingleSurveyOutput: SingleSurveyOutput;
  SurveySelector: SurveySelector;
  MultiSurveyInput: MultiSurveyInput;
  MultiSurveyOutput: MultiSurveyOutput;
  TagFlag: TagFlag;
  SingleTagFlagInput: SingleTagFlagInput;
  SingleTagFlagOutput: SingleTagFlagOutput;
  TagFlagSelector: TagFlagSelector;
  MultiTagFlagInput: MultiTagFlagInput;
  MultiTagFlagOutput: MultiTagFlagOutput;
  TagRel: TagRel;
  SingleTagRelInput: SingleTagRelInput;
  SingleTagRelOutput: SingleTagRelOutput;
  TagRelsPostsWithTagInput: TagRelsPostsWithTagInput;
  TagRelsTagsOnPostInput: TagRelsTagsOnPostInput;
  TagRelSelector: TagRelSelector;
  MultiTagRelInput: MultiTagRelInput;
  MultiTagRelOutput: MultiTagRelOutput;
  Tag: Tag;
  SingleTagInput: SingleTagInput;
  SingleTagOutput: SingleTagOutput;
  TagDefaultViewInput: TagDefaultViewInput;
  TagsTagsByTagIdsInput: TagsTagsByTagIdsInput;
  TagsAllTagsAlphabeticalInput: TagsAllTagsAlphabeticalInput;
  TagsUserTagsInput: TagsUserTagsInput;
  TagsCurrentUserSubforumsInput: TagsCurrentUserSubforumsInput;
  TagsAllPagesByNewestInput: TagsAllPagesByNewestInput;
  TagsAllTagsHierarchicalInput: TagsAllTagsHierarchicalInput;
  TagsTagBySlugInput: TagsTagBySlugInput;
  TagsTagsBySlugsInput: TagsTagsBySlugsInput;
  TagsCoreTagsInput: TagsCoreTagsInput;
  TagsPostTypeTagsInput: TagsPostTypeTagsInput;
  TagsCoreAndSubforumTagsInput: TagsCoreAndSubforumTagsInput;
  TagsNewTagsInput: TagsNewTagsInput;
  TagsUnreviewedTagsInput: TagsUnreviewedTagsInput;
  TagsSuggestedFilterTagsInput: TagsSuggestedFilterTagsInput;
  TagsAllLWWikiTagsInput: TagsAllLWWikiTagsInput;
  TagsUnprocessedLWWikiTagsInput: TagsUnprocessedLWWikiTagsInput;
  TagsTagsByTagFlagInput: TagsTagsByTagFlagInput;
  TagsAllPublicTagsInput: TagsAllPublicTagsInput;
  TagsAllArbitalTagsInput: TagsAllArbitalTagsInput;
  TagsPingbackWikiPagesInput: TagsPingbackWikiPagesInput;
  TagSelector: TagSelector;
  MultiTagInput: MultiTagInput;
  MultiTagOutput: MultiTagOutput;
  Tweet: Tweet;
  TypingIndicator: TypingIndicator;
  SingleTypingIndicatorInput: SingleTypingIndicatorInput;
  SingleTypingIndicatorOutput: SingleTypingIndicatorOutput;
  TypingIndicatorSelector: TypingIndicatorSelector;
  MultiTypingIndicatorInput: MultiTypingIndicatorInput;
  MultiTypingIndicatorOutput: MultiTypingIndicatorOutput;
  UltraFeedEvent: UltraFeedEvent;
  SingleUltraFeedEventInput: SingleUltraFeedEventInput;
  SingleUltraFeedEventOutput: SingleUltraFeedEventOutput;
  UltraFeedEventSelector: UltraFeedEventSelector;
  MultiUltraFeedEventInput: MultiUltraFeedEventInput;
  MultiUltraFeedEventOutput: MultiUltraFeedEventOutput;
  UserActivity: UserActivity;
  UserEAGDetail: UserEAGDetail;
  SingleUserEAGDetailInput: SingleUserEAGDetailInput;
  SingleUserEAGDetailOutput: SingleUserEAGDetailOutput;
  UserEAGDetailsDataByUserInput: UserEAGDetailsDataByUserInput;
  UserEAGDetailSelector: UserEAGDetailSelector;
  MultiUserEAGDetailInput: MultiUserEAGDetailInput;
  MultiUserEAGDetailOutput: MultiUserEAGDetailOutput;
  UserJobAd: UserJobAd;
  SingleUserJobAdInput: SingleUserJobAdInput;
  SingleUserJobAdOutput: SingleUserJobAdOutput;
  UserJobAdsAdsByUserInput: UserJobAdsAdsByUserInput;
  UserJobAdSelector: UserJobAdSelector;
  MultiUserJobAdInput: MultiUserJobAdInput;
  MultiUserJobAdOutput: MultiUserJobAdOutput;
  UserMostValuablePost: UserMostValuablePost;
  SingleUserMostValuablePostInput: SingleUserMostValuablePostInput;
  SingleUserMostValuablePostOutput: SingleUserMostValuablePostOutput;
  UserMostValuablePostsCurrentUserPostInput: UserMostValuablePostsCurrentUserPostInput;
  UserMostValuablePostSelector: UserMostValuablePostSelector;
  MultiUserMostValuablePostInput: MultiUserMostValuablePostInput;
  MultiUserMostValuablePostOutput: MultiUserMostValuablePostOutput;
  UserRateLimit: UserRateLimit;
  SingleUserRateLimitInput: SingleUserRateLimitInput;
  SingleUserRateLimitOutput: SingleUserRateLimitOutput;
  UserRateLimitsUserRateLimitsInput: UserRateLimitsUserRateLimitsInput;
  UserRateLimitSelector: UserRateLimitSelector;
  MultiUserRateLimitInput: MultiUserRateLimitInput;
  MultiUserRateLimitOutput: MultiUserRateLimitOutput;
  UserTagRel: UserTagRel;
  SingleUserTagRelInput: SingleUserTagRelInput;
  SingleUserTagRelOutput: SingleUserTagRelOutput;
  UserTagRelsSingleInput: UserTagRelsSingleInput;
  UserTagRelSelector: UserTagRelSelector;
  MultiUserTagRelInput: MultiUserTagRelInput;
  MultiUserTagRelOutput: MultiUserTagRelOutput;
  User: User;
  UserSelectorUniqueInput: UserSelectorUniqueInput;
  SingleUserInput: SingleUserInput;
  SingleUserOutput: SingleUserOutput;
  UsersUsersByUserIdsInput: UsersUsersByUserIdsInput;
  UsersUsersProfileInput: UsersUsersProfileInput;
  UsersTagCommunityMembersInput: UsersTagCommunityMembersInput;
  UserSelector: UserSelector;
  MultiUserInput: MultiUserInput;
  MultiUserOutput: MultiUserOutput;
  Vote: Vote;
  SingleVoteInput: SingleVoteInput;
  SingleVoteOutput: SingleVoteOutput;
  VotesUserPostVotesInput: VotesUserPostVotesInput;
  VotesUserVotesInput: VotesUserVotesInput;
  VoteSelector: VoteSelector;
  MultiVoteInput: MultiVoteInput;
  MultiVoteOutput: MultiVoteOutput;
  CreateAdvisorRequestDataInput: CreateAdvisorRequestDataInput;
  CreateAdvisorRequestInput: CreateAdvisorRequestInput;
  UpdateAdvisorRequestDataInput: UpdateAdvisorRequestDataInput;
  UpdateAdvisorRequestInput: UpdateAdvisorRequestInput;
  AdvisorRequestOutput: AdvisorRequestOutput;
  CreateBookDataInput: CreateBookDataInput;
  CreateBookInput: CreateBookInput;
  UpdateBookDataInput: UpdateBookDataInput;
  UpdateBookInput: UpdateBookInput;
  BookOutput: BookOutput;
  CreateChapterDataInput: CreateChapterDataInput;
  CreateChapterInput: CreateChapterInput;
  UpdateChapterDataInput: UpdateChapterDataInput;
  UpdateChapterInput: UpdateChapterInput;
  ChapterOutput: ChapterOutput;
  CreateCollectionDataInput: CreateCollectionDataInput;
  CreateCollectionInput: CreateCollectionInput;
  UpdateCollectionDataInput: UpdateCollectionDataInput;
  UpdateCollectionInput: UpdateCollectionInput;
  CollectionOutput: CollectionOutput;
  CreateCommentModeratorActionDataInput: CreateCommentModeratorActionDataInput;
  CreateCommentModeratorActionInput: CreateCommentModeratorActionInput;
  UpdateCommentModeratorActionDataInput: UpdateCommentModeratorActionDataInput;
  UpdateCommentModeratorActionInput: UpdateCommentModeratorActionInput;
  CommentModeratorActionOutput: CommentModeratorActionOutput;
  CreateCommentDataInput: CreateCommentDataInput;
  CreateCommentInput: CreateCommentInput;
  UpdateCommentDataInput: UpdateCommentDataInput;
  UpdateCommentInput: UpdateCommentInput;
  CommentOutput: CommentOutput;
  CreateConversationDataInput: CreateConversationDataInput;
  CreateConversationInput: CreateConversationInput;
  UpdateConversationDataInput: UpdateConversationDataInput;
  UpdateConversationInput: UpdateConversationInput;
  ConversationOutput: ConversationOutput;
  CreateCurationNoticeDataInput: CreateCurationNoticeDataInput;
  CreateCurationNoticeInput: CreateCurationNoticeInput;
  UpdateCurationNoticeDataInput: UpdateCurationNoticeDataInput;
  UpdateCurationNoticeInput: UpdateCurationNoticeInput;
  CurationNoticeOutput: CurationNoticeOutput;
  CreateDigestPostDataInput: CreateDigestPostDataInput;
  CreateDigestPostInput: CreateDigestPostInput;
  UpdateDigestPostDataInput: UpdateDigestPostDataInput;
  UpdateDigestPostInput: UpdateDigestPostInput;
  DigestPostOutput: DigestPostOutput;
  CreateDigestDataInput: CreateDigestDataInput;
  CreateDigestInput: CreateDigestInput;
  UpdateDigestDataInput: UpdateDigestDataInput;
  UpdateDigestInput: UpdateDigestInput;
  DigestOutput: DigestOutput;
  CreateElectionCandidateDataInput: CreateElectionCandidateDataInput;
  CreateElectionCandidateInput: CreateElectionCandidateInput;
  UpdateElectionCandidateDataInput: UpdateElectionCandidateDataInput;
  UpdateElectionCandidateInput: UpdateElectionCandidateInput;
  ElectionCandidateOutput: ElectionCandidateOutput;
  CreateElectionVoteDataInput: CreateElectionVoteDataInput;
  CreateElectionVoteInput: CreateElectionVoteInput;
  UpdateElectionVoteDataInput: UpdateElectionVoteDataInput;
  UpdateElectionVoteInput: UpdateElectionVoteInput;
  ElectionVoteOutput: ElectionVoteOutput;
  CreateElicitQuestionDataInput: CreateElicitQuestionDataInput;
  CreateElicitQuestionInput: CreateElicitQuestionInput;
  UpdateElicitQuestionDataInput: UpdateElicitQuestionDataInput;
  UpdateElicitQuestionInput: UpdateElicitQuestionInput;
  ElicitQuestionOutput: ElicitQuestionOutput;
  CreateForumEventDataInput: CreateForumEventDataInput;
  CreateForumEventInput: CreateForumEventInput;
  UpdateForumEventDataInput: UpdateForumEventDataInput;
  UpdateForumEventInput: UpdateForumEventInput;
  ForumEventOutput: ForumEventOutput;
  CreateJargonTermDataInput: CreateJargonTermDataInput;
  CreateJargonTermInput: CreateJargonTermInput;
  UpdateJargonTermDataInput: UpdateJargonTermDataInput;
  UpdateJargonTermInput: UpdateJargonTermInput;
  JargonTermOutput: JargonTermOutput;
  CreateLWEventDataInput: CreateLWEventDataInput;
  CreateLWEventInput: CreateLWEventInput;
  LWEventOutput: LWEventOutput;
  UpdateLlmConversationDataInput: UpdateLlmConversationDataInput;
  UpdateLlmConversationInput: UpdateLlmConversationInput;
  LlmConversationOutput: LlmConversationOutput;
  CreateLocalgroupDataInput: CreateLocalgroupDataInput;
  CreateLocalgroupInput: CreateLocalgroupInput;
  UpdateLocalgroupDataInput: UpdateLocalgroupDataInput;
  UpdateLocalgroupInput: UpdateLocalgroupInput;
  LocalgroupOutput: LocalgroupOutput;
  CreateMessageDataInput: CreateMessageDataInput;
  CreateMessageInput: CreateMessageInput;
  UpdateMessageDataInput: UpdateMessageDataInput;
  UpdateMessageInput: UpdateMessageInput;
  MessageOutput: MessageOutput;
  CreateModerationTemplateDataInput: CreateModerationTemplateDataInput;
  CreateModerationTemplateInput: CreateModerationTemplateInput;
  UpdateModerationTemplateDataInput: UpdateModerationTemplateDataInput;
  UpdateModerationTemplateInput: UpdateModerationTemplateInput;
  ModerationTemplateOutput: ModerationTemplateOutput;
  CreateModeratorActionDataInput: CreateModeratorActionDataInput;
  CreateModeratorActionInput: CreateModeratorActionInput;
  UpdateModeratorActionDataInput: UpdateModeratorActionDataInput;
  UpdateModeratorActionInput: UpdateModeratorActionInput;
  ModeratorActionOutput: ModeratorActionOutput;
  CreateMultiDocumentDataInput: CreateMultiDocumentDataInput;
  CreateMultiDocumentInput: CreateMultiDocumentInput;
  UpdateMultiDocumentDataInput: UpdateMultiDocumentDataInput;
  UpdateMultiDocumentInput: UpdateMultiDocumentInput;
  MultiDocumentOutput: MultiDocumentOutput;
  UpdateNotificationDataInput: UpdateNotificationDataInput;
  UpdateNotificationInput: UpdateNotificationInput;
  NotificationOutput: NotificationOutput;
  CreatePetrovDayActionDataInput: CreatePetrovDayActionDataInput;
  CreatePetrovDayActionInput: CreatePetrovDayActionInput;
  PetrovDayActionOutput: PetrovDayActionOutput;
  CreatePodcastEpisodeDataInput: CreatePodcastEpisodeDataInput;
  CreatePodcastEpisodeInput: CreatePodcastEpisodeInput;
  PodcastEpisodeOutput: PodcastEpisodeOutput;
  CreatePostDataInput: CreatePostDataInput;
  CreatePostInput: CreatePostInput;
  UpdatePostDataInput: UpdatePostDataInput;
  UpdatePostInput: UpdatePostInput;
  PostOutput: PostOutput;
  CreateRSSFeedDataInput: CreateRSSFeedDataInput;
  CreateRSSFeedInput: CreateRSSFeedInput;
  UpdateRSSFeedDataInput: UpdateRSSFeedDataInput;
  UpdateRSSFeedInput: UpdateRSSFeedInput;
  RSSFeedOutput: RSSFeedOutput;
  CreateReportDataInput: CreateReportDataInput;
  CreateReportInput: CreateReportInput;
  UpdateReportDataInput: UpdateReportDataInput;
  UpdateReportInput: UpdateReportInput;
  ReportOutput: ReportOutput;
  ContentTypeInput: ContentTypeInput;
  CreateRevisionDataInput: CreateRevisionDataInput;
  UpdateRevisionDataInput: UpdateRevisionDataInput;
  UpdateRevisionInput: UpdateRevisionInput;
  RevisionOutput: RevisionOutput;
  CreateSequenceDataInput: CreateSequenceDataInput;
  CreateSequenceInput: CreateSequenceInput;
  UpdateSequenceDataInput: UpdateSequenceDataInput;
  UpdateSequenceInput: UpdateSequenceInput;
  SequenceOutput: SequenceOutput;
  CreateSplashArtCoordinateDataInput: CreateSplashArtCoordinateDataInput;
  CreateSplashArtCoordinateInput: CreateSplashArtCoordinateInput;
  SplashArtCoordinateOutput: SplashArtCoordinateOutput;
  CreateSpotlightDataInput: CreateSpotlightDataInput;
  CreateSpotlightInput: CreateSpotlightInput;
  UpdateSpotlightDataInput: UpdateSpotlightDataInput;
  UpdateSpotlightInput: UpdateSpotlightInput;
  SpotlightOutput: SpotlightOutput;
  CreateSubscriptionDataInput: CreateSubscriptionDataInput;
  CreateSubscriptionInput: CreateSubscriptionInput;
  SubscriptionOutput: SubscriptionOutput;
  CreateSurveyQuestionDataInput: CreateSurveyQuestionDataInput;
  CreateSurveyQuestionInput: CreateSurveyQuestionInput;
  UpdateSurveyQuestionDataInput: UpdateSurveyQuestionDataInput;
  UpdateSurveyQuestionInput: UpdateSurveyQuestionInput;
  SurveyQuestionOutput: SurveyQuestionOutput;
  CreateSurveyResponseDataInput: CreateSurveyResponseDataInput;
  CreateSurveyResponseInput: CreateSurveyResponseInput;
  UpdateSurveyResponseDataInput: UpdateSurveyResponseDataInput;
  UpdateSurveyResponseInput: UpdateSurveyResponseInput;
  SurveyResponseOutput: SurveyResponseOutput;
  CreateSurveyScheduleDataInput: CreateSurveyScheduleDataInput;
  CreateSurveyScheduleInput: CreateSurveyScheduleInput;
  UpdateSurveyScheduleDataInput: UpdateSurveyScheduleDataInput;
  UpdateSurveyScheduleInput: UpdateSurveyScheduleInput;
  SurveyScheduleOutput: SurveyScheduleOutput;
  CreateSurveyDataInput: CreateSurveyDataInput;
  CreateSurveyInput: CreateSurveyInput;
  UpdateSurveyDataInput: UpdateSurveyDataInput;
  UpdateSurveyInput: UpdateSurveyInput;
  SurveyOutput: SurveyOutput;
  CreateTagFlagDataInput: CreateTagFlagDataInput;
  CreateTagFlagInput: CreateTagFlagInput;
  UpdateTagFlagDataInput: UpdateTagFlagDataInput;
  UpdateTagFlagInput: UpdateTagFlagInput;
  TagFlagOutput: TagFlagOutput;
  CreateTagDataInput: CreateTagDataInput;
  CreateTagInput: CreateTagInput;
  UpdateTagDataInput: UpdateTagDataInput;
  UpdateTagInput: UpdateTagInput;
  TagOutput: TagOutput;
  CreateUltraFeedEventDataInput: CreateUltraFeedEventDataInput;
  CreateUltraFeedEventInput: CreateUltraFeedEventInput;
  UpdateUltraFeedEventDataInput: UpdateUltraFeedEventDataInput;
  UltraFeedEventOutput: UltraFeedEventOutput;
  CreateUserEAGDetailDataInput: CreateUserEAGDetailDataInput;
  CreateUserEAGDetailInput: CreateUserEAGDetailInput;
  UpdateUserEAGDetailDataInput: UpdateUserEAGDetailDataInput;
  UpdateUserEAGDetailInput: UpdateUserEAGDetailInput;
  UserEAGDetailOutput: UserEAGDetailOutput;
  CreateUserJobAdDataInput: CreateUserJobAdDataInput;
  CreateUserJobAdInput: CreateUserJobAdInput;
  UpdateUserJobAdDataInput: UpdateUserJobAdDataInput;
  UpdateUserJobAdInput: UpdateUserJobAdInput;
  UserJobAdOutput: UserJobAdOutput;
  CreateUserMostValuablePostDataInput: CreateUserMostValuablePostDataInput;
  CreateUserMostValuablePostInput: CreateUserMostValuablePostInput;
  UpdateUserMostValuablePostDataInput: UpdateUserMostValuablePostDataInput;
  UpdateUserMostValuablePostInput: UpdateUserMostValuablePostInput;
  UserMostValuablePostOutput: UserMostValuablePostOutput;
  CreateUserRateLimitDataInput: CreateUserRateLimitDataInput;
  CreateUserRateLimitInput: CreateUserRateLimitInput;
  UpdateUserRateLimitDataInput: UpdateUserRateLimitDataInput;
  UpdateUserRateLimitInput: UpdateUserRateLimitInput;
  UserRateLimitOutput: UserRateLimitOutput;
  CreateUserTagRelDataInput: CreateUserTagRelDataInput;
  CreateUserTagRelInput: CreateUserTagRelInput;
  UpdateUserTagRelDataInput: UpdateUserTagRelDataInput;
  UpdateUserTagRelInput: UpdateUserTagRelInput;
  UserTagRelOutput: UserTagRelOutput;
  CreateUserDataInput: CreateUserDataInput;
  CreateUserInput: CreateUserInput;
  UpdateUserDataInput: UpdateUserDataInput;
  UpdateUserInput: UpdateUserInput;
  UserOutput: UserOutput;
}

interface CreateInputsByCollectionName {
  AdvisorRequests: CreateAdvisorRequestInput;
  Books: CreateBookInput;
  Chapters: CreateChapterInput;
  Collections: CreateCollectionInput;
  CommentModeratorActions: CreateCommentModeratorActionInput;
  Comments: CreateCommentInput;
  Conversations: CreateConversationInput;
  CurationNotices: CreateCurationNoticeInput;
  DigestPosts: CreateDigestPostInput;
  Digests: CreateDigestInput;
  ElectionCandidates: CreateElectionCandidateInput;
  ElectionVotes: CreateElectionVoteInput;
  ElicitQuestions: CreateElicitQuestionInput;
  ForumEvents: CreateForumEventInput;
  JargonTerms: CreateJargonTermInput;
  LWEvents: CreateLWEventInput;
  Localgroups: CreateLocalgroupInput;
  Messages: CreateMessageInput;
  ModerationTemplates: CreateModerationTemplateInput;
  ModeratorActions: CreateModeratorActionInput;
  MultiDocuments: CreateMultiDocumentInput;
  PetrovDayActions: CreatePetrovDayActionInput;
  PodcastEpisodes: CreatePodcastEpisodeInput;
  Posts: CreatePostInput;
  RSSFeeds: CreateRSSFeedInput;
  Reports: CreateReportInput;
  Sequences: CreateSequenceInput;
  SplashArtCoordinates: CreateSplashArtCoordinateInput;
  Spotlights: CreateSpotlightInput;
  Subscriptions: CreateSubscriptionInput;
  SurveyQuestions: CreateSurveyQuestionInput;
  SurveyResponses: CreateSurveyResponseInput;
  SurveySchedules: CreateSurveyScheduleInput;
  Surveys: CreateSurveyInput;
  TagFlags: CreateTagFlagInput;
  Tags: CreateTagInput;
  UltraFeedEvents: CreateUltraFeedEventInput;
  UserEAGDetails: CreateUserEAGDetailInput;
  UserJobAds: CreateUserJobAdInput;
  UserMostValuablePosts: CreateUserMostValuablePostInput;
  UserRateLimits: CreateUserRateLimitInput;
  UserTagRels: CreateUserTagRelInput;
  Users: CreateUserInput;
  ArbitalCaches: never;
  ArbitalTagContentRels: never;
  AutomatedContentEvaluations: never;
  Bans: never;
  Bookmarks: never;
  CkEditorUserSessions: never;
  ClientIds: never;
  CronHistories: never;
  CurationEmails: never;
  DatabaseMetadata: never;
  DebouncerEvents: never;
  DialogueChecks: never;
  DialogueMatchPreferences: never;
  ElicitQuestionPredictions: never;
  EmailTokens: never;
  FeaturedResources: never;
  FieldChanges: never;
  GardenCodes: never;
  GoogleServiceAccountSessions: never;
  Images: never;
  LegacyData: never;
  LlmConversations: never;
  LlmMessages: never;
  ManifoldProbabilitiesCaches: never;
  Migrations: never;
  Notifications: never;
  PageCache: never;
  PetrovDayLaunchs: never;
  Podcasts: never;
  PostEmbeddings: never;
  PostRecommendations: never;
  PostRelations: never;
  PostViewTimes: never;
  PostViews: never;
  ReadStatuses: never;
  RecommendationsCaches: never;
  ReviewVotes: never;
  ReviewWinnerArts: never;
  ReviewWinners: never;
  Revisions: never;
  Sessions: never;
  SideCommentCaches: never;
  TagRels: never;
  Tweets: never;
  TypingIndicators: never;
  UserActivities: never;
  Votes: never;
}

interface UpdateInputsByCollectionName {
  AdvisorRequests: UpdateAdvisorRequestInput;
  Books: UpdateBookInput;
  Chapters: UpdateChapterInput;
  Collections: UpdateCollectionInput;
  CommentModeratorActions: UpdateCommentModeratorActionInput;
  Comments: UpdateCommentInput;
  Conversations: UpdateConversationInput;
  CurationNotices: UpdateCurationNoticeInput;
  DigestPosts: UpdateDigestPostInput;
  Digests: UpdateDigestInput;
  ElectionCandidates: UpdateElectionCandidateInput;
  ElectionVotes: UpdateElectionVoteInput;
  ElicitQuestions: UpdateElicitQuestionInput;
  ForumEvents: UpdateForumEventInput;
  JargonTerms: UpdateJargonTermInput;
  LlmConversations: UpdateLlmConversationInput;
  Localgroups: UpdateLocalgroupInput;
  Messages: UpdateMessageInput;
  ModerationTemplates: UpdateModerationTemplateInput;
  ModeratorActions: UpdateModeratorActionInput;
  MultiDocuments: UpdateMultiDocumentInput;
  Notifications: UpdateNotificationInput;
  Posts: UpdatePostInput;
  RSSFeeds: UpdateRSSFeedInput;
  Reports: UpdateReportInput;
  Revisions: UpdateRevisionInput;
  Sequences: UpdateSequenceInput;
  Spotlights: UpdateSpotlightInput;
  SurveyQuestions: UpdateSurveyQuestionInput;
  SurveyResponses: UpdateSurveyResponseInput;
  SurveySchedules: UpdateSurveyScheduleInput;
  Surveys: UpdateSurveyInput;
  TagFlags: UpdateTagFlagInput;
  Tags: UpdateTagInput;
  UserEAGDetails: UpdateUserEAGDetailInput;
  UserJobAds: UpdateUserJobAdInput;
  UserMostValuablePosts: UpdateUserMostValuablePostInput;
  UserRateLimits: UpdateUserRateLimitInput;
  UserTagRels: UpdateUserTagRelInput;
  Users: UpdateUserInput;
  ArbitalCaches: never;
  ArbitalTagContentRels: never;
  AutomatedContentEvaluations: never;
  Bans: never;
  Bookmarks: never;
  CkEditorUserSessions: never;
  ClientIds: never;
  CronHistories: never;
  CurationEmails: never;
  DatabaseMetadata: never;
  DebouncerEvents: never;
  DialogueChecks: never;
  DialogueMatchPreferences: never;
  ElicitQuestionPredictions: never;
  EmailTokens: never;
  FeaturedResources: never;
  FieldChanges: never;
  GardenCodes: never;
  GoogleServiceAccountSessions: never;
  Images: never;
  LWEvents: never;
  LegacyData: never;
  LlmMessages: never;
  ManifoldProbabilitiesCaches: never;
  Migrations: never;
  PageCache: never;
  PetrovDayActions: never;
  PetrovDayLaunchs: never;
  PodcastEpisodes: never;
  Podcasts: never;
  PostEmbeddings: never;
  PostRecommendations: never;
  PostRelations: never;
  PostViewTimes: never;
  PostViews: never;
  ReadStatuses: never;
  RecommendationsCaches: never;
  ReviewVotes: never;
  ReviewWinnerArts: never;
  ReviewWinners: never;
  Sessions: never;
  SideCommentCaches: never;
  SplashArtCoordinates: never;
  Subscriptions: never;
  TagRels: never;
  Tweets: never;
  TypingIndicators: never;
  UltraFeedEvents: never;
  UserActivities: never;
  Votes: never;
}
