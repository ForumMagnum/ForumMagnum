type Maybe<T> = T | null;
type InputMaybe<T> = T | null | undefined;
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ContentTypeData: { input: any; output: any; }
  Date: { input: Date; output: string; }
  JSON: { input: any; output: any; }
};

type AdvisorRequest = {
  __typename?: 'AdvisorRequest';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  interestedInMetaculus?: Maybe<Scalars['Boolean']['output']>;
  jobAds?: Maybe<Scalars['JSON']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type AdvisorRequestOutput = {
  __typename?: 'AdvisorRequestOutput';
  data?: Maybe<AdvisorRequest>;
};

type AdvisorRequestSelector = {
  default?: InputMaybe<EmptyViewInput>;
  requestsByUser?: InputMaybe<AdvisorRequestsRequestsByUserInput>;
};

type AdvisorRequestsRequestsByUserInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type AllTagsActivityFeedEntryType = {
  __typename?: 'AllTagsActivityFeedEntryType';
  tagCreated?: Maybe<Tag>;
  tagDiscussionComment?: Maybe<Comment>;
  tagRevision?: Maybe<Revision>;
  type: Scalars['String']['output'];
};

type AllTagsActivityFeedQueryResults = {
  __typename?: 'AllTagsActivityFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<AllTagsActivityFeedEntryType>>;
};

type AnalyticsSeriesValue = {
  __typename?: 'AnalyticsSeriesValue';
  comments?: Maybe<Scalars['Int']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
  karma?: Maybe<Scalars['Int']['output']>;
  reads?: Maybe<Scalars['Int']['output']>;
  views?: Maybe<Scalars['Int']['output']>;
};

type ArbitalCaches = {
  __typename?: 'ArbitalCaches';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type ArbitalLinkedPage = {
  __typename?: 'ArbitalLinkedPage';
  _id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

type ArbitalLinkedPages = {
  __typename?: 'ArbitalLinkedPages';
  children: Array<ArbitalLinkedPage>;
  faster: Array<ArbitalLinkedPage>;
  lessTechnical: Array<ArbitalLinkedPage>;
  moreTechnical: Array<ArbitalLinkedPage>;
  parents: Array<ArbitalLinkedPage>;
  requirements: Array<ArbitalLinkedPage>;
  slower: Array<ArbitalLinkedPage>;
  teaches: Array<ArbitalLinkedPage>;
};

type ArbitalPageData = {
  __typename?: 'ArbitalPageData';
  html?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

type ArbitalTagContentRel = {
  __typename?: 'ArbitalTagContentRel';
  _id: Scalars['String']['output'];
  childCollectionName: Scalars['String']['output'];
  childDocumentId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  isStrong: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  level: Scalars['Float']['output'];
  parentCollectionName: Scalars['String']['output'];
  parentDocumentId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

type ArbitalTagContentRelSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type AutomatedContentEvaluation = {
  __typename?: 'AutomatedContentEvaluation';
  _id: Scalars['String']['output'];
  aiChoice: Scalars['String']['output'];
  aiCoT: Scalars['String']['output'];
  aiReasoning: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  revisionId: Scalars['String']['output'];
  score: Scalars['Float']['output'];
  sentenceScores: Array<SentenceScore>;
};

type AutosaveContentType = {
  type?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['ContentTypeData']['input']>;
};

type Ban = {
  __typename?: 'Ban';
  _id: Scalars['String']['output'];
  comment: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  expirationDate?: Maybe<Scalars['Date']['output']>;
  ip?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  properties?: Maybe<Scalars['JSON']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

type BanSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type Book = {
  __typename?: 'Book';
  _id: Scalars['String']['output'];
  collectionId: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  displaySequencesAsGrid?: Maybe<Scalars['Boolean']['output']>;
  hideProgressBar?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
  postIds: Array<Scalars['String']['output']>;
  postedAt?: Maybe<Scalars['Date']['output']>;
  posts: Array<Post>;
  schemaVersion: Scalars['Float']['output'];
  sequenceIds: Array<Scalars['String']['output']>;
  sequences: Array<Sequence>;
  showChapters?: Maybe<Scalars['Boolean']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  tocTitle?: Maybe<Scalars['String']['output']>;
};


type BookcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type BookOutput = {
  __typename?: 'BookOutput';
  data?: Maybe<Book>;
};

type BookSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type Bookmark = {
  __typename?: 'Bookmark';
  _id: Scalars['String']['output'];
  active: Scalars['Boolean']['output'];
  collectionName: Scalars['String']['output'];
  comment?: Maybe<Comment>;
  createdAt: Scalars['Date']['output'];
  documentId: Scalars['String']['output'];
  lastUpdated: Scalars['Date']['output'];
  post?: Maybe<Post>;
  userId: Scalars['String']['output'];
};

type Chapter = {
  __typename?: 'Chapter';
  _id: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
  postIds: Array<Scalars['String']['output']>;
  posts: Array<Post>;
  schemaVersion: Scalars['Float']['output'];
  sequence?: Maybe<Sequence>;
  sequenceId?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


type ChaptercontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type ChapterOutput = {
  __typename?: 'ChapterOutput';
  data?: Maybe<Chapter>;
};

type ChapterSelector = {
  SequenceChapters?: InputMaybe<ChaptersSequenceChaptersInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type ChaptersSequenceChaptersInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};

type CkEditorUserSession = {
  __typename?: 'CkEditorUserSession';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  documentId?: Maybe<Scalars['String']['output']>;
  endedAt?: Maybe<Scalars['Date']['output']>;
  endedBy?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type CkEditorUserSessionSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type ClientId = {
  __typename?: 'ClientId';
  _id: Scalars['String']['output'];
  clientId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  firstSeenLandingPage?: Maybe<Scalars['String']['output']>;
  firstSeenReferrer?: Maybe<Scalars['String']['output']>;
  invalidated?: Maybe<Scalars['Boolean']['output']>;
  lastSeenAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  timesSeen?: Maybe<Scalars['Float']['output']>;
  userIds?: Maybe<Array<Scalars['String']['output']>>;
  users?: Maybe<Array<User>>;
};

type ClientIdSelector = {
  default?: InputMaybe<EmptyViewInput>;
  getClientId?: InputMaybe<ClientIdsGetClientIdInput>;
};

type ClientIdsGetClientIdInput = {
  clientId?: InputMaybe<Scalars['String']['input']>;
};

type CoauthorStatus = {
  __typename?: 'CoauthorStatus';
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  requested?: Maybe<Scalars['Boolean']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

type CoauthorStatusInput = {
  confirmed: Scalars['Boolean']['input'];
  requested: Scalars['Boolean']['input'];
  userId: Scalars['String']['input'];
};

type CoauthorStatusOutput = {
  __typename?: 'CoauthorStatusOutput';
  confirmed: Scalars['Boolean']['output'];
  requested: Scalars['Boolean']['output'];
  userId: Scalars['String']['output'];
};

type Collection = {
  __typename?: 'Collection';
  _id: Scalars['String']['output'];
  books: Array<Book>;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  firstPageLink: Scalars['String']['output'];
  gridImageId?: Maybe<Scalars['String']['output']>;
  hideStartReadingButton?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  noindex: Scalars['Boolean']['output'];
  postsCount: Scalars['Int']['output'];
  readPostsCount: Scalars['Int']['output'];
  schemaVersion: Scalars['Float']['output'];
  slug: Scalars['String']['output'];
  title: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};


type CollectioncontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type CollectionDefaultViewInput = {
  collectionIds?: InputMaybe<Scalars['String']['input']>;
};

type CollectionOutput = {
  __typename?: 'CollectionOutput';
  data?: Maybe<Collection>;
};

type CollectionSelector = {
  default?: InputMaybe<CollectionDefaultViewInput>;
};

type CombinedKarmaVals = {
  __typename?: 'CombinedKarmaVals';
  commentKarma: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
  postKarma: Scalars['Int']['output'];
};

type Comment = {
  __typename?: 'Comment';
  _id: Scalars['String']['output'];
  af: Scalars['Boolean']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afDate?: Maybe<Scalars['Date']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  agentFoundationsId?: Maybe<Scalars['String']['output']>;
  allVotes?: Maybe<Array<Vote>>;
  answer: Scalars['Boolean']['output'];
  author?: Maybe<Scalars['String']['output']>;
  authorIsUnreviewed: Scalars['Boolean']['output'];
  baseScore?: Maybe<Scalars['Float']['output']>;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  debateResponse?: Maybe<Scalars['Boolean']['output']>;
  deleted: Scalars['Boolean']['output'];
  deletedByUser?: Maybe<User>;
  deletedByUserId?: Maybe<Scalars['String']['output']>;
  deletedDate?: Maybe<Scalars['Date']['output']>;
  deletedPublic: Scalars['Boolean']['output'];
  deletedReason?: Maybe<Scalars['String']['output']>;
  descendentCount: Scalars['Float']['output'];
  directChildrenCount: Scalars['Float']['output'];
  emojiReactors?: Maybe<Scalars['JSON']['output']>;
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  forumEvent?: Maybe<ForumEvent>;
  forumEventId?: Maybe<Scalars['String']['output']>;
  forumEventMetadata?: Maybe<Scalars['JSON']['output']>;
  hideAuthor: Scalars['Boolean']['output'];
  hideKarma?: Maybe<Scalars['Boolean']['output']>;
  hideModeratorHat?: Maybe<Scalars['Boolean']['output']>;
  htmlBody?: Maybe<Scalars['String']['output']>;
  isPinnedOnProfile: Scalars['Boolean']['output'];
  lastEditedAt?: Maybe<Scalars['Date']['output']>;
  lastSubthreadActivity?: Maybe<Scalars['Date']['output']>;
  latestChildren: Array<Comment>;
  legacy: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  legacyId?: Maybe<Scalars['String']['output']>;
  legacyParentId?: Maybe<Scalars['String']['output']>;
  legacyPoll: Scalars['Boolean']['output'];
  modGPTAnalysis?: Maybe<Scalars['String']['output']>;
  modGPTRecommendation?: Maybe<Scalars['String']['output']>;
  moderatorHat: Scalars['Boolean']['output'];
  moveToAlignmentUser?: Maybe<User>;
  moveToAlignmentUserId?: Maybe<Scalars['String']['output']>;
  needsReview?: Maybe<Scalars['Boolean']['output']>;
  nominatedForReview?: Maybe<Scalars['String']['output']>;
  originalDialogue?: Maybe<Post>;
  originalDialogueId?: Maybe<Scalars['String']['output']>;
  pageUrl?: Maybe<Scalars['String']['output']>;
  pageUrlRelative?: Maybe<Scalars['String']['output']>;
  parentAnswer?: Maybe<Comment>;
  parentAnswerId?: Maybe<Scalars['String']['output']>;
  parentComment?: Maybe<Comment>;
  parentCommentId?: Maybe<Scalars['String']['output']>;
  pingbacks?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId?: Maybe<Scalars['String']['output']>;
  postVersion?: Maybe<Scalars['String']['output']>;
  postedAt: Scalars['Date']['output'];
  promoted?: Maybe<Scalars['Boolean']['output']>;
  promotedAt?: Maybe<Scalars['Date']['output']>;
  promotedByUser?: Maybe<User>;
  promotedByUserId?: Maybe<Scalars['String']['output']>;
  referrer?: Maybe<Scalars['String']['output']>;
  rejected: Scalars['Boolean']['output'];
  rejectedByUser?: Maybe<User>;
  rejectedByUserId?: Maybe<Scalars['String']['output']>;
  rejectedReason?: Maybe<Scalars['String']['output']>;
  relevantTagIds: Array<Scalars['String']['output']>;
  relevantTags: Array<Tag>;
  repliesBlockedUntil?: Maybe<Scalars['Date']['output']>;
  retracted: Scalars['Boolean']['output'];
  reviewForAlignmentUserId?: Maybe<Scalars['String']['output']>;
  reviewedByUser?: Maybe<User>;
  reviewedByUserId?: Maybe<Scalars['String']['output']>;
  reviewingForReview?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  shortform?: Maybe<Scalars['Boolean']['output']>;
  shortformFrontpage: Scalars['Boolean']['output'];
  spam: Scalars['Boolean']['output'];
  subforumStickyPriority?: Maybe<Scalars['Float']['output']>;
  suggestForAlignmentUserIds: Array<Scalars['String']['output']>;
  suggestForAlignmentUsers: Array<User>;
  tag?: Maybe<Tag>;
  tagCommentType: TagCommentType;
  tagId?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  topLevelComment?: Maybe<Comment>;
  topLevelCommentId?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userIP?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  voteCount: Scalars['Float']['output'];
  votingSystem: Scalars['String']['output'];
  wordCount?: Maybe<Scalars['Int']['output']>;
};


type CommentcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type CommentCountTag = {
  __typename?: 'CommentCountTag';
  comment_count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

type CommentDefaultViewInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentKarmaChange = {
  __typename?: 'CommentKarmaChange';
  _id: Scalars['String']['output'];
  addedReacts?: Maybe<Array<ReactionChange>>;
  collectionName: Scalars['String']['output'];
  commentId?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  eaAddedReacts?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  postSlug?: Maybe<Scalars['String']['output']>;
  postTitle?: Maybe<Scalars['String']['output']>;
  scoreChange: Scalars['Int']['output'];
  tagCommentType?: Maybe<TagCommentType>;
  tagId?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  tagSlug?: Maybe<Scalars['String']['output']>;
};

type CommentModeratorAction = {
  __typename?: 'CommentModeratorAction';
  _id: Scalars['String']['output'];
  active?: Maybe<Scalars['Boolean']['output']>;
  comment?: Maybe<Comment>;
  commentId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  endedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

type CommentModeratorActionOutput = {
  __typename?: 'CommentModeratorActionOutput';
  data?: Maybe<CommentModeratorAction>;
};

type CommentModeratorActionSelector = {
  activeCommentModeratorActions?: InputMaybe<CommentModeratorActionsActiveCommentModeratorActionsInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type CommentModeratorActionsActiveCommentModeratorActionsInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type CommentOutput = {
  __typename?: 'CommentOutput';
  data?: Maybe<Comment>;
};

type CommentSelector = {
  afPostCommentsTop?: InputMaybe<CommentsAfPostCommentsTopInput>;
  afRecentDiscussionThread?: InputMaybe<CommentsAfRecentDiscussionThreadInput>;
  afSubmissions?: InputMaybe<CommentsAfSubmissionsInput>;
  alignmentSuggestedComments?: InputMaybe<CommentsAlignmentSuggestedCommentsInput>;
  allCommentsDeleted?: InputMaybe<CommentsAllCommentsDeletedInput>;
  allRecentComments?: InputMaybe<CommentsAllRecentCommentsInput>;
  answersAndReplies?: InputMaybe<CommentsAnswersAndRepliesInput>;
  checkedByModGPT?: InputMaybe<CommentsCheckedByModGPTInput>;
  commentReplies?: InputMaybe<CommentsCommentRepliesInput>;
  debateResponses?: InputMaybe<CommentsDebateResponsesInput>;
  default?: InputMaybe<CommentDefaultViewInput>;
  defaultModeratorResponses?: InputMaybe<CommentsDefaultModeratorResponsesInput>;
  forumEventComments?: InputMaybe<CommentsForumEventCommentsInput>;
  latestSubforumDiscussion?: InputMaybe<CommentsLatestSubforumDiscussionInput>;
  legacyIdComment?: InputMaybe<CommentsLegacyIdCommentInput>;
  moderatorComments?: InputMaybe<CommentsModeratorCommentsInput>;
  nominations2018?: InputMaybe<CommentsNominations2018Input>;
  nominations2019?: InputMaybe<CommentsNominations2019Input>;
  postCommentsBest?: InputMaybe<CommentsPostCommentsBestInput>;
  postCommentsDeleted?: InputMaybe<CommentsPostCommentsDeletedInput>;
  postCommentsMagic?: InputMaybe<CommentsPostCommentsMagicInput>;
  postCommentsNew?: InputMaybe<CommentsPostCommentsNewInput>;
  postCommentsOld?: InputMaybe<CommentsPostCommentsOldInput>;
  postCommentsRecentReplies?: InputMaybe<CommentsPostCommentsRecentRepliesInput>;
  postCommentsTop?: InputMaybe<CommentsPostCommentsTopInput>;
  postLWComments?: InputMaybe<CommentsPostLWCommentsInput>;
  postsItemComments?: InputMaybe<CommentsPostsItemCommentsInput>;
  profileComments?: InputMaybe<CommentsProfileCommentsInput>;
  profileRecentComments?: InputMaybe<CommentsProfileRecentCommentsInput>;
  questionAnswers?: InputMaybe<CommentsQuestionAnswersInput>;
  recentComments?: InputMaybe<CommentsRecentCommentsInput>;
  recentDebateResponses?: InputMaybe<CommentsRecentDebateResponsesInput>;
  recentDiscussionThread?: InputMaybe<CommentsRecentDiscussionThreadInput>;
  rejected?: InputMaybe<CommentsRejectedInput>;
  repliesToAnswer?: InputMaybe<CommentsRepliesToAnswerInput>;
  repliesToCommentThread?: InputMaybe<CommentsRepliesToCommentThreadInput>;
  reviews?: InputMaybe<CommentsReviewsInput>;
  reviews2018?: InputMaybe<CommentsReviews2018Input>;
  reviews2019?: InputMaybe<CommentsReviews2019Input>;
  rss?: InputMaybe<CommentsRssInput>;
  shortform?: InputMaybe<CommentsShortformInput>;
  shortformFrontpage?: InputMaybe<CommentsShortformFrontpageInput>;
  shortformLatestChildren?: InputMaybe<CommentsShortformLatestChildrenInput>;
  sunshineNewCommentsList?: InputMaybe<CommentsSunshineNewCommentsListInput>;
  sunshineNewUsersComments?: InputMaybe<CommentsSunshineNewUsersCommentsInput>;
  tagDiscussionComments?: InputMaybe<CommentsTagDiscussionCommentsInput>;
  tagSubforumComments?: InputMaybe<CommentsTagSubforumCommentsInput>;
  topShortform?: InputMaybe<CommentsTopShortformInput>;
};

type CommentsAfPostCommentsTopInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsAfRecentDiscussionThreadInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsAfSubmissionsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsAlignmentSuggestedCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsAllCommentsDeletedInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsAllRecentCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsAnswersAndRepliesInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsCheckedByModGPTInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsCommentRepliesInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  parentCommentId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsDebateResponsesInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsDefaultModeratorResponsesInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsForumEventCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  forumEventId?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsLatestSubforumDiscussionInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  profileTagIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsLegacyIdCommentInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsModeratorCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsNominations2018Input = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsNominations2019Input = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsBestInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsDeletedInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsMagicInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsNewInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsOldInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsRecentRepliesInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostCommentsTopInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostLWCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsPostsItemCommentsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsProfileCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsProfileRecentCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsQuestionAnswersInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRecentCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRecentDebateResponsesInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRecentDiscussionThreadInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRejectedInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRepliesToAnswerInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  parentAnswerId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRepliesToCommentThreadInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  topLevelCommentId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsReviews2018Input = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsReviews2019Input = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsReviewsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsRssInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsShortformFrontpageInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  maxAgeDays?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  relevantTagId?: InputMaybe<Scalars['String']['input']>;
  showCommunity?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsShortformInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsShortformLatestChildrenInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  topLevelCommentId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsSunshineNewCommentsListInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsSunshineNewUsersCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsTagDiscussionCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsTagSubforumCommentsInput = {
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsTopShortformInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  commentIds?: InputMaybe<Scalars['String']['input']>;
  minimumKarma?: InputMaybe<Scalars['String']['input']>;
  shortformFrontpage?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CommentsWithReactsResult = {
  __typename?: 'CommentsWithReactsResult';
  results: Array<Comment>;
};

type ContentType = {
  __typename?: 'ContentType';
  data: Scalars['ContentTypeData']['output'];
  type: Scalars['String']['output'];
};

type ContentTypeInput = {
  data: Scalars['ContentTypeData']['input'];
  type: Scalars['String']['input'];
};

type Conversation = {
  __typename?: 'Conversation';
  _id: Scalars['String']['output'];
  af?: Maybe<Scalars['Boolean']['output']>;
  archivedBy: Array<User>;
  archivedByIds: Array<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  hasUnreadMessages?: Maybe<Scalars['Boolean']['output']>;
  latestActivity?: Maybe<Scalars['Date']['output']>;
  latestMessage?: Maybe<Message>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  messageCount: Scalars['Float']['output'];
  moderator?: Maybe<Scalars['Boolean']['output']>;
  participantIds?: Maybe<Array<Scalars['String']['output']>>;
  participants?: Maybe<Array<User>>;
  schemaVersion: Scalars['Float']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

type ConversationOutput = {
  __typename?: 'ConversationOutput';
  data?: Maybe<Conversation>;
};

type ConversationSelector = {
  default?: InputMaybe<EmptyViewInput>;
  moderatorConversations?: InputMaybe<ConversationsModeratorConversationsInput>;
  userConversations?: InputMaybe<ConversationsUserConversationsInput>;
  userConversationsAll?: InputMaybe<ConversationsUserConversationsAllInput>;
  userGroupUntitledConversations?: InputMaybe<ConversationsUserGroupUntitledConversationsInput>;
};

type ConversationsModeratorConversationsInput = {
  showArchive?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ConversationsUserConversationsAllInput = {
  showArchive?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ConversationsUserConversationsInput = {
  showArchive?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ConversationsUserGroupUntitledConversationsInput = {
  moderator?: InputMaybe<Scalars['String']['input']>;
  participantIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateAdvisorRequestDataInput = {
  interestedInMetaculus?: InputMaybe<Scalars['Boolean']['input']>;
  jobAds?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

type CreateAdvisorRequestInput = {
  data: CreateAdvisorRequestDataInput;
};

type CreateBookDataInput = {
  collectionId: Scalars['String']['input'];
  contents?: InputMaybe<CreateRevisionDataInput>;
  displaySequencesAsGrid?: InputMaybe<Scalars['Boolean']['input']>;
  hideProgressBar?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  number?: InputMaybe<Scalars['Float']['input']>;
  postIds?: InputMaybe<Array<Scalars['String']['input']>>;
  sequenceIds?: InputMaybe<Array<Scalars['String']['input']>>;
  showChapters?: InputMaybe<Scalars['Boolean']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  tocTitle?: InputMaybe<Scalars['String']['input']>;
};

type CreateBookInput = {
  data: CreateBookDataInput;
};

type CreateChapterDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  number?: InputMaybe<Scalars['Float']['input']>;
  postIds: Array<Scalars['String']['input']>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type CreateChapterInput = {
  data: CreateChapterDataInput;
};

type CreateCollectionDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  createdAt: Scalars['Date']['input'];
  firstPageLink?: InputMaybe<Scalars['String']['input']>;
  gridImageId?: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

type CreateCollectionInput = {
  data: CreateCollectionDataInput;
};

type CreateCommentDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  afDate?: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId?: InputMaybe<Scalars['String']['input']>;
  answer?: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  debateResponse?: InputMaybe<Scalars['Boolean']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  deletedByUserId?: InputMaybe<Scalars['String']['input']>;
  deletedDate?: InputMaybe<Scalars['Date']['input']>;
  deletedPublic?: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason?: InputMaybe<Scalars['String']['input']>;
  forumEventId?: InputMaybe<Scalars['String']['input']>;
  forumEventMetadata?: InputMaybe<Scalars['JSON']['input']>;
  hideKarma?: InputMaybe<Scalars['Boolean']['input']>;
  hideModeratorHat?: InputMaybe<Scalars['Boolean']['input']>;
  isPinnedOnProfile?: InputMaybe<Scalars['Boolean']['input']>;
  legacy?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  legacyParentId?: InputMaybe<Scalars['String']['input']>;
  legacyPoll?: InputMaybe<Scalars['Boolean']['input']>;
  modGPTAnalysis?: InputMaybe<Scalars['String']['input']>;
  modGPTRecommendation?: InputMaybe<Scalars['String']['input']>;
  moderatorHat?: InputMaybe<Scalars['Boolean']['input']>;
  needsReview?: InputMaybe<Scalars['Boolean']['input']>;
  nominatedForReview?: InputMaybe<Scalars['String']['input']>;
  originalDialogueId?: InputMaybe<Scalars['String']['input']>;
  parentAnswerId?: InputMaybe<Scalars['String']['input']>;
  parentCommentId?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  promotedByUserId?: InputMaybe<Scalars['String']['input']>;
  rejected?: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId?: InputMaybe<Scalars['String']['input']>;
  rejectedReason?: InputMaybe<Scalars['String']['input']>;
  relevantTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  retracted?: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  reviewingForReview?: InputMaybe<Scalars['String']['input']>;
  shortform?: InputMaybe<Scalars['Boolean']['input']>;
  shortformFrontpage?: InputMaybe<Scalars['Boolean']['input']>;
  spam?: InputMaybe<Scalars['Boolean']['input']>;
  subforumStickyPriority?: InputMaybe<Scalars['Float']['input']>;
  tagCommentType?: InputMaybe<TagCommentType>;
  tagId?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  topLevelCommentId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateCommentInput = {
  data: CreateCommentDataInput;
};

type CreateCommentModeratorActionDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
};

type CreateCommentModeratorActionInput = {
  data: CreateCommentModeratorActionDataInput;
};

type CreateConversationDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds?: InputMaybe<Array<Scalars['String']['input']>>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderator?: InputMaybe<Scalars['Boolean']['input']>;
  participantIds?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type CreateConversationInput = {
  data: CreateConversationDataInput;
};

type CreateCurationNoticeDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

type CreateCurationNoticeInput = {
  data: CreateCurationNoticeDataInput;
};

type CreateDigestDataInput = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  num: Scalars['Float']['input'];
  onsiteImageId?: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  publishedDate?: InputMaybe<Scalars['Date']['input']>;
  startDate: Scalars['Date']['input'];
};

type CreateDigestInput = {
  data: CreateDigestDataInput;
};

type CreateDigestPostDataInput = {
  digestId: Scalars['String']['input'];
  emailDigestStatus?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  onsiteDigestStatus?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};

type CreateDigestPostInput = {
  data: CreateDigestPostDataInput;
};

type CreateElectionCandidateDataInput = {
  amountRaised?: InputMaybe<Scalars['Float']['input']>;
  description: Scalars['String']['input'];
  electionName: Scalars['String']['input'];
  fundraiserLink?: InputMaybe<Scalars['String']['input']>;
  gwwcId?: InputMaybe<Scalars['String']['input']>;
  gwwcLink?: InputMaybe<Scalars['String']['input']>;
  href: Scalars['String']['input'];
  isElectionFundraiser?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  logoSrc: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
  targetAmount?: InputMaybe<Scalars['Float']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateElectionCandidateInput = {
  data: CreateElectionCandidateDataInput;
};

type CreateElectionVoteDataInput = {
  compareState?: InputMaybe<Scalars['JSON']['input']>;
  electionName: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  submissionComments?: InputMaybe<Scalars['JSON']['input']>;
  submittedAt?: InputMaybe<Scalars['Date']['input']>;
  userExplanation?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
  userOtherComments?: InputMaybe<Scalars['String']['input']>;
  vote?: InputMaybe<Scalars['JSON']['input']>;
};

type CreateElectionVoteInput = {
  data: CreateElectionVoteDataInput;
};

type CreateElicitQuestionDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  resolution?: InputMaybe<Scalars['String']['input']>;
  resolvesBy?: InputMaybe<Scalars['Date']['input']>;
  title: Scalars['String']['input'];
};

type CreateElicitQuestionInput = {
  data: CreateElicitQuestionDataInput;
};

type CreateForumEventDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  bannerTextColor: Scalars['String']['input'];
  commentPrompt?: InputMaybe<Scalars['String']['input']>;
  contrastColor?: InputMaybe<Scalars['String']['input']>;
  customComponent: ForumEventCustomComponent;
  darkColor: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  eventFormat?: InputMaybe<ForumEventFormat>;
  frontpageDescription?: InputMaybe<CreateRevisionDataInput>;
  frontpageDescriptionMobile?: InputMaybe<CreateRevisionDataInput>;
  includesPoll?: InputMaybe<Scalars['Boolean']['input']>;
  isGlobal: Scalars['Boolean']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  lightColor: Scalars['String']['input'];
  maxStickersPerUser?: InputMaybe<Scalars['Float']['input']>;
  pollAgreeWording?: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording?: InputMaybe<Scalars['String']['input']>;
  pollQuestion?: InputMaybe<CreateRevisionDataInput>;
  postId?: InputMaybe<Scalars['String']['input']>;
  postPageDescription?: InputMaybe<CreateRevisionDataInput>;
  publicData?: InputMaybe<Scalars['JSON']['input']>;
  startDate: Scalars['Date']['input'];
  tagId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

type CreateForumEventInput = {
  data: CreateForumEventDataInput;
};

type CreateJargonTermDataInput = {
  altTerms: Array<Scalars['String']['input']>;
  approved?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  term: Scalars['String']['input'];
};

type CreateJargonTermInput = {
  data: CreateJargonTermDataInput;
};

type CreateLWEventDataInput = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  important?: InputMaybe<Scalars['Boolean']['input']>;
  intercom?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  properties?: InputMaybe<Scalars['JSON']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateLWEventInput = {
  data: CreateLWEventDataInput;
};

type CreateLocalgroupDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  facebookLink?: InputMaybe<Scalars['String']['input']>;
  facebookPageLink?: InputMaybe<Scalars['String']['input']>;
  googleLocation?: InputMaybe<Scalars['JSON']['input']>;
  inactive?: InputMaybe<Scalars['Boolean']['input']>;
  isOnline?: InputMaybe<Scalars['Boolean']['input']>;
  lastActivity?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  meetupLink?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  nameInAnotherLanguage?: InputMaybe<Scalars['String']['input']>;
  organizerIds: Array<Scalars['String']['input']>;
  slackLink?: InputMaybe<Scalars['String']['input']>;
  types: Array<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

type CreateLocalgroupInput = {
  data: CreateLocalgroupDataInput;
};

type CreateMessageDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  conversationId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noEmail?: InputMaybe<Scalars['Boolean']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateMessageInput = {
  data: CreateMessageDataInput;
};

type CreateModerationTemplateDataInput = {
  collectionName: ModerationTemplateType;
  contents?: InputMaybe<CreateRevisionDataInput>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Float']['input']>;
};

type CreateModerationTemplateInput = {
  data: CreateModerationTemplateDataInput;
};

type CreateModeratorActionDataInput = {
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type: ModeratorActionType;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateModeratorActionInput = {
  data: CreateModeratorActionDataInput;
};

type CreateMultiDocumentDataInput = {
  collectionName: Scalars['String']['input'];
  contents?: InputMaybe<CreateRevisionDataInput>;
  fieldName: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  parentDocumentId: Scalars['String']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
  tabSubtitle?: InputMaybe<Scalars['String']['input']>;
  tabTitle: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateMultiDocumentInput = {
  data: CreateMultiDocumentDataInput;
};

type CreatePetrovDayActionDataInput = {
  actionType: Scalars['String']['input'];
  data?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

type CreatePetrovDayActionInput = {
  data: CreatePetrovDayActionDataInput;
};

type CreatePodcastEpisodeDataInput = {
  episodeLink: Scalars['String']['input'];
  externalEpisodeId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  podcastId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

type CreatePodcastEpisodeInput = {
  data: CreatePodcastEpisodeDataInput;
};

type CreatePostDataInput = {
  activateRSVPs?: InputMaybe<Scalars['Boolean']['input']>;
  af?: InputMaybe<Scalars['Boolean']['input']>;
  afDate?: InputMaybe<Scalars['Date']['input']>;
  afSticky?: InputMaybe<Scalars['Boolean']['input']>;
  agentFoundationsId?: InputMaybe<Scalars['String']['input']>;
  authorIsUnreviewed?: InputMaybe<Scalars['Boolean']['input']>;
  autoFrontpage?: InputMaybe<Scalars['String']['input']>;
  bannedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  canonicalBookId?: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug?: InputMaybe<Scalars['String']['input']>;
  canonicalNextPostSlug?: InputMaybe<Scalars['String']['input']>;
  canonicalPrevPostSlug?: InputMaybe<Scalars['String']['input']>;
  canonicalSequenceId?: InputMaybe<Scalars['String']['input']>;
  canonicalSource?: InputMaybe<Scalars['String']['input']>;
  coauthorStatuses?: InputMaybe<Array<CoauthorStatusInput>>;
  collabEditorDialogue?: InputMaybe<Scalars['Boolean']['input']>;
  collectionTitle?: InputMaybe<Scalars['String']['input']>;
  commentSortOrder?: InputMaybe<Scalars['String']['input']>;
  commentsLocked?: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter?: InputMaybe<Scalars['Date']['input']>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  curatedDate?: InputMaybe<Scalars['Date']['input']>;
  customHighlight?: InputMaybe<CreateRevisionDataInput>;
  defaultRecommendation?: InputMaybe<Scalars['Boolean']['input']>;
  disableRecommendation?: InputMaybe<Scalars['Boolean']['input']>;
  disableSidenotes?: InputMaybe<Scalars['Boolean']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  endTime?: InputMaybe<Scalars['Date']['input']>;
  eventImageId?: InputMaybe<Scalars['String']['input']>;
  eventRegistrationLink?: InputMaybe<Scalars['String']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  facebookLink?: InputMaybe<Scalars['String']['input']>;
  feedId?: InputMaybe<Scalars['String']['input']>;
  feedLink?: InputMaybe<Scalars['String']['input']>;
  fmCrosspost?: InputMaybe<CrosspostInput>;
  forceAllowType3Audio?: InputMaybe<Scalars['Boolean']['input']>;
  frontpageDate?: InputMaybe<Scalars['Date']['input']>;
  generateDraftJargon?: InputMaybe<Scalars['Boolean']['input']>;
  globalEvent?: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation?: InputMaybe<Scalars['JSON']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hasCoauthorPermission?: InputMaybe<Scalars['Boolean']['input']>;
  hiddenRelatedQuestion?: InputMaybe<Scalars['Boolean']['input']>;
  hideAuthor?: InputMaybe<Scalars['Boolean']['input']>;
  hideCommentKarma?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPopularComments?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromRecentDiscussions?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageComments?: InputMaybe<Scalars['Boolean']['input']>;
  ignoreRateLimits?: InputMaybe<Scalars['Boolean']['input']>;
  isEvent?: InputMaybe<Scalars['Boolean']['input']>;
  joinEventLink?: InputMaybe<Scalars['String']['input']>;
  legacy?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  legacySpam?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  manifoldReviewMarketId?: InputMaybe<Scalars['String']['input']>;
  meetupLink?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['Boolean']['input']>;
  metaDate?: InputMaybe<Scalars['Date']['input']>;
  metaSticky?: InputMaybe<Scalars['Boolean']['input']>;
  moderationGuidelines?: InputMaybe<CreateRevisionDataInput>;
  moderationStyle?: InputMaybe<Scalars['String']['input']>;
  nextDayReminderSent?: InputMaybe<Scalars['Boolean']['input']>;
  noIndex?: InputMaybe<Scalars['Boolean']['input']>;
  onlineEvent?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn?: InputMaybe<Scalars['Boolean']['input']>;
  organizerIds?: InputMaybe<Array<Scalars['String']['input']>>;
  originalPostRelationSourceId?: InputMaybe<Scalars['String']['input']>;
  podcastEpisodeId?: InputMaybe<Scalars['String']['input']>;
  postCategory?: InputMaybe<PostCategory>;
  postedAt?: InputMaybe<Scalars['Date']['input']>;
  question?: InputMaybe<Scalars['Boolean']['input']>;
  readTimeMinutesOverride?: InputMaybe<Scalars['Float']['input']>;
  rejected?: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId?: InputMaybe<Scalars['String']['input']>;
  rejectedReason?: InputMaybe<Scalars['String']['input']>;
  reviewForAlignmentUserId?: InputMaybe<Scalars['String']['input']>;
  reviewForCuratedUserId?: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  shareWithUsers?: InputMaybe<Array<Scalars['String']['input']>>;
  sharingSettings?: InputMaybe<Scalars['JSON']['input']>;
  shortform?: InputMaybe<Scalars['Boolean']['input']>;
  sideCommentVisibility?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  socialPreview?: InputMaybe<SocialPreviewInput>;
  socialPreviewImageAutoUrl?: InputMaybe<Scalars['String']['input']>;
  socialPreviewImageId?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['Float']['input']>;
  sticky?: InputMaybe<Scalars['Boolean']['input']>;
  stickyPriority?: InputMaybe<Scalars['Int']['input']>;
  subforumTagId?: InputMaybe<Scalars['String']['input']>;
  submitToFrontpage?: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  suggestForCuratedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  swrCachingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tagRelevance?: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  types?: InputMaybe<Array<Scalars['String']['input']>>;
  unlisted?: InputMaybe<Scalars['Boolean']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  wasEverUndrafted?: InputMaybe<Scalars['Boolean']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

type CreatePostInput = {
  data: CreatePostDataInput;
};

type CreateRSSFeedDataInput = {
  displayFullContent?: InputMaybe<Scalars['Boolean']['input']>;
  importAsDraft?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  nickname: Scalars['String']['input'];
  ownedByUser?: InputMaybe<Scalars['Boolean']['input']>;
  rawFeed: Scalars['JSON']['input'];
  setCanonicalUrl?: InputMaybe<Scalars['Boolean']['input']>;
  url: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateRSSFeedInput = {
  data: CreateRSSFeedDataInput;
};

type CreateReportDataInput = {
  claimedUserId?: InputMaybe<Scalars['String']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  link: Scalars['String']['input'];
  postId?: InputMaybe<Scalars['String']['input']>;
  reportedAsSpam?: InputMaybe<Scalars['Boolean']['input']>;
  reportedUserId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateReportInput = {
  data: CreateReportDataInput;
};

type CreateRevisionDataInput = {
  commitMessage?: InputMaybe<Scalars['String']['input']>;
  dataWithDiscardedSuggestions?: InputMaybe<Scalars['JSON']['input']>;
  googleDocMetadata?: InputMaybe<Scalars['JSON']['input']>;
  originalContents: ContentTypeInput;
  updateType?: InputMaybe<Scalars['String']['input']>;
};

type CreateSequenceDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  curatedOrder?: InputMaybe<Scalars['Float']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  gridImageId?: InputMaybe<Scalars['String']['input']>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromAuthorPage?: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
  userProfileOrder?: InputMaybe<Scalars['Float']['input']>;
};

type CreateSequenceInput = {
  data: CreateSequenceDataInput;
};

type CreateSplashArtCoordinateDataInput = {
  leftFlipped?: InputMaybe<Scalars['Boolean']['input']>;
  leftHeightPct: Scalars['Float']['input'];
  leftWidthPct: Scalars['Float']['input'];
  leftXPct: Scalars['Float']['input'];
  leftYPct: Scalars['Float']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  middleFlipped?: InputMaybe<Scalars['Boolean']['input']>;
  middleHeightPct: Scalars['Float']['input'];
  middleWidthPct: Scalars['Float']['input'];
  middleXPct: Scalars['Float']['input'];
  middleYPct: Scalars['Float']['input'];
  reviewWinnerArtId: Scalars['String']['input'];
  rightFlipped: Scalars['Boolean']['input'];
  rightHeightPct: Scalars['Float']['input'];
  rightWidthPct: Scalars['Float']['input'];
  rightXPct: Scalars['Float']['input'];
  rightYPct: Scalars['Float']['input'];
};

type CreateSplashArtCoordinateInput = {
  data: CreateSplashArtCoordinateDataInput;
};

type CreateSpotlightDataInput = {
  customSubtitle?: InputMaybe<Scalars['String']['input']>;
  customTitle?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<CreateRevisionDataInput>;
  documentId: Scalars['String']['input'];
  documentType: SpotlightDocumentType;
  draft: Scalars['Boolean']['input'];
  duration: Scalars['Float']['input'];
  headerTitle?: InputMaybe<Scalars['String']['input']>;
  headerTitleLeftColor?: InputMaybe<Scalars['String']['input']>;
  headerTitleRightColor?: InputMaybe<Scalars['String']['input']>;
  imageFade?: InputMaybe<Scalars['Boolean']['input']>;
  imageFadeColor?: InputMaybe<Scalars['String']['input']>;
  lastPromotedAt: Scalars['Date']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
  showAuthor?: InputMaybe<Scalars['Boolean']['input']>;
  spotlightDarkImageId?: InputMaybe<Scalars['String']['input']>;
  spotlightImageId?: InputMaybe<Scalars['String']['input']>;
  spotlightSplashImageUrl?: InputMaybe<Scalars['String']['input']>;
  subtitleUrl?: InputMaybe<Scalars['String']['input']>;
};

type CreateSpotlightInput = {
  data: CreateSpotlightDataInput;
};

type CreateSubscriptionDataInput = {
  collectionName: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  state: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

type CreateSubscriptionInput = {
  data: CreateSubscriptionDataInput;
};

type CreateSurveyDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
};

type CreateSurveyInput = {
  data: CreateSurveyDataInput;
};

type CreateSurveyQuestionDataInput = {
  format: SurveyQuestionFormat;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  order: Scalars['Float']['input'];
  question: Scalars['String']['input'];
  surveyId: Scalars['String']['input'];
};

type CreateSurveyQuestionInput = {
  data: CreateSurveyQuestionDataInput;
};

type CreateSurveyResponseDataInput = {
  clientId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  response: Scalars['JSON']['input'];
  surveyId: Scalars['String']['input'];
  surveyScheduleId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

type CreateSurveyResponseInput = {
  data: CreateSurveyResponseDataInput;
};

type CreateSurveyScheduleDataInput = {
  clientIds?: InputMaybe<Array<Scalars['String']['input']>>;
  deactivated?: InputMaybe<Scalars['Boolean']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  impressionsLimit?: InputMaybe<Scalars['Float']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  maxKarma?: InputMaybe<Scalars['Float']['input']>;
  maxVisitorPercentage?: InputMaybe<Scalars['Float']['input']>;
  minKarma?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['Date']['input']>;
  surveyId: Scalars['String']['input'];
  target: SurveyScheduleTarget;
};

type CreateSurveyScheduleInput = {
  data: CreateSurveyScheduleDataInput;
};

type CreateTagDataInput = {
  adminOnly?: InputMaybe<Scalars['Boolean']['input']>;
  autoTagModel?: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt?: InputMaybe<Scalars['String']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canEditUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  canVoteOnRels?: InputMaybe<Array<TagRelVoteGroup>>;
  core?: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId?: InputMaybe<Scalars['String']['input']>;
  defaultOrder?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<CreateRevisionDataInput>;
  descriptionTruncationCount?: InputMaybe<Scalars['Float']['input']>;
  forceAllowType3Audio?: InputMaybe<Scalars['Boolean']['input']>;
  introSequenceId?: InputMaybe<Scalars['String']['input']>;
  isPostType?: InputMaybe<Scalars['Boolean']['input']>;
  isSubforum?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines?: InputMaybe<CreateRevisionDataInput>;
  name: Scalars['String']['input'];
  parentTagId?: InputMaybe<Scalars['String']['input']>;
  postsDefaultSortOrder?: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  squareImageId?: InputMaybe<Scalars['String']['input']>;
  subTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  subforumIntroPostId?: InputMaybe<Scalars['String']['input']>;
  subforumModeratorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  subforumWelcomeText?: InputMaybe<CreateRevisionDataInput>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  suggestedAsFilter?: InputMaybe<Scalars['Boolean']['input']>;
  tagFlagsIds?: InputMaybe<Array<Scalars['String']['input']>>;
  wikiGrade?: InputMaybe<Scalars['Int']['input']>;
  wikiOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

type CreateTagFlagDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Float']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

type CreateTagFlagInput = {
  data: CreateTagFlagDataInput;
};

type CreateTagInput = {
  data: CreateTagDataInput;
};

type CreateUltraFeedEventDataInput = {
  collectionName: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  event?: InputMaybe<Scalars['JSON']['input']>;
  eventType: Scalars['String']['input'];
  feedItemId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type CreateUltraFeedEventInput = {
  data: CreateUltraFeedEventDataInput;
};

type CreateUserDataInput = {
  acceptedTos?: InputMaybe<Scalars['Boolean']['input']>;
  acknowledgedNewUserGuidelines?: InputMaybe<Scalars['Boolean']['input']>;
  afSubmittedApplication?: InputMaybe<Scalars['Boolean']['input']>;
  allCommentingDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsFilter?: InputMaybe<Scalars['String']['input']>;
  allPostsHideCommunity?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsIncludeEvents?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsOpenSettings?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsShowLowKarma?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsSorting?: InputMaybe<Scalars['String']['input']>;
  allPostsTimeframe?: InputMaybe<Scalars['String']['input']>;
  allowDatadogSessionReplay?: InputMaybe<Scalars['Boolean']['input']>;
  autoSubscribeAsOrganizer?: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_comments?: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_posts?: InputMaybe<Scalars['Boolean']['input']>;
  banned?: InputMaybe<Scalars['Date']['input']>;
  bannedPersonalUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  bannedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  biography?: InputMaybe<CreateRevisionDataInput>;
  blueskyProfileURL?: InputMaybe<Scalars['String']['input']>;
  careerStage?: InputMaybe<Array<Scalars['String']['input']>>;
  collapseModerationGuidelines?: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting?: InputMaybe<Scalars['String']['input']>;
  commentingOnOtherUsersDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  criticismTipsDismissed?: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter?: InputMaybe<Scalars['String']['input']>;
  deleteContent?: InputMaybe<Scalars['Boolean']['input']>;
  displayName: Scalars['String']['input'];
  draftsListShowArchived?: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared?: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailSubscribedToCurated?: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections?: InputMaybe<ExpandedFrontpageSectionsSettingsInput>;
  facebookProfileURL?: InputMaybe<Scalars['String']['input']>;
  fmCrosspostUserId?: InputMaybe<Scalars['String']['input']>;
  frontpageFilterSettings?: InputMaybe<Scalars['JSON']['input']>;
  frontpageSelectedTab?: InputMaybe<Scalars['String']['input']>;
  githubProfileURL?: InputMaybe<Scalars['String']['input']>;
  googleLocation?: InputMaybe<Scalars['JSON']['input']>;
  groups?: InputMaybe<Array<Scalars['String']['input']>>;
  hideActiveDialogueUsers?: InputMaybe<Scalars['Boolean']['input']>;
  hideCommunitySection?: InputMaybe<Scalars['Boolean']['input']>;
  hideDialogueFacilitation?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPeopleDirectory?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2019Ad?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2020Ad?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBookAd?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageFilterSettingsDesktop?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageMap?: InputMaybe<Scalars['Boolean']['input']>;
  hideHomeRHS?: InputMaybe<Scalars['Boolean']['input']>;
  hideIntercom?: InputMaybe<Scalars['Boolean']['input']>;
  hideJobAdUntil?: InputMaybe<Scalars['Date']['input']>;
  hideMeetupsPoke?: InputMaybe<Scalars['Boolean']['input']>;
  hideNavigationSidebar?: InputMaybe<Scalars['Boolean']['input']>;
  hidePostsRecommendations?: InputMaybe<Scalars['Boolean']['input']>;
  hideSubscribePoke?: InputMaybe<Scalars['Boolean']['input']>;
  hideSunshineSidebar?: InputMaybe<Scalars['Boolean']['input']>;
  hideTaggingProgressBar?: InputMaybe<Scalars['Boolean']['input']>;
  howICanHelpOthers?: InputMaybe<CreateRevisionDataInput>;
  howOthersCanHelpMe?: InputMaybe<CreateRevisionDataInput>;
  inactiveSurveyEmailSentAt?: InputMaybe<Scalars['Date']['input']>;
  isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  karmaChangeBatchStart?: InputMaybe<Scalars['Date']['input']>;
  karmaChangeLastOpened?: InputMaybe<Scalars['Date']['input']>;
  karmaChangeNotifierSettings?: InputMaybe<Scalars['JSON']['input']>;
  lastNotificationsCheck?: InputMaybe<Scalars['Date']['input']>;
  lastUsedTimezone?: InputMaybe<Scalars['String']['input']>;
  legacy?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  linkedinProfileURL?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  mapLocation?: InputMaybe<Scalars['JSON']['input']>;
  mapMarkerText?: InputMaybe<Scalars['String']['input']>;
  moderationGuidelines?: InputMaybe<CreateRevisionDataInput>;
  moderationStyle?: InputMaybe<Scalars['String']['input']>;
  moderatorAssistance?: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotificationsLocation?: InputMaybe<Scalars['JSON']['input']>;
  nearbyEventsNotificationsRadius?: InputMaybe<Scalars['Float']['input']>;
  nearbyPeopleNotificationThreshold?: InputMaybe<Scalars['Float']['input']>;
  noCollapseCommentsFrontpage?: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsPosts?: InputMaybe<Scalars['Boolean']['input']>;
  noExpandUnreadCommentsReview?: InputMaybe<Scalars['Boolean']['input']>;
  noKibitz?: InputMaybe<Scalars['Boolean']['input']>;
  noSingleLineComments?: InputMaybe<Scalars['Boolean']['input']>;
  notificationAddedAsCoauthor?: InputMaybe<Scalars['JSON']['input']>;
  notificationAlignmentSubmissionApproved?: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnDraft?: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnSubscribedPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateCommentsOnSubscribedPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateReplies?: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMatch?: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMessages?: InputMaybe<Scalars['JSON']['input']>;
  notificationEventInRadius?: InputMaybe<Scalars['JSON']['input']>;
  notificationGroupAdministration?: InputMaybe<Scalars['JSON']['input']>;
  notificationKarmaPowersGained?: InputMaybe<Scalars['JSON']['input']>;
  notificationNewDialogueChecks?: InputMaybe<Scalars['JSON']['input']>;
  notificationNewMention?: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsInGroups?: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsNominatedReview?: InputMaybe<Scalars['JSON']['input']>;
  notificationPrivateMessage?: InputMaybe<Scalars['JSON']['input']>;
  notificationPublishedDialogueMessages?: InputMaybe<Scalars['JSON']['input']>;
  notificationRSVPs?: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToMyComments?: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToSubscribedComments?: InputMaybe<Scalars['JSON']['input']>;
  notificationSharedWithMe?: InputMaybe<Scalars['JSON']['input']>;
  notificationShortformContent?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubforumUnread?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedSequencePost?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedTagPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserComment?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationYourTurnMatchForm?: InputMaybe<Scalars['JSON']['input']>;
  nullifyVotes?: InputMaybe<Scalars['Boolean']['input']>;
  optedInToDialogueFacilitation?: InputMaybe<Scalars['Boolean']['input']>;
  optedOutOfSurveys?: InputMaybe<Scalars['Boolean']['input']>;
  organization?: InputMaybe<Scalars['String']['input']>;
  organizerOfGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  petrovOptOut?: InputMaybe<Scalars['Boolean']['input']>;
  postGlossariesPinned?: InputMaybe<Scalars['Boolean']['input']>;
  postingDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  previousDisplayName?: InputMaybe<Scalars['String']['input']>;
  profileTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  profileUpdatedAt?: InputMaybe<Scalars['Date']['input']>;
  programParticipation?: InputMaybe<Array<Scalars['String']['input']>>;
  revealChecksToAdmins?: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentForumUserId?: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  shortformFeedId?: InputMaybe<Scalars['String']['input']>;
  showCommunityInRecentDiscussion?: InputMaybe<Scalars['Boolean']['input']>;
  showDialoguesList?: InputMaybe<Scalars['Boolean']['input']>;
  showHideKarmaOption?: InputMaybe<Scalars['Boolean']['input']>;
  showMatches?: InputMaybe<Scalars['Boolean']['input']>;
  showMyDialogues?: InputMaybe<Scalars['Boolean']['input']>;
  showPostAuthorCard?: InputMaybe<Scalars['Boolean']['input']>;
  showRecommendedPartners?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  subforumPreferredLayout?: InputMaybe<SubforumPreferredLayout>;
  subscribedToDigest?: InputMaybe<Scalars['Boolean']['input']>;
  subscribedToNewsletter?: InputMaybe<Scalars['Boolean']['input']>;
  theme?: InputMaybe<Scalars['JSON']['input']>;
  twitterProfileURL?: InputMaybe<Scalars['String']['input']>;
  twitterProfileURLAdmin?: InputMaybe<Scalars['String']['input']>;
  unsubscribeFromAll?: InputMaybe<Scalars['Boolean']['input']>;
  userSurveyEmailSentAt?: InputMaybe<Scalars['Date']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  viewUnreviewedComments?: InputMaybe<Scalars['Boolean']['input']>;
  voteBanned?: InputMaybe<Scalars['Boolean']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  whenConfirmationEmailSent?: InputMaybe<Scalars['Date']['input']>;
};

type CreateUserEAGDetailDataInput = {
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

type CreateUserEAGDetailInput = {
  data: CreateUserEAGDetailDataInput;
};

type CreateUserInput = {
  data: CreateUserDataInput;
};

type CreateUserJobAdDataInput = {
  adState: Scalars['String']['input'];
  jobName: Scalars['String']['input'];
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  reminderSetAt?: InputMaybe<Scalars['Date']['input']>;
  userId: Scalars['String']['input'];
};

type CreateUserJobAdInput = {
  data: CreateUserJobAdDataInput;
};

type CreateUserMostValuablePostDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

type CreateUserMostValuablePostInput = {
  data: CreateUserMostValuablePostDataInput;
};

type CreateUserRateLimitDataInput = {
  actionsPerInterval: Scalars['Float']['input'];
  endedAt: Scalars['Date']['input'];
  intervalLength: Scalars['Float']['input'];
  intervalUnit: UserRateLimitIntervalUnit;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type: UserRateLimitType;
  userId: Scalars['String']['input'];
};

type CreateUserRateLimitInput = {
  data: CreateUserRateLimitDataInput;
};

type CreateUserTagRelDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  subforumEmailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost?: InputMaybe<Scalars['Boolean']['input']>;
  subforumShowUnreadInSidebar?: InputMaybe<Scalars['Boolean']['input']>;
  tagId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

type CreateUserTagRelInput = {
  data: CreateUserTagRelDataInput;
};

type CronHistory = {
  __typename?: 'CronHistory';
  _id?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['Date']['output']>;
  intendedAt?: Maybe<Scalars['Date']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  result?: Maybe<Scalars['JSON']['output']>;
  startedAt?: Maybe<Scalars['Date']['output']>;
};

type CrossedKarmaThresholdResult = {
  __typename?: 'CrossedKarmaThresholdResult';
  results: Array<Post>;
};

type CrosspostInput = {
  foreignPostId?: InputMaybe<Scalars['String']['input']>;
  hostedHere?: InputMaybe<Scalars['Boolean']['input']>;
  isCrosspost: Scalars['Boolean']['input'];
};

type CrosspostOutput = {
  __typename?: 'CrosspostOutput';
  foreignPostId?: Maybe<Scalars['String']['output']>;
  hostedHere?: Maybe<Scalars['Boolean']['output']>;
  isCrosspost: Scalars['Boolean']['output'];
};

type CuratedAndPopularThisWeekResult = {
  __typename?: 'CuratedAndPopularThisWeekResult';
  results: Array<Post>;
};

type CurationEmail = {
  __typename?: 'CurationEmail';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type CurationNotice = {
  __typename?: 'CurationNotice';
  _id: Scalars['String']['output'];
  comment?: Maybe<Comment>;
  commentId?: Maybe<Scalars['String']['output']>;
  contents: Revision;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post: Post;
  postId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  user: User;
  userId: Scalars['String']['output'];
};


type CurationNoticecontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type CurationNoticeOutput = {
  __typename?: 'CurationNoticeOutput';
  data?: Maybe<CurationNotice>;
};

type CurationNoticeSelector = {
  curationNoticesPage?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type DatabaseMetadata = {
  __typename?: 'DatabaseMetadata';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type DebouncerEvents = {
  __typename?: 'DebouncerEvents';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type DialogueCheck = {
  __typename?: 'DialogueCheck';
  _id: Scalars['String']['output'];
  checked?: Maybe<Scalars['Boolean']['output']>;
  checkedAt?: Maybe<Scalars['Date']['output']>;
  createdAt: Scalars['Date']['output'];
  hideInRecommendations?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  matchPreference?: Maybe<DialogueMatchPreference>;
  reciprocalMatchPreference?: Maybe<DialogueMatchPreference>;
  schemaVersion: Scalars['Float']['output'];
  targetUserId?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

type DialogueCheckSelector = {
  default?: InputMaybe<EmptyViewInput>;
  userDialogueChecks?: InputMaybe<DialogueChecksUserDialogueChecksInput>;
  userTargetDialogueChecks?: InputMaybe<DialogueChecksUserTargetDialogueChecksInput>;
};

type DialogueChecksUserDialogueChecksInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type DialogueChecksUserTargetDialogueChecksInput = {
  targetUserIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type DialogueMatchPreference = {
  __typename?: 'DialogueMatchPreference';
  _id: Scalars['String']['output'];
  asyncPreference?: Maybe<Scalars['String']['output']>;
  calendlyLink?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  dialogueCheck?: Maybe<DialogueCheck>;
  dialogueCheckId?: Maybe<Scalars['String']['output']>;
  formatNotes?: Maybe<Scalars['String']['output']>;
  generatedDialogueId?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  syncPreference?: Maybe<Scalars['String']['output']>;
  topicNotes?: Maybe<Scalars['String']['output']>;
  topicPreferences?: Maybe<Array<Scalars['JSON']['output']>>;
};

type DialogueMatchPreferenceSelector = {
  default?: InputMaybe<EmptyViewInput>;
  dialogueMatchPreferences?: InputMaybe<DialogueMatchPreferencesDialogueMatchPreferencesInput>;
};

type DialogueMatchPreferencesDialogueMatchPreferencesInput = {
  dialogueCheckId?: InputMaybe<Scalars['String']['input']>;
};

type Digest = {
  __typename?: 'Digest';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  endDate?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  num: Scalars['Float']['output'];
  onsiteImageId?: Maybe<Scalars['String']['output']>;
  onsitePrimaryColor?: Maybe<Scalars['String']['output']>;
  publishedDate?: Maybe<Scalars['Date']['output']>;
  schemaVersion: Scalars['Float']['output'];
  startDate: Scalars['Date']['output'];
};

type DigestHighlightsResult = {
  __typename?: 'DigestHighlightsResult';
  results: Array<Post>;
};

type DigestOutput = {
  __typename?: 'DigestOutput';
  data?: Maybe<Digest>;
};

type DigestPlannerPost = {
  __typename?: 'DigestPlannerPost';
  digestPost?: Maybe<DigestPost>;
  post: Post;
  rating: Scalars['Int']['output'];
};

type DigestPost = {
  __typename?: 'DigestPost';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  digest: Digest;
  digestId: Scalars['String']['output'];
  emailDigestStatus?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  onsiteDigestStatus?: Maybe<Scalars['String']['output']>;
  post?: Maybe<Post>;
  postId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
};

type DigestPostOutput = {
  __typename?: 'DigestPostOutput';
  data?: Maybe<DigestPost>;
};

type DigestPostSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type DigestPostsThisWeekResult = {
  __typename?: 'DigestPostsThisWeekResult';
  results: Array<Post>;
};

type DigestSelector = {
  all?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  findByNum?: InputMaybe<DigestsFindByNumInput>;
};

type DigestsFindByNumInput = {
  num?: InputMaybe<Scalars['String']['input']>;
};

type DocumentDeletion = {
  __typename?: 'DocumentDeletion';
  createdAt: Scalars['Date']['output'];
  docFields?: Maybe<MultiDocument>;
  documentId: Scalars['String']['output'];
  netChange: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

type ElectionCandidate = {
  __typename?: 'ElectionCandidate';
  _id: Scalars['String']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  amountRaised?: Maybe<Scalars['Float']['output']>;
  baseScore: Scalars['Float']['output'];
  createdAt: Scalars['Date']['output'];
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  electionName: Scalars['String']['output'];
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  fundraiserLink?: Maybe<Scalars['String']['output']>;
  gwwcId?: Maybe<Scalars['String']['output']>;
  gwwcLink?: Maybe<Scalars['String']['output']>;
  href: Scalars['String']['output'];
  isElectionFundraiser: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  logoSrc: Scalars['String']['output'];
  name: Scalars['String']['output'];
  postCount: Scalars['Float']['output'];
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  tag?: Maybe<Tag>;
  tagId: Scalars['String']['output'];
  targetAmount?: Maybe<Scalars['Float']['output']>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  voteCount: Scalars['Float']['output'];
};

type ElectionCandidateDefaultViewInput = {
  electionName?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
};

type ElectionCandidateOutput = {
  __typename?: 'ElectionCandidateOutput';
  data?: Maybe<ElectionCandidate>;
};

type ElectionCandidateSelector = {
  default?: InputMaybe<ElectionCandidateDefaultViewInput>;
};

type ElectionVote = {
  __typename?: 'ElectionVote';
  _id: Scalars['String']['output'];
  compareState?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['Date']['output'];
  electionName?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  submissionComments?: Maybe<Scalars['JSON']['output']>;
  submittedAt?: Maybe<Scalars['Date']['output']>;
  user?: Maybe<User>;
  userExplanation?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  userOtherComments?: Maybe<Scalars['String']['output']>;
  vote?: Maybe<Scalars['JSON']['output']>;
};

type ElectionVoteDefaultViewInput = {
  electionName?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ElectionVoteOutput = {
  __typename?: 'ElectionVoteOutput';
  data?: Maybe<ElectionVote>;
};

type ElectionVoteSelector = {
  allSubmittedVotes?: InputMaybe<ElectionVotesAllSubmittedVotesInput>;
  default?: InputMaybe<ElectionVoteDefaultViewInput>;
};

type ElectionVotesAllSubmittedVotesInput = {
  electionName?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ElicitBlockData = {
  __typename?: 'ElicitBlockData';
  _id?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  predictions?: Maybe<Array<Maybe<ElicitPrediction>>>;
  resolution?: Maybe<Scalars['Boolean']['output']>;
  resolvesBy?: Maybe<Scalars['Date']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

type ElicitPrediction = {
  __typename?: 'ElicitPrediction';
  _id?: Maybe<Scalars['String']['output']>;
  binaryQuestionId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  creator?: Maybe<ElicitUser>;
  notes?: Maybe<Scalars['String']['output']>;
  prediction?: Maybe<Scalars['Float']['output']>;
  predictionId?: Maybe<Scalars['String']['output']>;
  sourceId?: Maybe<Scalars['String']['output']>;
  sourceUrl?: Maybe<Scalars['String']['output']>;
};

type ElicitQuestion = {
  __typename?: 'ElicitQuestion';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  resolution?: Maybe<Scalars['String']['output']>;
  resolvesBy?: Maybe<Scalars['Date']['output']>;
  schemaVersion: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

type ElicitQuestionOutput = {
  __typename?: 'ElicitQuestionOutput';
  data?: Maybe<ElicitQuestion>;
};

type ElicitQuestionPrediction = {
  __typename?: 'ElicitQuestionPrediction';
  _id: Scalars['String']['output'];
  binaryQuestionId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  creator: ElicitQuestionPredictionCreator;
  isDeleted: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  prediction?: Maybe<Scalars['Float']['output']>;
  predictionId?: Maybe<Scalars['String']['output']>;
  question: ElicitQuestion;
  sourceId?: Maybe<Scalars['String']['output']>;
  sourceUrl?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type ElicitQuestionPredictionCreator = {
  __typename?: 'ElicitQuestionPredictionCreator';
  _id: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  isQuestionCreator: Scalars['Boolean']['output'];
  sourceUserId?: Maybe<Scalars['String']['output']>;
};

type ElicitQuestionPredictionSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type ElicitQuestionSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type ElicitUser = {
  __typename?: 'ElicitUser';
  _id?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  isQuestionCreator?: Maybe<Scalars['Boolean']['output']>;
  lwUser?: Maybe<User>;
  sourceUserId?: Maybe<Scalars['String']['output']>;
};

type EmailPreview = {
  __typename?: 'EmailPreview';
  html?: Maybe<Scalars['String']['output']>;
  subject?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  to?: Maybe<Scalars['String']['output']>;
};

type EmailTokens = {
  __typename?: 'EmailTokens';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type EmptyViewInput = {
  /** @deprecated GraphQL doesn't support empty input types, so we need to provide a field.  Don't pass anything in, it doesn't do anything. */
  _?: InputMaybe<Scalars['Boolean']['input']>;
};

type ExpandedFrontpageSectionsSettingsInput = {
  community?: InputMaybe<Scalars['Boolean']['input']>;
  popularComments?: InputMaybe<Scalars['Boolean']['input']>;
  quickTakes?: InputMaybe<Scalars['Boolean']['input']>;
  quickTakesCommunity?: InputMaybe<Scalars['Boolean']['input']>;
  recommendations?: InputMaybe<Scalars['Boolean']['input']>;
};

type ExpandedFrontpageSectionsSettingsOutput = {
  __typename?: 'ExpandedFrontpageSectionsSettingsOutput';
  community?: Maybe<Scalars['Boolean']['output']>;
  popularComments?: Maybe<Scalars['Boolean']['output']>;
  quickTakes?: Maybe<Scalars['Boolean']['output']>;
  quickTakesCommunity?: Maybe<Scalars['Boolean']['output']>;
  recommendations?: Maybe<Scalars['Boolean']['output']>;
};

type ExternalPost = {
  __typename?: 'ExternalPost';
  _id: Scalars['String']['output'];
  coauthorStatuses?: Maybe<Array<Maybe<CoauthorStatus>>>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  draft?: Maybe<Scalars['Boolean']['output']>;
  modifiedAt?: Maybe<Scalars['Date']['output']>;
  postedAt?: Maybe<Scalars['Date']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

type ExternalPostImportData = {
  __typename?: 'ExternalPostImportData';
  alreadyExists?: Maybe<Scalars['Boolean']['output']>;
  post?: Maybe<ExternalPost>;
};

type FeaturedResource = {
  __typename?: 'FeaturedResource';
  _id: Scalars['String']['output'];
  body?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  ctaText: Scalars['String']['output'];
  ctaUrl: Scalars['String']['output'];
  expiresAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

type FeaturedResourceSelector = {
  activeResources?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type FeedCommentThread = {
  __typename?: 'FeedCommentThread';
  _id: Scalars['String']['output'];
  commentMetaInfos?: Maybe<Scalars['JSON']['output']>;
  comments: Array<Comment>;
  post?: Maybe<Post>;
};

type FeedPost = {
  __typename?: 'FeedPost';
  _id: Scalars['String']['output'];
  post: Post;
  postMetaInfo?: Maybe<Scalars['JSON']['output']>;
};

type FeedSpotlightItem = {
  __typename?: 'FeedSpotlightItem';
  _id: Scalars['String']['output'];
  spotlight?: Maybe<Spotlight>;
};

type FieldChange = {
  __typename?: 'FieldChange';
  _id: Scalars['String']['output'];
  changeGroup?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  documentId?: Maybe<Scalars['String']['output']>;
  fieldName?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  newValue?: Maybe<Scalars['JSON']['output']>;
  oldValue?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type FieldChangeSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type ForumEvent = {
  __typename?: 'ForumEvent';
  _id: Scalars['String']['output'];
  bannerImageId?: Maybe<Scalars['String']['output']>;
  bannerTextColor: Scalars['String']['output'];
  commentPrompt?: Maybe<Scalars['String']['output']>;
  contrastColor?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  customComponent: ForumEventCustomComponent;
  darkColor: Scalars['String']['output'];
  endDate?: Maybe<Scalars['Date']['output']>;
  eventFormat: ForumEventFormat;
  frontpageDescription?: Maybe<Revision>;
  frontpageDescriptionMobile?: Maybe<Revision>;
  frontpageDescriptionMobile_latest?: Maybe<Scalars['String']['output']>;
  frontpageDescription_latest?: Maybe<Scalars['String']['output']>;
  includesPoll: Scalars['Boolean']['output'];
  isGlobal: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  lightColor: Scalars['String']['output'];
  maxStickersPerUser: Scalars['Float']['output'];
  pollAgreeWording?: Maybe<Scalars['String']['output']>;
  pollDisagreeWording?: Maybe<Scalars['String']['output']>;
  pollQuestion?: Maybe<Revision>;
  pollQuestion_latest?: Maybe<Scalars['String']['output']>;
  post?: Maybe<Post>;
  postId?: Maybe<Scalars['String']['output']>;
  postPageDescription?: Maybe<Revision>;
  postPageDescription_latest?: Maybe<Scalars['String']['output']>;
  publicData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  startDate: Scalars['Date']['output'];
  tag?: Maybe<Tag>;
  tagId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  voteCount: Scalars['Int']['output'];
};


type ForumEventfrontpageDescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type ForumEventfrontpageDescriptionMobileArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type ForumEventpollQuestionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type ForumEventpostPageDescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type ForumEventCustomComponent =
  | 'GivingSeason2024Banner';

type ForumEventFormat =
  | 'BASIC'
  | 'POLL'
  | 'STICKERS';

type ForumEventOutput = {
  __typename?: 'ForumEventOutput';
  data?: Maybe<ForumEvent>;
};

type ForumEventSelector = {
  currentAndRecentForumEvents?: InputMaybe<ForumEventsCurrentAndRecentForumEventsInput>;
  currentForumEvent?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  pastForumEvents?: InputMaybe<ForumEventsPastForumEventsInput>;
  upcomingForumEvents?: InputMaybe<ForumEventsUpcomingForumEventsInput>;
};

type ForumEventsCurrentAndRecentForumEventsInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type ForumEventsPastForumEventsInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type ForumEventsUpcomingForumEventsInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type GardenCode = {
  __typename?: 'GardenCode';
  _id: Scalars['String']['output'];
  afOnly: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  endTime: Scalars['Date']['output'];
  fbLink?: Maybe<Scalars['String']['output']>;
  hidden: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  pingbacks?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  slug: Scalars['String']['output'];
  startTime?: Maybe<Scalars['Date']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};


type GardenCodecontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type GardenCodeDefaultViewInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type GardenCodeSelector = {
  default?: InputMaybe<GardenCodeDefaultViewInput>;
  gardenCodeByCode?: InputMaybe<GardenCodesGardenCodeByCodeInput>;
  publicGardenCodes?: InputMaybe<GardenCodesPublicGardenCodesInput>;
  usersPrivateGardenCodes?: InputMaybe<GardenCodesUsersPrivateGardenCodesInput>;
};

type GardenCodesGardenCodeByCodeInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type GardenCodesPublicGardenCodesInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type GardenCodesUsersPrivateGardenCodesInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type GivingSeasonHeart = {
  __typename?: 'GivingSeasonHeart';
  displayName: Scalars['String']['output'];
  theta: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

type GoogleServiceAccountSession = {
  __typename?: 'GoogleServiceAccountSession';
  _id: Scalars['String']['output'];
  active?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['Date']['output'];
  email?: Maybe<Scalars['String']['output']>;
  estimatedExpiry?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  revoked?: Maybe<Scalars['Boolean']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type GoogleServiceAccountSessionSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type GoogleVertexPostsResult = {
  __typename?: 'GoogleVertexPostsResult';
  results: Array<VertexRecommendedPost>;
};

type Images = {
  __typename?: 'Images';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type JargonTerm = {
  __typename?: 'JargonTerm';
  _id: Scalars['String']['output'];
  altTerms: Array<Scalars['String']['output']>;
  approved: Scalars['Boolean']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  humansAndOrAIEdited?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  term: Scalars['String']['output'];
};


type JargonTermcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type JargonTermOutput = {
  __typename?: 'JargonTermOutput';
  data?: Maybe<JargonTerm>;
};

type JargonTermSelector = {
  default?: InputMaybe<EmptyViewInput>;
  glossaryEditAll?: InputMaybe<EmptyViewInput>;
  postEditorJargonTerms?: InputMaybe<JargonTermsPostEditorJargonTermsInput>;
  postsApprovedJargon?: InputMaybe<JargonTermsPostsApprovedJargonInput>;
};

type JargonTermsPostEditorJargonTermsInput = {
  postId?: InputMaybe<Scalars['String']['input']>;
};

type JargonTermsPostsApprovedJargonInput = {
  postIds?: InputMaybe<Scalars['String']['input']>;
};

type KarmaChanges = {
  __typename?: 'KarmaChanges';
  comments: Array<CommentKarmaChange>;
  endDate?: Maybe<Scalars['Date']['output']>;
  nextBatchDate?: Maybe<Scalars['Date']['output']>;
  posts: Array<PostKarmaChange>;
  startDate?: Maybe<Scalars['Date']['output']>;
  tagRevisions: Array<RevisionsKarmaChange>;
  thisWeeksKarmaChanges?: Maybe<KarmaChangesSimple>;
  todaysKarmaChanges?: Maybe<KarmaChangesSimple>;
  totalChange: Scalars['Int']['output'];
  updateFrequency: Scalars['String']['output'];
};

type KarmaChangesSimple = {
  __typename?: 'KarmaChangesSimple';
  comments: Array<CommentKarmaChange>;
  posts: Array<PostKarmaChange>;
  tagRevisions: Array<RevisionsKarmaChange>;
};

type LWEvent = {
  __typename?: 'LWEvent';
  _id: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  important?: Maybe<Scalars['Boolean']['output']>;
  intercom?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  properties?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type LWEventOutput = {
  __typename?: 'LWEventOutput';
  data?: Maybe<LWEvent>;
};

type LWEventSelector = {
  adminView?: InputMaybe<LWEventsAdminViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  emailHistory?: InputMaybe<LWEventsEmailHistoryInput>;
  gatherTownUsers?: InputMaybe<EmptyViewInput>;
  postVisits?: InputMaybe<LWEventsPostVisitsInput>;
};

type LWEventsAdminViewInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

type LWEventsEmailHistoryInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type LWEventsPostVisitsInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type LatLng = {
  __typename?: 'LatLng';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

type LegacyData = {
  __typename?: 'LegacyData';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type LlmConversation = {
  __typename?: 'LlmConversation';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  lastUpdatedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  messages?: Maybe<Array<LlmMessage>>;
  model?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  systemPrompt?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  totalCharacterCount?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type LlmConversationOutput = {
  __typename?: 'LlmConversationOutput';
  data?: Maybe<LlmConversation>;
};

type LlmConversationSelector = {
  default?: InputMaybe<EmptyViewInput>;
  llmConversationsAll?: InputMaybe<LlmConversationsLlmConversationsAllInput>;
  llmConversationsWithUser?: InputMaybe<LlmConversationsLlmConversationsWithUserInput>;
};

type LlmConversationsLlmConversationsAllInput = {
  showDeleted?: InputMaybe<Scalars['String']['input']>;
};

type LlmConversationsLlmConversationsWithUserInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type LlmMessage = {
  __typename?: 'LlmMessage';
  _id: Scalars['String']['output'];
  content?: Maybe<Scalars['String']['output']>;
  conversationId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type Localgroup = {
  __typename?: 'Localgroup';
  _id: Scalars['String']['output'];
  bannerImageId?: Maybe<Scalars['String']['output']>;
  categories?: Maybe<Array<Scalars['String']['output']>>;
  contactInfo?: Maybe<Scalars['String']['output']>;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  facebookLink?: Maybe<Scalars['String']['output']>;
  facebookPageLink?: Maybe<Scalars['String']['output']>;
  googleLocation?: Maybe<Scalars['JSON']['output']>;
  inactive: Scalars['Boolean']['output'];
  isOnline: Scalars['Boolean']['output'];
  lastActivity: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  meetupLink?: Maybe<Scalars['String']['output']>;
  mongoLocation?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  nameInAnotherLanguage?: Maybe<Scalars['String']['output']>;
  organizerIds: Array<Scalars['String']['output']>;
  organizers: Array<User>;
  schemaVersion: Scalars['Float']['output'];
  slackLink?: Maybe<Scalars['String']['output']>;
  types: Array<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};


type LocalgroupcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupDefaultViewInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupOutput = {
  __typename?: 'LocalgroupOutput';
  data?: Maybe<Localgroup>;
};

type LocalgroupSelector = {
  all?: InputMaybe<LocalgroupsAllInput>;
  default?: InputMaybe<LocalgroupDefaultViewInput>;
  local?: InputMaybe<LocalgroupsLocalInput>;
  nearby?: InputMaybe<LocalgroupsNearbyInput>;
  online?: InputMaybe<LocalgroupsOnlineInput>;
  single?: InputMaybe<LocalgroupsSingleInput>;
  userActiveGroups?: InputMaybe<LocalgroupsUserActiveGroupsInput>;
  userInactiveGroups?: InputMaybe<LocalgroupsUserInactiveGroupsInput>;
  userOrganizesGroups?: InputMaybe<LocalgroupsUserOrganizesGroupsInput>;
};

type LocalgroupsAllInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsLocalInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsNearbyInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
  lat?: InputMaybe<Scalars['String']['input']>;
  lng?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsOnlineInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsSingleInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsUserActiveGroupsInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsUserInactiveGroupsInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type LocalgroupsUserOrganizesGroupsInput = {
  filters?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type LoginReturnData = {
  __typename?: 'LoginReturnData';
  token?: Maybe<Scalars['String']['output']>;
};

type ManifoldProbabilitiesCache = {
  __typename?: 'ManifoldProbabilitiesCache';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  isResolved: Scalars['Boolean']['output'];
  lastUpdated: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  marketId: Scalars['String']['output'];
  probability: Scalars['Float']['output'];
  schemaVersion: Scalars['Float']['output'];
  url?: Maybe<Scalars['String']['output']>;
  year: Scalars['Float']['output'];
};

type Message = {
  __typename?: 'Message';
  _id: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  conversation?: Maybe<Conversation>;
  conversationId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  noEmail?: Maybe<Scalars['Boolean']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};


type MessagecontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type MessageOutput = {
  __typename?: 'MessageOutput';
  data?: Maybe<Message>;
};

type MessageSelector = {
  conversationPreview?: InputMaybe<MessagesConversationPreviewInput>;
  default?: InputMaybe<EmptyViewInput>;
  messagesConversation?: InputMaybe<MessagesMessagesConversationInput>;
};

type MessagesConversationPreviewInput = {
  conversationId?: InputMaybe<Scalars['String']['input']>;
};

type MessagesMessagesConversationInput = {
  conversationId?: InputMaybe<Scalars['String']['input']>;
};

type Migration = {
  __typename?: 'Migration';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type MigrationRun = {
  __typename?: 'MigrationRun';
  finished?: Maybe<Scalars['Date']['output']>;
  name: Scalars['String']['output'];
  started: Scalars['Date']['output'];
  succeeded?: Maybe<Scalars['Boolean']['output']>;
};

type MigrationStatus = {
  __typename?: 'MigrationStatus';
  dateWritten?: Maybe<Scalars['String']['output']>;
  lastRun?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  runs?: Maybe<Array<MigrationRun>>;
};

type MigrationsDashboardData = {
  __typename?: 'MigrationsDashboardData';
  migrations?: Maybe<Array<MigrationStatus>>;
};

type ModerationTemplate = {
  __typename?: 'ModerationTemplate';
  _id: Scalars['String']['output'];
  collectionName: ModerationTemplateType;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  order: Scalars['Float']['output'];
  schemaVersion: Scalars['Float']['output'];
};


type ModerationTemplatecontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type ModerationTemplateOutput = {
  __typename?: 'ModerationTemplateOutput';
  data?: Maybe<ModerationTemplate>;
};

type ModerationTemplateSelector = {
  default?: InputMaybe<EmptyViewInput>;
  moderationTemplatesList?: InputMaybe<ModerationTemplatesModerationTemplatesListInput>;
  moderationTemplatesPage?: InputMaybe<EmptyViewInput>;
};

type ModerationTemplateType =
  | 'Comments'
  | 'Messages'
  | 'Rejections';

type ModerationTemplatesModerationTemplatesListInput = {
  collectionName?: InputMaybe<Scalars['String']['input']>;
};

type ModeratorAction = {
  __typename?: 'ModeratorAction';
  _id: Scalars['String']['output'];
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['Date']['output'];
  endedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  type: ModeratorActionType;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

type ModeratorActionOutput = {
  __typename?: 'ModeratorActionOutput';
  data?: Maybe<ModeratorAction>;
};

type ModeratorActionSelector = {
  default?: InputMaybe<EmptyViewInput>;
  restrictionModerationActions?: InputMaybe<EmptyViewInput>;
  userModeratorActions?: InputMaybe<ModeratorActionsUserModeratorActionsInput>;
};

type ModeratorActionType =
  | 'autoBlockedFromSendingDMs'
  | 'exemptFromRateLimits'
  | 'flaggedForNDMs'
  | 'lowAverageKarmaCommentAlert'
  | 'lowAverageKarmaPostAlert'
  | 'manualFlag'
  | 'movedPostToDraft'
  | 'negativeUserKarmaAlert'
  | 'potentialTargetedDownvoting'
  | 'rateLimitOnePerDay'
  | 'rateLimitOnePerFortnight'
  | 'rateLimitOnePerMonth'
  | 'rateLimitOnePerThreeDays'
  | 'rateLimitOnePerWeek'
  | 'rateLimitThreeCommentsPerPost'
  | 'receivedSeniorDownvotesAlert'
  | 'recentlyDownvotedContentAlert'
  | 'rejectedComment'
  | 'rejectedPost'
  | 'sentModeratorMessage'
  | 'votingPatternWarningDelivered';

type ModeratorActionsUserModeratorActionsInput = {
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type ModeratorIPAddressInfo = {
  __typename?: 'ModeratorIPAddressInfo';
  ip: Scalars['String']['output'];
  userIds: Array<Scalars['String']['output']>;
};

type MostReadAuthor = {
  __typename?: 'MostReadAuthor';
  _id?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  engagementPercentile?: Maybe<Scalars['Float']['output']>;
  profileImageId?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
};

type MostReadTopic = {
  __typename?: 'MostReadTopic';
  count?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  shortName?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
};

type MostReceivedReact = {
  __typename?: 'MostReceivedReact';
  count?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

type MultiAdvisorRequestInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiAdvisorRequestOutput = {
  __typename?: 'MultiAdvisorRequestOutput';
  results?: Maybe<Array<Maybe<AdvisorRequest>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiArbitalTagContentRelInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiArbitalTagContentRelOutput = {
  __typename?: 'MultiArbitalTagContentRelOutput';
  results?: Maybe<Array<Maybe<ArbitalTagContentRel>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiBanInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiBanOutput = {
  __typename?: 'MultiBanOutput';
  results?: Maybe<Array<Maybe<Ban>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiBookInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiBookOutput = {
  __typename?: 'MultiBookOutput';
  results?: Maybe<Array<Maybe<Book>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiBookmarkInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiBookmarkOutput = {
  __typename?: 'MultiBookmarkOutput';
  results?: Maybe<Array<Maybe<Bookmark>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiChapterInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiChapterOutput = {
  __typename?: 'MultiChapterOutput';
  results?: Maybe<Array<Maybe<Chapter>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiCkEditorUserSessionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiCkEditorUserSessionOutput = {
  __typename?: 'MultiCkEditorUserSessionOutput';
  results?: Maybe<Array<Maybe<CkEditorUserSession>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiClientIdInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiClientIdOutput = {
  __typename?: 'MultiClientIdOutput';
  results?: Maybe<Array<Maybe<ClientId>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiCollectionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiCollectionOutput = {
  __typename?: 'MultiCollectionOutput';
  results?: Maybe<Array<Maybe<Collection>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiCommentInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiCommentModeratorActionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiCommentModeratorActionOutput = {
  __typename?: 'MultiCommentModeratorActionOutput';
  results?: Maybe<Array<Maybe<CommentModeratorAction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiCommentOutput = {
  __typename?: 'MultiCommentOutput';
  results?: Maybe<Array<Maybe<Comment>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiConversationInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiConversationOutput = {
  __typename?: 'MultiConversationOutput';
  results?: Maybe<Array<Maybe<Conversation>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiCurationNoticeInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiCurationNoticeOutput = {
  __typename?: 'MultiCurationNoticeOutput';
  results?: Maybe<Array<Maybe<CurationNotice>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiDialogueCheckInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiDialogueCheckOutput = {
  __typename?: 'MultiDialogueCheckOutput';
  results?: Maybe<Array<Maybe<DialogueCheck>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiDialogueMatchPreferenceInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiDialogueMatchPreferenceOutput = {
  __typename?: 'MultiDialogueMatchPreferenceOutput';
  results?: Maybe<Array<Maybe<DialogueMatchPreference>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiDigestInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiDigestOutput = {
  __typename?: 'MultiDigestOutput';
  results?: Maybe<Array<Maybe<Digest>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiDigestPostInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiDigestPostOutput = {
  __typename?: 'MultiDigestPostOutput';
  results?: Maybe<Array<Maybe<DigestPost>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiDocument = {
  __typename?: 'MultiDocument';
  _id: Scalars['String']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  arbitalLinkedPages?: Maybe<ArbitalLinkedPages>;
  baseScore: Scalars['Float']['output'];
  collectionName: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  contributionStats?: Maybe<Scalars['JSON']['output']>;
  contributors?: Maybe<TagContributorsList>;
  createdAt: Scalars['Date']['output'];
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  deleted: Scalars['Boolean']['output'];
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  fieldName: Scalars['String']['output'];
  htmlWithContributorAnnotations?: Maybe<Scalars['String']['output']>;
  index: Scalars['Float']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  oldSlugs: Array<Scalars['String']['output']>;
  parentDocumentId: Scalars['String']['output'];
  parentLens?: Maybe<MultiDocument>;
  parentTag?: Maybe<Tag>;
  pingbacks?: Maybe<Scalars['JSON']['output']>;
  preview?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  slug: Scalars['String']['output'];
  summaries: Array<MultiDocument>;
  tabSubtitle?: Maybe<Scalars['String']['output']>;
  tabTitle: Scalars['String']['output'];
  tableOfContents?: Maybe<Scalars['JSON']['output']>;
  textLastUpdatedAt?: Maybe<Scalars['Date']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  voteCount: Scalars['Float']['output'];
};


type MultiDocumentcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type MultiDocumentcontributorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


type MultiDocumenttableOfContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type MultiDocumentDefaultViewInput = {
  excludedDocumentIds?: InputMaybe<Scalars['String']['input']>;
};

type MultiDocumentOutput = {
  __typename?: 'MultiDocumentOutput';
  data?: Maybe<MultiDocument>;
};

type MultiDocumentSelector = {
  default?: InputMaybe<MultiDocumentDefaultViewInput>;
  lensBySlug?: InputMaybe<MultiDocumentsLensBySlugInput>;
  pingbackLensPages?: InputMaybe<MultiDocumentsPingbackLensPagesInput>;
  summariesByParentId?: InputMaybe<MultiDocumentsSummariesByParentIdInput>;
};

type MultiDocumentsLensBySlugInput = {
  excludedDocumentIds?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

type MultiDocumentsPingbackLensPagesInput = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  excludedDocumentIds?: InputMaybe<Scalars['String']['input']>;
};

type MultiDocumentsSummariesByParentIdInput = {
  excludedDocumentIds?: InputMaybe<Scalars['String']['input']>;
  parentDocumentId?: InputMaybe<Scalars['String']['input']>;
};

type MultiElectionCandidateInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiElectionCandidateOutput = {
  __typename?: 'MultiElectionCandidateOutput';
  results?: Maybe<Array<Maybe<ElectionCandidate>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiElectionVoteInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiElectionVoteOutput = {
  __typename?: 'MultiElectionVoteOutput';
  results?: Maybe<Array<Maybe<ElectionVote>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiElicitQuestionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiElicitQuestionOutput = {
  __typename?: 'MultiElicitQuestionOutput';
  results?: Maybe<Array<Maybe<ElicitQuestion>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiElicitQuestionPredictionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiElicitQuestionPredictionOutput = {
  __typename?: 'MultiElicitQuestionPredictionOutput';
  results?: Maybe<Array<Maybe<ElicitQuestionPrediction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiFeaturedResourceInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiFeaturedResourceOutput = {
  __typename?: 'MultiFeaturedResourceOutput';
  results?: Maybe<Array<Maybe<FeaturedResource>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiFieldChangeInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiFieldChangeOutput = {
  __typename?: 'MultiFieldChangeOutput';
  results?: Maybe<Array<Maybe<FieldChange>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiForumEventInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiForumEventOutput = {
  __typename?: 'MultiForumEventOutput';
  results?: Maybe<Array<Maybe<ForumEvent>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiGardenCodeInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiGardenCodeOutput = {
  __typename?: 'MultiGardenCodeOutput';
  results?: Maybe<Array<Maybe<GardenCode>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiGoogleServiceAccountSessionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiGoogleServiceAccountSessionOutput = {
  __typename?: 'MultiGoogleServiceAccountSessionOutput';
  results?: Maybe<Array<Maybe<GoogleServiceAccountSession>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiJargonTermInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiJargonTermOutput = {
  __typename?: 'MultiJargonTermOutput';
  results?: Maybe<Array<Maybe<JargonTerm>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiLWEventInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiLWEventOutput = {
  __typename?: 'MultiLWEventOutput';
  results?: Maybe<Array<Maybe<LWEvent>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiLlmConversationInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiLlmConversationOutput = {
  __typename?: 'MultiLlmConversationOutput';
  results?: Maybe<Array<Maybe<LlmConversation>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiLocalgroupInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiLocalgroupOutput = {
  __typename?: 'MultiLocalgroupOutput';
  results?: Maybe<Array<Maybe<Localgroup>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiMessageInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiMessageOutput = {
  __typename?: 'MultiMessageOutput';
  results?: Maybe<Array<Maybe<Message>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiModerationTemplateInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiModerationTemplateOutput = {
  __typename?: 'MultiModerationTemplateOutput';
  results?: Maybe<Array<Maybe<ModerationTemplate>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiModeratorActionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiModeratorActionOutput = {
  __typename?: 'MultiModeratorActionOutput';
  results?: Maybe<Array<Maybe<ModeratorAction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiMultiDocumentInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiMultiDocumentOutput = {
  __typename?: 'MultiMultiDocumentOutput';
  results?: Maybe<Array<Maybe<MultiDocument>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiNotificationInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiNotificationOutput = {
  __typename?: 'MultiNotificationOutput';
  results?: Maybe<Array<Maybe<Notification>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiPetrovDayActionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiPetrovDayActionOutput = {
  __typename?: 'MultiPetrovDayActionOutput';
  results?: Maybe<Array<Maybe<PetrovDayAction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiPodcastEpisodeInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiPodcastEpisodeOutput = {
  __typename?: 'MultiPodcastEpisodeOutput';
  results?: Maybe<Array<Maybe<PodcastEpisode>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiPodcastInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiPodcastOutput = {
  __typename?: 'MultiPodcastOutput';
  results?: Maybe<Array<Maybe<Podcast>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiPostAnalyticsResult = {
  __typename?: 'MultiPostAnalyticsResult';
  posts?: Maybe<Array<Maybe<PostAnalytics2Result>>>;
  totalCount: Scalars['Int']['output'];
};

type MultiPostInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiPostOutput = {
  __typename?: 'MultiPostOutput';
  results?: Maybe<Array<Maybe<Post>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiPostRelationInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiPostRelationOutput = {
  __typename?: 'MultiPostRelationOutput';
  results?: Maybe<Array<Maybe<PostRelation>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiRSSFeedInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiRSSFeedOutput = {
  __typename?: 'MultiRSSFeedOutput';
  results?: Maybe<Array<Maybe<RSSFeed>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiReportInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiReportOutput = {
  __typename?: 'MultiReportOutput';
  results?: Maybe<Array<Maybe<Report>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiReviewVoteInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiReviewVoteOutput = {
  __typename?: 'MultiReviewVoteOutput';
  results?: Maybe<Array<Maybe<ReviewVote>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiReviewWinnerArtInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiReviewWinnerArtOutput = {
  __typename?: 'MultiReviewWinnerArtOutput';
  results?: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiReviewWinnerInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiReviewWinnerOutput = {
  __typename?: 'MultiReviewWinnerOutput';
  results?: Maybe<Array<Maybe<ReviewWinner>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiRevisionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiRevisionOutput = {
  __typename?: 'MultiRevisionOutput';
  results?: Maybe<Array<Maybe<Revision>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSequenceInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSequenceOutput = {
  __typename?: 'MultiSequenceOutput';
  results?: Maybe<Array<Maybe<Sequence>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSplashArtCoordinateInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSplashArtCoordinateOutput = {
  __typename?: 'MultiSplashArtCoordinateOutput';
  results?: Maybe<Array<Maybe<SplashArtCoordinate>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSpotlightInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSpotlightOutput = {
  __typename?: 'MultiSpotlightOutput';
  results?: Maybe<Array<Maybe<Spotlight>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSubscriptionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSubscriptionOutput = {
  __typename?: 'MultiSubscriptionOutput';
  results?: Maybe<Array<Maybe<Subscription>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSurveyInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSurveyOutput = {
  __typename?: 'MultiSurveyOutput';
  results?: Maybe<Array<Maybe<Survey>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSurveyQuestionInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSurveyQuestionOutput = {
  __typename?: 'MultiSurveyQuestionOutput';
  results?: Maybe<Array<Maybe<SurveyQuestion>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSurveyResponseInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSurveyResponseOutput = {
  __typename?: 'MultiSurveyResponseOutput';
  results?: Maybe<Array<Maybe<SurveyResponse>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiSurveyScheduleInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiSurveyScheduleOutput = {
  __typename?: 'MultiSurveyScheduleOutput';
  results?: Maybe<Array<Maybe<SurveySchedule>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiTagFlagInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiTagFlagOutput = {
  __typename?: 'MultiTagFlagOutput';
  results?: Maybe<Array<Maybe<TagFlag>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiTagInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiTagOutput = {
  __typename?: 'MultiTagOutput';
  results?: Maybe<Array<Maybe<Tag>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiTagRelInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiTagRelOutput = {
  __typename?: 'MultiTagRelOutput';
  results?: Maybe<Array<Maybe<TagRel>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiTypingIndicatorInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiTypingIndicatorOutput = {
  __typename?: 'MultiTypingIndicatorOutput';
  results?: Maybe<Array<Maybe<TypingIndicator>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUltraFeedEventInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUltraFeedEventOutput = {
  __typename?: 'MultiUltraFeedEventOutput';
  results?: Maybe<Array<Maybe<UltraFeedEvent>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUserEAGDetailInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUserEAGDetailOutput = {
  __typename?: 'MultiUserEAGDetailOutput';
  results?: Maybe<Array<Maybe<UserEAGDetail>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUserInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUserJobAdInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUserJobAdOutput = {
  __typename?: 'MultiUserJobAdOutput';
  results?: Maybe<Array<Maybe<UserJobAd>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUserMostValuablePostInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUserMostValuablePostOutput = {
  __typename?: 'MultiUserMostValuablePostOutput';
  results?: Maybe<Array<Maybe<UserMostValuablePost>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUserOutput = {
  __typename?: 'MultiUserOutput';
  results?: Maybe<Array<Maybe<User>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUserRateLimitInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUserRateLimitOutput = {
  __typename?: 'MultiUserRateLimitOutput';
  results?: Maybe<Array<Maybe<UserRateLimit>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiUserTagRelInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiUserTagRelOutput = {
  __typename?: 'MultiUserTagRelOutput';
  results?: Maybe<Array<Maybe<UserTagRel>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type MultiVoteInput = {
  enableCache?: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

type MultiVoteOutput = {
  __typename?: 'MultiVoteOutput';
  results?: Maybe<Array<Maybe<Vote>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

type Mutation = {
  __typename?: 'Mutation';
  AddForumEventVote?: Maybe<Scalars['Boolean']['output']>;
  AddGivingSeasonHeart: Array<GivingSeasonHeart>;
  CancelRSVPToEvent?: Maybe<Post>;
  ImportGoogleDoc?: Maybe<Post>;
  MakeElicitPrediction?: Maybe<ElicitBlockData>;
  MarkAllNotificationsAsRead?: Maybe<Scalars['Boolean']['output']>;
  NewUserCompleteProfile?: Maybe<NewUserCompletedProfile>;
  PetrovDayLaunchMissile?: Maybe<PetrovDayLaunchMissileData>;
  RSVPToEvent?: Maybe<Post>;
  RefreshDbSettings?: Maybe<Scalars['Boolean']['output']>;
  RemoveForumEventSticker?: Maybe<Scalars['Boolean']['output']>;
  RemoveForumEventVote?: Maybe<Scalars['Boolean']['output']>;
  RemoveGivingSeasonHeart: Array<GivingSeasonHeart>;
  UpdateSearchSynonyms: Array<Scalars['String']['output']>;
  UserExpandFrontpageSection?: Maybe<Scalars['Boolean']['output']>;
  UserUpdateSubforumMembership?: Maybe<User>;
  acceptCoauthorRequest?: Maybe<Post>;
  addOrUpvoteTag?: Maybe<TagRel>;
  addTags?: Maybe<Scalars['Boolean']['output']>;
  alignmentComment?: Maybe<Comment>;
  alignmentPost?: Maybe<Post>;
  analyticsEvent?: Maybe<Scalars['Boolean']['output']>;
  autosaveRevision?: Maybe<Revision>;
  clickRecommendation?: Maybe<Scalars['Boolean']['output']>;
  connectCrossposter?: Maybe<Scalars['String']['output']>;
  createAdvisorRequest?: Maybe<AdvisorRequestOutput>;
  createBook?: Maybe<BookOutput>;
  createChapter?: Maybe<ChapterOutput>;
  createCollection?: Maybe<CollectionOutput>;
  createComment?: Maybe<CommentOutput>;
  createCommentModeratorAction?: Maybe<CommentModeratorActionOutput>;
  createConversation?: Maybe<ConversationOutput>;
  createCurationNotice?: Maybe<CurationNoticeOutput>;
  createDigest?: Maybe<DigestOutput>;
  createDigestPost?: Maybe<DigestPostOutput>;
  createElectionCandidate?: Maybe<ElectionCandidateOutput>;
  createElectionVote?: Maybe<ElectionVoteOutput>;
  createElicitQuestion?: Maybe<ElicitQuestionOutput>;
  createForumEvent?: Maybe<ForumEventOutput>;
  createJargonTerm?: Maybe<JargonTermOutput>;
  createLWEvent?: Maybe<LWEventOutput>;
  createLocalgroup?: Maybe<LocalgroupOutput>;
  createMessage?: Maybe<MessageOutput>;
  createModerationTemplate?: Maybe<ModerationTemplateOutput>;
  createModeratorAction?: Maybe<ModeratorActionOutput>;
  createMultiDocument?: Maybe<MultiDocumentOutput>;
  createPetrovDayAction?: Maybe<PetrovDayActionOutput>;
  createPodcastEpisode?: Maybe<PodcastEpisodeOutput>;
  createPost?: Maybe<PostOutput>;
  createRSSFeed?: Maybe<RSSFeedOutput>;
  createReport?: Maybe<ReportOutput>;
  createSequence?: Maybe<SequenceOutput>;
  createSplashArtCoordinate?: Maybe<SplashArtCoordinateOutput>;
  createSpotlight?: Maybe<SpotlightOutput>;
  createSubscription?: Maybe<SubscriptionOutput>;
  createSurvey?: Maybe<SurveyOutput>;
  createSurveyQuestion?: Maybe<SurveyQuestionOutput>;
  createSurveyResponse?: Maybe<SurveyResponseOutput>;
  createSurveySchedule?: Maybe<SurveyScheduleOutput>;
  createTag?: Maybe<TagOutput>;
  createTagFlag?: Maybe<TagFlagOutput>;
  createUltraFeedEvent?: Maybe<UltraFeedEventOutput>;
  createUser?: Maybe<UserOutput>;
  createUserEAGDetail?: Maybe<UserEAGDetailOutput>;
  createUserJobAd?: Maybe<UserJobAdOutput>;
  createUserMostValuablePost?: Maybe<UserMostValuablePostOutput>;
  createUserRateLimit?: Maybe<UserRateLimitOutput>;
  createUserTagRel?: Maybe<UserTagRelOutput>;
  dismissRecommendation?: Maybe<Scalars['Boolean']['output']>;
  editSurvey?: Maybe<Survey>;
  flipSplashArtImage?: Maybe<Scalars['Boolean']['output']>;
  generateCoverImagesForPost?: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  getNewJargonTerms?: Maybe<Array<Maybe<JargonTerm>>>;
  importUrlAsDraftPost: ExternalPostImportData;
  increasePostViewCount?: Maybe<Scalars['Float']['output']>;
  initiateConversation?: Maybe<Conversation>;
  lockThread: Scalars['Boolean']['output'];
  login?: Maybe<LoginReturnData>;
  logout?: Maybe<LoginReturnData>;
  markAsReadOrUnread?: Maybe<Scalars['Boolean']['output']>;
  markConversationRead: Scalars['Boolean']['output'];
  markPostCommentsRead?: Maybe<Scalars['Boolean']['output']>;
  mergeTags?: Maybe<Scalars['Boolean']['output']>;
  moderateComment?: Maybe<Comment>;
  observeRecommendation?: Maybe<Scalars['Boolean']['output']>;
  performVoteComment?: Maybe<VoteResultComment>;
  performVoteElectionCandidate?: Maybe<VoteResultElectionCandidate>;
  performVoteMultiDocument?: Maybe<VoteResultMultiDocument>;
  performVotePost?: Maybe<VoteResultPost>;
  performVoteRevision?: Maybe<VoteResultRevision>;
  performVoteTag?: Maybe<VoteResultTag>;
  performVoteTagRel?: Maybe<VoteResultTagRel>;
  promoteLensToMain?: Maybe<Scalars['Boolean']['output']>;
  publishAndDeDuplicateSpotlight?: Maybe<Spotlight>;
  reorderSummaries?: Maybe<Scalars['Boolean']['output']>;
  resetPassword?: Maybe<Scalars['String']['output']>;
  resyncRssFeed: Scalars['Boolean']['output'];
  revertPostToRevision?: Maybe<Post>;
  revertTagToRevision?: Maybe<Tag>;
  revokeGoogleServiceAccountTokens: Scalars['Boolean']['output'];
  sendEventTriggeredDM: Scalars['Boolean']['output'];
  sendNewDialogueMessageNotification: Scalars['Boolean']['output'];
  sendVertexMediaCompleteEvent: Scalars['Boolean']['output'];
  sendVertexViewHomePageEvent: Scalars['Boolean']['output'];
  sendVertexViewItemEvent: Scalars['Boolean']['output'];
  setIsHidden: User;
  setVoteComment?: Maybe<Comment>;
  setVoteElectionCandidate?: Maybe<ElectionCandidate>;
  setVoteMultiDocument?: Maybe<MultiDocument>;
  setVotePost?: Maybe<Post>;
  setVoteRevision?: Maybe<Revision>;
  setVoteTag?: Maybe<Tag>;
  setVoteTagRel?: Maybe<TagRel>;
  signup?: Maybe<LoginReturnData>;
  submitReviewVote?: Maybe<Post>;
  toggleBookmark?: Maybe<ToggleBookmarkOutput>;
  unlinkCrossposter?: Maybe<Scalars['String']['output']>;
  unlockPost?: Maybe<Post>;
  unlockThread: Scalars['Boolean']['output'];
  updateAdvisorRequest?: Maybe<AdvisorRequestOutput>;
  updateBook?: Maybe<BookOutput>;
  updateChapter?: Maybe<ChapterOutput>;
  updateCollection?: Maybe<CollectionOutput>;
  updateComment?: Maybe<CommentOutput>;
  updateCommentModeratorAction?: Maybe<CommentModeratorActionOutput>;
  updateContinueReading?: Maybe<Scalars['Boolean']['output']>;
  updateConversation?: Maybe<ConversationOutput>;
  updateCurationNotice?: Maybe<CurationNoticeOutput>;
  updateDigest?: Maybe<DigestOutput>;
  updateDigestPost?: Maybe<DigestPostOutput>;
  updateElectionCandidate?: Maybe<ElectionCandidateOutput>;
  updateElectionVote?: Maybe<ElectionVoteOutput>;
  updateElicitQuestion?: Maybe<ElicitQuestionOutput>;
  updateForumEvent?: Maybe<ForumEventOutput>;
  updateJargonTerm?: Maybe<JargonTermOutput>;
  updateLlmConversation?: Maybe<LlmConversationOutput>;
  updateLocalgroup?: Maybe<LocalgroupOutput>;
  updateMessage?: Maybe<MessageOutput>;
  updateModerationTemplate?: Maybe<ModerationTemplateOutput>;
  updateModeratorAction?: Maybe<ModeratorActionOutput>;
  updateMultiDocument?: Maybe<MultiDocumentOutput>;
  updateNotification?: Maybe<NotificationOutput>;
  updatePost?: Maybe<PostOutput>;
  updateRSSFeed?: Maybe<RSSFeedOutput>;
  updateReport?: Maybe<ReportOutput>;
  updateRevision?: Maybe<RevisionOutput>;
  updateSequence?: Maybe<SequenceOutput>;
  updateSpotlight?: Maybe<SpotlightOutput>;
  updateSurvey?: Maybe<SurveyOutput>;
  updateSurveyQuestion?: Maybe<SurveyQuestionOutput>;
  updateSurveyResponse?: Maybe<SurveyResponseOutput>;
  updateSurveySchedule?: Maybe<SurveyScheduleOutput>;
  updateTag?: Maybe<TagOutput>;
  updateTagFlag?: Maybe<TagFlagOutput>;
  updateUser?: Maybe<UserOutput>;
  updateUserEAGDetail?: Maybe<UserEAGDetailOutput>;
  updateUserJobAd?: Maybe<UserJobAdOutput>;
  updateUserMostValuablePost?: Maybe<UserMostValuablePostOutput>;
  updateUserRateLimit?: Maybe<UserRateLimitOutput>;
  updateUserTagRel?: Maybe<UserTagRelOutput>;
  upsertUserTypingIndicator?: Maybe<TypingIndicator>;
  useEmailToken?: Maybe<Scalars['JSON']['output']>;
};


type MutationAddForumEventVoteArgs = {
  delta?: InputMaybe<Scalars['Float']['input']>;
  forumEventId: Scalars['String']['input'];
  postIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  x: Scalars['Float']['input'];
};


type MutationAddGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
  theta: Scalars['Float']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};


type MutationCancelRSVPToEventArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


type MutationImportGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
  postId?: InputMaybe<Scalars['String']['input']>;
};


type MutationMakeElicitPredictionArgs = {
  prediction?: InputMaybe<Scalars['Int']['input']>;
  questionId?: InputMaybe<Scalars['String']['input']>;
};


type MutationNewUserCompleteProfileArgs = {
  acceptedTos?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  subscribeToDigest: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};


type MutationPetrovDayLaunchMissileArgs = {
  launchCode?: InputMaybe<Scalars['String']['input']>;
};


type MutationRSVPToEventArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  private?: InputMaybe<Scalars['Boolean']['input']>;
  response?: InputMaybe<Scalars['String']['input']>;
};


type MutationRemoveForumEventStickerArgs = {
  forumEventId: Scalars['String']['input'];
  stickerId: Scalars['String']['input'];
};


type MutationRemoveForumEventVoteArgs = {
  forumEventId: Scalars['String']['input'];
};


type MutationRemoveGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
};


type MutationUpdateSearchSynonymsArgs = {
  synonyms: Array<Scalars['String']['input']>;
};


type MutationUserExpandFrontpageSectionArgs = {
  expanded: Scalars['Boolean']['input'];
  section: Scalars['String']['input'];
};


type MutationUserUpdateSubforumMembershipArgs = {
  member: Scalars['Boolean']['input'];
  tagId: Scalars['String']['input'];
};


type MutationacceptCoauthorRequestArgs = {
  accept?: InputMaybe<Scalars['Boolean']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


type MutationaddOrUpvoteTagArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
};


type MutationaddTagsArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
  tagIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


type MutationalignmentCommentArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
};


type MutationalignmentPostArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};


type MutationanalyticsEventArgs = {
  events?: InputMaybe<Array<Scalars['JSON']['input']>>;
  now?: InputMaybe<Scalars['Date']['input']>;
};


type MutationautosaveRevisionArgs = {
  contents: AutosaveContentType;
  postId: Scalars['String']['input'];
};


type MutationclickRecommendationArgs = {
  postId: Scalars['String']['input'];
};


type MutationconnectCrossposterArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};


type MutationcreateAdvisorRequestArgs = {
  data: CreateAdvisorRequestDataInput;
};


type MutationcreateBookArgs = {
  data: CreateBookDataInput;
};


type MutationcreateChapterArgs = {
  data: CreateChapterDataInput;
};


type MutationcreateCollectionArgs = {
  data: CreateCollectionDataInput;
};


type MutationcreateCommentArgs = {
  data: CreateCommentDataInput;
};


type MutationcreateCommentModeratorActionArgs = {
  data: CreateCommentModeratorActionDataInput;
};


type MutationcreateConversationArgs = {
  data: CreateConversationDataInput;
};


type MutationcreateCurationNoticeArgs = {
  data: CreateCurationNoticeDataInput;
};


type MutationcreateDigestArgs = {
  data: CreateDigestDataInput;
};


type MutationcreateDigestPostArgs = {
  data: CreateDigestPostDataInput;
};


type MutationcreateElectionCandidateArgs = {
  data: CreateElectionCandidateDataInput;
};


type MutationcreateElectionVoteArgs = {
  data: CreateElectionVoteDataInput;
};


type MutationcreateElicitQuestionArgs = {
  data: CreateElicitQuestionDataInput;
};


type MutationcreateForumEventArgs = {
  data: CreateForumEventDataInput;
};


type MutationcreateJargonTermArgs = {
  data: CreateJargonTermDataInput;
};


type MutationcreateLWEventArgs = {
  data: CreateLWEventDataInput;
};


type MutationcreateLocalgroupArgs = {
  data: CreateLocalgroupDataInput;
};


type MutationcreateMessageArgs = {
  data: CreateMessageDataInput;
};


type MutationcreateModerationTemplateArgs = {
  data: CreateModerationTemplateDataInput;
};


type MutationcreateModeratorActionArgs = {
  data: CreateModeratorActionDataInput;
};


type MutationcreateMultiDocumentArgs = {
  data: CreateMultiDocumentDataInput;
};


type MutationcreatePetrovDayActionArgs = {
  data: CreatePetrovDayActionDataInput;
};


type MutationcreatePodcastEpisodeArgs = {
  data: CreatePodcastEpisodeDataInput;
};


type MutationcreatePostArgs = {
  data: CreatePostDataInput;
};


type MutationcreateRSSFeedArgs = {
  data: CreateRSSFeedDataInput;
};


type MutationcreateReportArgs = {
  data: CreateReportDataInput;
};


type MutationcreateSequenceArgs = {
  data: CreateSequenceDataInput;
};


type MutationcreateSplashArtCoordinateArgs = {
  data: CreateSplashArtCoordinateDataInput;
};


type MutationcreateSpotlightArgs = {
  data: CreateSpotlightDataInput;
};


type MutationcreateSubscriptionArgs = {
  data: CreateSubscriptionDataInput;
};


type MutationcreateSurveyArgs = {
  data: CreateSurveyDataInput;
};


type MutationcreateSurveyQuestionArgs = {
  data: CreateSurveyQuestionDataInput;
};


type MutationcreateSurveyResponseArgs = {
  data: CreateSurveyResponseDataInput;
};


type MutationcreateSurveyScheduleArgs = {
  data: CreateSurveyScheduleDataInput;
};


type MutationcreateTagArgs = {
  data: CreateTagDataInput;
};


type MutationcreateTagFlagArgs = {
  data: CreateTagFlagDataInput;
};


type MutationcreateUltraFeedEventArgs = {
  data: CreateUltraFeedEventDataInput;
};


type MutationcreateUserArgs = {
  data: CreateUserDataInput;
};


type MutationcreateUserEAGDetailArgs = {
  data: CreateUserEAGDetailDataInput;
};


type MutationcreateUserJobAdArgs = {
  data: CreateUserJobAdDataInput;
};


type MutationcreateUserMostValuablePostArgs = {
  data: CreateUserMostValuablePostDataInput;
};


type MutationcreateUserRateLimitArgs = {
  data: CreateUserRateLimitDataInput;
};


type MutationcreateUserTagRelArgs = {
  data: CreateUserTagRelDataInput;
};


type MutationdismissRecommendationArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
};


type MutationeditSurveyArgs = {
  name: Scalars['String']['input'];
  questions: Array<SurveyQuestionInfo>;
  surveyId: Scalars['String']['input'];
};


type MutationflipSplashArtImageArgs = {
  reviewWinnerArtId: Scalars['String']['input'];
};


type MutationgenerateCoverImagesForPostArgs = {
  postId: Scalars['String']['input'];
  prompt?: InputMaybe<Scalars['String']['input']>;
};


type MutationgetNewJargonTermsArgs = {
  exampleAltTerm?: InputMaybe<Scalars['String']['input']>;
  exampleDefinition?: InputMaybe<Scalars['String']['input']>;
  examplePost?: InputMaybe<Scalars['String']['input']>;
  exampleTerm?: InputMaybe<Scalars['String']['input']>;
  glossaryPrompt?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


type MutationimportUrlAsDraftPostArgs = {
  url: Scalars['String']['input'];
};


type MutationincreasePostViewCountArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
};


type MutationinitiateConversationArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  moderator?: InputMaybe<Scalars['Boolean']['input']>;
  participantIds: Array<Scalars['String']['input']>;
};


type MutationlockThreadArgs = {
  commentId: Scalars['String']['input'];
  until?: InputMaybe<Scalars['String']['input']>;
};


type MutationloginArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


type MutationmarkAsReadOrUnreadArgs = {
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};


type MutationmarkConversationReadArgs = {
  conversationId: Scalars['String']['input'];
};


type MutationmarkPostCommentsReadArgs = {
  postId: Scalars['String']['input'];
};


type MutationmergeTagsArgs = {
  redirectSource: Scalars['Boolean']['input'];
  sourceTagId: Scalars['String']['input'];
  targetTagId: Scalars['String']['input'];
  transferSubtags: Scalars['Boolean']['input'];
};


type MutationmoderateCommentArgs = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  deletedPublic?: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason?: InputMaybe<Scalars['String']['input']>;
};


type MutationobserveRecommendationArgs = {
  postId: Scalars['String']['input'];
};


type MutationperformVoteCommentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationperformVoteElectionCandidateArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationperformVoteMultiDocumentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationperformVotePostArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationperformVoteRevisionArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationperformVoteTagArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationperformVoteTagRelArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationpromoteLensToMainArgs = {
  lensId: Scalars['String']['input'];
};


type MutationpublishAndDeDuplicateSpotlightArgs = {
  spotlightId?: InputMaybe<Scalars['String']['input']>;
};


type MutationreorderSummariesArgs = {
  parentDocumentCollectionName: Scalars['String']['input'];
  parentDocumentId: Scalars['String']['input'];
  summaryIds: Array<Scalars['String']['input']>;
};


type MutationresetPasswordArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
};


type MutationresyncRssFeedArgs = {
  feedId: Scalars['String']['input'];
};


type MutationrevertPostToRevisionArgs = {
  postId: Scalars['String']['input'];
  revisionId: Scalars['String']['input'];
};


type MutationrevertTagToRevisionArgs = {
  revertToRevisionId: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
};


type MutationsendEventTriggeredDMArgs = {
  eventType: Scalars['String']['input'];
};


type MutationsendNewDialogueMessageNotificationArgs = {
  dialogueHtml: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


type MutationsendVertexMediaCompleteEventArgs = {
  attributionId?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


type MutationsendVertexViewItemEventArgs = {
  attributionId?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


type MutationsetIsHiddenArgs = {
  isHidden: Scalars['Boolean']['input'];
  postId: Scalars['String']['input'];
};


type MutationsetVoteCommentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsetVoteElectionCandidateArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsetVoteMultiDocumentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsetVotePostArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsetVoteRevisionArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsetVoteTagArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsetVoteTagRelArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


type MutationsignupArgs = {
  abTestKey?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  reCaptchaToken?: InputMaybe<Scalars['String']['input']>;
  subscribeToCurated?: InputMaybe<Scalars['Boolean']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


type MutationsubmitReviewVoteArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  dummy?: InputMaybe<Scalars['Boolean']['input']>;
  newQuadraticScore?: InputMaybe<Scalars['Int']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  quadraticChange?: InputMaybe<Scalars['Int']['input']>;
  qualitativeScore?: InputMaybe<Scalars['Int']['input']>;
  reactions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  year?: InputMaybe<Scalars['String']['input']>;
};


type MutationtoggleBookmarkArgs = {
  input: ToggleBookmarkInput;
};


type MutationunlockPostArgs = {
  linkSharingKey: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


type MutationunlockThreadArgs = {
  commentId: Scalars['String']['input'];
};


type MutationupdateAdvisorRequestArgs = {
  data: UpdateAdvisorRequestDataInput;
  selector: SelectorInput;
};


type MutationupdateBookArgs = {
  data: UpdateBookDataInput;
  selector: SelectorInput;
};


type MutationupdateChapterArgs = {
  data: UpdateChapterDataInput;
  selector: SelectorInput;
};


type MutationupdateCollectionArgs = {
  data: UpdateCollectionDataInput;
  selector: SelectorInput;
};


type MutationupdateCommentArgs = {
  data: UpdateCommentDataInput;
  selector: SelectorInput;
};


type MutationupdateCommentModeratorActionArgs = {
  data: UpdateCommentModeratorActionDataInput;
  selector: SelectorInput;
};


type MutationupdateContinueReadingArgs = {
  postId: Scalars['String']['input'];
  sequenceId: Scalars['String']['input'];
};


type MutationupdateConversationArgs = {
  data: UpdateConversationDataInput;
  selector: SelectorInput;
};


type MutationupdateCurationNoticeArgs = {
  data: UpdateCurationNoticeDataInput;
  selector: SelectorInput;
};


type MutationupdateDigestArgs = {
  data: UpdateDigestDataInput;
  selector: SelectorInput;
};


type MutationupdateDigestPostArgs = {
  data: UpdateDigestPostDataInput;
  selector: SelectorInput;
};


type MutationupdateElectionCandidateArgs = {
  data: UpdateElectionCandidateDataInput;
  selector: SelectorInput;
};


type MutationupdateElectionVoteArgs = {
  data: UpdateElectionVoteDataInput;
  selector: SelectorInput;
};


type MutationupdateElicitQuestionArgs = {
  data: UpdateElicitQuestionDataInput;
  selector: SelectorInput;
};


type MutationupdateForumEventArgs = {
  data: UpdateForumEventDataInput;
  selector: SelectorInput;
};


type MutationupdateJargonTermArgs = {
  data: UpdateJargonTermDataInput;
  selector: SelectorInput;
};


type MutationupdateLlmConversationArgs = {
  data: UpdateLlmConversationDataInput;
  selector: SelectorInput;
};


type MutationupdateLocalgroupArgs = {
  data: UpdateLocalgroupDataInput;
  selector: SelectorInput;
};


type MutationupdateMessageArgs = {
  data: UpdateMessageDataInput;
  selector: SelectorInput;
};


type MutationupdateModerationTemplateArgs = {
  data: UpdateModerationTemplateDataInput;
  selector: SelectorInput;
};


type MutationupdateModeratorActionArgs = {
  data: UpdateModeratorActionDataInput;
  selector: SelectorInput;
};


type MutationupdateMultiDocumentArgs = {
  data: UpdateMultiDocumentDataInput;
  selector: SelectorInput;
};


type MutationupdateNotificationArgs = {
  data: UpdateNotificationDataInput;
  selector: SelectorInput;
};


type MutationupdatePostArgs = {
  data: UpdatePostDataInput;
  selector: SelectorInput;
};


type MutationupdateRSSFeedArgs = {
  data: UpdateRSSFeedDataInput;
  selector: SelectorInput;
};


type MutationupdateReportArgs = {
  data: UpdateReportDataInput;
  selector: SelectorInput;
};


type MutationupdateRevisionArgs = {
  data: UpdateRevisionDataInput;
  selector: SelectorInput;
};


type MutationupdateSequenceArgs = {
  data: UpdateSequenceDataInput;
  selector: SelectorInput;
};


type MutationupdateSpotlightArgs = {
  data: UpdateSpotlightDataInput;
  selector: SelectorInput;
};


type MutationupdateSurveyArgs = {
  data: UpdateSurveyDataInput;
  selector: SelectorInput;
};


type MutationupdateSurveyQuestionArgs = {
  data: UpdateSurveyQuestionDataInput;
  selector: SelectorInput;
};


type MutationupdateSurveyResponseArgs = {
  data: UpdateSurveyResponseDataInput;
  selector: SelectorInput;
};


type MutationupdateSurveyScheduleArgs = {
  data: UpdateSurveyScheduleDataInput;
  selector: SelectorInput;
};


type MutationupdateTagArgs = {
  data: UpdateTagDataInput;
  selector: SelectorInput;
};


type MutationupdateTagFlagArgs = {
  data: UpdateTagFlagDataInput;
  selector: SelectorInput;
};


type MutationupdateUserArgs = {
  data: UpdateUserDataInput;
  selector: SelectorInput;
};


type MutationupdateUserEAGDetailArgs = {
  data: UpdateUserEAGDetailDataInput;
  selector: SelectorInput;
};


type MutationupdateUserJobAdArgs = {
  data: UpdateUserJobAdDataInput;
  selector: SelectorInput;
};


type MutationupdateUserMostValuablePostArgs = {
  data: UpdateUserMostValuablePostDataInput;
  selector: SelectorInput;
};


type MutationupdateUserRateLimitArgs = {
  data: UpdateUserRateLimitDataInput;
  selector: SelectorInput;
};


type MutationupdateUserTagRelArgs = {
  data: UpdateUserTagRelDataInput;
  selector: SelectorInput;
};


type MutationupsertUserTypingIndicatorArgs = {
  documentId: Scalars['String']['input'];
};


type MutationuseEmailTokenArgs = {
  args?: InputMaybe<Scalars['JSON']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

type MyDialoguesResult = {
  __typename?: 'MyDialoguesResult';
  results: Array<Post>;
};

type NewUserCompletedProfile = {
  __typename?: 'NewUserCompletedProfile';
  displayName?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  subscribedToDigest?: Maybe<Scalars['Boolean']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  usernameUnset?: Maybe<Scalars['Boolean']['output']>;
};

type Notification = {
  __typename?: 'Notification';
  _id: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  emailed?: Maybe<Scalars['Boolean']['output']>;
  extraData?: Maybe<Scalars['JSON']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  viewed?: Maybe<Scalars['Boolean']['output']>;
  waitingForBatch?: Maybe<Scalars['Boolean']['output']>;
};

type NotificationCounts = {
  __typename?: 'NotificationCounts';
  checkedAt: Scalars['Date']['output'];
  faviconBadgeNumber: Scalars['Int']['output'];
  unreadNotifications: Scalars['Int']['output'];
  unreadPrivateMessages: Scalars['Int']['output'];
};

type NotificationDisplaysResult = {
  __typename?: 'NotificationDisplaysResult';
  results: Array<Scalars['JSON']['output']>;
};

type NotificationOutput = {
  __typename?: 'NotificationOutput';
  data?: Maybe<Notification>;
};

type NotificationSelector = {
  adminAlertNotifications?: InputMaybe<NotificationsAdminAlertNotificationsInput>;
  default?: InputMaybe<EmptyViewInput>;
  unreadUserNotifications?: InputMaybe<NotificationsUnreadUserNotificationsInput>;
  userNotifications?: InputMaybe<NotificationsUserNotificationsInput>;
};

type NotificationsAdminAlertNotificationsInput = {
  type?: InputMaybe<Scalars['String']['input']>;
};

type NotificationsUnreadUserNotificationsInput = {
  lastViewedDate?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type NotificationsUserNotificationsInput = {
  type?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  viewed?: InputMaybe<Scalars['String']['input']>;
};

type PageCacheEntry = {
  __typename?: 'PageCacheEntry';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type PartiallyReadSequenceItemInput = {
  collectionId?: InputMaybe<Scalars['String']['input']>;
  lastReadPostId: Scalars['String']['input'];
  lastReadTime?: InputMaybe<Scalars['Date']['input']>;
  nextPostId: Scalars['String']['input'];
  numRead: Scalars['Int']['input'];
  numTotal: Scalars['Int']['input'];
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};

type PartiallyReadSequenceItemOutput = {
  __typename?: 'PartiallyReadSequenceItemOutput';
  collectionId?: Maybe<Scalars['String']['output']>;
  lastReadPostId?: Maybe<Scalars['String']['output']>;
  lastReadTime?: Maybe<Scalars['Date']['output']>;
  nextPostId?: Maybe<Scalars['String']['output']>;
  numRead?: Maybe<Scalars['Int']['output']>;
  numTotal?: Maybe<Scalars['Int']['output']>;
  sequenceId?: Maybe<Scalars['String']['output']>;
};

type PetrovDay2024CheckNumberOfIncomingData = {
  __typename?: 'PetrovDay2024CheckNumberOfIncomingData';
  count?: Maybe<Scalars['Int']['output']>;
};

type PetrovDayAction = {
  __typename?: 'PetrovDayAction';
  _id: Scalars['String']['output'];
  actionType: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type PetrovDayActionOutput = {
  __typename?: 'PetrovDayActionOutput';
  data?: Maybe<PetrovDayAction>;
};

type PetrovDayActionSelector = {
  adminConsole?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  getAction?: InputMaybe<PetrovDayActionsGetActionInput>;
  launchDashboard?: InputMaybe<PetrovDayActionsLaunchDashboardInput>;
  warningConsole?: InputMaybe<PetrovDayActionsWarningConsoleInput>;
};

type PetrovDayActionsGetActionInput = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type PetrovDayActionsLaunchDashboardInput = {
  side?: InputMaybe<Scalars['String']['input']>;
};

type PetrovDayActionsWarningConsoleInput = {
  side?: InputMaybe<Scalars['String']['input']>;
};

type PetrovDayCheckIfIncomingData = {
  __typename?: 'PetrovDayCheckIfIncomingData';
  createdAt?: Maybe<Scalars['Date']['output']>;
  launched?: Maybe<Scalars['Boolean']['output']>;
};

type PetrovDayLaunch = {
  __typename?: 'PetrovDayLaunch';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  hashedLaunchCode?: Maybe<Scalars['String']['output']>;
  launchCode: Scalars['String']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type PetrovDayLaunchMissileData = {
  __typename?: 'PetrovDayLaunchMissileData';
  createdAt?: Maybe<Scalars['Date']['output']>;
  launchCode?: Maybe<Scalars['String']['output']>;
};

type Podcast = {
  __typename?: 'Podcast';
  _id: Scalars['String']['output'];
  applePodcastLink?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  spotifyPodcastLink?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

type PodcastEpisode = {
  __typename?: 'PodcastEpisode';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  episodeLink: Scalars['String']['output'];
  externalEpisodeId: Scalars['String']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  podcast: Podcast;
  podcastId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

type PodcastEpisodeOutput = {
  __typename?: 'PodcastEpisodeOutput';
  data?: Maybe<PodcastEpisode>;
};

type PodcastEpisodeSelector = {
  default?: InputMaybe<EmptyViewInput>;
  episodeByExternalId?: InputMaybe<EmptyViewInput>;
};

type PodcastSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type PopularCommentsResult = {
  __typename?: 'PopularCommentsResult';
  results: Array<Comment>;
};

type Post = {
  __typename?: 'Post';
  _id: Scalars['String']['output'];
  activateRSVPs?: Maybe<Scalars['Boolean']['output']>;
  af: Scalars['Boolean']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afCommentCount: Scalars['Float']['output'];
  afDate?: Maybe<Scalars['Date']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afLastCommentedAt?: Maybe<Scalars['Date']['output']>;
  afSticky: Scalars['Boolean']['output'];
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  agentFoundationsId?: Maybe<Scalars['String']['output']>;
  annualReviewMarketIsResolved?: Maybe<Scalars['Boolean']['output']>;
  annualReviewMarketProbability?: Maybe<Scalars['Float']['output']>;
  annualReviewMarketUrl?: Maybe<Scalars['String']['output']>;
  annualReviewMarketYear?: Maybe<Scalars['Int']['output']>;
  author?: Maybe<Scalars['String']['output']>;
  authorIsUnreviewed: Scalars['Boolean']['output'];
  autoFrontpage?: Maybe<Scalars['String']['output']>;
  bannedUserIds?: Maybe<Array<Scalars['String']['output']>>;
  baseScore: Scalars['Float']['output'];
  bestAnswer?: Maybe<Comment>;
  canonicalBook?: Maybe<Book>;
  canonicalBookId?: Maybe<Scalars['String']['output']>;
  canonicalCollection?: Maybe<Collection>;
  canonicalCollectionSlug?: Maybe<Scalars['String']['output']>;
  canonicalNextPostSlug?: Maybe<Scalars['String']['output']>;
  canonicalPrevPostSlug?: Maybe<Scalars['String']['output']>;
  canonicalSequence?: Maybe<Sequence>;
  canonicalSequenceId?: Maybe<Scalars['String']['output']>;
  canonicalSource?: Maybe<Scalars['String']['output']>;
  clickCount?: Maybe<Scalars['Float']['output']>;
  coauthorStatuses?: Maybe<Array<CoauthorStatusOutput>>;
  coauthors?: Maybe<Array<User>>;
  collabEditorDialogue: Scalars['Boolean']['output'];
  collectionTitle?: Maybe<Scalars['String']['output']>;
  commentCount: Scalars['Float']['output'];
  commentEmojiReactors?: Maybe<Scalars['JSON']['output']>;
  commentSortOrder?: Maybe<Scalars['String']['output']>;
  commentsLocked?: Maybe<Scalars['Boolean']['output']>;
  commentsLockedToAccountsCreatedAfter?: Maybe<Scalars['Date']['output']>;
  contactInfo?: Maybe<Scalars['String']['output']>;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  curatedDate?: Maybe<Scalars['Date']['output']>;
  curationNotices?: Maybe<Array<CurationNotice>>;
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserReviewVote?: Maybe<ReviewVote>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  customHighlight?: Maybe<Revision>;
  customHighlight_latest?: Maybe<Scalars['String']['output']>;
  debate: Scalars['Boolean']['output'];
  defaultRecommendation: Scalars['Boolean']['output'];
  deletedDraft: Scalars['Boolean']['output'];
  dialogTooltipPreview?: Maybe<Scalars['String']['output']>;
  dialogueMessageContents?: Maybe<Scalars['String']['output']>;
  disableRecommendation: Scalars['Boolean']['output'];
  disableSidenotes: Scalars['Boolean']['output'];
  domain?: Maybe<Scalars['String']['output']>;
  draft?: Maybe<Scalars['Boolean']['output']>;
  emailShareUrl?: Maybe<Scalars['String']['output']>;
  emojiReactors?: Maybe<Scalars['JSON']['output']>;
  endTime?: Maybe<Scalars['Date']['output']>;
  eventImageId?: Maybe<Scalars['String']['output']>;
  eventRegistrationLink?: Maybe<Scalars['String']['output']>;
  eventType?: Maybe<Scalars['String']['output']>;
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  facebookLink?: Maybe<Scalars['String']['output']>;
  facebookShareUrl?: Maybe<Scalars['String']['output']>;
  feed?: Maybe<RSSFeed>;
  feedId?: Maybe<Scalars['String']['output']>;
  feedLink?: Maybe<Scalars['String']['output']>;
  finalReviewVoteScoreAF: Scalars['Float']['output'];
  finalReviewVoteScoreAllKarma: Scalars['Float']['output'];
  finalReviewVoteScoreHighKarma: Scalars['Float']['output'];
  finalReviewVotesAF: Array<Scalars['Float']['output']>;
  finalReviewVotesAllKarma: Array<Scalars['Float']['output']>;
  finalReviewVotesHighKarma: Array<Scalars['Float']['output']>;
  firstVideoAttribsForPreview?: Maybe<Scalars['JSON']['output']>;
  fmCrosspost?: Maybe<CrosspostOutput>;
  forceAllowType3Audio: Scalars['Boolean']['output'];
  frontpageDate?: Maybe<Scalars['Date']['output']>;
  generateDraftJargon?: Maybe<Scalars['Boolean']['output']>;
  globalEvent: Scalars['Boolean']['output'];
  glossary: Array<JargonTerm>;
  googleLocation?: Maybe<Scalars['JSON']['output']>;
  group?: Maybe<Localgroup>;
  groupId?: Maybe<Scalars['String']['output']>;
  hasCoauthorPermission: Scalars['Boolean']['output'];
  hiddenRelatedQuestion: Scalars['Boolean']['output'];
  hideAuthor: Scalars['Boolean']['output'];
  hideCommentKarma: Scalars['Boolean']['output'];
  hideFromPopularComments?: Maybe<Scalars['Boolean']['output']>;
  hideFromRecentDiscussions: Scalars['Boolean']['output'];
  hideFrontpageComments: Scalars['Boolean']['output'];
  htmlBody?: Maybe<Scalars['String']['output']>;
  ignoreRateLimits?: Maybe<Scalars['Boolean']['output']>;
  isEvent: Scalars['Boolean']['output'];
  isFuture: Scalars['Boolean']['output'];
  isRead?: Maybe<Scalars['Boolean']['output']>;
  joinEventLink?: Maybe<Scalars['String']['output']>;
  languageModelSummary?: Maybe<Scalars['String']['output']>;
  lastCommentPromotedAt?: Maybe<Scalars['Date']['output']>;
  lastCommentedAt: Scalars['Date']['output'];
  lastPromotedComment?: Maybe<Comment>;
  lastVisitedAt?: Maybe<Scalars['Date']['output']>;
  legacy: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  legacyId?: Maybe<Scalars['String']['output']>;
  legacySpam: Scalars['Boolean']['output'];
  linkSharingKey?: Maybe<Scalars['String']['output']>;
  linkSharingKeyUsedBy?: Maybe<Array<Scalars['String']['output']>>;
  linkUrl?: Maybe<Scalars['String']['output']>;
  localEndTime?: Maybe<Scalars['Date']['output']>;
  localStartTime?: Maybe<Scalars['Date']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  manifoldReviewMarketId?: Maybe<Scalars['String']['output']>;
  maxBaseScore: Scalars['Float']['output'];
  meetupLink?: Maybe<Scalars['String']['output']>;
  meta: Scalars['Boolean']['output'];
  metaDate?: Maybe<Scalars['Date']['output']>;
  metaSticky: Scalars['Boolean']['output'];
  moderationGuidelines?: Maybe<Revision>;
  moderationGuidelines_latest?: Maybe<Scalars['String']['output']>;
  moderationStyle?: Maybe<Scalars['String']['output']>;
  modifiedAt?: Maybe<Scalars['Date']['output']>;
  mongoLocation?: Maybe<Scalars['JSON']['output']>;
  mostRecentPublishedDialogueResponseDate?: Maybe<Scalars['Date']['output']>;
  myEditorAccess: Scalars['String']['output'];
  nextDayReminderSent: Scalars['Boolean']['output'];
  nextPost?: Maybe<Post>;
  noIndex: Scalars['Boolean']['output'];
  nominationCount2018: Scalars['Float']['output'];
  nominationCount2019: Scalars['Float']['output'];
  onlineEvent: Scalars['Boolean']['output'];
  onlyVisibleToEstablishedAccounts: Scalars['Boolean']['output'];
  onlyVisibleToLoggedIn: Scalars['Boolean']['output'];
  organizerIds?: Maybe<Array<Scalars['String']['output']>>;
  organizers?: Maybe<Array<User>>;
  originalPostRelationSourceId?: Maybe<Scalars['String']['output']>;
  pageUrl: Scalars['String']['output'];
  pageUrlRelative?: Maybe<Scalars['String']['output']>;
  pingbacks?: Maybe<Scalars['JSON']['output']>;
  podcastEpisode?: Maybe<PodcastEpisode>;
  podcastEpisodeId?: Maybe<Scalars['String']['output']>;
  positiveReviewVoteCount: Scalars['Float']['output'];
  postCategory: PostCategory;
  postedAt: Scalars['Date']['output'];
  postedAtFormatted?: Maybe<Scalars['String']['output']>;
  prevPost?: Maybe<Post>;
  question: Scalars['Boolean']['output'];
  readTimeMinutes: Scalars['Int']['output'];
  readTimeMinutesOverride?: Maybe<Scalars['Float']['output']>;
  recentComments?: Maybe<Array<Comment>>;
  referrer?: Maybe<Scalars['String']['output']>;
  rejected: Scalars['Boolean']['output'];
  rejectedByUser?: Maybe<User>;
  rejectedByUserId?: Maybe<Scalars['String']['output']>;
  rejectedReason?: Maybe<Scalars['String']['output']>;
  reviewCount: Scalars['Float']['output'];
  reviewCount2018: Scalars['Float']['output'];
  reviewCount2019: Scalars['Float']['output'];
  reviewForAlignmentUserId?: Maybe<Scalars['String']['output']>;
  reviewForCuratedUserId?: Maybe<Scalars['String']['output']>;
  reviewVoteCount: Scalars['Float']['output'];
  reviewVoteScoreAF: Scalars['Float']['output'];
  reviewVoteScoreAllKarma: Scalars['Float']['output'];
  reviewVoteScoreHighKarma: Scalars['Float']['output'];
  reviewVotesAF: Array<Scalars['Float']['output']>;
  reviewVotesAllKarma: Array<Scalars['Float']['output']>;
  reviewVotesHighKarma: Array<Scalars['Float']['output']>;
  reviewWinner?: Maybe<ReviewWinner>;
  reviewedByUser?: Maybe<User>;
  reviewedByUserId?: Maybe<Scalars['String']['output']>;
  reviews?: Maybe<Array<Comment>>;
  revisions?: Maybe<Array<Revision>>;
  rsvpCounts: Scalars['JSON']['output'];
  rsvps?: Maybe<Array<Scalars['JSON']['output']>>;
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  scoreExceeded2Date?: Maybe<Scalars['Date']['output']>;
  scoreExceeded30Date?: Maybe<Scalars['Date']['output']>;
  scoreExceeded45Date?: Maybe<Scalars['Date']['output']>;
  scoreExceeded75Date?: Maybe<Scalars['Date']['output']>;
  scoreExceeded125Date?: Maybe<Scalars['Date']['output']>;
  scoreExceeded200Date?: Maybe<Scalars['Date']['output']>;
  sequence?: Maybe<Sequence>;
  shareWithUsers?: Maybe<Array<Scalars['String']['output']>>;
  sharingSettings?: Maybe<Scalars['JSON']['output']>;
  shortform: Scalars['Boolean']['output'];
  sideCommentVisibility?: Maybe<Scalars['String']['output']>;
  sideComments?: Maybe<Scalars['JSON']['output']>;
  sideCommentsCache?: Maybe<SideCommentCache>;
  slug: Scalars['String']['output'];
  socialPreview?: Maybe<SocialPreviewOutput>;
  socialPreviewData: SocialPreviewType;
  socialPreviewImageAutoUrl?: Maybe<Scalars['String']['output']>;
  socialPreviewImageId?: Maybe<Scalars['String']['output']>;
  socialPreviewImageUrl?: Maybe<Scalars['String']['output']>;
  sourcePostRelations: Array<PostRelation>;
  spotlight?: Maybe<Spotlight>;
  startTime?: Maybe<Scalars['Date']['output']>;
  status: Scalars['Float']['output'];
  sticky: Scalars['Boolean']['output'];
  stickyPriority: Scalars['Int']['output'];
  subforumTag?: Maybe<Tag>;
  subforumTagId?: Maybe<Scalars['String']['output']>;
  submitToFrontpage: Scalars['Boolean']['output'];
  suggestForAlignmentUserIds: Array<Scalars['String']['output']>;
  suggestForAlignmentUsers: Array<User>;
  suggestForCuratedUserIds?: Maybe<Array<Scalars['String']['output']>>;
  suggestForCuratedUsernames?: Maybe<Scalars['String']['output']>;
  swrCachingEnabled?: Maybe<Scalars['Boolean']['output']>;
  tableOfContents?: Maybe<Scalars['JSON']['output']>;
  tableOfContentsRevision?: Maybe<Scalars['JSON']['output']>;
  tagRel?: Maybe<TagRel>;
  tagRelevance?: Maybe<Scalars['JSON']['output']>;
  tags: Array<Tag>;
  targetPostRelations: Array<PostRelation>;
  title: Scalars['String']['output'];
  topLevelCommentCount: Scalars['Float']['output'];
  totalDialogueResponseCount: Scalars['Int']['output'];
  twitterShareUrl?: Maybe<Scalars['String']['output']>;
  types?: Maybe<Array<Scalars['String']['output']>>;
  unlisted: Scalars['Boolean']['output'];
  unreadDebateResponseCount: Scalars['Int']['output'];
  url?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userIP?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  usersSharedWith?: Maybe<Array<User>>;
  version?: Maybe<Scalars['String']['output']>;
  viewCount?: Maybe<Scalars['Float']['output']>;
  voteCount: Scalars['Float']['output'];
  votingSystem?: Maybe<Scalars['String']['output']>;
  wasEverUndrafted?: Maybe<Scalars['Boolean']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  wordCount?: Maybe<Scalars['Int']['output']>;
};


type PostcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type PostcustomHighlightArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type PostdialogueMessageContentsArgs = {
  dialogueMessageId?: InputMaybe<Scalars['String']['input']>;
};


type PostmoderationGuidelinesArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type PostnextPostArgs = {
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};


type PostprevPostArgs = {
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};


type PostrecentCommentsArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  commentsLimit?: InputMaybe<Scalars['Int']['input']>;
  maxAgeHours?: InputMaybe<Scalars['Int']['input']>;
};


type PostrevisionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type PostsequenceArgs = {
  prevOrNext?: InputMaybe<Scalars['String']['input']>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};


type PosttableOfContentsRevisionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type PosttagRelArgs = {
  tagId?: InputMaybe<Scalars['String']['input']>;
};

type PostAnalytics2Result = {
  __typename?: 'PostAnalytics2Result';
  _id?: Maybe<Scalars['String']['output']>;
  comments?: Maybe<Scalars['Int']['output']>;
  karma?: Maybe<Scalars['Int']['output']>;
  meanReadingTime?: Maybe<Scalars['Float']['output']>;
  postedAt?: Maybe<Scalars['Date']['output']>;
  reads?: Maybe<Scalars['Int']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  uniqueViews?: Maybe<Scalars['Int']['output']>;
  views?: Maybe<Scalars['Int']['output']>;
};

type PostAnalyticsResult = {
  __typename?: 'PostAnalyticsResult';
  allViews?: Maybe<Scalars['Int']['output']>;
  medianReadingTime?: Maybe<Scalars['Int']['output']>;
  uniqueClientViews?: Maybe<Scalars['Int']['output']>;
  uniqueClientViews5Min?: Maybe<Scalars['Int']['output']>;
  uniqueClientViews10Sec?: Maybe<Scalars['Int']['output']>;
  uniqueClientViewsSeries?: Maybe<Array<Maybe<UniqueClientViewsSeries>>>;
};

type PostCategory =
  | 'linkpost'
  | 'post'
  | 'question';

type PostDefaultViewInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostKarmaChange = {
  __typename?: 'PostKarmaChange';
  _id: Scalars['String']['output'];
  addedReacts?: Maybe<Array<ReactionChange>>;
  collectionName: Scalars['String']['output'];
  eaAddedReacts?: Maybe<Scalars['JSON']['output']>;
  postId: Scalars['String']['output'];
  scoreChange: Scalars['Int']['output'];
  slug: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

type PostMetadataInput = {
  postId: Scalars['String']['input'];
};

type PostMetadataOutput = {
  __typename?: 'PostMetadataOutput';
  postId: Scalars['String']['output'];
};

type PostOutput = {
  __typename?: 'PostOutput';
  data?: Maybe<Post>;
};

type PostRecommendation = {
  __typename?: 'PostRecommendation';
  _id: Scalars['String']['output'];
  clickedAt?: Maybe<Scalars['Date']['output']>;
  clientId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  lastRecommendedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId?: Maybe<Scalars['String']['output']>;
  recommendationCount?: Maybe<Scalars['Int']['output']>;
  schemaVersion: Scalars['Float']['output'];
  strategyName?: Maybe<Scalars['String']['output']>;
  strategySettings?: Maybe<Scalars['JSON']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type PostRelation = {
  __typename?: 'PostRelation';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  order?: Maybe<Scalars['Float']['output']>;
  schemaVersion: Scalars['Float']['output'];
  sourcePost?: Maybe<Post>;
  sourcePostId: Scalars['String']['output'];
  targetPost?: Maybe<Post>;
  targetPostId: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

type PostRelationSelector = {
  allPostRelations?: InputMaybe<PostRelationsAllPostRelationsInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type PostRelationsAllPostRelationsInput = {
  postId?: InputMaybe<Scalars['String']['input']>;
};

type PostReviewFilter = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  minKarma?: InputMaybe<Scalars['Int']['input']>;
  showEvents?: InputMaybe<Scalars['Boolean']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

type PostReviewSort = {
  karma?: InputMaybe<Scalars['Boolean']['input']>;
};

type PostSelector = {
  afRecentDiscussionThreadsList?: InputMaybe<PostsAfRecentDiscussionThreadsListInput>;
  alignmentSuggestedPosts?: InputMaybe<PostsAlignmentSuggestedPostsInput>;
  all_drafts?: InputMaybe<PostsAll_draftsInput>;
  community?: InputMaybe<PostsCommunityInput>;
  communityResourcePosts?: InputMaybe<PostsCommunityResourcePostsInput>;
  communityRss?: InputMaybe<PostsCommunityRssInput>;
  curated?: InputMaybe<PostsCuratedInput>;
  curatedRss?: InputMaybe<PostsCuratedRssInput>;
  currentOpenThread?: InputMaybe<PostsCurrentOpenThreadInput>;
  daily?: InputMaybe<PostsDailyInput>;
  default?: InputMaybe<PostDefaultViewInput>;
  drafts?: InputMaybe<PostsDraftsInput>;
  events?: InputMaybe<PostsEventsInput>;
  eventsInTimeRange?: InputMaybe<PostsEventsInTimeRangeInput>;
  frontpage?: InputMaybe<PostsFrontpageInput>;
  frontpageReviewWidget?: InputMaybe<PostsFrontpageReviewWidgetInput>;
  frontpageRss?: InputMaybe<PostsFrontpageRssInput>;
  globalEvents?: InputMaybe<PostsGlobalEventsInput>;
  hasEverDialogued?: InputMaybe<PostsHasEverDialoguedInput>;
  legacyIdPost?: InputMaybe<PostsLegacyIdPostInput>;
  magic?: InputMaybe<PostsMagicInput>;
  metaRss?: InputMaybe<PostsMetaRssInput>;
  myBookmarkedPosts?: InputMaybe<PostsMyBookmarkedPostsInput>;
  nearbyEvents?: InputMaybe<PostsNearbyEventsInput>;
  new?: InputMaybe<PostsNewInput>;
  nominatablePostsByVote?: InputMaybe<PostsNominatablePostsByVoteInput>;
  nominations2018?: InputMaybe<PostsNominations2018Input>;
  nominations2019?: InputMaybe<PostsNominations2019Input>;
  nonEventGroupPosts?: InputMaybe<PostsNonEventGroupPostsInput>;
  old?: InputMaybe<PostsOldInput>;
  pastEvents?: InputMaybe<PostsPastEventsInput>;
  pingbackPosts?: InputMaybe<PostsPingbackPostsInput>;
  postsWithBannedUsers?: InputMaybe<PostsPostsWithBannedUsersInput>;
  recentComments?: InputMaybe<PostsRecentCommentsInput>;
  recentDiscussionThreadsList?: InputMaybe<PostsRecentDiscussionThreadsListInput>;
  recentQuestionActivity?: InputMaybe<PostsRecentQuestionActivityInput>;
  rejected?: InputMaybe<PostsRejectedInput>;
  reviewFinalVoting?: InputMaybe<PostsReviewFinalVotingInput>;
  reviewQuickPage?: InputMaybe<PostsReviewQuickPageInput>;
  reviewRecentDiscussionThreadsList2018?: InputMaybe<PostsReviewRecentDiscussionThreadsList2018Input>;
  reviewRecentDiscussionThreadsList2019?: InputMaybe<PostsReviewRecentDiscussionThreadsList2019Input>;
  reviewVoting?: InputMaybe<PostsReviewVotingInput>;
  reviews2018?: InputMaybe<PostsReviews2018Input>;
  reviews2019?: InputMaybe<PostsReviews2019Input>;
  rss?: InputMaybe<PostsRssInput>;
  scheduled?: InputMaybe<PostsScheduledInput>;
  slugPost?: InputMaybe<PostsSlugPostInput>;
  stickied?: InputMaybe<PostsStickiedInput>;
  sunshineCuratedSuggestions?: InputMaybe<PostsSunshineCuratedSuggestionsInput>;
  sunshineNewPosts?: InputMaybe<PostsSunshineNewPostsInput>;
  sunshineNewUsersPosts?: InputMaybe<PostsSunshineNewUsersPostsInput>;
  tagRelevance?: InputMaybe<PostsTagRelevanceInput>;
  tbdEvents?: InputMaybe<PostsTbdEventsInput>;
  timeframe?: InputMaybe<PostsTimeframeInput>;
  top?: InputMaybe<PostsTopInput>;
  topQuestions?: InputMaybe<PostsTopQuestionsInput>;
  unlisted?: InputMaybe<PostsUnlistedInput>;
  upcomingEvents?: InputMaybe<PostsUpcomingEventsInput>;
  userAFSubmissions?: InputMaybe<PostsUserAFSubmissionsInput>;
  userPosts?: InputMaybe<PostsUserPostsInput>;
  voting2019?: InputMaybe<PostsVoting2019Input>;
};

type PostWithApprovedJargon = {
  __typename?: 'PostWithApprovedJargon';
  jargonTerms?: Maybe<Array<JargonTerm>>;
  post: Post;
};

type PostsAfRecentDiscussionThreadsListInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsAlignmentSuggestedPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsAll_draftsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsBySubscribedAuthorsResult = {
  __typename?: 'PostsBySubscribedAuthorsResult';
  results: Array<Post>;
};

type PostsCommunityInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsCommunityResourcePostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsCommunityRssInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsCuratedInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsCuratedRssInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsCurrentOpenThreadInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsDailyInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsDraftsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeArchived?: InputMaybe<Scalars['String']['input']>;
  includeDraftEvents?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  includeShared?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortDraftsBy?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsEventsInTimeRangeInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsEventsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  globalEvent?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  onlineEvent?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsFrontpageInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsFrontpageReviewWidgetInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  reviewPhase?: InputMaybe<Scalars['String']['input']>;
  reviewYear?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsFrontpageRssInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsGlobalEventsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  onlineEvent?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsHasEverDialoguedInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsLegacyIdPostInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsMagicInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsMetaRssInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsMyBookmarkedPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsNearbyEventsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  distance?: InputMaybe<Scalars['String']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  lat?: InputMaybe<Scalars['String']['input']>;
  lng?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  onlineEvent?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsNewInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsNominatablePostsByVoteInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  requiredFrontpage?: InputMaybe<Scalars['String']['input']>;
  requiredUnnominated?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsNominations2018Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortByMost?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsNominations2019Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortByMost?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsNonEventGroupPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsOldInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsPastEventsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsPingbackPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsPostsWithBannedUsersInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsRecentCommentsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsRecentDiscussionThreadsListInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsRecentQuestionActivityInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsRejectedInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviewFinalVotingInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviewQuickPageInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviewRecentDiscussionThreadsList2018Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviewRecentDiscussionThreadsList2019Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviewVotingInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  reviewPhase?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviews2018Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsReviews2019Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsRssInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsScheduledInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsSlugPostInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsStickiedInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsSunshineCuratedSuggestionsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  audioOnly?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsSunshineNewPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsSunshineNewUsersPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsTagRelevanceInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsTbdEventsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsTimeframeInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsTopInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsTopQuestionsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsUnlistedInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsUpcomingEventsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsUserAFSubmissionsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsUserCommentedOnResult = {
  __typename?: 'PostsUserCommentedOnResult';
  posts?: Maybe<Array<Post>>;
};

type PostsUserPostsInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsVoting2019Input = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  curatedAfter?: InputMaybe<Scalars['String']['input']>;
  excludeEvents?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  filterSettings?: InputMaybe<Scalars['String']['input']>;
  hideCommunity?: InputMaybe<Scalars['String']['input']>;
  includeRelatedQuestions?: InputMaybe<Scalars['String']['input']>;
  karmaThreshold?: InputMaybe<Scalars['String']['input']>;
  notPostIds?: InputMaybe<Scalars['String']['input']>;
  postIds?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortedBy?: InputMaybe<Scalars['String']['input']>;
  timeField?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<Scalars['String']['input']>;
};

type PostsWithActiveDiscussionResult = {
  __typename?: 'PostsWithActiveDiscussionResult';
  results: Array<Post>;
};

type PostsWithApprovedJargonResult = {
  __typename?: 'PostsWithApprovedJargonResult';
  results: Array<PostWithApprovedJargon>;
};

type Query = {
  __typename?: 'Query';
  ActiveTagCount: Scalars['Int']['output'];
  AdminMetadata?: Maybe<Scalars['String']['output']>;
  AllTagsActivityFeed: AllTagsActivityFeedQueryResults;
  AnalyticsSeries?: Maybe<Array<Maybe<AnalyticsSeriesValue>>>;
  ArbitalPageData?: Maybe<ArbitalPageData>;
  CanAccessGoogleDoc?: Maybe<Scalars['Boolean']['output']>;
  CommentsWithReacts?: Maybe<CommentsWithReactsResult>;
  ContinueReading?: Maybe<Array<RecommendResumeSequence>>;
  CrossedKarmaThreshold?: Maybe<CrossedKarmaThresholdResult>;
  CuratedAndPopularThisWeek?: Maybe<CuratedAndPopularThisWeekResult>;
  CurrentFrontpageSurvey?: Maybe<SurveySchedule>;
  DigestHighlights?: Maybe<DigestHighlightsResult>;
  DigestPlannerData: Array<DigestPlannerPost>;
  DigestPosts?: Maybe<Array<Post>>;
  DigestPostsThisWeek?: Maybe<DigestPostsThisWeekResult>;
  ElicitBlockData?: Maybe<ElicitBlockData>;
  EmailPreview?: Maybe<Array<Maybe<EmailPreview>>>;
  GetAllReviewWinners: Array<Post>;
  GetRandomUser?: Maybe<User>;
  GetUserBySlug?: Maybe<User>;
  GivingSeasonHearts: Array<GivingSeasonHeart>;
  GoogleVertexPosts?: Maybe<GoogleVertexPostsResult>;
  IsDisplayNameTaken: Scalars['Boolean']['output'];
  Lightcone2024FundraiserStripeAmounts?: Maybe<Array<Scalars['Int']['output']>>;
  MigrationsDashboard?: Maybe<MigrationsDashboardData>;
  MultiPostAnalytics: MultiPostAnalyticsResult;
  MyDialogues?: Maybe<MyDialoguesResult>;
  NotificationDisplays?: Maybe<NotificationDisplaysResult>;
  PetrovDay2024CheckNumberOfIncoming?: Maybe<PetrovDay2024CheckNumberOfIncomingData>;
  PetrovDayCheckIfIncoming?: Maybe<PetrovDayCheckIfIncomingData>;
  PopularComments?: Maybe<PopularCommentsResult>;
  PostAnalytics: PostAnalyticsResult;
  PostIsCriticism?: Maybe<Scalars['Boolean']['output']>;
  PostsBySubscribedAuthors?: Maybe<PostsBySubscribedAuthorsResult>;
  PostsUserCommentedOn?: Maybe<UserReadHistoryResult>;
  PostsWithActiveDiscussion?: Maybe<PostsWithActiveDiscussionResult>;
  PostsWithApprovedJargon?: Maybe<PostsWithApprovedJargonResult>;
  RandomTag: Tag;
  RecentDiscussionFeed: RecentDiscussionFeedQueryResults;
  RecentlyActiveDialogues?: Maybe<RecentlyActiveDialoguesResult>;
  RecombeeHybridPosts?: Maybe<RecombeeHybridPostsResult>;
  RecombeeLatestPosts?: Maybe<RecombeeLatestPostsResult>;
  Recommendations?: Maybe<Array<Post>>;
  RevisionsDiff?: Maybe<Scalars['String']['output']>;
  RssPostChanges: RssPostChangeInfo;
  SearchSynonyms: Array<Scalars['String']['output']>;
  SiteData?: Maybe<Site>;
  SubforumMagicFeed: SubforumMagicFeedQueryResults;
  SubforumNewFeed: SubforumNewFeedQueryResults;
  SubforumOldFeed: SubforumOldFeedQueryResults;
  SubforumRecentCommentsFeed: SubforumRecentCommentsFeedQueryResults;
  SubforumTopFeed: SubforumTopFeedQueryResults;
  SubscribedFeed: SubscribedFeedQueryResults;
  SuggestedFeedSubscriptionUsers?: Maybe<SuggestedFeedSubscriptionUsersResult>;
  TagHistoryFeed: TagHistoryFeedQueryResults;
  TagPreview?: Maybe<TagPreviewWithSummaries>;
  TagUpdatesByUser?: Maybe<Array<TagUpdates>>;
  TagUpdatesInTimeBlock?: Maybe<Array<TagUpdates>>;
  TagsByCoreTagId: TagWithTotalCount;
  UltraFeed: UltraFeedQueryResults;
  UserReadHistory?: Maybe<UserReadHistoryResult>;
  UserReadsPerCoreTag: Array<UserCoreTagReads>;
  UserWrappedDataByYear?: Maybe<WrappedDataByYear>;
  UsersReadPostsOfTargetUser?: Maybe<Array<Post>>;
  advisorRequest?: Maybe<SingleAdvisorRequestOutput>;
  advisorRequests?: Maybe<MultiAdvisorRequestOutput>;
  arbitalTagContentRel?: Maybe<SingleArbitalTagContentRelOutput>;
  arbitalTagContentRels?: Maybe<MultiArbitalTagContentRelOutput>;
  ban?: Maybe<SingleBanOutput>;
  bans?: Maybe<MultiBanOutput>;
  book?: Maybe<SingleBookOutput>;
  bookmark?: Maybe<SingleBookmarkOutput>;
  bookmarks?: Maybe<MultiBookmarkOutput>;
  books?: Maybe<MultiBookOutput>;
  chapter?: Maybe<SingleChapterOutput>;
  chapters?: Maybe<MultiChapterOutput>;
  ckEditorUserSession?: Maybe<SingleCkEditorUserSessionOutput>;
  ckEditorUserSessions?: Maybe<MultiCkEditorUserSessionOutput>;
  clientId?: Maybe<SingleClientIdOutput>;
  clientIds?: Maybe<MultiClientIdOutput>;
  collection?: Maybe<SingleCollectionOutput>;
  collections?: Maybe<MultiCollectionOutput>;
  comment?: Maybe<SingleCommentOutput>;
  commentModeratorAction?: Maybe<SingleCommentModeratorActionOutput>;
  commentModeratorActions?: Maybe<MultiCommentModeratorActionOutput>;
  comments?: Maybe<MultiCommentOutput>;
  conversation?: Maybe<SingleConversationOutput>;
  conversations?: Maybe<MultiConversationOutput>;
  convertDocument?: Maybe<Scalars['JSON']['output']>;
  curationNotice?: Maybe<SingleCurationNoticeOutput>;
  curationNotices?: Maybe<MultiCurationNoticeOutput>;
  currentUser?: Maybe<User>;
  dialogueCheck?: Maybe<SingleDialogueCheckOutput>;
  dialogueChecks?: Maybe<MultiDialogueCheckOutput>;
  dialogueMatchPreference?: Maybe<SingleDialogueMatchPreferenceOutput>;
  dialogueMatchPreferences?: Maybe<MultiDialogueMatchPreferenceOutput>;
  digest?: Maybe<SingleDigestOutput>;
  digestPost?: Maybe<SingleDigestPostOutput>;
  digestPosts?: Maybe<MultiDigestPostOutput>;
  digests?: Maybe<MultiDigestOutput>;
  electionCandidate?: Maybe<SingleElectionCandidateOutput>;
  electionCandidates?: Maybe<MultiElectionCandidateOutput>;
  electionVote?: Maybe<SingleElectionVoteOutput>;
  electionVotes?: Maybe<MultiElectionVoteOutput>;
  elicitQuestion?: Maybe<SingleElicitQuestionOutput>;
  elicitQuestionPrediction?: Maybe<SingleElicitQuestionPredictionOutput>;
  elicitQuestionPredictions?: Maybe<MultiElicitQuestionPredictionOutput>;
  elicitQuestions?: Maybe<MultiElicitQuestionOutput>;
  featuredResource?: Maybe<SingleFeaturedResourceOutput>;
  featuredResources?: Maybe<MultiFeaturedResourceOutput>;
  fieldChange?: Maybe<SingleFieldChangeOutput>;
  fieldChanges?: Maybe<MultiFieldChangeOutput>;
  forumEvent?: Maybe<SingleForumEventOutput>;
  forumEvents?: Maybe<MultiForumEventOutput>;
  gardenCode?: Maybe<SingleGardenCodeOutput>;
  gardenCodes?: Maybe<MultiGardenCodeOutput>;
  getCrosspost?: Maybe<Scalars['JSON']['output']>;
  getLinkSharedPost?: Maybe<Post>;
  googleServiceAccountSession?: Maybe<SingleGoogleServiceAccountSessionOutput>;
  googleServiceAccountSessions?: Maybe<MultiGoogleServiceAccountSessionOutput>;
  jargonTerm?: Maybe<SingleJargonTermOutput>;
  jargonTerms?: Maybe<MultiJargonTermOutput>;
  lWEvent?: Maybe<SingleLWEventOutput>;
  lWEvents?: Maybe<MultiLWEventOutput>;
  latestDialogueMessages?: Maybe<Array<Scalars['String']['output']>>;
  latestGoogleDocMetadata?: Maybe<Scalars['JSON']['output']>;
  llmConversation?: Maybe<SingleLlmConversationOutput>;
  llmConversations?: Maybe<MultiLlmConversationOutput>;
  localgroup?: Maybe<SingleLocalgroupOutput>;
  localgroups?: Maybe<MultiLocalgroupOutput>;
  message?: Maybe<SingleMessageOutput>;
  messages?: Maybe<MultiMessageOutput>;
  moderationTemplate?: Maybe<SingleModerationTemplateOutput>;
  moderationTemplates?: Maybe<MultiModerationTemplateOutput>;
  moderatorAction?: Maybe<SingleModeratorActionOutput>;
  moderatorActions?: Maybe<MultiModeratorActionOutput>;
  moderatorViewIPAddress?: Maybe<ModeratorIPAddressInfo>;
  multiDocument?: Maybe<SingleMultiDocumentOutput>;
  multiDocuments?: Maybe<MultiMultiDocumentOutput>;
  notification?: Maybe<SingleNotificationOutput>;
  notifications?: Maybe<MultiNotificationOutput>;
  petrov2024checkIfNuked?: Maybe<Scalars['Boolean']['output']>;
  petrovDayAction?: Maybe<SinglePetrovDayActionOutput>;
  petrovDayActions?: Maybe<MultiPetrovDayActionOutput>;
  podcast?: Maybe<SinglePodcastOutput>;
  podcastEpisode?: Maybe<SinglePodcastEpisodeOutput>;
  podcastEpisodes?: Maybe<MultiPodcastEpisodeOutput>;
  podcasts?: Maybe<MultiPodcastOutput>;
  post?: Maybe<SinglePostOutput>;
  postRelation?: Maybe<SinglePostRelationOutput>;
  postRelations?: Maybe<MultiPostRelationOutput>;
  posts?: Maybe<MultiPostOutput>;
  rSSFeed?: Maybe<SingleRSSFeedOutput>;
  rSSFeeds?: Maybe<MultiRSSFeedOutput>;
  report?: Maybe<SingleReportOutput>;
  reports?: Maybe<MultiReportOutput>;
  reviewVote?: Maybe<SingleReviewVoteOutput>;
  reviewVotes?: Maybe<MultiReviewVoteOutput>;
  reviewWinner?: Maybe<SingleReviewWinnerOutput>;
  reviewWinnerArt?: Maybe<SingleReviewWinnerArtOutput>;
  reviewWinnerArts?: Maybe<MultiReviewWinnerArtOutput>;
  reviewWinners?: Maybe<MultiReviewWinnerOutput>;
  revision?: Maybe<SingleRevisionOutput>;
  revisions?: Maybe<MultiRevisionOutput>;
  sequence?: Maybe<SingleSequenceOutput>;
  sequences?: Maybe<MultiSequenceOutput>;
  splashArtCoordinate?: Maybe<SingleSplashArtCoordinateOutput>;
  splashArtCoordinates?: Maybe<MultiSplashArtCoordinateOutput>;
  spotlight?: Maybe<SingleSpotlightOutput>;
  spotlights?: Maybe<MultiSpotlightOutput>;
  subscription?: Maybe<SingleSubscriptionOutput>;
  subscriptions?: Maybe<MultiSubscriptionOutput>;
  survey?: Maybe<SingleSurveyOutput>;
  surveyQuestion?: Maybe<SingleSurveyQuestionOutput>;
  surveyQuestions?: Maybe<MultiSurveyQuestionOutput>;
  surveyResponse?: Maybe<SingleSurveyResponseOutput>;
  surveyResponses?: Maybe<MultiSurveyResponseOutput>;
  surveySchedule?: Maybe<SingleSurveyScheduleOutput>;
  surveySchedules?: Maybe<MultiSurveyScheduleOutput>;
  surveys?: Maybe<MultiSurveyOutput>;
  tag?: Maybe<SingleTagOutput>;
  tagFlag?: Maybe<SingleTagFlagOutput>;
  tagFlags?: Maybe<MultiTagFlagOutput>;
  tagRel?: Maybe<SingleTagRelOutput>;
  tagRels?: Maybe<MultiTagRelOutput>;
  tags?: Maybe<MultiTagOutput>;
  typingIndicator?: Maybe<SingleTypingIndicatorOutput>;
  typingIndicators?: Maybe<MultiTypingIndicatorOutput>;
  ultraFeedEvent?: Maybe<SingleUltraFeedEventOutput>;
  ultraFeedEvents?: Maybe<MultiUltraFeedEventOutput>;
  unreadNotificationCounts: NotificationCounts;
  user?: Maybe<SingleUserOutput>;
  userEAGDetail?: Maybe<SingleUserEAGDetailOutput>;
  userEAGDetails?: Maybe<MultiUserEAGDetailOutput>;
  userJobAd?: Maybe<SingleUserJobAdOutput>;
  userJobAds?: Maybe<MultiUserJobAdOutput>;
  userMostValuablePost?: Maybe<SingleUserMostValuablePostOutput>;
  userMostValuablePosts?: Maybe<MultiUserMostValuablePostOutput>;
  userRateLimit?: Maybe<SingleUserRateLimitOutput>;
  userRateLimits?: Maybe<MultiUserRateLimitOutput>;
  userTagRel?: Maybe<SingleUserTagRelOutput>;
  userTagRels?: Maybe<MultiUserTagRelOutput>;
  users?: Maybe<MultiUserOutput>;
  vote?: Maybe<SingleVoteOutput>;
  votes?: Maybe<MultiVoteOutput>;
};


type QueryAllTagsActivityFeedArgs = {
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


type QueryAnalyticsSeriesArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  postIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


type QueryArbitalPageDataArgs = {
  pageAlias?: InputMaybe<Scalars['String']['input']>;
};


type QueryCanAccessGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
};


type QueryCommentsWithReactsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryCrossedKarmaThresholdArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryCuratedAndPopularThisWeekArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryDigestHighlightsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryDigestPlannerDataArgs = {
  digestId?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


type QueryDigestPostsArgs = {
  num?: InputMaybe<Scalars['Int']['input']>;
};


type QueryDigestPostsThisWeekArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryElicitBlockDataArgs = {
  questionId?: InputMaybe<Scalars['String']['input']>;
};


type QueryEmailPreviewArgs = {
  notificationIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  postId?: InputMaybe<Scalars['String']['input']>;
};


type QueryGetRandomUserArgs = {
  userIsAuthor: Scalars['String']['input'];
};


type QueryGetUserBySlugArgs = {
  slug: Scalars['String']['input'];
};


type QueryGivingSeasonHeartsArgs = {
  electionName: Scalars['String']['input'];
};


type QueryGoogleVertexPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


type QueryIsDisplayNameTakenArgs = {
  displayName: Scalars['String']['input'];
};


type QueryMultiPostAnalyticsArgs = {
  desc?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  postIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


type QueryMyDialoguesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryNotificationDisplaysArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


type QueryPopularCommentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryPostAnalyticsArgs = {
  postId: Scalars['String']['input'];
};


type QueryPostIsCriticismArgs = {
  args?: InputMaybe<Scalars['JSON']['input']>;
};


type QueryPostsBySubscribedAuthorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryPostsUserCommentedOnArgs = {
  filter?: InputMaybe<PostReviewFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PostReviewSort>;
};


type QueryPostsWithActiveDiscussionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryPostsWithApprovedJargonArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryRecentDiscussionFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


type QueryRecentlyActiveDialoguesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryRecombeeHybridPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


type QueryRecombeeLatestPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


type QueryRecommendationsArgs = {
  algorithm?: InputMaybe<Scalars['JSON']['input']>;
  count?: InputMaybe<Scalars['Int']['input']>;
};


type QueryRevisionsDiffArgs = {
  afterRev: Scalars['String']['input'];
  beforeRev?: InputMaybe<Scalars['String']['input']>;
  collectionName: Scalars['String']['input'];
  fieldName: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  trim?: InputMaybe<Scalars['Boolean']['input']>;
};


type QueryRssPostChangesArgs = {
  postId: Scalars['String']['input'];
};


type QuerySubforumMagicFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


type QuerySubforumNewFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


type QuerySubforumOldFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


type QuerySubforumRecentCommentsFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


type QuerySubforumTopFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


type QuerySubscribedFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


type QuerySuggestedFeedSubscriptionUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type QueryTagHistoryFeedArgs = {
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  options?: InputMaybe<Scalars['JSON']['input']>;
  tagId: Scalars['String']['input'];
};


type QueryTagPreviewArgs = {
  hash?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};


type QueryTagUpdatesByUserArgs = {
  limit: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  userId: Scalars['String']['input'];
};


type QueryTagUpdatesInTimeBlockArgs = {
  after: Scalars['Date']['input'];
  before: Scalars['Date']['input'];
};


type QueryTagsByCoreTagIdArgs = {
  coreTagId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  searchTagIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


type QueryUltraFeedArgs = {
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


type QueryUserReadHistoryArgs = {
  filter?: InputMaybe<PostReviewFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PostReviewSort>;
};


type QueryUserReadsPerCoreTagArgs = {
  userId: Scalars['String']['input'];
};


type QueryUserWrappedDataByYearArgs = {
  userId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


type QueryUsersReadPostsOfTargetUserArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  targetUserId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


type QueryadvisorRequestArgs = {
  input?: InputMaybe<SingleAdvisorRequestInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryadvisorRequestsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiAdvisorRequestInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<AdvisorRequestSelector>;
};


type QueryarbitalTagContentRelArgs = {
  input?: InputMaybe<SingleArbitalTagContentRelInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryarbitalTagContentRelsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiArbitalTagContentRelInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ArbitalTagContentRelSelector>;
};


type QuerybanArgs = {
  input?: InputMaybe<SingleBanInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerybansArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiBanInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<BanSelector>;
};


type QuerybookArgs = {
  input?: InputMaybe<SingleBookInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerybookmarkArgs = {
  input?: InputMaybe<SingleBookmarkInput>;
};


type QuerybookmarksArgs = {
  input?: InputMaybe<MultiBookmarkInput>;
};


type QuerybooksArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiBookInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<BookSelector>;
};


type QuerychapterArgs = {
  input?: InputMaybe<SingleChapterInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerychaptersArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiChapterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ChapterSelector>;
};


type QueryckEditorUserSessionArgs = {
  input?: InputMaybe<SingleCkEditorUserSessionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryckEditorUserSessionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiCkEditorUserSessionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<CkEditorUserSessionSelector>;
};


type QueryclientIdArgs = {
  input?: InputMaybe<SingleClientIdInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryclientIdsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiClientIdInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ClientIdSelector>;
};


type QuerycollectionArgs = {
  input?: InputMaybe<SingleCollectionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerycollectionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiCollectionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<CollectionSelector>;
};


type QuerycommentArgs = {
  input?: InputMaybe<SingleCommentInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerycommentModeratorActionArgs = {
  input?: InputMaybe<SingleCommentModeratorActionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerycommentModeratorActionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiCommentModeratorActionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<CommentModeratorActionSelector>;
};


type QuerycommentsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiCommentInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<CommentSelector>;
};


type QueryconversationArgs = {
  input?: InputMaybe<SingleConversationInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryconversationsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiConversationInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ConversationSelector>;
};


type QueryconvertDocumentArgs = {
  document?: InputMaybe<Scalars['JSON']['input']>;
  targetFormat?: InputMaybe<Scalars['String']['input']>;
};


type QuerycurationNoticeArgs = {
  input?: InputMaybe<SingleCurationNoticeInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerycurationNoticesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiCurationNoticeInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<CurationNoticeSelector>;
};


type QuerydialogueCheckArgs = {
  input?: InputMaybe<SingleDialogueCheckInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerydialogueChecksArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiDialogueCheckInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<DialogueCheckSelector>;
};


type QuerydialogueMatchPreferenceArgs = {
  input?: InputMaybe<SingleDialogueMatchPreferenceInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerydialogueMatchPreferencesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiDialogueMatchPreferenceInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<DialogueMatchPreferenceSelector>;
};


type QuerydigestArgs = {
  input?: InputMaybe<SingleDigestInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerydigestPostArgs = {
  input?: InputMaybe<SingleDigestPostInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerydigestPostsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiDigestPostInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<DigestPostSelector>;
};


type QuerydigestsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiDigestInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<DigestSelector>;
};


type QueryelectionCandidateArgs = {
  input?: InputMaybe<SingleElectionCandidateInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryelectionCandidatesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiElectionCandidateInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ElectionCandidateSelector>;
};


type QueryelectionVoteArgs = {
  input?: InputMaybe<SingleElectionVoteInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryelectionVotesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiElectionVoteInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ElectionVoteSelector>;
};


type QueryelicitQuestionArgs = {
  input?: InputMaybe<SingleElicitQuestionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryelicitQuestionPredictionArgs = {
  input?: InputMaybe<SingleElicitQuestionPredictionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryelicitQuestionPredictionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiElicitQuestionPredictionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ElicitQuestionPredictionSelector>;
};


type QueryelicitQuestionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiElicitQuestionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ElicitQuestionSelector>;
};


type QueryfeaturedResourceArgs = {
  input?: InputMaybe<SingleFeaturedResourceInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryfeaturedResourcesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiFeaturedResourceInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<FeaturedResourceSelector>;
};


type QueryfieldChangeArgs = {
  input?: InputMaybe<SingleFieldChangeInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryfieldChangesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiFieldChangeInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<FieldChangeSelector>;
};


type QueryforumEventArgs = {
  input?: InputMaybe<SingleForumEventInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryforumEventsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiForumEventInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ForumEventSelector>;
};


type QuerygardenCodeArgs = {
  input?: InputMaybe<SingleGardenCodeInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerygardenCodesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiGardenCodeInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<GardenCodeSelector>;
};


type QuerygetCrosspostArgs = {
  args?: InputMaybe<Scalars['JSON']['input']>;
};


type QuerygetLinkSharedPostArgs = {
  linkSharingKey: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


type QuerygoogleServiceAccountSessionArgs = {
  input?: InputMaybe<SingleGoogleServiceAccountSessionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerygoogleServiceAccountSessionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiGoogleServiceAccountSessionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<GoogleServiceAccountSessionSelector>;
};


type QueryjargonTermArgs = {
  input?: InputMaybe<SingleJargonTermInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryjargonTermsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiJargonTermInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<JargonTermSelector>;
};


type QuerylWEventArgs = {
  input?: InputMaybe<SingleLWEventInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerylWEventsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiLWEventInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<LWEventSelector>;
};


type QuerylatestDialogueMessagesArgs = {
  dialogueId: Scalars['String']['input'];
  numMessages: Scalars['Int']['input'];
};


type QuerylatestGoogleDocMetadataArgs = {
  postId: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


type QueryllmConversationArgs = {
  input?: InputMaybe<SingleLlmConversationInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryllmConversationsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiLlmConversationInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<LlmConversationSelector>;
};


type QuerylocalgroupArgs = {
  input?: InputMaybe<SingleLocalgroupInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerylocalgroupsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiLocalgroupInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<LocalgroupSelector>;
};


type QuerymessageArgs = {
  input?: InputMaybe<SingleMessageInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerymessagesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiMessageInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<MessageSelector>;
};


type QuerymoderationTemplateArgs = {
  input?: InputMaybe<SingleModerationTemplateInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerymoderationTemplatesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiModerationTemplateInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ModerationTemplateSelector>;
};


type QuerymoderatorActionArgs = {
  input?: InputMaybe<SingleModeratorActionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerymoderatorActionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiModeratorActionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ModeratorActionSelector>;
};


type QuerymoderatorViewIPAddressArgs = {
  ipAddress: Scalars['String']['input'];
};


type QuerymultiDocumentArgs = {
  input?: InputMaybe<SingleMultiDocumentInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerymultiDocumentsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiMultiDocumentInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<MultiDocumentSelector>;
};


type QuerynotificationArgs = {
  input?: InputMaybe<SingleNotificationInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerynotificationsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiNotificationInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<NotificationSelector>;
};


type QuerypetrovDayActionArgs = {
  input?: InputMaybe<SinglePetrovDayActionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerypetrovDayActionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiPetrovDayActionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<PetrovDayActionSelector>;
};


type QuerypodcastArgs = {
  input?: InputMaybe<SinglePodcastInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerypodcastEpisodeArgs = {
  input?: InputMaybe<SinglePodcastEpisodeInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerypodcastEpisodesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiPodcastEpisodeInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<PodcastEpisodeSelector>;
};


type QuerypodcastsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiPodcastInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<PodcastSelector>;
};


type QuerypostArgs = {
  input?: InputMaybe<SinglePostInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerypostRelationArgs = {
  input?: InputMaybe<SinglePostRelationInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerypostRelationsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiPostRelationInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<PostRelationSelector>;
};


type QuerypostsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiPostInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<PostSelector>;
};


type QueryrSSFeedArgs = {
  input?: InputMaybe<SingleRSSFeedInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryrSSFeedsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiRSSFeedInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<RSSFeedSelector>;
};


type QueryreportArgs = {
  input?: InputMaybe<SingleReportInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryreportsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiReportInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ReportSelector>;
};


type QueryreviewVoteArgs = {
  input?: InputMaybe<SingleReviewVoteInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryreviewVotesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiReviewVoteInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ReviewVoteSelector>;
};


type QueryreviewWinnerArgs = {
  input?: InputMaybe<SingleReviewWinnerInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryreviewWinnerArtArgs = {
  input?: InputMaybe<SingleReviewWinnerArtInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryreviewWinnerArtsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiReviewWinnerArtInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ReviewWinnerArtSelector>;
};


type QueryreviewWinnersArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiReviewWinnerInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<ReviewWinnerSelector>;
};


type QueryrevisionArgs = {
  input?: InputMaybe<SingleRevisionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryrevisionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiRevisionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<RevisionSelector>;
};


type QuerysequenceArgs = {
  input?: InputMaybe<SingleSequenceInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysequencesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSequenceInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SequenceSelector>;
};


type QuerysplashArtCoordinateArgs = {
  input?: InputMaybe<SingleSplashArtCoordinateInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysplashArtCoordinatesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSplashArtCoordinateInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SplashArtCoordinateSelector>;
};


type QueryspotlightArgs = {
  input?: InputMaybe<SingleSpotlightInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryspotlightsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSpotlightInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SpotlightSelector>;
};


type QuerysubscriptionArgs = {
  input?: InputMaybe<SingleSubscriptionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysubscriptionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSubscriptionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SubscriptionSelector>;
};


type QuerysurveyArgs = {
  input?: InputMaybe<SingleSurveyInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysurveyQuestionArgs = {
  input?: InputMaybe<SingleSurveyQuestionInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysurveyQuestionsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSurveyQuestionInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SurveyQuestionSelector>;
};


type QuerysurveyResponseArgs = {
  input?: InputMaybe<SingleSurveyResponseInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysurveyResponsesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSurveyResponseInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SurveyResponseSelector>;
};


type QuerysurveyScheduleArgs = {
  input?: InputMaybe<SingleSurveyScheduleInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerysurveySchedulesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSurveyScheduleInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SurveyScheduleSelector>;
};


type QuerysurveysArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiSurveyInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<SurveySelector>;
};


type QuerytagArgs = {
  input?: InputMaybe<SingleTagInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerytagFlagArgs = {
  input?: InputMaybe<SingleTagFlagInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerytagFlagsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiTagFlagInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<TagFlagSelector>;
};


type QuerytagRelArgs = {
  input?: InputMaybe<SingleTagRelInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerytagRelsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiTagRelInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<TagRelSelector>;
};


type QuerytagsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiTagInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<TagSelector>;
};


type QuerytypingIndicatorArgs = {
  input?: InputMaybe<SingleTypingIndicatorInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QuerytypingIndicatorsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiTypingIndicatorInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<TypingIndicatorSelector>;
};


type QueryultraFeedEventArgs = {
  input?: InputMaybe<SingleUltraFeedEventInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryultraFeedEventsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUltraFeedEventInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UltraFeedEventSelector>;
};


type QueryuserArgs = {
  input?: InputMaybe<SingleUserInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryuserEAGDetailArgs = {
  input?: InputMaybe<SingleUserEAGDetailInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryuserEAGDetailsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUserEAGDetailInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UserEAGDetailSelector>;
};


type QueryuserJobAdArgs = {
  input?: InputMaybe<SingleUserJobAdInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryuserJobAdsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUserJobAdInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UserJobAdSelector>;
};


type QueryuserMostValuablePostArgs = {
  input?: InputMaybe<SingleUserMostValuablePostInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryuserMostValuablePostsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUserMostValuablePostInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UserMostValuablePostSelector>;
};


type QueryuserRateLimitArgs = {
  input?: InputMaybe<SingleUserRateLimitInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryuserRateLimitsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUserRateLimitInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UserRateLimitSelector>;
};


type QueryuserTagRelArgs = {
  input?: InputMaybe<SingleUserTagRelInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryuserTagRelsArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUserTagRelInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UserTagRelSelector>;
};


type QueryusersArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiUserInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<UserSelector>;
};


type QueryvoteArgs = {
  input?: InputMaybe<SingleVoteInput>;
  selector?: InputMaybe<SelectorInput>;
};


type QueryvotesArgs = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<MultiVoteInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  selector?: InputMaybe<VoteSelector>;
};

type RSSFeed = {
  __typename?: 'RSSFeed';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  displayFullContent: Scalars['Boolean']['output'];
  importAsDraft: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  nickname: Scalars['String']['output'];
  ownedByUser: Scalars['Boolean']['output'];
  rawFeed: Scalars['JSON']['output'];
  schemaVersion: Scalars['Float']['output'];
  setCanonicalUrl: Scalars['Boolean']['output'];
  status?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

type RSSFeedOutput = {
  __typename?: 'RSSFeedOutput';
  data?: Maybe<RSSFeed>;
};

type RSSFeedSelector = {
  default?: InputMaybe<EmptyViewInput>;
  usersFeed?: InputMaybe<RSSFeedsUsersFeedInput>;
};

type RSSFeedsUsersFeedInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ReactPaletteStyle =
  | 'gridView'
  | 'listView';

type ReactionChange = {
  __typename?: 'ReactionChange';
  reactionType: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type ReadStatus = {
  __typename?: 'ReadStatus';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type RecentDiscussionFeedEntryType = {
  __typename?: 'RecentDiscussionFeedEntryType';
  postCommented?: Maybe<Post>;
  shortformCommented?: Maybe<Post>;
  tagDiscussed?: Maybe<Tag>;
  tagRevised?: Maybe<Revision>;
  type: Scalars['String']['output'];
};

type RecentDiscussionFeedQueryResults = {
  __typename?: 'RecentDiscussionFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<RecentDiscussionFeedEntryType>>;
  sessionId?: Maybe<Scalars['String']['output']>;
};

type RecentlyActiveDialoguesResult = {
  __typename?: 'RecentlyActiveDialoguesResult';
  results: Array<Post>;
};

type RecombeeHybridPostsResult = {
  __typename?: 'RecombeeHybridPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

type RecombeeLatestPostsResult = {
  __typename?: 'RecombeeLatestPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

type RecombeeRecommendedPost = {
  __typename?: 'RecombeeRecommendedPost';
  curated?: Maybe<Scalars['Boolean']['output']>;
  generatedAt?: Maybe<Scalars['Date']['output']>;
  post: Post;
  recommId?: Maybe<Scalars['String']['output']>;
  scenario?: Maybe<Scalars['String']['output']>;
  stickied?: Maybe<Scalars['Boolean']['output']>;
};

type RecommendResumeSequence = {
  __typename?: 'RecommendResumeSequence';
  collection?: Maybe<Collection>;
  lastReadTime?: Maybe<Scalars['Date']['output']>;
  nextPost: Post;
  numRead?: Maybe<Scalars['Int']['output']>;
  numTotal?: Maybe<Scalars['Int']['output']>;
  sequence?: Maybe<Sequence>;
};

type RecommendationAlgorithmSettingsInput = {
  count: Scalars['Int']['input'];
  curatedModifier: Scalars['Float']['input'];
  frontpageModifier: Scalars['Float']['input'];
  method: Scalars['String']['input'];
  onlyUnread: Scalars['Boolean']['input'];
  personalBlogpostModifier: Scalars['Float']['input'];
  scoreExponent: Scalars['Float']['input'];
  scoreOffset: Scalars['Float']['input'];
};

type RecommendationSettingsInput = {
  frontpage: RecommendationAlgorithmSettingsInput;
  frontpageEA: RecommendationAlgorithmSettingsInput;
  recommendationspage: RecommendationAlgorithmSettingsInput;
};

type RecommendationsCache = {
  __typename?: 'RecommendationsCache';
  _id: Scalars['String']['output'];
  attributionId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  scenario?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  source?: Maybe<Scalars['String']['output']>;
  ttlMs?: Maybe<Scalars['Float']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

type Report = {
  __typename?: 'Report';
  _id: Scalars['String']['output'];
  claimedUser?: Maybe<User>;
  claimedUserId?: Maybe<Scalars['String']['output']>;
  closedAt?: Maybe<Scalars['Date']['output']>;
  comment?: Maybe<Comment>;
  commentId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  description?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  link: Scalars['String']['output'];
  markedAsSpam?: Maybe<Scalars['Boolean']['output']>;
  post?: Maybe<Post>;
  postId?: Maybe<Scalars['String']['output']>;
  reportedAsSpam?: Maybe<Scalars['Boolean']['output']>;
  reportedUser?: Maybe<User>;
  reportedUserId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

type ReportOutput = {
  __typename?: 'ReportOutput';
  data?: Maybe<Report>;
};

type ReportSelector = {
  adminClaimedReports?: InputMaybe<ReportsAdminClaimedReportsInput>;
  allReports?: InputMaybe<EmptyViewInput>;
  claimedReports?: InputMaybe<EmptyViewInput>;
  closedReports?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  sunshineSidebarReports?: InputMaybe<EmptyViewInput>;
  unclaimedReports?: InputMaybe<EmptyViewInput>;
};

type ReportsAdminClaimedReportsInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ReviewVote = {
  __typename?: 'ReviewVote';
  _id: Scalars['String']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  dummy: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId: Scalars['String']['output'];
  quadraticScore: Scalars['Int']['output'];
  qualitativeScore: Scalars['Int']['output'];
  reactions?: Maybe<Array<Scalars['String']['output']>>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  year: Scalars['String']['output'];
};

type ReviewVoteSelector = {
  default?: InputMaybe<EmptyViewInput>;
  reviewVotesAdminDashboard?: InputMaybe<EmptyViewInput>;
  reviewVotesForPost?: InputMaybe<EmptyViewInput>;
  reviewVotesForPostAndUser?: InputMaybe<EmptyViewInput>;
  reviewVotesFromUser?: InputMaybe<ReviewVotesReviewVotesFromUserInput>;
};

type ReviewVotesReviewVotesFromUserInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
  year?: InputMaybe<Scalars['String']['input']>;
};

type ReviewWinner = {
  __typename?: 'ReviewWinner';
  _id: Scalars['String']['output'];
  category: Scalars['String']['output'];
  competitorCount?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['Date']['output'];
  curatedOrder?: Maybe<Scalars['Float']['output']>;
  isAI?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId: Scalars['String']['output'];
  reviewRanking: Scalars['Float']['output'];
  reviewWinnerArt?: Maybe<ReviewWinnerArt>;
  reviewYear: Scalars['Float']['output'];
  schemaVersion: Scalars['Float']['output'];
};

type ReviewWinnerArt = {
  __typename?: 'ReviewWinnerArt';
  _id: Scalars['String']['output'];
  activeSplashArtCoordinates?: Maybe<SplashArtCoordinate>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  postId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  splashArtImagePrompt: Scalars['String']['output'];
  splashArtImageUrl: Scalars['String']['output'];
};

type ReviewWinnerArtSelector = {
  allForYear?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  postArt?: InputMaybe<ReviewWinnerArtsPostArtInput>;
};

type ReviewWinnerArtsPostArtInput = {
  postId?: InputMaybe<Scalars['String']['input']>;
};

type ReviewWinnerSelector = {
  bestOfLessWrongAnnouncement?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  reviewWinnerSingle?: InputMaybe<ReviewWinnersReviewWinnerSingleInput>;
};

type ReviewWinnersReviewWinnerSingleInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  reviewRanking?: InputMaybe<Scalars['String']['input']>;
  reviewYear?: InputMaybe<Scalars['String']['input']>;
};

type Revision = {
  __typename?: 'Revision';
  _id: Scalars['String']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  automatedContentEvaluations?: Maybe<AutomatedContentEvaluation>;
  baseScore: Scalars['Float']['output'];
  changeMetrics: Scalars['JSON']['output'];
  ckEditorMarkup?: Maybe<Scalars['String']['output']>;
  collectionName?: Maybe<Scalars['String']['output']>;
  commitMessage?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  draft?: Maybe<Scalars['Boolean']['output']>;
  editedAt: Scalars['Date']['output'];
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  fieldName?: Maybe<Scalars['String']['output']>;
  googleDocMetadata?: Maybe<Scalars['JSON']['output']>;
  hasFootnotes?: Maybe<Scalars['Boolean']['output']>;
  html?: Maybe<Scalars['String']['output']>;
  htmlHighlight: Scalars['String']['output'];
  htmlHighlightStartingAtHash: Scalars['String']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  lens?: Maybe<MultiDocument>;
  markdown?: Maybe<Scalars['String']['output']>;
  originalContents: ContentType;
  plaintextDescription: Scalars['String']['output'];
  plaintextMainText: Scalars['String']['output'];
  post?: Maybe<Post>;
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  skipAttributions: Scalars['Boolean']['output'];
  summary?: Maybe<MultiDocument>;
  tag?: Maybe<Tag>;
  updateType?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
  version: Scalars['String']['output'];
  voteCount: Scalars['Float']['output'];
  wordCount: Scalars['Float']['output'];
};


type RevisionhtmlHighlightStartingAtHashArgs = {
  hash?: InputMaybe<Scalars['String']['input']>;
};

type RevisionOutput = {
  __typename?: 'RevisionOutput';
  data?: Maybe<Revision>;
};

type RevisionSelector = {
  default?: InputMaybe<EmptyViewInput>;
  revisionByVersionNumber?: InputMaybe<RevisionsRevisionByVersionNumberInput>;
  revisionsByUser?: InputMaybe<RevisionsRevisionsByUserInput>;
  revisionsOnDocument?: InputMaybe<RevisionsRevisionsOnDocumentInput>;
};

type RevisionsKarmaChange = {
  __typename?: 'RevisionsKarmaChange';
  _id: Scalars['String']['output'];
  addedReacts?: Maybe<Array<ReactionChange>>;
  collectionName: Scalars['String']['output'];
  eaAddedReacts?: Maybe<Scalars['JSON']['output']>;
  scoreChange: Scalars['Int']['output'];
  tagId?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  tagSlug?: Maybe<Scalars['String']['output']>;
};

type RevisionsRevisionByVersionNumberInput = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  fieldName?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

type RevisionsRevisionsByUserInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type RevisionsRevisionsOnDocumentInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  documentId?: InputMaybe<Scalars['String']['input']>;
  fieldName?: InputMaybe<Scalars['String']['input']>;
};

type RssPostChangeInfo = {
  __typename?: 'RssPostChangeInfo';
  htmlDiff: Scalars['String']['output'];
  isChanged: Scalars['Boolean']['output'];
  newHtml: Scalars['String']['output'];
};

type SelectorInput = {
  _id?: InputMaybe<Scalars['String']['input']>;
  documentId?: InputMaybe<Scalars['String']['input']>;
};

type SentenceScore = {
  __typename?: 'SentenceScore';
  score: Scalars['Float']['output'];
  sentence: Scalars['String']['output'];
};

type Sequence = {
  __typename?: 'Sequence';
  _id: Scalars['String']['output'];
  af: Scalars['Boolean']['output'];
  bannerImageId?: Maybe<Scalars['String']['output']>;
  canonicalCollection?: Maybe<Collection>;
  canonicalCollectionSlug?: Maybe<Scalars['String']['output']>;
  chapters: Array<Chapter>;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  curatedOrder?: Maybe<Scalars['Float']['output']>;
  draft: Scalars['Boolean']['output'];
  gridImageId?: Maybe<Scalars['String']['output']>;
  hidden: Scalars['Boolean']['output'];
  hideFromAuthorPage: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  lastUpdated: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  noindex: Scalars['Boolean']['output'];
  postsCount: Scalars['Int']['output'];
  readPostsCount: Scalars['Int']['output'];
  schemaVersion: Scalars['Float']['output'];
  title: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  userProfileOrder?: Maybe<Scalars['Float']['output']>;
};


type SequencecontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type SequenceDefaultViewInput = {
  sequenceIds?: InputMaybe<Scalars['String']['input']>;
};

type SequenceOutput = {
  __typename?: 'SequenceOutput';
  data?: Maybe<Sequence>;
};

type SequenceSelector = {
  communitySequences?: InputMaybe<SequencesCommunitySequencesInput>;
  curatedSequences?: InputMaybe<SequencesCuratedSequencesInput>;
  default?: InputMaybe<SequenceDefaultViewInput>;
  userProfile?: InputMaybe<SequencesUserProfileInput>;
  userProfileAll?: InputMaybe<SequencesUserProfileAllInput>;
  userProfilePrivate?: InputMaybe<SequencesUserProfilePrivateInput>;
};

type SequencesCommunitySequencesInput = {
  sequenceIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type SequencesCuratedSequencesInput = {
  sequenceIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type SequencesUserProfileAllInput = {
  sequenceIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type SequencesUserProfileInput = {
  sequenceIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type SequencesUserProfilePrivateInput = {
  sequenceIds?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type Session = {
  __typename?: 'Session';
  _id?: Maybe<Scalars['String']['output']>;
  expires?: Maybe<Scalars['Date']['output']>;
  lastModified?: Maybe<Scalars['Date']['output']>;
  session?: Maybe<Scalars['JSON']['output']>;
};

type SideCommentCache = {
  __typename?: 'SideCommentCache';
  _id: Scalars['String']['output'];
  annotatedHtml?: Maybe<Scalars['String']['output']>;
  commentsByBlock?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  version?: Maybe<Scalars['Float']['output']>;
};

type SingleAdvisorRequestInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleAdvisorRequestOutput = {
  __typename?: 'SingleAdvisorRequestOutput';
  result?: Maybe<AdvisorRequest>;
};

type SingleArbitalTagContentRelInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleArbitalTagContentRelOutput = {
  __typename?: 'SingleArbitalTagContentRelOutput';
  result?: Maybe<ArbitalTagContentRel>;
};

type SingleBanInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleBanOutput = {
  __typename?: 'SingleBanOutput';
  result?: Maybe<Ban>;
};

type SingleBookInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleBookOutput = {
  __typename?: 'SingleBookOutput';
  result?: Maybe<Book>;
};

type SingleBookmarkInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleBookmarkOutput = {
  __typename?: 'SingleBookmarkOutput';
  result?: Maybe<Bookmark>;
};

type SingleChapterInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleChapterOutput = {
  __typename?: 'SingleChapterOutput';
  result?: Maybe<Chapter>;
};

type SingleCkEditorUserSessionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleCkEditorUserSessionOutput = {
  __typename?: 'SingleCkEditorUserSessionOutput';
  result?: Maybe<CkEditorUserSession>;
};

type SingleClientIdInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleClientIdOutput = {
  __typename?: 'SingleClientIdOutput';
  result?: Maybe<ClientId>;
};

type SingleCollectionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleCollectionOutput = {
  __typename?: 'SingleCollectionOutput';
  result?: Maybe<Collection>;
};

type SingleCommentInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleCommentModeratorActionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleCommentModeratorActionOutput = {
  __typename?: 'SingleCommentModeratorActionOutput';
  result?: Maybe<CommentModeratorAction>;
};

type SingleCommentOutput = {
  __typename?: 'SingleCommentOutput';
  result?: Maybe<Comment>;
};

type SingleConversationInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleConversationOutput = {
  __typename?: 'SingleConversationOutput';
  result?: Maybe<Conversation>;
};

type SingleCurationNoticeInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleCurationNoticeOutput = {
  __typename?: 'SingleCurationNoticeOutput';
  result?: Maybe<CurationNotice>;
};

type SingleDialogueCheckInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleDialogueCheckOutput = {
  __typename?: 'SingleDialogueCheckOutput';
  result?: Maybe<DialogueCheck>;
};

type SingleDialogueMatchPreferenceInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleDialogueMatchPreferenceOutput = {
  __typename?: 'SingleDialogueMatchPreferenceOutput';
  result?: Maybe<DialogueMatchPreference>;
};

type SingleDigestInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleDigestOutput = {
  __typename?: 'SingleDigestOutput';
  result?: Maybe<Digest>;
};

type SingleDigestPostInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleDigestPostOutput = {
  __typename?: 'SingleDigestPostOutput';
  result?: Maybe<DigestPost>;
};

type SingleElectionCandidateInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleElectionCandidateOutput = {
  __typename?: 'SingleElectionCandidateOutput';
  result?: Maybe<ElectionCandidate>;
};

type SingleElectionVoteInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleElectionVoteOutput = {
  __typename?: 'SingleElectionVoteOutput';
  result?: Maybe<ElectionVote>;
};

type SingleElicitQuestionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleElicitQuestionOutput = {
  __typename?: 'SingleElicitQuestionOutput';
  result?: Maybe<ElicitQuestion>;
};

type SingleElicitQuestionPredictionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleElicitQuestionPredictionOutput = {
  __typename?: 'SingleElicitQuestionPredictionOutput';
  result?: Maybe<ElicitQuestionPrediction>;
};

type SingleFeaturedResourceInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleFeaturedResourceOutput = {
  __typename?: 'SingleFeaturedResourceOutput';
  result?: Maybe<FeaturedResource>;
};

type SingleFieldChangeInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleFieldChangeOutput = {
  __typename?: 'SingleFieldChangeOutput';
  result?: Maybe<FieldChange>;
};

type SingleForumEventInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleForumEventOutput = {
  __typename?: 'SingleForumEventOutput';
  result?: Maybe<ForumEvent>;
};

type SingleGardenCodeInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleGardenCodeOutput = {
  __typename?: 'SingleGardenCodeOutput';
  result?: Maybe<GardenCode>;
};

type SingleGoogleServiceAccountSessionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleGoogleServiceAccountSessionOutput = {
  __typename?: 'SingleGoogleServiceAccountSessionOutput';
  result?: Maybe<GoogleServiceAccountSession>;
};

type SingleJargonTermInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleJargonTermOutput = {
  __typename?: 'SingleJargonTermOutput';
  result?: Maybe<JargonTerm>;
};

type SingleLWEventInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleLWEventOutput = {
  __typename?: 'SingleLWEventOutput';
  result?: Maybe<LWEvent>;
};

type SingleLlmConversationInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleLlmConversationOutput = {
  __typename?: 'SingleLlmConversationOutput';
  result?: Maybe<LlmConversation>;
};

type SingleLocalgroupInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleLocalgroupOutput = {
  __typename?: 'SingleLocalgroupOutput';
  result?: Maybe<Localgroup>;
};

type SingleMessageInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleMessageOutput = {
  __typename?: 'SingleMessageOutput';
  result?: Maybe<Message>;
};

type SingleModerationTemplateInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleModerationTemplateOutput = {
  __typename?: 'SingleModerationTemplateOutput';
  result?: Maybe<ModerationTemplate>;
};

type SingleModeratorActionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleModeratorActionOutput = {
  __typename?: 'SingleModeratorActionOutput';
  result?: Maybe<ModeratorAction>;
};

type SingleMultiDocumentInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleMultiDocumentOutput = {
  __typename?: 'SingleMultiDocumentOutput';
  result?: Maybe<MultiDocument>;
};

type SingleNotificationInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleNotificationOutput = {
  __typename?: 'SingleNotificationOutput';
  result?: Maybe<Notification>;
};

type SinglePetrovDayActionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SinglePetrovDayActionOutput = {
  __typename?: 'SinglePetrovDayActionOutput';
  result?: Maybe<PetrovDayAction>;
};

type SinglePodcastEpisodeInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SinglePodcastEpisodeOutput = {
  __typename?: 'SinglePodcastEpisodeOutput';
  result?: Maybe<PodcastEpisode>;
};

type SinglePodcastInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SinglePodcastOutput = {
  __typename?: 'SinglePodcastOutput';
  result?: Maybe<Podcast>;
};

type SinglePostInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SinglePostOutput = {
  __typename?: 'SinglePostOutput';
  result?: Maybe<Post>;
};

type SinglePostRelationInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SinglePostRelationOutput = {
  __typename?: 'SinglePostRelationOutput';
  result?: Maybe<PostRelation>;
};

type SingleRSSFeedInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleRSSFeedOutput = {
  __typename?: 'SingleRSSFeedOutput';
  result?: Maybe<RSSFeed>;
};

type SingleReportInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleReportOutput = {
  __typename?: 'SingleReportOutput';
  result?: Maybe<Report>;
};

type SingleReviewVoteInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleReviewVoteOutput = {
  __typename?: 'SingleReviewVoteOutput';
  result?: Maybe<ReviewVote>;
};

type SingleReviewWinnerArtInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleReviewWinnerArtOutput = {
  __typename?: 'SingleReviewWinnerArtOutput';
  result?: Maybe<ReviewWinnerArt>;
};

type SingleReviewWinnerInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleReviewWinnerOutput = {
  __typename?: 'SingleReviewWinnerOutput';
  result?: Maybe<ReviewWinner>;
};

type SingleRevisionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleRevisionOutput = {
  __typename?: 'SingleRevisionOutput';
  result?: Maybe<Revision>;
};

type SingleSequenceInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSequenceOutput = {
  __typename?: 'SingleSequenceOutput';
  result?: Maybe<Sequence>;
};

type SingleSplashArtCoordinateInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSplashArtCoordinateOutput = {
  __typename?: 'SingleSplashArtCoordinateOutput';
  result?: Maybe<SplashArtCoordinate>;
};

type SingleSpotlightInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSpotlightOutput = {
  __typename?: 'SingleSpotlightOutput';
  result?: Maybe<Spotlight>;
};

type SingleSubscriptionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSubscriptionOutput = {
  __typename?: 'SingleSubscriptionOutput';
  result?: Maybe<Subscription>;
};

type SingleSurveyInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSurveyOutput = {
  __typename?: 'SingleSurveyOutput';
  result?: Maybe<Survey>;
};

type SingleSurveyQuestionInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSurveyQuestionOutput = {
  __typename?: 'SingleSurveyQuestionOutput';
  result?: Maybe<SurveyQuestion>;
};

type SingleSurveyResponseInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSurveyResponseOutput = {
  __typename?: 'SingleSurveyResponseOutput';
  result?: Maybe<SurveyResponse>;
};

type SingleSurveyScheduleInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleSurveyScheduleOutput = {
  __typename?: 'SingleSurveyScheduleOutput';
  result?: Maybe<SurveySchedule>;
};

type SingleTagFlagInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleTagFlagOutput = {
  __typename?: 'SingleTagFlagOutput';
  result?: Maybe<TagFlag>;
};

type SingleTagInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleTagOutput = {
  __typename?: 'SingleTagOutput';
  result?: Maybe<Tag>;
};

type SingleTagRelInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleTagRelOutput = {
  __typename?: 'SingleTagRelOutput';
  result?: Maybe<TagRel>;
};

type SingleTypingIndicatorInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleTypingIndicatorOutput = {
  __typename?: 'SingleTypingIndicatorOutput';
  result?: Maybe<TypingIndicator>;
};

type SingleUltraFeedEventInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleUltraFeedEventOutput = {
  __typename?: 'SingleUltraFeedEventOutput';
  result?: Maybe<UltraFeedEvent>;
};

type SingleUserEAGDetailInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleUserEAGDetailOutput = {
  __typename?: 'SingleUserEAGDetailOutput';
  result?: Maybe<UserEAGDetail>;
};

type SingleUserInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<UserSelectorUniqueInput>;
};

type SingleUserJobAdInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleUserJobAdOutput = {
  __typename?: 'SingleUserJobAdOutput';
  result?: Maybe<UserJobAd>;
};

type SingleUserMostValuablePostInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleUserMostValuablePostOutput = {
  __typename?: 'SingleUserMostValuablePostOutput';
  result?: Maybe<UserMostValuablePost>;
};

type SingleUserOutput = {
  __typename?: 'SingleUserOutput';
  result?: Maybe<User>;
};

type SingleUserRateLimitInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleUserRateLimitOutput = {
  __typename?: 'SingleUserRateLimitOutput';
  result?: Maybe<UserRateLimit>;
};

type SingleUserTagRelInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleUserTagRelOutput = {
  __typename?: 'SingleUserTagRelOutput';
  result?: Maybe<UserTagRel>;
};

type SingleVoteInput = {
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

type SingleVoteOutput = {
  __typename?: 'SingleVoteOutput';
  result?: Maybe<Vote>;
};

type Site = {
  __typename?: 'Site';
  logoUrl?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

type SocialPreviewInput = {
  imageId: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};

type SocialPreviewOutput = {
  __typename?: 'SocialPreviewOutput';
  imageId: Scalars['String']['output'];
  text?: Maybe<Scalars['String']['output']>;
};

type SocialPreviewType = {
  __typename?: 'SocialPreviewType';
  _id: Scalars['String']['output'];
  imageId?: Maybe<Scalars['String']['output']>;
  imageUrl: Scalars['String']['output'];
  text?: Maybe<Scalars['String']['output']>;
};

type SplashArtCoordinate = {
  __typename?: 'SplashArtCoordinate';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  leftFlipped: Scalars['Boolean']['output'];
  leftHeightPct: Scalars['Float']['output'];
  leftWidthPct: Scalars['Float']['output'];
  leftXPct: Scalars['Float']['output'];
  leftYPct: Scalars['Float']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  middleFlipped: Scalars['Boolean']['output'];
  middleHeightPct: Scalars['Float']['output'];
  middleWidthPct: Scalars['Float']['output'];
  middleXPct: Scalars['Float']['output'];
  middleYPct: Scalars['Float']['output'];
  reviewWinnerArt?: Maybe<ReviewWinnerArt>;
  reviewWinnerArtId?: Maybe<Scalars['String']['output']>;
  rightFlipped: Scalars['Boolean']['output'];
  rightHeightPct: Scalars['Float']['output'];
  rightWidthPct: Scalars['Float']['output'];
  rightXPct: Scalars['Float']['output'];
  rightYPct: Scalars['Float']['output'];
  schemaVersion: Scalars['Float']['output'];
};

type SplashArtCoordinateOutput = {
  __typename?: 'SplashArtCoordinateOutput';
  data?: Maybe<SplashArtCoordinate>;
};

type SplashArtCoordinateSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type Spotlight = {
  __typename?: 'Spotlight';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  customSubtitle?: Maybe<Scalars['String']['output']>;
  customTitle?: Maybe<Scalars['String']['output']>;
  deletedDraft: Scalars['Boolean']['output'];
  description?: Maybe<Revision>;
  description_latest?: Maybe<Scalars['String']['output']>;
  document?: Maybe<Post>;
  documentId: Scalars['String']['output'];
  documentType: SpotlightDocumentType;
  draft: Scalars['Boolean']['output'];
  duration: Scalars['Float']['output'];
  headerTitle?: Maybe<Scalars['String']['output']>;
  headerTitleLeftColor?: Maybe<Scalars['String']['output']>;
  headerTitleRightColor?: Maybe<Scalars['String']['output']>;
  imageFade: Scalars['Boolean']['output'];
  imageFadeColor?: Maybe<Scalars['String']['output']>;
  lastPromotedAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  position: Scalars['Float']['output'];
  post?: Maybe<Post>;
  schemaVersion: Scalars['Float']['output'];
  sequence?: Maybe<Sequence>;
  sequenceChapters?: Maybe<Array<Chapter>>;
  showAuthor: Scalars['Boolean']['output'];
  spotlightDarkImageId?: Maybe<Scalars['String']['output']>;
  spotlightImageId?: Maybe<Scalars['String']['output']>;
  spotlightSplashImageUrl?: Maybe<Scalars['String']['output']>;
  subtitleUrl?: Maybe<Scalars['String']['output']>;
  tag?: Maybe<Tag>;
};


type SpotlightdescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type SpotlightDocumentType =
  | 'Post'
  | 'Sequence'
  | 'Tag';

type SpotlightOutput = {
  __typename?: 'SpotlightOutput';
  data?: Maybe<Spotlight>;
};

type SpotlightSelector = {
  default?: InputMaybe<EmptyViewInput>;
  mostRecentlyPromotedSpotlights?: InputMaybe<SpotlightsMostRecentlyPromotedSpotlightsInput>;
  spotlightsByDocumentIds?: InputMaybe<SpotlightsSpotlightsByDocumentIdsInput>;
  spotlightsById?: InputMaybe<SpotlightsSpotlightsByIdInput>;
  spotlightsPage?: InputMaybe<SpotlightsSpotlightsPageInput>;
  spotlightsPageDraft?: InputMaybe<SpotlightsSpotlightsPageDraftInput>;
};

type SpotlightsMostRecentlyPromotedSpotlightsInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type SpotlightsSpotlightsByDocumentIdsInput = {
  documentIds?: InputMaybe<Scalars['String']['input']>;
};

type SpotlightsSpotlightsByIdInput = {
  spotlightIds?: InputMaybe<Scalars['String']['input']>;
};

type SpotlightsSpotlightsPageDraftInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type SpotlightsSpotlightsPageInput = {
  limit?: InputMaybe<Scalars['String']['input']>;
};

type SubforumMagicFeedEntryType = {
  __typename?: 'SubforumMagicFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

type SubforumMagicFeedQueryResults = {
  __typename?: 'SubforumMagicFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumMagicFeedEntryType>>;
};

type SubforumNewFeedEntryType = {
  __typename?: 'SubforumNewFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

type SubforumNewFeedQueryResults = {
  __typename?: 'SubforumNewFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumNewFeedEntryType>>;
};

type SubforumOldFeedEntryType = {
  __typename?: 'SubforumOldFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

type SubforumOldFeedQueryResults = {
  __typename?: 'SubforumOldFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumOldFeedEntryType>>;
};

type SubforumPreferredLayout =
  | 'card'
  | 'list';

type SubforumRecentCommentsFeedEntryType = {
  __typename?: 'SubforumRecentCommentsFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

type SubforumRecentCommentsFeedQueryResults = {
  __typename?: 'SubforumRecentCommentsFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumRecentCommentsFeedEntryType>>;
};

type SubforumTopFeedEntryType = {
  __typename?: 'SubforumTopFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

type SubforumTopFeedQueryResults = {
  __typename?: 'SubforumTopFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumTopFeedEntryType>>;
};

type SubscribedFeedEntryType = {
  __typename?: 'SubscribedFeedEntryType';
  postCommented?: Maybe<SubscribedPostAndComments>;
  type: Scalars['String']['output'];
};

type SubscribedFeedQueryResults = {
  __typename?: 'SubscribedFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubscribedFeedEntryType>>;
};

type SubscribedPostAndComments = {
  __typename?: 'SubscribedPostAndComments';
  _id: Scalars['String']['output'];
  comments?: Maybe<Array<Comment>>;
  expandCommentIds?: Maybe<Array<Scalars['String']['output']>>;
  post: Post;
  postIsFromSubscribedUser: Scalars['Boolean']['output'];
};

type Subscription = {
  __typename?: 'Subscription';
  _id: Scalars['String']['output'];
  collectionName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  state?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type SubscriptionOutput = {
  __typename?: 'SubscriptionOutput';
  data?: Maybe<Subscription>;
};

type SubscriptionSelector = {
  default?: InputMaybe<EmptyViewInput>;
  membersOfGroup?: InputMaybe<EmptyViewInput>;
  subscriptionState?: InputMaybe<EmptyViewInput>;
  subscriptionsOfType?: InputMaybe<SubscriptionsSubscriptionsOfTypeInput>;
};

type SubscriptionsSubscriptionsOfTypeInput = {
  collectionName?: InputMaybe<Scalars['String']['input']>;
  subscriptionType?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type SuggestedFeedSubscriptionUsersResult = {
  __typename?: 'SuggestedFeedSubscriptionUsersResult';
  results: Array<User>;
};

type Survey = {
  __typename?: 'Survey';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  questions: Array<SurveyQuestion>;
  schemaVersion: Scalars['Float']['output'];
};

type SurveyOutput = {
  __typename?: 'SurveyOutput';
  data?: Maybe<Survey>;
};

type SurveyQuestion = {
  __typename?: 'SurveyQuestion';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  format: SurveyQuestionFormat;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  order: Scalars['Float']['output'];
  question: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  survey: Survey;
  surveyId: Scalars['String']['output'];
};

type SurveyQuestionFormat =
  | 'multilineText'
  | 'rank0To10'
  | 'text';

type SurveyQuestionInfo = {
  _id?: InputMaybe<Scalars['String']['input']>;
  format: Scalars['String']['input'];
  question: Scalars['String']['input'];
};

type SurveyQuestionOutput = {
  __typename?: 'SurveyQuestionOutput';
  data?: Maybe<SurveyQuestion>;
};

type SurveyQuestionSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type SurveyResponse = {
  __typename?: 'SurveyResponse';
  _id: Scalars['String']['output'];
  client?: Maybe<ClientId>;
  clientId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  response?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  survey?: Maybe<Survey>;
  surveyId?: Maybe<Scalars['String']['output']>;
  surveySchedule?: Maybe<SurveySchedule>;
  surveyScheduleId?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type SurveyResponseOutput = {
  __typename?: 'SurveyResponseOutput';
  data?: Maybe<SurveyResponse>;
};

type SurveyResponseSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type SurveySchedule = {
  __typename?: 'SurveySchedule';
  _id: Scalars['String']['output'];
  clientIds?: Maybe<Array<Scalars['String']['output']>>;
  clients?: Maybe<Array<ClientId>>;
  createdAt: Scalars['Date']['output'];
  deactivated?: Maybe<Scalars['Boolean']['output']>;
  endDate?: Maybe<Scalars['Date']['output']>;
  impressionsLimit?: Maybe<Scalars['Float']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  maxKarma?: Maybe<Scalars['Float']['output']>;
  maxVisitorPercentage?: Maybe<Scalars['Float']['output']>;
  minKarma?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  startDate?: Maybe<Scalars['Date']['output']>;
  survey?: Maybe<Survey>;
  surveyId: Scalars['String']['output'];
  target?: Maybe<SurveyScheduleTarget>;
};

type SurveyScheduleOutput = {
  __typename?: 'SurveyScheduleOutput';
  data?: Maybe<SurveySchedule>;
};

type SurveyScheduleSelector = {
  default?: InputMaybe<EmptyViewInput>;
  surveySchedulesByCreatedAt?: InputMaybe<EmptyViewInput>;
};

type SurveyScheduleTarget =
  | 'allUsers'
  | 'loggedInOnly'
  | 'loggedOutOnly';

type SurveySelector = {
  default?: InputMaybe<EmptyViewInput>;
  surveysByCreatedAt?: InputMaybe<EmptyViewInput>;
};

type Tag = {
  __typename?: 'Tag';
  _id: Scalars['String']['output'];
  adminOnly: Scalars['Boolean']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  arbitalLinkedPages?: Maybe<ArbitalLinkedPages>;
  autoTagModel?: Maybe<Scalars['String']['output']>;
  autoTagPrompt?: Maybe<Scalars['String']['output']>;
  bannerImageId?: Maybe<Scalars['String']['output']>;
  baseScore: Scalars['Float']['output'];
  canEditUserIds?: Maybe<Array<Scalars['String']['output']>>;
  canVoteOnRels?: Maybe<Array<TagRelVoteGroup>>;
  charsAdded?: Maybe<Scalars['Float']['output']>;
  charsRemoved?: Maybe<Scalars['Float']['output']>;
  contributionStats?: Maybe<Scalars['JSON']['output']>;
  contributors: TagContributorsList;
  core: Scalars['Boolean']['output'];
  coreTagId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  defaultOrder: Scalars['Float']['output'];
  deleted: Scalars['Boolean']['output'];
  description?: Maybe<Revision>;
  descriptionTruncationCount: Scalars['Float']['output'];
  description_latest?: Maybe<Scalars['String']['output']>;
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  forceAllowType3Audio: Scalars['Boolean']['output'];
  htmlWithContributorAnnotations?: Maybe<Scalars['String']['output']>;
  introSequenceId?: Maybe<Scalars['String']['output']>;
  isArbitalImport?: Maybe<Scalars['Boolean']['output']>;
  isPlaceholderPage: Scalars['Boolean']['output'];
  isPostType: Scalars['Boolean']['output'];
  isRead?: Maybe<Scalars['Boolean']['output']>;
  isSubforum: Scalars['Boolean']['output'];
  lastCommentedAt?: Maybe<Scalars['Date']['output']>;
  lastSubforumCommentAt?: Maybe<Scalars['Date']['output']>;
  lastVisitedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  lenses: Array<MultiDocument>;
  lensesIncludingDeleted: Array<MultiDocument>;
  lesswrongWikiImportCompleted?: Maybe<Scalars['Boolean']['output']>;
  lesswrongWikiImportRevision?: Maybe<Scalars['String']['output']>;
  lesswrongWikiImportSlug?: Maybe<Scalars['String']['output']>;
  maxScore?: Maybe<Scalars['Int']['output']>;
  moderationGuidelines?: Maybe<Revision>;
  moderationGuidelines_latest?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  needsReview: Scalars['Boolean']['output'];
  noindex: Scalars['Boolean']['output'];
  oldSlugs: Array<Scalars['String']['output']>;
  parentTag?: Maybe<Tag>;
  parentTagId?: Maybe<Scalars['String']['output']>;
  pingbacks?: Maybe<Scalars['JSON']['output']>;
  postCount: Scalars['Float']['output'];
  postsDefaultSortOrder?: Maybe<Scalars['String']['output']>;
  recentComments: Array<Comment>;
  reviewedByUser?: Maybe<User>;
  reviewedByUserId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  sequence?: Maybe<Sequence>;
  shortName?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  squareImageId?: Maybe<Scalars['String']['output']>;
  subTagIds: Array<Scalars['String']['output']>;
  subTags: Array<Tag>;
  subforumIntroPost?: Maybe<Post>;
  subforumIntroPostId?: Maybe<Scalars['String']['output']>;
  subforumModeratorIds: Array<Scalars['String']['output']>;
  subforumModerators: Array<User>;
  subforumUnreadMessagesCount?: Maybe<Scalars['Int']['output']>;
  subforumWelcomeText?: Maybe<Revision>;
  subforumWelcomeText_latest?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  suggestedAsFilter: Scalars['Boolean']['output'];
  summaries: Array<MultiDocument>;
  tableOfContents?: Maybe<Scalars['JSON']['output']>;
  tagFlags: Array<TagFlag>;
  tagFlagsIds: Array<Scalars['String']['output']>;
  textLastUpdatedAt?: Maybe<Scalars['Date']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
  usersWhoLiked: Array<UserLikingTag>;
  voteCount: Scalars['Float']['output'];
  wikiGrade: Scalars['Int']['output'];
  wikiOnly: Scalars['Boolean']['output'];
};


type TagcontributorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


type TagdescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type TaglensesArgs = {
  lensSlug?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


type TaglensesIncludingDeletedArgs = {
  lensSlug?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


type TagmoderationGuidelinesArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type TagrecentCommentsArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  maxAgeHours?: InputMaybe<Scalars['Int']['input']>;
  tagCommentType?: InputMaybe<Scalars['String']['input']>;
  tagCommentsLimit?: InputMaybe<Scalars['Int']['input']>;
};


type TagsubforumWelcomeTextArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type TagtableOfContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type TagCommentType =
  | 'DISCUSSION'
  | 'SUBFORUM';

type TagContributor = {
  __typename?: 'TagContributor';
  contributionScore: Scalars['Int']['output'];
  currentAttributionCharCount?: Maybe<Scalars['Int']['output']>;
  numCommits: Scalars['Int']['output'];
  user?: Maybe<User>;
  voteCount: Scalars['Int']['output'];
};

type TagContributorsList = {
  __typename?: 'TagContributorsList';
  contributors: Array<TagContributor>;
  totalCount: Scalars['Int']['output'];
};

type TagDefaultViewInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagFlag = {
  __typename?: 'TagFlag';
  _id: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  order?: Maybe<Scalars['Float']['output']>;
  schemaVersion: Scalars['Float']['output'];
  slug: Scalars['String']['output'];
};


type TagFlagcontentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

type TagFlagOutput = {
  __typename?: 'TagFlagOutput';
  data?: Maybe<TagFlag>;
};

type TagFlagSelector = {
  allTagFlags?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type TagHistoryFeedEntryType = {
  __typename?: 'TagHistoryFeedEntryType';
  lensOrSummaryMetadataChanged?: Maybe<FieldChange>;
  lensRevision?: Maybe<Revision>;
  summaryRevision?: Maybe<Revision>;
  tagApplied?: Maybe<TagRel>;
  tagCreated?: Maybe<Tag>;
  tagDiscussionComment?: Maybe<Comment>;
  tagRevision?: Maybe<Revision>;
  type: Scalars['String']['output'];
  wikiMetadataChanged?: Maybe<FieldChange>;
};

type TagHistoryFeedQueryResults = {
  __typename?: 'TagHistoryFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<TagHistoryFeedEntryType>>;
};

type TagOutput = {
  __typename?: 'TagOutput';
  data?: Maybe<Tag>;
};

type TagPreviewWithSummaries = {
  __typename?: 'TagPreviewWithSummaries';
  lens?: Maybe<MultiDocument>;
  summaries: Array<MultiDocument>;
  tag: Tag;
};

type TagReadLikelihoodRatio = {
  __typename?: 'TagReadLikelihoodRatio';
  readLikelihoodRatio?: Maybe<Scalars['Float']['output']>;
  tagId?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  tagShortName?: Maybe<Scalars['String']['output']>;
  userReadCount?: Maybe<Scalars['Int']['output']>;
};

type TagRel = {
  __typename?: 'TagRel';
  _id: Scalars['String']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  autoApplied: Scalars['Boolean']['output'];
  backfilled: Scalars['Boolean']['output'];
  baseScore: Scalars['Float']['output'];
  createdAt: Scalars['Date']['output'];
  currentUserCanVote: Scalars['Boolean']['output'];
  currentUserExtendedVote?: Maybe<Scalars['JSON']['output']>;
  currentUserVote?: Maybe<Scalars['String']['output']>;
  deleted: Scalars['Boolean']['output'];
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  score: Scalars['Float']['output'];
  tag?: Maybe<Tag>;
  tagId: Scalars['String']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
  voteCount: Scalars['Float']['output'];
};

type TagRelSelector = {
  default?: InputMaybe<EmptyViewInput>;
  postsWithTag?: InputMaybe<TagRelsPostsWithTagInput>;
  tagsOnPost?: InputMaybe<TagRelsTagsOnPostInput>;
};

type TagRelVoteGroup =
  | 'admins'
  | 'alignmentForum'
  | 'alignmentForumAdmins'
  | 'alignmentVoters'
  | 'canBypassPostRateLimit'
  | 'canModeratePersonal'
  | 'canSuggestCuration'
  | 'debaters'
  | 'guests'
  | 'members'
  | 'podcasters'
  | 'realAdmins'
  | 'sunshineRegiment'
  | 'trustLevel1'
  | 'userOwns'
  | 'userOwnsOnlyUpvote';

type TagRelsPostsWithTagInput = {
  tagId?: InputMaybe<Scalars['String']['input']>;
};

type TagRelsTagsOnPostInput = {
  postId?: InputMaybe<Scalars['String']['input']>;
};

type TagSelector = {
  allArbitalTags?: InputMaybe<TagsAllArbitalTagsInput>;
  allLWWikiTags?: InputMaybe<TagsAllLWWikiTagsInput>;
  allPagesByNewest?: InputMaybe<TagsAllPagesByNewestInput>;
  allPublicTags?: InputMaybe<TagsAllPublicTagsInput>;
  allTagsAlphabetical?: InputMaybe<TagsAllTagsAlphabeticalInput>;
  allTagsHierarchical?: InputMaybe<TagsAllTagsHierarchicalInput>;
  coreAndSubforumTags?: InputMaybe<TagsCoreAndSubforumTagsInput>;
  coreTags?: InputMaybe<TagsCoreTagsInput>;
  currentUserSubforums?: InputMaybe<TagsCurrentUserSubforumsInput>;
  default?: InputMaybe<TagDefaultViewInput>;
  newTags?: InputMaybe<TagsNewTagsInput>;
  pingbackWikiPages?: InputMaybe<TagsPingbackWikiPagesInput>;
  postTypeTags?: InputMaybe<TagsPostTypeTagsInput>;
  suggestedFilterTags?: InputMaybe<TagsSuggestedFilterTagsInput>;
  tagBySlug?: InputMaybe<TagsTagBySlugInput>;
  tagsBySlugs?: InputMaybe<TagsTagsBySlugsInput>;
  tagsByTagFlag?: InputMaybe<TagsTagsByTagFlagInput>;
  tagsByTagIds?: InputMaybe<TagsTagsByTagIdsInput>;
  unprocessedLWWikiTags?: InputMaybe<TagsUnprocessedLWWikiTagsInput>;
  unreviewedTags?: InputMaybe<TagsUnreviewedTagsInput>;
  userTags?: InputMaybe<TagsUserTagsInput>;
};

type TagUpdates = {
  __typename?: 'TagUpdates';
  added?: Maybe<Scalars['Int']['output']>;
  commentCount?: Maybe<Scalars['Int']['output']>;
  commentIds?: Maybe<Array<Scalars['String']['output']>>;
  documentDeletions?: Maybe<Array<DocumentDeletion>>;
  lastCommentedAt?: Maybe<Scalars['Date']['output']>;
  lastRevisedAt?: Maybe<Scalars['Date']['output']>;
  removed?: Maybe<Scalars['Int']['output']>;
  revisionIds?: Maybe<Array<Scalars['String']['output']>>;
  tag: Tag;
  users?: Maybe<Array<User>>;
};

type TagWithTotalCount = {
  __typename?: 'TagWithTotalCount';
  tags: Array<Tag>;
  totalCount: Scalars['Int']['output'];
};

type TagsAllArbitalTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsAllLWWikiTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsAllPagesByNewestInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsAllPublicTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsAllTagsAlphabeticalInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsAllTagsHierarchicalInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  wikiGrade?: InputMaybe<Scalars['String']['input']>;
};

type TagsCoreAndSubforumTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsCoreTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsCurrentUserSubforumsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsNewTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsPingbackWikiPagesInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsPostTypeTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsSuggestedFilterTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsTagBySlugInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

type TagsTagsBySlugsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  slugs: Array<Scalars['String']['input']>;
};

type TagsTagsByTagFlagInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  tagFlagId?: InputMaybe<Scalars['String']['input']>;
};

type TagsTagsByTagIdsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  tagIds: Array<Scalars['String']['input']>;
};

type TagsUnprocessedLWWikiTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsUnreviewedTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type TagsUserTagsInput = {
  excludedTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type ToggleBookmarkInput = {
  collectionName: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
};

type ToggleBookmarkOutput = {
  __typename?: 'ToggleBookmarkOutput';
  data?: Maybe<Bookmark>;
};

type TopComment = {
  __typename?: 'TopComment';
  _id?: Maybe<Scalars['String']['output']>;
  baseScore?: Maybe<Scalars['Int']['output']>;
  contents?: Maybe<TopCommentContents>;
  extendedScore?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  postSlug?: Maybe<Scalars['String']['output']>;
  postTitle?: Maybe<Scalars['String']['output']>;
  postedAt?: Maybe<Scalars['Date']['output']>;
};

type TopCommentContents = {
  __typename?: 'TopCommentContents';
  html?: Maybe<Scalars['String']['output']>;
};

type TopCommentedTagUser = {
  __typename?: 'TopCommentedTagUser';
  _id: Scalars['ID']['output'];
  displayName: Scalars['String']['output'];
  tag_comment_counts: Array<CommentCountTag>;
  total_power: Scalars['Float']['output'];
  username: Scalars['String']['output'];
};

type Tweet = {
  __typename?: 'Tweet';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type TypingIndicator = {
  __typename?: 'TypingIndicator';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  documentId?: Maybe<Scalars['String']['output']>;
  lastUpdated?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

type TypingIndicatorSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type UltraFeedEntryType = {
  __typename?: 'UltraFeedEntryType';
  feedCommentThread?: Maybe<FeedCommentThread>;
  feedPost?: Maybe<FeedPost>;
  feedSpotlight?: Maybe<FeedSpotlightItem>;
  type: Scalars['String']['output'];
};

type UltraFeedEvent = {
  __typename?: 'UltraFeedEvent';
  _id: Scalars['String']['output'];
  collectionName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  documentId?: Maybe<Scalars['String']['output']>;
  event?: Maybe<Scalars['JSON']['output']>;
  eventType?: Maybe<Scalars['String']['output']>;
  feedItemId?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

type UltraFeedEventOutput = {
  __typename?: 'UltraFeedEventOutput';
  data?: Maybe<UltraFeedEvent>;
};

type UltraFeedEventSelector = {
  default?: InputMaybe<EmptyViewInput>;
};

type UltraFeedQueryResults = {
  __typename?: 'UltraFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<UltraFeedEntryType>>;
  sessionId?: Maybe<Scalars['String']['output']>;
};

type UniqueClientViewsSeries = {
  __typename?: 'UniqueClientViewsSeries';
  date?: Maybe<Scalars['Date']['output']>;
  uniqueClientViews?: Maybe<Scalars['Int']['output']>;
};

type UpdateAdvisorRequestDataInput = {
  interestedInMetaculus?: InputMaybe<Scalars['Boolean']['input']>;
  jobAds?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateAdvisorRequestInput = {
  data: UpdateAdvisorRequestDataInput;
  selector: SelectorInput;
};

type UpdateBookDataInput = {
  collectionId?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  displaySequencesAsGrid?: InputMaybe<Scalars['Boolean']['input']>;
  hideProgressBar?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  number?: InputMaybe<Scalars['Float']['input']>;
  postIds?: InputMaybe<Array<Scalars['String']['input']>>;
  sequenceIds?: InputMaybe<Array<Scalars['String']['input']>>;
  showChapters?: InputMaybe<Scalars['Boolean']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  tocTitle?: InputMaybe<Scalars['String']['input']>;
};

type UpdateBookInput = {
  data: UpdateBookDataInput;
  selector: SelectorInput;
};

type UpdateChapterDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  number?: InputMaybe<Scalars['Float']['input']>;
  postIds?: InputMaybe<Array<Scalars['String']['input']>>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateChapterInput = {
  data: UpdateChapterDataInput;
  selector: SelectorInput;
};

type UpdateCollectionDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  createdAt?: InputMaybe<Scalars['Date']['input']>;
  firstPageLink?: InputMaybe<Scalars['String']['input']>;
  gridImageId?: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateCollectionInput = {
  data: UpdateCollectionDataInput;
  selector: SelectorInput;
};

type UpdateCommentDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  afDate?: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId?: InputMaybe<Scalars['String']['input']>;
  answer?: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  debateResponse?: InputMaybe<Scalars['Boolean']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  deletedByUserId?: InputMaybe<Scalars['String']['input']>;
  deletedDate?: InputMaybe<Scalars['Date']['input']>;
  deletedPublic?: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason?: InputMaybe<Scalars['String']['input']>;
  hideAuthor?: InputMaybe<Scalars['Boolean']['input']>;
  hideKarma?: InputMaybe<Scalars['Boolean']['input']>;
  hideModeratorHat?: InputMaybe<Scalars['Boolean']['input']>;
  isPinnedOnProfile?: InputMaybe<Scalars['Boolean']['input']>;
  legacy?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  legacyParentId?: InputMaybe<Scalars['String']['input']>;
  legacyPoll?: InputMaybe<Scalars['Boolean']['input']>;
  modGPTAnalysis?: InputMaybe<Scalars['String']['input']>;
  modGPTRecommendation?: InputMaybe<Scalars['String']['input']>;
  moderatorHat?: InputMaybe<Scalars['Boolean']['input']>;
  moveToAlignmentUserId?: InputMaybe<Scalars['String']['input']>;
  needsReview?: InputMaybe<Scalars['Boolean']['input']>;
  nominatedForReview?: InputMaybe<Scalars['String']['input']>;
  originalDialogueId?: InputMaybe<Scalars['String']['input']>;
  promoted?: InputMaybe<Scalars['Boolean']['input']>;
  promotedByUserId?: InputMaybe<Scalars['String']['input']>;
  rejected?: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId?: InputMaybe<Scalars['String']['input']>;
  rejectedReason?: InputMaybe<Scalars['String']['input']>;
  relevantTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  repliesBlockedUntil?: InputMaybe<Scalars['Date']['input']>;
  retracted?: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentUserId?: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  reviewingForReview?: InputMaybe<Scalars['String']['input']>;
  shortform?: InputMaybe<Scalars['Boolean']['input']>;
  shortformFrontpage?: InputMaybe<Scalars['Boolean']['input']>;
  spam?: InputMaybe<Scalars['Boolean']['input']>;
  subforumStickyPriority?: InputMaybe<Scalars['Float']['input']>;
  suggestForAlignmentUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateCommentInput = {
  data: UpdateCommentDataInput;
  selector: SelectorInput;
};

type UpdateCommentModeratorActionDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

type UpdateCommentModeratorActionInput = {
  data: UpdateCommentModeratorActionDataInput;
  selector: SelectorInput;
};

type UpdateConversationDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds?: InputMaybe<Array<Scalars['String']['input']>>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderator?: InputMaybe<Scalars['Boolean']['input']>;
  participantIds?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateConversationInput = {
  data: UpdateConversationDataInput;
  selector: SelectorInput;
};

type UpdateCurationNoticeDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

type UpdateCurationNoticeInput = {
  data: UpdateCurationNoticeDataInput;
  selector: SelectorInput;
};

type UpdateDigestDataInput = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  num?: InputMaybe<Scalars['Float']['input']>;
  onsiteImageId?: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  publishedDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

type UpdateDigestInput = {
  data: UpdateDigestDataInput;
  selector: SelectorInput;
};

type UpdateDigestPostDataInput = {
  digestId?: InputMaybe<Scalars['String']['input']>;
  emailDigestStatus?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  onsiteDigestStatus?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateDigestPostInput = {
  data: UpdateDigestPostDataInput;
  selector: SelectorInput;
};

type UpdateElectionCandidateDataInput = {
  amountRaised?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  electionName?: InputMaybe<Scalars['String']['input']>;
  fundraiserLink?: InputMaybe<Scalars['String']['input']>;
  gwwcId?: InputMaybe<Scalars['String']['input']>;
  gwwcLink?: InputMaybe<Scalars['String']['input']>;
  href?: InputMaybe<Scalars['String']['input']>;
  isElectionFundraiser?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  logoSrc?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
  targetAmount?: InputMaybe<Scalars['Float']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateElectionCandidateInput = {
  data: UpdateElectionCandidateDataInput;
  selector: SelectorInput;
};

type UpdateElectionVoteDataInput = {
  compareState?: InputMaybe<Scalars['JSON']['input']>;
  electionName?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  submissionComments?: InputMaybe<Scalars['JSON']['input']>;
  submittedAt?: InputMaybe<Scalars['Date']['input']>;
  userExplanation?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  userOtherComments?: InputMaybe<Scalars['String']['input']>;
  vote?: InputMaybe<Scalars['JSON']['input']>;
};

type UpdateElectionVoteInput = {
  data: UpdateElectionVoteDataInput;
  selector: SelectorInput;
};

type UpdateElicitQuestionDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  resolution?: InputMaybe<Scalars['String']['input']>;
  resolvesBy?: InputMaybe<Scalars['Date']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateElicitQuestionInput = {
  data: UpdateElicitQuestionDataInput;
  selector: SelectorInput;
};

type UpdateForumEventDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  bannerTextColor?: InputMaybe<Scalars['String']['input']>;
  commentPrompt?: InputMaybe<Scalars['String']['input']>;
  contrastColor?: InputMaybe<Scalars['String']['input']>;
  customComponent?: InputMaybe<ForumEventCustomComponent>;
  darkColor?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  eventFormat?: InputMaybe<ForumEventFormat>;
  frontpageDescription?: InputMaybe<CreateRevisionDataInput>;
  frontpageDescriptionMobile?: InputMaybe<CreateRevisionDataInput>;
  includesPoll?: InputMaybe<Scalars['Boolean']['input']>;
  isGlobal?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  lightColor?: InputMaybe<Scalars['String']['input']>;
  maxStickersPerUser?: InputMaybe<Scalars['Float']['input']>;
  pollAgreeWording?: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording?: InputMaybe<Scalars['String']['input']>;
  pollQuestion?: InputMaybe<CreateRevisionDataInput>;
  postId?: InputMaybe<Scalars['String']['input']>;
  postPageDescription?: InputMaybe<CreateRevisionDataInput>;
  publicData?: InputMaybe<Scalars['JSON']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateForumEventInput = {
  data: UpdateForumEventDataInput;
  selector: SelectorInput;
};

type UpdateJargonTermDataInput = {
  altTerms?: InputMaybe<Array<Scalars['String']['input']>>;
  approved?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  term?: InputMaybe<Scalars['String']['input']>;
};

type UpdateJargonTermInput = {
  data: UpdateJargonTermDataInput;
  selector: SelectorInput;
};

type UpdateLlmConversationDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateLlmConversationInput = {
  data: UpdateLlmConversationDataInput;
  selector: SelectorInput;
};

type UpdateLocalgroupDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  facebookLink?: InputMaybe<Scalars['String']['input']>;
  facebookPageLink?: InputMaybe<Scalars['String']['input']>;
  googleLocation?: InputMaybe<Scalars['JSON']['input']>;
  inactive?: InputMaybe<Scalars['Boolean']['input']>;
  isOnline?: InputMaybe<Scalars['Boolean']['input']>;
  lastActivity?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  meetupLink?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nameInAnotherLanguage?: InputMaybe<Scalars['String']['input']>;
  organizerIds?: InputMaybe<Array<Scalars['String']['input']>>;
  slackLink?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
  website?: InputMaybe<Scalars['String']['input']>;
};

type UpdateLocalgroupInput = {
  data: UpdateLocalgroupDataInput;
  selector: SelectorInput;
};

type UpdateMessageDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

type UpdateMessageInput = {
  data: UpdateMessageDataInput;
  selector: SelectorInput;
};

type UpdateModerationTemplateDataInput = {
  collectionName?: InputMaybe<ModerationTemplateType>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
};

type UpdateModerationTemplateInput = {
  data: UpdateModerationTemplateDataInput;
  selector: SelectorInput;
};

type UpdateModeratorActionDataInput = {
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<ModeratorActionType>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateModeratorActionInput = {
  data: UpdateModeratorActionDataInput;
  selector: SelectorInput;
};

type UpdateMultiDocumentDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  tabSubtitle?: InputMaybe<Scalars['String']['input']>;
  tabTitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

type UpdateMultiDocumentInput = {
  data: UpdateMultiDocumentDataInput;
  selector: SelectorInput;
};

type UpdateNotificationDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  viewed?: InputMaybe<Scalars['Boolean']['input']>;
};

type UpdateNotificationInput = {
  data: UpdateNotificationDataInput;
  selector: SelectorInput;
};

type UpdatePostDataInput = {
  activateRSVPs?: InputMaybe<Scalars['Boolean']['input']>;
  af?: InputMaybe<Scalars['Boolean']['input']>;
  afDate?: InputMaybe<Scalars['Date']['input']>;
  afSticky?: InputMaybe<Scalars['Boolean']['input']>;
  agentFoundationsId?: InputMaybe<Scalars['String']['input']>;
  authorIsUnreviewed?: InputMaybe<Scalars['Boolean']['input']>;
  autoFrontpage?: InputMaybe<Scalars['String']['input']>;
  bannedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  canonicalBookId?: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug?: InputMaybe<Scalars['String']['input']>;
  canonicalNextPostSlug?: InputMaybe<Scalars['String']['input']>;
  canonicalPrevPostSlug?: InputMaybe<Scalars['String']['input']>;
  canonicalSequenceId?: InputMaybe<Scalars['String']['input']>;
  canonicalSource?: InputMaybe<Scalars['String']['input']>;
  coauthorStatuses?: InputMaybe<Array<CoauthorStatusInput>>;
  collabEditorDialogue?: InputMaybe<Scalars['Boolean']['input']>;
  collectionTitle?: InputMaybe<Scalars['String']['input']>;
  commentSortOrder?: InputMaybe<Scalars['String']['input']>;
  commentsLocked?: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter?: InputMaybe<Scalars['Date']['input']>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  curatedDate?: InputMaybe<Scalars['Date']['input']>;
  customHighlight?: InputMaybe<CreateRevisionDataInput>;
  defaultRecommendation?: InputMaybe<Scalars['Boolean']['input']>;
  deletedDraft?: InputMaybe<Scalars['Boolean']['input']>;
  disableRecommendation?: InputMaybe<Scalars['Boolean']['input']>;
  disableSidenotes?: InputMaybe<Scalars['Boolean']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  endTime?: InputMaybe<Scalars['Date']['input']>;
  eventImageId?: InputMaybe<Scalars['String']['input']>;
  eventRegistrationLink?: InputMaybe<Scalars['String']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  facebookLink?: InputMaybe<Scalars['String']['input']>;
  feedId?: InputMaybe<Scalars['String']['input']>;
  feedLink?: InputMaybe<Scalars['String']['input']>;
  fmCrosspost?: InputMaybe<CrosspostInput>;
  forceAllowType3Audio?: InputMaybe<Scalars['Boolean']['input']>;
  frontpageDate?: InputMaybe<Scalars['Date']['input']>;
  generateDraftJargon?: InputMaybe<Scalars['Boolean']['input']>;
  globalEvent?: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation?: InputMaybe<Scalars['JSON']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  hasCoauthorPermission?: InputMaybe<Scalars['Boolean']['input']>;
  hiddenRelatedQuestion?: InputMaybe<Scalars['Boolean']['input']>;
  hideAuthor?: InputMaybe<Scalars['Boolean']['input']>;
  hideCommentKarma?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPopularComments?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromRecentDiscussions?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageComments?: InputMaybe<Scalars['Boolean']['input']>;
  ignoreRateLimits?: InputMaybe<Scalars['Boolean']['input']>;
  isEvent?: InputMaybe<Scalars['Boolean']['input']>;
  joinEventLink?: InputMaybe<Scalars['String']['input']>;
  legacy?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  legacySpam?: InputMaybe<Scalars['Boolean']['input']>;
  linkSharingKey?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  manifoldReviewMarketId?: InputMaybe<Scalars['String']['input']>;
  meetupLink?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['Boolean']['input']>;
  metaDate?: InputMaybe<Scalars['Date']['input']>;
  metaSticky?: InputMaybe<Scalars['Boolean']['input']>;
  moderationGuidelines?: InputMaybe<CreateRevisionDataInput>;
  moderationStyle?: InputMaybe<Scalars['String']['input']>;
  nextDayReminderSent?: InputMaybe<Scalars['Boolean']['input']>;
  noIndex?: InputMaybe<Scalars['Boolean']['input']>;
  onlineEvent?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn?: InputMaybe<Scalars['Boolean']['input']>;
  organizerIds?: InputMaybe<Array<Scalars['String']['input']>>;
  podcastEpisodeId?: InputMaybe<Scalars['String']['input']>;
  postCategory?: InputMaybe<PostCategory>;
  postedAt?: InputMaybe<Scalars['Date']['input']>;
  question?: InputMaybe<Scalars['Boolean']['input']>;
  readTimeMinutesOverride?: InputMaybe<Scalars['Float']['input']>;
  rejected?: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId?: InputMaybe<Scalars['String']['input']>;
  rejectedReason?: InputMaybe<Scalars['String']['input']>;
  reviewForAlignmentUserId?: InputMaybe<Scalars['String']['input']>;
  reviewForCuratedUserId?: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  shareWithUsers?: InputMaybe<Array<Scalars['String']['input']>>;
  sharingSettings?: InputMaybe<Scalars['JSON']['input']>;
  shortform?: InputMaybe<Scalars['Boolean']['input']>;
  sideCommentVisibility?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  socialPreview?: InputMaybe<SocialPreviewInput>;
  socialPreviewImageAutoUrl?: InputMaybe<Scalars['String']['input']>;
  socialPreviewImageId?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['Float']['input']>;
  sticky?: InputMaybe<Scalars['Boolean']['input']>;
  stickyPriority?: InputMaybe<Scalars['Int']['input']>;
  subforumTagId?: InputMaybe<Scalars['String']['input']>;
  submitToFrontpage?: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  suggestForCuratedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  swrCachingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tagRelevance?: InputMaybe<Scalars['JSON']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
  unlisted?: InputMaybe<Scalars['Boolean']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  votingSystem?: InputMaybe<Scalars['String']['input']>;
  wasEverUndrafted?: InputMaybe<Scalars['Boolean']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

type UpdatePostInput = {
  data: UpdatePostDataInput;
  selector: SelectorInput;
};

type UpdateRSSFeedDataInput = {
  displayFullContent?: InputMaybe<Scalars['Boolean']['input']>;
  importAsDraft?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  ownedByUser?: InputMaybe<Scalars['Boolean']['input']>;
  rawFeed?: InputMaybe<Scalars['JSON']['input']>;
  setCanonicalUrl?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateRSSFeedInput = {
  data: UpdateRSSFeedDataInput;
  selector: SelectorInput;
};

type UpdateReportDataInput = {
  claimedUserId?: InputMaybe<Scalars['String']['input']>;
  closedAt?: InputMaybe<Scalars['Date']['input']>;
  createdAt?: InputMaybe<Scalars['Date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  markedAsSpam?: InputMaybe<Scalars['Boolean']['input']>;
  reportedAsSpam?: InputMaybe<Scalars['Boolean']['input']>;
};

type UpdateReportInput = {
  data: UpdateReportDataInput;
  selector: SelectorInput;
};

type UpdateRevisionDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  skipAttributions?: InputMaybe<Scalars['Boolean']['input']>;
};

type UpdateRevisionInput = {
  data: UpdateRevisionDataInput;
  selector: SelectorInput;
};

type UpdateSequenceDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<CreateRevisionDataInput>;
  curatedOrder?: InputMaybe<Scalars['Float']['input']>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  gridImageId?: InputMaybe<Scalars['String']['input']>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromAuthorPage?: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  userProfileOrder?: InputMaybe<Scalars['Float']['input']>;
};

type UpdateSequenceInput = {
  data: UpdateSequenceDataInput;
  selector: SelectorInput;
};

type UpdateSpotlightDataInput = {
  customSubtitle?: InputMaybe<Scalars['String']['input']>;
  customTitle?: InputMaybe<Scalars['String']['input']>;
  deletedDraft?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<CreateRevisionDataInput>;
  documentId?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<SpotlightDocumentType>;
  draft?: InputMaybe<Scalars['Boolean']['input']>;
  duration?: InputMaybe<Scalars['Float']['input']>;
  headerTitle?: InputMaybe<Scalars['String']['input']>;
  headerTitleLeftColor?: InputMaybe<Scalars['String']['input']>;
  headerTitleRightColor?: InputMaybe<Scalars['String']['input']>;
  imageFade?: InputMaybe<Scalars['Boolean']['input']>;
  imageFadeColor?: InputMaybe<Scalars['String']['input']>;
  lastPromotedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
  showAuthor?: InputMaybe<Scalars['Boolean']['input']>;
  spotlightDarkImageId?: InputMaybe<Scalars['String']['input']>;
  spotlightImageId?: InputMaybe<Scalars['String']['input']>;
  spotlightSplashImageUrl?: InputMaybe<Scalars['String']['input']>;
  subtitleUrl?: InputMaybe<Scalars['String']['input']>;
};

type UpdateSpotlightInput = {
  data: UpdateSpotlightDataInput;
  selector: SelectorInput;
};

type UpdateSurveyDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

type UpdateSurveyInput = {
  data: UpdateSurveyDataInput;
  selector: SelectorInput;
};

type UpdateSurveyQuestionDataInput = {
  format?: InputMaybe<SurveyQuestionFormat>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
  question?: InputMaybe<Scalars['String']['input']>;
  surveyId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateSurveyQuestionInput = {
  data: UpdateSurveyQuestionDataInput;
  selector: SelectorInput;
};

type UpdateSurveyResponseDataInput = {
  clientId?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  response?: InputMaybe<Scalars['JSON']['input']>;
  surveyId?: InputMaybe<Scalars['String']['input']>;
  surveyScheduleId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateSurveyResponseInput = {
  data: UpdateSurveyResponseDataInput;
  selector: SelectorInput;
};

type UpdateSurveyScheduleDataInput = {
  clientIds?: InputMaybe<Array<Scalars['String']['input']>>;
  deactivated?: InputMaybe<Scalars['Boolean']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  impressionsLimit?: InputMaybe<Scalars['Float']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  maxKarma?: InputMaybe<Scalars['Float']['input']>;
  maxVisitorPercentage?: InputMaybe<Scalars['Float']['input']>;
  minKarma?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  surveyId?: InputMaybe<Scalars['String']['input']>;
  target?: InputMaybe<SurveyScheduleTarget>;
};

type UpdateSurveyScheduleInput = {
  data: UpdateSurveyScheduleDataInput;
  selector: SelectorInput;
};

type UpdateTagDataInput = {
  adminOnly?: InputMaybe<Scalars['Boolean']['input']>;
  autoTagModel?: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt?: InputMaybe<Scalars['String']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canEditUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  canVoteOnRels?: InputMaybe<Array<TagRelVoteGroup>>;
  core?: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId?: InputMaybe<Scalars['String']['input']>;
  defaultOrder?: InputMaybe<Scalars['Float']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<CreateRevisionDataInput>;
  descriptionTruncationCount?: InputMaybe<Scalars['Float']['input']>;
  forceAllowType3Audio?: InputMaybe<Scalars['Boolean']['input']>;
  introSequenceId?: InputMaybe<Scalars['String']['input']>;
  isPlaceholderPage?: InputMaybe<Scalars['Boolean']['input']>;
  isPostType?: InputMaybe<Scalars['Boolean']['input']>;
  isSubforum?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines?: InputMaybe<CreateRevisionDataInput>;
  name?: InputMaybe<Scalars['String']['input']>;
  needsReview?: InputMaybe<Scalars['Boolean']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  parentTagId?: InputMaybe<Scalars['String']['input']>;
  postsDefaultSortOrder?: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  squareImageId?: InputMaybe<Scalars['String']['input']>;
  subTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  subforumIntroPostId?: InputMaybe<Scalars['String']['input']>;
  subforumModeratorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  subforumWelcomeText?: InputMaybe<CreateRevisionDataInput>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  suggestedAsFilter?: InputMaybe<Scalars['Boolean']['input']>;
  tagFlagsIds?: InputMaybe<Array<Scalars['String']['input']>>;
  wikiGrade?: InputMaybe<Scalars['Int']['input']>;
  wikiOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

type UpdateTagFlagDataInput = {
  contents?: InputMaybe<CreateRevisionDataInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

type UpdateTagFlagInput = {
  data: UpdateTagFlagDataInput;
  selector: SelectorInput;
};

type UpdateTagInput = {
  data: UpdateTagDataInput;
  selector: SelectorInput;
};

type UpdateUserDataInput = {
  abTestKey?: InputMaybe<Scalars['String']['input']>;
  abTestOverrides?: InputMaybe<Scalars['JSON']['input']>;
  acceptedTos?: InputMaybe<Scalars['Boolean']['input']>;
  acknowledgedNewUserGuidelines?: InputMaybe<Scalars['Boolean']['input']>;
  afApplicationText?: InputMaybe<Scalars['String']['input']>;
  afSubmittedApplication?: InputMaybe<Scalars['Boolean']['input']>;
  allCommentingDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsFilter?: InputMaybe<Scalars['String']['input']>;
  allPostsHideCommunity?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsIncludeEvents?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsOpenSettings?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsShowLowKarma?: InputMaybe<Scalars['Boolean']['input']>;
  allPostsSorting?: InputMaybe<Scalars['String']['input']>;
  allPostsTimeframe?: InputMaybe<Scalars['String']['input']>;
  allowDatadogSessionReplay?: InputMaybe<Scalars['Boolean']['input']>;
  autoSubscribeAsOrganizer?: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_comments?: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_posts?: InputMaybe<Scalars['Boolean']['input']>;
  banned?: InputMaybe<Scalars['Date']['input']>;
  bannedPersonalUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  bannedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  beta?: InputMaybe<Scalars['Boolean']['input']>;
  biography?: InputMaybe<CreateRevisionDataInput>;
  blueskyProfileURL?: InputMaybe<Scalars['String']['input']>;
  careerStage?: InputMaybe<Array<Scalars['String']['input']>>;
  collapseModerationGuidelines?: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting?: InputMaybe<Scalars['String']['input']>;
  commentingOnOtherUsersDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  criticismTipsDismissed?: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter?: InputMaybe<Scalars['String']['input']>;
  defaultToCKEditor?: InputMaybe<Scalars['Boolean']['input']>;
  deleteContent?: InputMaybe<Scalars['Boolean']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  draftsListShowArchived?: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared?: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailSubscribedToCurated?: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections?: InputMaybe<ExpandedFrontpageSectionsSettingsInput>;
  facebookProfileURL?: InputMaybe<Scalars['String']['input']>;
  fmCrosspostUserId?: InputMaybe<Scalars['String']['input']>;
  frontpageFilterSettings?: InputMaybe<Scalars['JSON']['input']>;
  frontpageSelectedTab?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  generateJargonForDrafts?: InputMaybe<Scalars['Boolean']['input']>;
  generateJargonForPublishedPosts?: InputMaybe<Scalars['Boolean']['input']>;
  githubProfileURL?: InputMaybe<Scalars['String']['input']>;
  googleLocation?: InputMaybe<Scalars['JSON']['input']>;
  groups?: InputMaybe<Array<Scalars['String']['input']>>;
  hiddenPostsMetadata?: InputMaybe<Array<PostMetadataInput>>;
  hideAFNonMemberInitialWarning?: InputMaybe<Scalars['Boolean']['input']>;
  hideActiveDialogueUsers?: InputMaybe<Scalars['Boolean']['input']>;
  hideCommunitySection?: InputMaybe<Scalars['Boolean']['input']>;
  hideDialogueFacilitation?: InputMaybe<Scalars['Boolean']['input']>;
  hideElicitPredictions?: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPeopleDirectory?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2019Ad?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2020Ad?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageFilterSettingsDesktop?: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageMap?: InputMaybe<Scalars['Boolean']['input']>;
  hideHomeRHS?: InputMaybe<Scalars['Boolean']['input']>;
  hideIntercom?: InputMaybe<Scalars['Boolean']['input']>;
  hideJobAdUntil?: InputMaybe<Scalars['Date']['input']>;
  hideMeetupsPoke?: InputMaybe<Scalars['Boolean']['input']>;
  hideNavigationSidebar?: InputMaybe<Scalars['Boolean']['input']>;
  hidePostsRecommendations?: InputMaybe<Scalars['Boolean']['input']>;
  hideSubscribePoke?: InputMaybe<Scalars['Boolean']['input']>;
  hideSunshineSidebar?: InputMaybe<Scalars['Boolean']['input']>;
  hideTaggingProgressBar?: InputMaybe<Scalars['Boolean']['input']>;
  howICanHelpOthers?: InputMaybe<CreateRevisionDataInput>;
  howOthersCanHelpMe?: InputMaybe<CreateRevisionDataInput>;
  inactiveSurveyEmailSentAt?: InputMaybe<Scalars['Date']['input']>;
  isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  karmaChangeBatchStart?: InputMaybe<Scalars['Date']['input']>;
  karmaChangeLastOpened?: InputMaybe<Scalars['Date']['input']>;
  karmaChangeNotifierSettings?: InputMaybe<Scalars['JSON']['input']>;
  lastNotificationsCheck?: InputMaybe<Scalars['Date']['input']>;
  lastUsedTimezone?: InputMaybe<Scalars['String']['input']>;
  legacy?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  legacyId?: InputMaybe<Scalars['String']['input']>;
  linkedinProfileURL?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  mapLocation?: InputMaybe<Scalars['JSON']['input']>;
  mapMarkerText?: InputMaybe<Scalars['String']['input']>;
  markDownPostEditor?: InputMaybe<Scalars['Boolean']['input']>;
  moderationGuidelines?: InputMaybe<CreateRevisionDataInput>;
  moderationStyle?: InputMaybe<Scalars['String']['input']>;
  moderatorAssistance?: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotificationsLocation?: InputMaybe<Scalars['JSON']['input']>;
  nearbyEventsNotificationsRadius?: InputMaybe<Scalars['Float']['input']>;
  nearbyPeopleNotificationThreshold?: InputMaybe<Scalars['Float']['input']>;
  needsReview?: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsFrontpage?: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsPosts?: InputMaybe<Scalars['Boolean']['input']>;
  noExpandUnreadCommentsReview?: InputMaybe<Scalars['Boolean']['input']>;
  noKibitz?: InputMaybe<Scalars['Boolean']['input']>;
  noSingleLineComments?: InputMaybe<Scalars['Boolean']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  notificationAddedAsCoauthor?: InputMaybe<Scalars['JSON']['input']>;
  notificationAlignmentSubmissionApproved?: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnDraft?: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnSubscribedPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateCommentsOnSubscribedPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateReplies?: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMatch?: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMessages?: InputMaybe<Scalars['JSON']['input']>;
  notificationEventInRadius?: InputMaybe<Scalars['JSON']['input']>;
  notificationGroupAdministration?: InputMaybe<Scalars['JSON']['input']>;
  notificationKarmaPowersGained?: InputMaybe<Scalars['JSON']['input']>;
  notificationNewDialogueChecks?: InputMaybe<Scalars['JSON']['input']>;
  notificationNewMention?: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsInGroups?: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsNominatedReview?: InputMaybe<Scalars['JSON']['input']>;
  notificationPrivateMessage?: InputMaybe<Scalars['JSON']['input']>;
  notificationPublishedDialogueMessages?: InputMaybe<Scalars['JSON']['input']>;
  notificationRSVPs?: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToMyComments?: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToSubscribedComments?: InputMaybe<Scalars['JSON']['input']>;
  notificationSharedWithMe?: InputMaybe<Scalars['JSON']['input']>;
  notificationShortformContent?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubforumUnread?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedSequencePost?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedTagPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserComment?: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserPost?: InputMaybe<Scalars['JSON']['input']>;
  notificationYourTurnMatchForm?: InputMaybe<Scalars['JSON']['input']>;
  nullifyVotes?: InputMaybe<Scalars['Boolean']['input']>;
  optedInToDialogueFacilitation?: InputMaybe<Scalars['Boolean']['input']>;
  optedOutOfSurveys?: InputMaybe<Scalars['Boolean']['input']>;
  organization?: InputMaybe<Scalars['String']['input']>;
  organizerOfGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  partiallyReadSequences?: InputMaybe<Array<PartiallyReadSequenceItemInput>>;
  paymentEmail?: InputMaybe<Scalars['String']['input']>;
  paymentInfo?: InputMaybe<Scalars['String']['input']>;
  permanentDeletionRequestedAt?: InputMaybe<Scalars['Date']['input']>;
  petrovLaunchCodeDate?: InputMaybe<Scalars['Date']['input']>;
  petrovOptOut?: InputMaybe<Scalars['Boolean']['input']>;
  petrovPressedButtonDate?: InputMaybe<Scalars['Date']['input']>;
  postGlossariesPinned?: InputMaybe<Scalars['Boolean']['input']>;
  postingDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  previousDisplayName?: InputMaybe<Scalars['String']['input']>;
  profileImageId?: InputMaybe<Scalars['String']['input']>;
  profileTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  profileUpdatedAt?: InputMaybe<Scalars['Date']['input']>;
  programParticipation?: InputMaybe<Array<Scalars['String']['input']>>;
  reactPaletteStyle?: InputMaybe<ReactPaletteStyle>;
  recommendationSettings?: InputMaybe<RecommendationSettingsInput>;
  revealChecksToAdmins?: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentForumUserId?: InputMaybe<Scalars['String']['input']>;
  reviewVotesQuadratic?: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic2019?: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic2020?: InputMaybe<Scalars['Boolean']['input']>;
  reviewedAt?: InputMaybe<Scalars['Date']['input']>;
  reviewedByUserId?: InputMaybe<Scalars['String']['input']>;
  shortformFeedId?: InputMaybe<Scalars['String']['input']>;
  showCommunityInRecentDiscussion?: InputMaybe<Scalars['Boolean']['input']>;
  showDialoguesList?: InputMaybe<Scalars['Boolean']['input']>;
  showHideKarmaOption?: InputMaybe<Scalars['Boolean']['input']>;
  showMatches?: InputMaybe<Scalars['Boolean']['input']>;
  showMyDialogues?: InputMaybe<Scalars['Boolean']['input']>;
  showPostAuthorCard?: InputMaybe<Scalars['Boolean']['input']>;
  showRecommendedPartners?: InputMaybe<Scalars['Boolean']['input']>;
  signUpReCaptchaRating?: InputMaybe<Scalars['Float']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  snoozedUntilContentCount?: InputMaybe<Scalars['Float']['input']>;
  sortDraftsBy?: InputMaybe<Scalars['String']['input']>;
  subforumPreferredLayout?: InputMaybe<SubforumPreferredLayout>;
  subscribedToDigest?: InputMaybe<Scalars['Boolean']['input']>;
  subscribedToNewsletter?: InputMaybe<Scalars['Boolean']['input']>;
  sunshineFlagged?: InputMaybe<Scalars['Boolean']['input']>;
  sunshineNotes?: InputMaybe<Scalars['String']['input']>;
  sunshineSnoozed?: InputMaybe<Scalars['Boolean']['input']>;
  taggingDashboardCollapsed?: InputMaybe<Scalars['Boolean']['input']>;
  theme?: InputMaybe<Scalars['JSON']['input']>;
  twitterProfileURL?: InputMaybe<Scalars['String']['input']>;
  twitterProfileURLAdmin?: InputMaybe<Scalars['String']['input']>;
  unsubscribeFromAll?: InputMaybe<Scalars['Boolean']['input']>;
  userSurveyEmailSentAt?: InputMaybe<Scalars['Date']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  usernameUnset?: InputMaybe<Scalars['Boolean']['input']>;
  viewUnreviewedComments?: InputMaybe<Scalars['Boolean']['input']>;
  voteBanned?: InputMaybe<Scalars['Boolean']['input']>;
  walledGardenInvite?: InputMaybe<Scalars['Boolean']['input']>;
  walledGardenPortalOnboarded?: InputMaybe<Scalars['Boolean']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  whenConfirmationEmailSent?: InputMaybe<Scalars['Date']['input']>;
};

type UpdateUserEAGDetailDataInput = {
  careerStage?: InputMaybe<Array<Scalars['String']['input']>>;
  countryOrRegion?: InputMaybe<Scalars['String']['input']>;
  experiencedIn?: InputMaybe<Array<Scalars['String']['input']>>;
  interestedIn?: InputMaybe<Array<Scalars['String']['input']>>;
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  nearestCity?: InputMaybe<Scalars['String']['input']>;
  willingnessToRelocate?: InputMaybe<Scalars['JSON']['input']>;
};

type UpdateUserEAGDetailInput = {
  data: UpdateUserEAGDetailDataInput;
  selector: SelectorInput;
};

type UpdateUserInput = {
  data: UpdateUserDataInput;
  selector: SelectorInput;
};

type UpdateUserJobAdDataInput = {
  adState?: InputMaybe<Scalars['String']['input']>;
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  reminderSetAt?: InputMaybe<Scalars['Date']['input']>;
};

type UpdateUserJobAdInput = {
  data: UpdateUserJobAdDataInput;
  selector: SelectorInput;
};

type UpdateUserMostValuablePostDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateUserMostValuablePostInput = {
  data: UpdateUserMostValuablePostDataInput;
  selector: SelectorInput;
};

type UpdateUserRateLimitDataInput = {
  actionsPerInterval?: InputMaybe<Scalars['Float']['input']>;
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  intervalLength?: InputMaybe<Scalars['Float']['input']>;
  intervalUnit?: InputMaybe<UserRateLimitIntervalUnit>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<UserRateLimitType>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UpdateUserRateLimitInput = {
  data: UpdateUserRateLimitDataInput;
  selector: SelectorInput;
};

type UpdateUserTagRelDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  subforumEmailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost?: InputMaybe<Scalars['Boolean']['input']>;
  subforumShowUnreadInSidebar?: InputMaybe<Scalars['Boolean']['input']>;
};

type UpdateUserTagRelInput = {
  data: UpdateUserTagRelDataInput;
  selector: SelectorInput;
};

type UpvotedUser = {
  __typename?: 'UpvotedUser';
  _id: Scalars['ID']['output'];
  agreement_values: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  power_values: Scalars['String']['output'];
  recently_active_matchmaking: Scalars['Boolean']['output'];
  total_agreement: Scalars['Float']['output'];
  total_power: Scalars['Float']['output'];
  username: Scalars['String']['output'];
  vote_counts: Scalars['Int']['output'];
};

type User = {
  __typename?: 'User';
  IPs?: Maybe<Array<Scalars['String']['output']>>;
  _id: Scalars['String']['output'];
  abTestKey?: Maybe<Scalars['String']['output']>;
  abTestOverrides?: Maybe<Scalars['JSON']['output']>;
  acceptedTos?: Maybe<Scalars['Boolean']['output']>;
  acknowledgedNewUserGuidelines?: Maybe<Scalars['Boolean']['output']>;
  afApplicationText?: Maybe<Scalars['String']['output']>;
  afCommentCount: Scalars['Float']['output'];
  afKarma: Scalars['Float']['output'];
  afPostCount: Scalars['Float']['output'];
  afSequenceCount: Scalars['Float']['output'];
  afSequenceDraftCount: Scalars['Float']['output'];
  afSubmittedApplication?: Maybe<Scalars['Boolean']['output']>;
  allCommentingDisabled?: Maybe<Scalars['Boolean']['output']>;
  allPostsFilter?: Maybe<Scalars['String']['output']>;
  allPostsHideCommunity?: Maybe<Scalars['Boolean']['output']>;
  allPostsIncludeEvents?: Maybe<Scalars['Boolean']['output']>;
  allPostsOpenSettings?: Maybe<Scalars['Boolean']['output']>;
  allPostsShowLowKarma?: Maybe<Scalars['Boolean']['output']>;
  allPostsSorting?: Maybe<Scalars['String']['output']>;
  allPostsTimeframe?: Maybe<Scalars['String']['output']>;
  allowDatadogSessionReplay: Scalars['Boolean']['output'];
  altAccountsDetected?: Maybe<Scalars['Boolean']['output']>;
  associatedClientId?: Maybe<ClientId>;
  associatedClientIds?: Maybe<Array<ClientId>>;
  autoSubscribeAsOrganizer: Scalars['Boolean']['output'];
  auto_subscribe_to_my_comments: Scalars['Boolean']['output'];
  auto_subscribe_to_my_posts: Scalars['Boolean']['output'];
  banned?: Maybe<Scalars['Date']['output']>;
  bannedPersonalUserIds?: Maybe<Array<Scalars['String']['output']>>;
  bannedUserIds?: Maybe<Array<Scalars['String']['output']>>;
  beta?: Maybe<Scalars['Boolean']['output']>;
  bigDownvoteCount?: Maybe<Scalars['Float']['output']>;
  bigDownvoteReceivedCount?: Maybe<Scalars['Float']['output']>;
  bigUpvoteCount?: Maybe<Scalars['Float']['output']>;
  bigUpvoteReceivedCount?: Maybe<Scalars['Float']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  biography?: Maybe<Revision>;
  biography_latest?: Maybe<Scalars['String']['output']>;
  blueskyProfileURL?: Maybe<Scalars['String']['output']>;
  bookmarkedPosts?: Maybe<Array<Post>>;
  bookmarkedPostsMetadata?: Maybe<Array<PostMetadataOutput>>;
  careerStage?: Maybe<Array<Scalars['String']['output']>>;
  collapseModerationGuidelines?: Maybe<Scalars['Boolean']['output']>;
  commentCount: Scalars['Float']['output'];
  commentSorting?: Maybe<Scalars['String']['output']>;
  commentingOnOtherUsersDisabled?: Maybe<Scalars['Boolean']['output']>;
  conversationsDisabled?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['Date']['output'];
  criticismTipsDismissed?: Maybe<Scalars['Boolean']['output']>;
  currentFrontpageFilter?: Maybe<Scalars['String']['output']>;
  defaultToCKEditor?: Maybe<Scalars['Boolean']['output']>;
  deleteContent?: Maybe<Scalars['Boolean']['output']>;
  deleted: Scalars['Boolean']['output'];
  displayName: Scalars['String']['output'];
  draftsListShowArchived?: Maybe<Scalars['Boolean']['output']>;
  draftsListShowShared?: Maybe<Scalars['Boolean']['output']>;
  draftsListSorting?: Maybe<Scalars['String']['output']>;
  editUrl?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailSubscribedToCurated?: Maybe<Scalars['Boolean']['output']>;
  emails?: Maybe<Array<Scalars['JSON']['output']>>;
  expandedFrontpageSections?: Maybe<ExpandedFrontpageSectionsSettingsOutput>;
  facebookProfileURL?: Maybe<Scalars['String']['output']>;
  fmCrosspostUserId?: Maybe<Scalars['String']['output']>;
  frontpageFilterSettings?: Maybe<Scalars['JSON']['output']>;
  frontpagePostCount: Scalars['Float']['output'];
  frontpageSelectedTab?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  generateJargonForDrafts?: Maybe<Scalars['Boolean']['output']>;
  generateJargonForPublishedPosts?: Maybe<Scalars['Boolean']['output']>;
  githubProfileURL?: Maybe<Scalars['String']['output']>;
  goodHeartTokens?: Maybe<Scalars['Float']['output']>;
  googleLocation?: Maybe<Scalars['JSON']['output']>;
  groups?: Maybe<Array<Scalars['String']['output']>>;
  hasAuth0Id?: Maybe<Scalars['Boolean']['output']>;
  hiddenPosts?: Maybe<Array<Post>>;
  hiddenPostsMetadata?: Maybe<Array<PostMetadataOutput>>;
  hideAFNonMemberInitialWarning?: Maybe<Scalars['Boolean']['output']>;
  hideActiveDialogueUsers?: Maybe<Scalars['Boolean']['output']>;
  hideCommunitySection: Scalars['Boolean']['output'];
  hideDialogueFacilitation?: Maybe<Scalars['Boolean']['output']>;
  hideElicitPredictions?: Maybe<Scalars['Boolean']['output']>;
  hideFromPeopleDirectory: Scalars['Boolean']['output'];
  hideFrontpageBook2019Ad?: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBook2020Ad?: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBookAd?: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageFilterSettingsDesktop?: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageMap?: Maybe<Scalars['Boolean']['output']>;
  hideHomeRHS?: Maybe<Scalars['Boolean']['output']>;
  hideIntercom: Scalars['Boolean']['output'];
  hideJobAdUntil?: Maybe<Scalars['Date']['output']>;
  hideMeetupsPoke?: Maybe<Scalars['Boolean']['output']>;
  hideNavigationSidebar?: Maybe<Scalars['Boolean']['output']>;
  hidePostsRecommendations: Scalars['Boolean']['output'];
  hideSubscribePoke?: Maybe<Scalars['Boolean']['output']>;
  hideSunshineSidebar?: Maybe<Scalars['Boolean']['output']>;
  hideTaggingProgressBar?: Maybe<Scalars['Boolean']['output']>;
  hideWalledGardenUI?: Maybe<Scalars['Boolean']['output']>;
  howICanHelpOthers?: Maybe<Revision>;
  howICanHelpOthers_latest?: Maybe<Scalars['String']['output']>;
  howOthersCanHelpMe?: Maybe<Revision>;
  howOthersCanHelpMe_latest?: Maybe<Scalars['String']['output']>;
  htmlBio: Scalars['String']['output'];
  htmlMapMarkerText?: Maybe<Scalars['String']['output']>;
  inactiveSurveyEmailSentAt?: Maybe<Scalars['Date']['output']>;
  isAdmin: Scalars['Boolean']['output'];
  isReviewed?: Maybe<Scalars['Boolean']['output']>;
  jobTitle?: Maybe<Scalars['String']['output']>;
  karma: Scalars['Float']['output'];
  karmaChangeBatchStart?: Maybe<Scalars['Date']['output']>;
  karmaChangeLastOpened?: Maybe<Scalars['Date']['output']>;
  karmaChangeNotifierSettings?: Maybe<Scalars['JSON']['output']>;
  karmaChanges?: Maybe<KarmaChanges>;
  lastNotificationsCheck?: Maybe<Scalars['Date']['output']>;
  lastUsedTimezone?: Maybe<Scalars['String']['output']>;
  legacy?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  legacyId?: Maybe<Scalars['String']['output']>;
  linkedinProfileURL?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  lwWikiImport?: Maybe<Scalars['Boolean']['output']>;
  mapLocation?: Maybe<Scalars['JSON']['output']>;
  mapLocationLatLng?: Maybe<LatLng>;
  mapLocationSet?: Maybe<Scalars['Boolean']['output']>;
  mapMarkerText?: Maybe<Scalars['String']['output']>;
  markDownPostEditor: Scalars['Boolean']['output'];
  maxCommentCount: Scalars['Float']['output'];
  maxPostCount: Scalars['Float']['output'];
  moderationGuidelines?: Maybe<Revision>;
  moderationGuidelines_latest?: Maybe<Scalars['String']['output']>;
  moderationStyle?: Maybe<Scalars['String']['output']>;
  moderatorActions?: Maybe<Array<ModeratorAction>>;
  moderatorAssistance?: Maybe<Scalars['Boolean']['output']>;
  mongoLocation?: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotifications: Scalars['Boolean']['output'];
  nearbyEventsNotificationsLocation?: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotificationsMongoLocation?: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotificationsRadius?: Maybe<Scalars['Float']['output']>;
  nearbyPeopleNotificationThreshold?: Maybe<Scalars['Float']['output']>;
  needsReview?: Maybe<Scalars['Boolean']['output']>;
  noCollapseCommentsFrontpage: Scalars['Boolean']['output'];
  noCollapseCommentsPosts: Scalars['Boolean']['output'];
  noExpandUnreadCommentsReview: Scalars['Boolean']['output'];
  noKibitz?: Maybe<Scalars['Boolean']['output']>;
  noSingleLineComments: Scalars['Boolean']['output'];
  noindex: Scalars['Boolean']['output'];
  notificationAddedAsCoauthor?: Maybe<Scalars['JSON']['output']>;
  notificationAlignmentSubmissionApproved?: Maybe<Scalars['JSON']['output']>;
  notificationCommentsOnDraft?: Maybe<Scalars['JSON']['output']>;
  notificationCommentsOnSubscribedPost?: Maybe<Scalars['JSON']['output']>;
  notificationDebateCommentsOnSubscribedPost?: Maybe<Scalars['JSON']['output']>;
  notificationDebateReplies?: Maybe<Scalars['JSON']['output']>;
  notificationDialogueMatch?: Maybe<Scalars['JSON']['output']>;
  notificationDialogueMessages?: Maybe<Scalars['JSON']['output']>;
  notificationEventInRadius?: Maybe<Scalars['JSON']['output']>;
  notificationGroupAdministration?: Maybe<Scalars['JSON']['output']>;
  notificationKarmaPowersGained?: Maybe<Scalars['JSON']['output']>;
  notificationNewDialogueChecks?: Maybe<Scalars['JSON']['output']>;
  notificationNewMention?: Maybe<Scalars['JSON']['output']>;
  notificationPostsInGroups?: Maybe<Scalars['JSON']['output']>;
  notificationPostsNominatedReview?: Maybe<Scalars['JSON']['output']>;
  notificationPrivateMessage?: Maybe<Scalars['JSON']['output']>;
  notificationPublishedDialogueMessages?: Maybe<Scalars['JSON']['output']>;
  notificationRSVPs?: Maybe<Scalars['JSON']['output']>;
  notificationRepliesToMyComments?: Maybe<Scalars['JSON']['output']>;
  notificationRepliesToSubscribedComments?: Maybe<Scalars['JSON']['output']>;
  notificationSharedWithMe?: Maybe<Scalars['JSON']['output']>;
  notificationShortformContent?: Maybe<Scalars['JSON']['output']>;
  notificationSubforumUnread?: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedSequencePost?: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedTagPost?: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedUserComment?: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedUserPost?: Maybe<Scalars['JSON']['output']>;
  notificationYourTurnMatchForm?: Maybe<Scalars['JSON']['output']>;
  nullifyVotes?: Maybe<Scalars['Boolean']['output']>;
  oldSlugs: Array<Scalars['String']['output']>;
  optedInToDialogueFacilitation?: Maybe<Scalars['Boolean']['output']>;
  optedOutOfSurveys?: Maybe<Scalars['Boolean']['output']>;
  organization?: Maybe<Scalars['String']['output']>;
  organizerOfGroupIds: Array<Scalars['String']['output']>;
  organizerOfGroups: Array<Localgroup>;
  pagePath?: Maybe<Scalars['String']['output']>;
  pageUrl?: Maybe<Scalars['String']['output']>;
  partiallyReadSequences?: Maybe<Array<PartiallyReadSequenceItemOutput>>;
  paymentEmail?: Maybe<Scalars['String']['output']>;
  paymentInfo?: Maybe<Scalars['String']['output']>;
  permanentDeletionRequestedAt?: Maybe<Scalars['Date']['output']>;
  petrovLaunchCodeDate?: Maybe<Scalars['Date']['output']>;
  petrovOptOut: Scalars['Boolean']['output'];
  petrovPressedButtonDate?: Maybe<Scalars['Date']['output']>;
  postCount: Scalars['Float']['output'];
  postGlossariesPinned?: Maybe<Scalars['Boolean']['output']>;
  postingDisabled?: Maybe<Scalars['Boolean']['output']>;
  posts?: Maybe<Array<Post>>;
  previousDisplayName?: Maybe<Scalars['String']['output']>;
  profile?: Maybe<Scalars['JSON']['output']>;
  profileImageId?: Maybe<Scalars['String']['output']>;
  profileTagIds: Array<Scalars['String']['output']>;
  profileTags: Array<Tag>;
  profileUpdatedAt: Scalars['Date']['output'];
  programParticipation?: Maybe<Array<Scalars['String']['output']>>;
  rateLimitNextAbleToComment?: Maybe<Scalars['JSON']['output']>;
  rateLimitNextAbleToPost?: Maybe<Scalars['JSON']['output']>;
  reactPaletteStyle?: Maybe<ReactPaletteStyle>;
  recentKarmaInfo?: Maybe<Scalars['JSON']['output']>;
  recommendationSettings?: Maybe<Scalars['JSON']['output']>;
  revealChecksToAdmins?: Maybe<Scalars['Boolean']['output']>;
  reviewForAlignmentForumUserId?: Maybe<Scalars['String']['output']>;
  reviewVoteCount?: Maybe<Scalars['Int']['output']>;
  reviewVotesQuadratic?: Maybe<Scalars['Boolean']['output']>;
  reviewVotesQuadratic2019?: Maybe<Scalars['Boolean']['output']>;
  reviewVotesQuadratic2020?: Maybe<Scalars['Boolean']['output']>;
  reviewedAt?: Maybe<Scalars['Date']['output']>;
  reviewedByUser?: Maybe<User>;
  reviewedByUserId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  sequenceCount: Scalars['Float']['output'];
  sequenceDraftCount: Scalars['Float']['output'];
  services?: Maybe<Scalars['JSON']['output']>;
  shortformFeed?: Maybe<Post>;
  shortformFeedId?: Maybe<Scalars['String']['output']>;
  showCommunityInRecentDiscussion: Scalars['Boolean']['output'];
  showDialoguesList?: Maybe<Scalars['Boolean']['output']>;
  showHideKarmaOption?: Maybe<Scalars['Boolean']['output']>;
  showMatches?: Maybe<Scalars['Boolean']['output']>;
  showMyDialogues?: Maybe<Scalars['Boolean']['output']>;
  showPostAuthorCard?: Maybe<Scalars['Boolean']['output']>;
  showRecommendedPartners?: Maybe<Scalars['Boolean']['output']>;
  signUpReCaptchaRating?: Maybe<Scalars['Float']['output']>;
  slug: Scalars['String']['output'];
  smallDownvoteCount?: Maybe<Scalars['Float']['output']>;
  smallDownvoteReceivedCount?: Maybe<Scalars['Float']['output']>;
  smallUpvoteCount?: Maybe<Scalars['Float']['output']>;
  smallUpvoteReceivedCount?: Maybe<Scalars['Float']['output']>;
  snoozedUntilContentCount?: Maybe<Scalars['Float']['output']>;
  sortDraftsBy?: Maybe<Scalars['String']['output']>;
  spamRiskScore: Scalars['Float']['output'];
  subforumPreferredLayout?: Maybe<SubforumPreferredLayout>;
  subscribedToDigest?: Maybe<Scalars['Boolean']['output']>;
  subscribedToNewsletter?: Maybe<Scalars['Boolean']['output']>;
  sunshineFlagged?: Maybe<Scalars['Boolean']['output']>;
  sunshineNotes?: Maybe<Scalars['String']['output']>;
  sunshineSnoozed?: Maybe<Scalars['Boolean']['output']>;
  tagRevisionCount: Scalars['Float']['output'];
  taggingDashboardCollapsed?: Maybe<Scalars['Boolean']['output']>;
  theme?: Maybe<Scalars['JSON']['output']>;
  twitterProfileURL?: Maybe<Scalars['String']['output']>;
  twitterProfileURLAdmin?: Maybe<Scalars['String']['output']>;
  unsubscribeFromAll?: Maybe<Scalars['Boolean']['output']>;
  userSurveyEmailSentAt?: Maybe<Scalars['Date']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  usernameUnset?: Maybe<Scalars['Boolean']['output']>;
  usersContactedBeforeReview?: Maybe<Array<Scalars['String']['output']>>;
  viewUnreviewedComments?: Maybe<Scalars['Boolean']['output']>;
  voteBanned?: Maybe<Scalars['Boolean']['output']>;
  voteCount?: Maybe<Scalars['Float']['output']>;
  voteReceivedCount?: Maybe<Scalars['Float']['output']>;
  walledGardenInvite?: Maybe<Scalars['Boolean']['output']>;
  walledGardenPortalOnboarded?: Maybe<Scalars['Boolean']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  whenConfirmationEmailSent?: Maybe<Scalars['Date']['output']>;
};


type UserbiographyArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type UserhowICanHelpOthersArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type UserhowOthersCanHelpMeArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type UserkarmaChangesArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


type UsermoderationGuidelinesArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


type UserpostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


type UserrateLimitNextAbleToCommentArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
};


type UserrateLimitNextAbleToPostArgs = {
  eventForm?: InputMaybe<Scalars['Boolean']['input']>;
};

type UserActivity = {
  __typename?: 'UserActivity';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

type UserCoreTagReads = {
  __typename?: 'UserCoreTagReads';
  tagId: Scalars['String']['output'];
  userReadCount: Scalars['Int']['output'];
};

type UserDialogueUsefulData = {
  __typename?: 'UserDialogueUsefulData';
  activeDialogueMatchSeekers?: Maybe<Array<Maybe<User>>>;
  dialogueUsers?: Maybe<Array<Maybe<User>>>;
  topUsers?: Maybe<Array<Maybe<UpvotedUser>>>;
};

type UserEAGDetail = {
  __typename?: 'UserEAGDetail';
  _id: Scalars['String']['output'];
  careerStage?: Maybe<Array<Scalars['String']['output']>>;
  countryOrRegion?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  experiencedIn?: Maybe<Array<Scalars['String']['output']>>;
  interestedIn?: Maybe<Array<Scalars['String']['output']>>;
  lastUpdated?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  nearestCity?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
  willingnessToRelocate?: Maybe<Scalars['JSON']['output']>;
};

type UserEAGDetailOutput = {
  __typename?: 'UserEAGDetailOutput';
  data?: Maybe<UserEAGDetail>;
};

type UserEAGDetailSelector = {
  dataByUser?: InputMaybe<UserEAGDetailsDataByUserInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type UserEAGDetailsDataByUserInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UserGroup =
  | 'admins'
  | 'alignmentForum'
  | 'alignmentForumAdmins'
  | 'alignmentVoters'
  | 'canBypassPostRateLimit'
  | 'canModeratePersonal'
  | 'canSuggestCuration'
  | 'debaters'
  | 'guests'
  | 'members'
  | 'podcasters'
  | 'realAdmins'
  | 'sunshineRegiment'
  | 'trustLevel1';

type UserJobAd = {
  __typename?: 'UserJobAd';
  _id: Scalars['String']['output'];
  adState?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  jobName?: Maybe<Scalars['String']['output']>;
  lastUpdated?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  reminderSetAt?: Maybe<Scalars['Date']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type UserJobAdOutput = {
  __typename?: 'UserJobAdOutput';
  data?: Maybe<UserJobAd>;
};

type UserJobAdSelector = {
  adsByUser?: InputMaybe<UserJobAdsAdsByUserInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type UserJobAdsAdsByUserInput = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UserLikingTag = {
  __typename?: 'UserLikingTag';
  _id: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
};

type UserMostValuablePost = {
  __typename?: 'UserMostValuablePost';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

type UserMostValuablePostOutput = {
  __typename?: 'UserMostValuablePostOutput';
  data?: Maybe<UserMostValuablePost>;
};

type UserMostValuablePostSelector = {
  currentUserMostValuablePosts?: InputMaybe<EmptyViewInput>;
  currentUserPost?: InputMaybe<UserMostValuablePostsCurrentUserPostInput>;
  default?: InputMaybe<EmptyViewInput>;
};

type UserMostValuablePostsCurrentUserPostInput = {
  postId?: InputMaybe<Scalars['String']['input']>;
};

type UserOutput = {
  __typename?: 'UserOutput';
  data?: Maybe<User>;
};

type UserRateLimit = {
  __typename?: 'UserRateLimit';
  _id: Scalars['String']['output'];
  actionsPerInterval: Scalars['Float']['output'];
  createdAt: Scalars['Date']['output'];
  endedAt: Scalars['Date']['output'];
  intervalLength: Scalars['Float']['output'];
  intervalUnit: UserRateLimitIntervalUnit;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  type: UserRateLimitType;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

type UserRateLimitIntervalUnit =
  | 'days'
  | 'hours'
  | 'minutes'
  | 'weeks';

type UserRateLimitOutput = {
  __typename?: 'UserRateLimitOutput';
  data?: Maybe<UserRateLimit>;
};

type UserRateLimitSelector = {
  activeUserRateLimits?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  userRateLimits?: InputMaybe<UserRateLimitsUserRateLimitsInput>;
};

type UserRateLimitType =
  | 'allComments'
  | 'allPosts';

type UserRateLimitsUserRateLimitsInput = {
  active?: InputMaybe<Scalars['String']['input']>;
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

type UserReadHistoryResult = {
  __typename?: 'UserReadHistoryResult';
  posts?: Maybe<Array<Post>>;
};

type UserSelector = {
  LWSunshinesList?: InputMaybe<EmptyViewInput>;
  LWTrustLevel1List?: InputMaybe<EmptyViewInput>;
  LWUsersAdmin?: InputMaybe<EmptyViewInput>;
  alignmentSuggestedUsers?: InputMaybe<EmptyViewInput>;
  allUsers?: InputMaybe<EmptyViewInput>;
  default?: InputMaybe<EmptyViewInput>;
  recentlyActive?: InputMaybe<EmptyViewInput>;
  reviewAdminUsers?: InputMaybe<EmptyViewInput>;
  sunshineNewUsers?: InputMaybe<EmptyViewInput>;
  tagCommunityMembers?: InputMaybe<UsersTagCommunityMembersInput>;
  usersByUserIds?: InputMaybe<UsersUsersByUserIdsInput>;
  usersMapLocations?: InputMaybe<EmptyViewInput>;
  usersProfile?: InputMaybe<UsersUsersProfileInput>;
  usersWithBannedUsers?: InputMaybe<EmptyViewInput>;
  usersWithOptedInToDialogueFacilitation?: InputMaybe<EmptyViewInput>;
  usersWithPaymentInfo?: InputMaybe<EmptyViewInput>;
};

type UserSelectorUniqueInput = {
  _id?: InputMaybe<Scalars['String']['input']>;
  documentId?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

type UserTagRel = {
  __typename?: 'UserTagRel';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  subforumEmailNotifications?: Maybe<Scalars['Boolean']['output']>;
  subforumHideIntroPost?: Maybe<Scalars['Boolean']['output']>;
  subforumShowUnreadInSidebar?: Maybe<Scalars['Boolean']['output']>;
  tag?: Maybe<Tag>;
  tagId: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

type UserTagRelOutput = {
  __typename?: 'UserTagRelOutput';
  data?: Maybe<UserTagRel>;
};

type UserTagRelSelector = {
  default?: InputMaybe<EmptyViewInput>;
  single?: InputMaybe<UserTagRelsSingleInput>;
};

type UserTagRelsSingleInput = {
  tagId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type UsersTagCommunityMembersInput = {
  hasBio?: InputMaybe<Scalars['String']['input']>;
  profileTagId?: InputMaybe<Scalars['String']['input']>;
};

type UsersUsersByUserIdsInput = {
  userIds?: InputMaybe<Scalars['String']['input']>;
};

type UsersUsersProfileInput = {
  slug?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

type VertexRecommendedPost = {
  __typename?: 'VertexRecommendedPost';
  attributionId?: Maybe<Scalars['String']['output']>;
  post: Post;
};

type Vote = {
  __typename?: 'Vote';
  _id: Scalars['String']['output'];
  afPower?: Maybe<Scalars['Float']['output']>;
  authorId?: Maybe<Scalars['String']['output']>;
  authorIds?: Maybe<Array<Scalars['String']['output']>>;
  cancelled: Scalars['Boolean']['output'];
  collectionName: Scalars['String']['output'];
  comment?: Maybe<Comment>;
  createdAt: Scalars['Date']['output'];
  documentId: Scalars['String']['output'];
  documentIsAf: Scalars['Boolean']['output'];
  extendedVoteType?: Maybe<Scalars['JSON']['output']>;
  isUnvote: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  power?: Maybe<Scalars['Float']['output']>;
  schemaVersion: Scalars['Float']['output'];
  silenceNotification: Scalars['Boolean']['output'];
  tagRel?: Maybe<TagRel>;
  userId?: Maybe<Scalars['String']['output']>;
  voteType: VoteType;
  votedAt?: Maybe<Scalars['Date']['output']>;
};

type VoteResultComment = {
  __typename?: 'VoteResultComment';
  document: Comment;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteResultElectionCandidate = {
  __typename?: 'VoteResultElectionCandidate';
  document: ElectionCandidate;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteResultMultiDocument = {
  __typename?: 'VoteResultMultiDocument';
  document: MultiDocument;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteResultPost = {
  __typename?: 'VoteResultPost';
  document: Post;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteResultRevision = {
  __typename?: 'VoteResultRevision';
  document: Revision;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteResultTag = {
  __typename?: 'VoteResultTag';
  document: Tag;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteResultTagRel = {
  __typename?: 'VoteResultTagRel';
  document: TagRel;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

type VoteSelector = {
  default?: InputMaybe<EmptyViewInput>;
  tagVotes?: InputMaybe<EmptyViewInput>;
  userPostVotes?: InputMaybe<EmptyViewInput>;
  userVotes?: InputMaybe<EmptyViewInput>;
};

type VoteType =
  | 'bigDownvote'
  | 'bigUpvote'
  | 'neutral'
  | 'smallDownvote'
  | 'smallUpvote';

type WrappedDataByYear = {
  __typename?: 'WrappedDataByYear';
  authorPercentile?: Maybe<Scalars['Float']['output']>;
  combinedKarmaVals?: Maybe<Array<Maybe<CombinedKarmaVals>>>;
  commentCount?: Maybe<Scalars['Int']['output']>;
  commenterPercentile?: Maybe<Scalars['Float']['output']>;
  daysVisited?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  engagementPercentile?: Maybe<Scalars['Float']['output']>;
  karmaChange?: Maybe<Scalars['Int']['output']>;
  mostReadAuthors?: Maybe<Array<Maybe<MostReadAuthor>>>;
  mostReadTopics?: Maybe<Array<Maybe<MostReadTopic>>>;
  mostReceivedReacts?: Maybe<Array<Maybe<MostReceivedReact>>>;
  personality: Scalars['String']['output'];
  postCount?: Maybe<Scalars['Int']['output']>;
  postsReadCount?: Maybe<Scalars['Int']['output']>;
  relativeMostReadCoreTopics?: Maybe<Array<Maybe<TagReadLikelihoodRatio>>>;
  shortformCount?: Maybe<Scalars['Int']['output']>;
  shortformPercentile?: Maybe<Scalars['Float']['output']>;
  topComment?: Maybe<TopComment>;
  topPosts?: Maybe<Array<Maybe<Post>>>;
  topShortform?: Maybe<Comment>;
  totalSeconds?: Maybe<Scalars['Int']['output']>;
};

type revokeGoogleServiceAccountTokensMutationVariables = Exact<{ [key: string]: never; }>;


type revokeGoogleServiceAccountTokensMutation = { __typename?: 'Mutation', revokeGoogleServiceAccountTokens: boolean };

type AdminMetadataQueryQueryVariables = Exact<{ [key: string]: never; }>;


type AdminMetadataQueryQuery = { __typename?: 'Query', AdminMetadata: string | null };

type SearchSynonymsQueryVariables = Exact<{ [key: string]: never; }>;


type SearchSynonymsQuery = { __typename?: 'Query', SearchSynonyms: Array<string> };

type UpdateSearchSynonymsMutationVariables = Exact<{
  synonyms: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


type UpdateSearchSynonymsMutation = { __typename?: 'Mutation', UpdateSearchSynonyms: Array<string> };

type randomUserQueryVariables = Exact<{
  userIsAuthor: Scalars['String']['input'];
}>;


type randomUserQuery = { __typename?: 'Query', GetRandomUser: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type MigrationsDashboardQueryQueryVariables = Exact<{ [key: string]: never; }>;


type MigrationsDashboardQueryQuery = { __typename?: 'Query', MigrationsDashboard: { __typename?: 'MigrationsDashboardData', migrations: Array<{ __typename?: 'MigrationStatus', name: string, dateWritten: string | null, lastRun: string | null, runs: Array<{ __typename?: 'MigrationRun', name: string, started: string, finished: string | null, succeeded: boolean | null }> | null }> | null } | null };

type PostsAnalyticsPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsAnalyticsPageQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsPage
    ) | null } | null };

type getReadHistoryQueryVariables = Exact<{
  limit: InputMaybe<Scalars['Int']['input']>;
  filter: InputMaybe<PostReviewFilter>;
  sort: InputMaybe<PostReviewSort>;
}>;


type getReadHistoryQuery = { __typename?: 'Query', UserReadHistory: { __typename?: 'UserReadHistoryResult', posts: Array<(
      { __typename?: 'Post', lastVisitedAt: string | null }
      & PostsListWithVotes
    )> | null } | null };

type CommentByIdQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentByIdQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsList
    ) | null } | null };

type CommentPermalinkQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentPermalinkQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentWithRepliesFragment
    ) | null } | null };

type CommentEditQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentEditQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentEdit
    ) | null } | null };

type CommentDeletedMetadataQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentDeletedMetadataQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & DeletedCommentsMetaData
    ) | null } | null };

type CommentPollVoteQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentPollVoteQuery = { __typename?: 'Query', forumEvent: { __typename?: 'SingleForumEventOutput', result: (
      { __typename?: 'ForumEvent' }
      & ForumEventsDisplay
    ) | null } | null };

type CommentsNewFormQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentsNewFormQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersCurrentCommentRateLimit
    ) | null } | null };

type upsertUserTypingIndicatorMutationVariables = Exact<{
  documentId: Scalars['String']['input'];
}>;


type upsertUserTypingIndicatorMutation = { __typename?: 'Mutation', upsertUserTypingIndicator: (
    { __typename?: 'TypingIndicator' }
    & TypingIndicatorInfo
  ) | null };

type PostsModerationGuidelinesQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsModerationGuidelinesQuery = { __typename?: 'Query', PostsModerationGuidelines: { __typename: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsModerationGuidelines
    ) | null } | null };

type TagModerationGuidelinesQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagModerationGuidelinesQuery = { __typename?: 'Query', TagModerationGuidelines: { __typename: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagFragment
    ) | null } | null };

type PostsEditQueryQueryVariables = Exact<{
  documentId: Scalars['String']['input'];
  version: InputMaybe<Scalars['String']['input']>;
}>;


type PostsEditQueryQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsEditQueryFragment
    ) | null } | null };

type TagEditQueryQueryVariables = Exact<{
  documentId: Scalars['String']['input'];
}>;


type TagEditQueryQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagEditFragment
    ) | null } | null };

type NewUserGuidelinesDialogQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NewUserGuidelinesDialogQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsList
    ) | null } | null };

type ParentCommentSingleQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ParentCommentSingleQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsListWithParentMetadata
    ) | null } | null };

type SideCommentSingleQueryVariables = Exact<{
  commentId: Scalars['String']['input'];
}>;


type SideCommentSingleQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentWithRepliesFragment
    ) | null } | null };

type sendVertexMediaCompleteEventMutationMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  attributionId: InputMaybe<Scalars['String']['input']>;
}>;


type sendVertexMediaCompleteEventMutationMutation = { __typename?: 'Mutation', sendVertexMediaCompleteEvent: boolean };

type LWHomePostsQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type LWHomePostsQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null } | null };

type sendVertexViewHomePageEventMutationMutationVariables = Exact<{ [key: string]: never; }>;


type sendVertexViewHomePageEventMutationMutation = { __typename?: 'Mutation', sendVertexViewHomePageEvent: boolean };

type PostExcerptQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  hash: InputMaybe<Scalars['String']['input']>;
}>;


type PostExcerptQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & HighlightWithHash
    ) | null } | null };

type DialoguesPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type DialoguesPageQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null } | null };

type CommentActionsQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentActionsQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsDetails
    ) | null } | null };

type lockThreadMutationVariables = Exact<{
  commentId: Scalars['String']['input'];
  until: InputMaybe<Scalars['String']['input']>;
}>;


type lockThreadMutation = { __typename?: 'Mutation', lockThread: boolean };

type unlockThreadMutationVariables = Exact<{
  commentId: Scalars['String']['input'];
}>;


type unlockThreadMutation = { __typename?: 'Mutation', unlockThread: boolean };

type moderateCommentMutationVariables = Exact<{
  commentId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
}>;


type moderateCommentMutation = { __typename?: 'Mutation', moderateComment: (
    { __typename?: 'Comment' }
    & CommentsList
  ) | null };

type getRssPostChangesQueryVariables = Exact<{
  postId: Scalars['String']['input'];
}>;


type getRssPostChangesQuery = { __typename?: 'Query', RssPostChanges: { __typename?: 'RssPostChangeInfo', isChanged: boolean, newHtml: string, htmlDiff: string } };

type setIsHiddenMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  isHidden: Scalars['Boolean']['input'];
}>;


type setIsHiddenMutation = { __typename?: 'Mutation', setIsHidden: (
    { __typename?: 'User' }
    & UsersCurrent
  ) };

type getDigestPostsQueryVariables = Exact<{
  num: InputMaybe<Scalars['Int']['input']>;
}>;


type getDigestPostsQuery = { __typename?: 'Query', DigestPosts: Array<(
    { __typename?: 'Post' }
    & PostsListWithVotes
  )> | null };

type EAHomeHandbookQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EAHomeHandbookQuery = { __typename?: 'Query', sequence: { __typename?: 'SingleSequenceOutput', result: (
      { __typename?: 'Sequence' }
      & SequencesPageFragment
    ) | null } | null };

type getUserReadsPerCoreTagQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


type getUserReadsPerCoreTagQuery = { __typename?: 'Query', UserReadsPerCoreTag: Array<{ __typename?: 'UserCoreTagReads', tagId: string, userReadCount: number }> };

type getDigestPlannerDataQueryVariables = Exact<{
  digestId: InputMaybe<Scalars['String']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
}>;


type getDigestPlannerDataQuery = { __typename?: 'Query', DigestPlannerData: Array<{ __typename?: 'DigestPlannerPost', rating: number, post: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ), digestPost: { __typename?: 'DigestPost', _id: string, emailDigestStatus: string | null, onsiteDigestStatus: string | null } | null }> };

type NewUserCompleteProfileMutationVariables = Exact<{
  username: Scalars['String']['input'];
  subscribeToDigest: Scalars['Boolean']['input'];
  email: InputMaybe<Scalars['String']['input']>;
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
}>;


type NewUserCompleteProfileMutation = { __typename?: 'Mutation', NewUserCompleteProfile: { __typename?: 'NewUserCompletedProfile', username: string | null, slug: string | null, displayName: string | null } | null };

type isDisplayNameTakenQueryVariables = Exact<{
  displayName: Scalars['String']['input'];
}>;


type isDisplayNameTakenQuery = { __typename?: 'Query', IsDisplayNameTaken: boolean };

type EAGApplicationImportFormQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EAGApplicationImportFormQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersEdit
    ) | null } | null };

type getWrappedDataQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
}>;


type getWrappedDataQuery = { __typename?: 'Query', UserWrappedDataByYear: { __typename?: 'WrappedDataByYear', engagementPercentile: number | null, postsReadCount: number | null, totalSeconds: number | null, daysVisited: Array<string | null> | null, postCount: number | null, authorPercentile: number | null, commentCount: number | null, commenterPercentile: number | null, shortformCount: number | null, shortformPercentile: number | null, karmaChange: number | null, personality: string, mostReadTopics: Array<{ __typename?: 'MostReadTopic', name: string | null, shortName: string | null, slug: string | null, count: number | null } | null> | null, relativeMostReadCoreTopics: Array<{ __typename?: 'TagReadLikelihoodRatio', tagId: string | null, tagName: string | null, tagShortName: string | null, userReadCount: number | null, readLikelihoodRatio: number | null } | null> | null, mostReadAuthors: Array<{ __typename?: 'MostReadAuthor', _id: string | null, displayName: string | null, slug: string | null, profileImageId: string | null, count: number | null, engagementPercentile: number | null } | null> | null, topPosts: Array<{ __typename?: 'Post', _id: string, title: string, slug: string, baseScore: number } | null> | null, topComment: { __typename?: 'TopComment', _id: string | null, postedAt: string | null, postId: string | null, postTitle: string | null, postSlug: string | null, baseScore: number | null, extendedScore: any | null, contents: { __typename?: 'TopCommentContents', html: string | null } | null } | null, topShortform: { __typename?: 'Comment', _id: string, postedAt: string, postId: string | null, baseScore: number | null, extendedScore: any | null, contents: { __typename?: 'Revision', html: string | null } | null } | null, combinedKarmaVals: Array<{ __typename?: 'CombinedKarmaVals', date: string, postKarma: number, commentKarma: number } | null> | null, mostReceivedReacts: Array<{ __typename?: 'MostReceivedReact', name: string | null, count: number | null } | null> | null } | null };

type sendNewDialogueMessageNotificationMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  dialogueHtml: Scalars['String']['input'];
}>;


type sendNewDialogueMessageNotificationMutation = { __typename?: 'Mutation', sendNewDialogueMessageNotification: boolean };

type getPostIsCriticismQueryVariables = Exact<{
  args: InputMaybe<Scalars['JSON']['input']>;
}>;


type getPostIsCriticismQuery = { __typename?: 'Query', PostIsCriticism: boolean | null };

type autosaveRevisionMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  contents: AutosaveContentType;
}>;


type autosaveRevisionMutation = { __typename?: 'Mutation', autosaveRevision: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null };

type LinkSharingQueryQueryVariables = Exact<{
  postId: Scalars['String']['input'];
  linkSharingKey: Scalars['String']['input'];
}>;


type LinkSharingQueryQuery = { __typename?: 'Query', getLinkSharedPost: (
    { __typename?: 'Post' }
    & PostsEdit
  ) | null };

type PostVersionHistoryQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostVersionHistoryQuery = { __typename?: 'Query', revision: { __typename?: 'SingleRevisionOutput', result: (
      { __typename?: 'Revision' }
      & RevisionDisplay
    ) | null } | null };

type revertPostToRevisionMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  revisionId: Scalars['String']['input'];
}>;


type revertPostToRevisionMutation = { __typename?: 'Mutation', revertPostToRevision: (
    { __typename?: 'Post' }
    & PostsEdit
  ) | null };

type PresenceListQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PresenceListQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null };

type TagVersionHistoryQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagVersionHistoryQuery = { __typename?: 'Query', revision: { __typename?: 'SingleRevisionOutput', result: (
      { __typename?: 'Revision' }
      & RevisionDisplay
    ) | null } | null };

type revertToRevisionMutationVariables = Exact<{
  tagId: Scalars['String']['input'];
  revertToRevisionId: Scalars['String']['input'];
  contributorsLimit: InputMaybe<Scalars['Int']['input']>;
}>;


type revertToRevisionMutation = { __typename?: 'Mutation', revertTagToRevision: (
    { __typename?: 'Tag' }
    & TagPageFragment
  ) | null };

type ConvertDocumentQueryVariables = Exact<{
  document: InputMaybe<Scalars['JSON']['input']>;
  targetFormat: InputMaybe<Scalars['String']['input']>;
}>;


type ConvertDocumentQuery = { __typename?: 'Query', convertDocument: any | null };

type FMCrosspostControlQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type FMCrosspostControlQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersCrosspostInfo
    ) | null } | null };

type unlinkCrossposterMutationVariables = Exact<{ [key: string]: never; }>;


type unlinkCrossposterMutation = { __typename?: 'Mutation', unlinkCrossposter: string | null };

type ImageUploadQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ImageUploadQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null };

type SequencesListEditorItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SequencesListEditorItemQuery = { __typename?: 'Query', sequence: { __typename?: 'SingleSequenceOutput', result: (
      { __typename?: 'Sequence' }
      & SequencesPageFragment
    ) | null } | null };

type SingleTagItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SingleTagItemQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagBasicInfo
    ) | null } | null };

type SingleUsersItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SingleUsersItemQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersProfile
    ) | null } | null };

type TagSelectQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagSelectQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagBasicInfo
    ) | null } | null };

type ForumEventFormQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ForumEventFormQuery = { __typename?: 'Query', forumEvent: { __typename?: 'SingleForumEventOutput', result: (
      { __typename?: 'ForumEvent' }
      & ForumEventsEdit
    ) | null } | null };

type ForumEventPollQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ForumEventPollQuery = { __typename?: 'Query', forumEvent: { __typename?: 'SingleForumEventOutput', result: (
      { __typename?: 'ForumEvent' }
      & ForumEventsDisplay
    ) | null } | null };

type AddForumEventVoteMutationVariables = Exact<{
  forumEventId: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  delta: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


type AddForumEventVoteMutation = { __typename?: 'Mutation', AddForumEventVote: boolean | null };

type RemoveForumEventVoteMutationVariables = Exact<{
  forumEventId: Scalars['String']['input'];
}>;


type RemoveForumEventVoteMutation = { __typename?: 'Mutation', RemoveForumEventVote: boolean | null };

type ForumEventPostPageBannerQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ForumEventPostPageBannerQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsDetails
    ) | null } | null };

type ForumEventPostPagePollSection2QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ForumEventPostPagePollSection2Query = { __typename?: 'Query', forumEvent: { __typename?: 'SingleForumEventOutput', result: (
      { __typename?: 'ForumEvent' }
      & ForumEventsDisplay
    ) | null } | null };

type ForumEventPostPagePollSectionQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ForumEventPostPagePollSectionQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsDetails
    ) | null } | null };

type RemoveForumEventStickerMutationVariables = Exact<{
  forumEventId: Scalars['String']['input'];
  stickerId: Scalars['String']['input'];
}>;


type RemoveForumEventStickerMutation = { __typename?: 'Mutation', RemoveForumEventSticker: boolean | null };

type MultiPostAnalyticsQueryQueryVariables = Exact<{
  userId: InputMaybe<Scalars['String']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  sortBy: InputMaybe<Scalars['String']['input']>;
  desc: InputMaybe<Scalars['Boolean']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
}>;


type MultiPostAnalyticsQueryQuery = { __typename?: 'Query', MultiPostAnalytics: { __typename?: 'MultiPostAnalyticsResult', totalCount: number, posts: Array<{ __typename?: 'PostAnalytics2Result', _id: string | null, title: string | null, slug: string | null, postedAt: string | null, views: number | null, uniqueViews: number | null, reads: number | null, meanReadingTime: number | null, karma: number | null, comments: number | null } | null> | null } };

type AnalyticsSeriesQueryQueryVariables = Exact<{
  userId: InputMaybe<Scalars['String']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
}>;


type AnalyticsSeriesQueryQuery = { __typename?: 'Query', AnalyticsSeries: Array<{ __typename?: 'AnalyticsSeriesValue', date: string | null, views: number | null, reads: number | null, karma: number | null, comments: number | null } | null> | null };

type ToggleBookmarkMutationMutationVariables = Exact<{
  input: ToggleBookmarkInput;
}>;


type ToggleBookmarkMutationMutation = { __typename?: 'Mutation', toggleBookmark: { __typename?: 'ToggleBookmarkOutput', data: (
      { __typename?: 'Bookmark' }
      & BookmarksDefaultFragment
    ) | null } | null };

type CurrentFrontpageSurveyQueryVariables = Exact<{ [key: string]: never; }>;


type CurrentFrontpageSurveyQuery = { __typename?: 'Query', CurrentFrontpageSurvey: (
    { __typename?: 'SurveySchedule' }
    & SurveyScheduleMinimumInfo
  ) | null };

type UserExpandFrontpageSectionMutationVariables = Exact<{
  section: Scalars['String']['input'];
  expanded: Scalars['Boolean']['input'];
}>;


type UserExpandFrontpageSectionMutation = { __typename?: 'Mutation', UserExpandFrontpageSection: boolean | null };

type GetCrosspostQueryQueryVariables = Exact<{
  args: InputMaybe<Scalars['JSON']['input']>;
}>;


type GetCrosspostQueryQuery = { __typename?: 'Query', getCrosspost: any | null };

type initiateConversationMutationVariables = Exact<{
  participantIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  af: InputMaybe<Scalars['Boolean']['input']>;
  moderator: InputMaybe<Scalars['Boolean']['input']>;
}>;


type initiateConversationMutation = { __typename?: 'Mutation', initiateConversation: (
    { __typename?: 'Conversation' }
    & ConversationsMinimumInfo
  ) | null };

type markConversationReadMutationVariables = Exact<{
  conversationId: Scalars['String']['input'];
}>;


type markConversationReadMutation = { __typename?: 'Mutation', markConversationRead: boolean };

type PostAnalyticsQueryQueryVariables = Exact<{
  postId: Scalars['String']['input'];
}>;


type PostAnalyticsQueryQuery = { __typename?: 'Query', PostAnalytics: { __typename?: 'PostAnalyticsResult', allViews: number | null, uniqueClientViews: number | null, uniqueClientViews10Sec: number | null, medianReadingTime: number | null, uniqueClientViews5Min: number | null, uniqueClientViewsSeries: Array<{ __typename?: 'UniqueClientViewsSeries', date: string | null, uniqueClientViews: number | null } | null> | null } };

type increasePostViewCountMutationMutationVariables = Exact<{
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type increasePostViewCountMutationMutation = { __typename?: 'Mutation', increasePostViewCount: number | null };

type sendVertexViewItemEventMutationMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  attributionId: InputMaybe<Scalars['String']['input']>;
}>;


type sendVertexViewItemEventMutationMutation = { __typename?: 'Mutation', sendVertexViewItemEvent: boolean };

type markPostCommentsReadMutationVariables = Exact<{
  postId: Scalars['String']['input'];
}>;


type markPostCommentsReadMutation = { __typename?: 'Mutation', markPostCommentsRead: boolean | null };

type RefreshDbSettingsMutationVariables = Exact<{ [key: string]: never; }>;


type RefreshDbSettingsMutation = { __typename?: 'Mutation', RefreshDbSettings: boolean | null };

type UnreadNotificationCountQueryQueryVariables = Exact<{ [key: string]: never; }>;


type UnreadNotificationCountQueryQuery = { __typename?: 'Query', unreadNotificationCounts: { __typename?: 'NotificationCounts', unreadNotifications: number, unreadPrivateMessages: number, faviconBadgeNumber: number, checkedAt: string } };

type getNewJargonTermsMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  glossaryPrompt: InputMaybe<Scalars['String']['input']>;
  examplePost: InputMaybe<Scalars['String']['input']>;
  exampleTerm: InputMaybe<Scalars['String']['input']>;
  exampleAltTerm: InputMaybe<Scalars['String']['input']>;
  exampleDefinition: InputMaybe<Scalars['String']['input']>;
}>;


type getNewJargonTermsMutation = { __typename?: 'Mutation', getNewJargonTerms: Array<(
    { __typename?: 'JargonTerm' }
    & JargonTerms
  ) | null> | null };

type getPostsWithApprovedJargonQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
}>;


type getPostsWithApprovedJargonQuery = { __typename?: 'Query', PostsWithApprovedJargon: { __typename?: 'PostsWithApprovedJargonResult', results: Array<{ __typename?: 'PostWithApprovedJargon', post: (
        { __typename?: 'Post' }
        & PostsListWithVotes
      ), jargonTerms: Array<(
        { __typename?: 'JargonTerm' }
        & JargonTerms
      )> | null }> } | null };

type LlmChatWrapperQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type LlmChatWrapperQuery = { __typename?: 'Query', llmConversation: { __typename?: 'SingleLlmConversationOutput', result: (
      { __typename?: 'LlmConversation' }
      & LlmConversationsWithMessagesFragment
    ) | null } | null };

type LlmConversationsViewingPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type LlmConversationsViewingPageQuery = { __typename?: 'Query', llmConversation: { __typename?: 'SingleLlmConversationOutput', result: (
      { __typename?: 'LlmConversation' }
      & LlmConversationsWithMessagesFragment
    ) | null } | null };

type PostSummaryDialogQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostSummaryDialogQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostWithGeneratedSummary
    ) | null } | null };

type PostLinkPreviewSequenceQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostLinkPreviewSequenceQuery = { __typename?: 'Query', sequence: { __typename?: 'SingleSequenceOutput', result: (
      { __typename?: 'Sequence' }
      & SequencesPageFragment
    ) | null } | null };

type PostLinkPreviewCommentQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostLinkPreviewCommentQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsList
    ) | null } | null };

type PostLinkPreviewPostQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostLinkPreviewPostQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type ArbitalPageRequestQueryVariables = Exact<{ [key: string]: never; }>;


type ArbitalPageRequestQuery = { __typename?: 'Query', ArbitalPageData: { __typename?: 'ArbitalPageData', title: string | null, html: string | null } | null };

type GroupFormDialogQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type GroupFormDialogQuery = { __typename?: 'Query', localgroup: { __typename?: 'SingleLocalgroupOutput', result: (
      { __typename?: 'Localgroup' }
      & localGroupsEdit
    ) | null } | null };

type LocalGroupPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type LocalGroupPageQuery = { __typename?: 'Query', localgroup: { __typename?: 'SingleLocalgroupOutput', result: (
      { __typename?: 'Localgroup' }
      & localGroupsHomeFragment
    ) | null } | null };

type SetPersonalMapLocationDialogQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SetPersonalMapLocationDialogQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersEdit
    ) | null } | null };

type ConversationPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ConversationPageQuery = { __typename?: 'Query', conversation: { __typename?: 'SingleConversationOutput', result: (
      { __typename?: 'Conversation' }
      & ConversationsList
    ) | null } | null };

type ConversationPreviewQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ConversationPreviewQuery = { __typename?: 'Query', conversation: { __typename?: 'SingleConversationOutput', result: (
      { __typename?: 'Conversation' }
      & ConversationsList
    ) | null } | null };

type FriendlyInboxQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type FriendlyInboxQuery = { __typename?: 'Query', conversation: { __typename?: 'SingleConversationOutput', result: (
      { __typename?: 'Conversation' }
      & ConversationsListWithReadStatus
    ) | null } | null };

type MessagesNewFormQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type MessagesNewFormQuery = { __typename?: 'Query', moderationTemplate: { __typename?: 'SingleModerationTemplateOutput', result: (
      { __typename?: 'ModerationTemplate' }
      & ModerationTemplateFragment
    ) | null } | null };

type CommentOnYourDraftNotificationHoverQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CommentOnYourDraftNotificationHoverQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsMinimumInfo
    ) | null } | null };

type EmailPreviewQueryQueryVariables = Exact<{
  notificationIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type EmailPreviewQueryQuery = { __typename?: 'Query', EmailPreview: Array<{ __typename?: 'EmailPreview', to: string | null, subject: string | null, html: string | null, text: string | null } | null> | null };

type NotificationsMenuButtonQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NotificationsMenuButtonQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UserKarmaChanges
    ) | null } | null };

type NotificationsPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NotificationsPageQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UserKarmaChanges
    ) | null } | null };

type NotificationsPageItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NotificationsPageItemQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsListWithParentMetadata
    ) | null } | null };

type getNotificationDisplaysQueryVariables = Exact<{
  limit: InputMaybe<Scalars['Int']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
}>;


type getNotificationDisplaysQuery = { __typename?: 'Query', NotificationDisplays: { __typename?: 'NotificationDisplaysResult', results: Array<any> } | null };

type MarkAllNotificationsAsReadMutationVariables = Exact<{ [key: string]: never; }>;


type MarkAllNotificationsAsReadMutation = { __typename?: 'Mutation', MarkAllNotificationsAsRead: boolean | null };

type TagRelNotificationItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagRelNotificationItemQuery = { __typename?: 'Query', tagRel: { __typename?: 'SingleTagRelOutput', result: (
      { __typename?: 'TagRel' }
      & TagRelFragment
    ) | null } | null };

type ActiveTagCountQueryVariables = Exact<{ [key: string]: never; }>;


type ActiveTagCountQuery = { __typename?: 'Query', ActiveTagCount: number };

type AddToCalendarButtonQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type AddToCalendarButtonQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsPlaintextDescription
    ) | null } | null };

type importUrlAsDraftPostMutationVariables = Exact<{
  url: Scalars['String']['input'];
}>;


type importUrlAsDraftPostMutation = { __typename?: 'Mutation', importUrlAsDraftPost: { __typename?: 'ExternalPostImportData', alreadyExists: boolean | null, post: { __typename?: 'ExternalPost', _id: string, slug: string | null, title: string | null, content: string | null, url: string | null } | null } };

type FeedPostsHighlightQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type FeedPostsHighlightQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsExpandedHighlight
    ) | null } | null };

type latestGoogleDocMetadataQueryVariables = Exact<{
  postId: Scalars['String']['input'];
  version: InputMaybe<Scalars['String']['input']>;
}>;


type latestGoogleDocMetadataQuery = { __typename?: 'Query', latestGoogleDocMetadata: any | null };

type CanAccessGoogleDocQueryVariables = Exact<{
  fileUrl: Scalars['String']['input'];
}>;


type CanAccessGoogleDocQuery = { __typename?: 'Query', CanAccessGoogleDoc: boolean | null };

type ImportGoogleDocMutationVariables = Exact<{
  fileUrl: Scalars['String']['input'];
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type ImportGoogleDocMutation = { __typename?: 'Mutation', ImportGoogleDoc: (
    { __typename?: 'Post' }
    & PostsBase
  ) | null };

type PostsCompareRevisionsQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsCompareRevisionsQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsWithNavigation
    ) | null } | null };

type PostsEditFormUserQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  eventForm: InputMaybe<Scalars['Boolean']['input']>;
}>;


type PostsEditFormUserQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersCurrentPostRateLimit
    ) | null } | null };

type PostsEditFormPostQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
}>;


type PostsEditFormPostQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsEditQueryFragment
    ) | null } | null };

type PostsGroupDetailsQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsGroupDetailsQuery = { __typename?: 'Query', localgroup: { __typename?: 'SingleLocalgroupOutput', result: (
      { __typename?: 'Localgroup' }
      & localGroupsHomeFragment
    ) | null } | null };

type PostsHighlightQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsHighlightQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsExpandedHighlight
    ) | null } | null };

type LatestDialogueMessagesQueryVariables = Exact<{
  dialogueId: Scalars['String']['input'];
  unreadCount: Scalars['Int']['input'];
}>;


type LatestDialogueMessagesQuery = { __typename?: 'Query', latestDialogueMessages: Array<string> | null };

type PostsItemWrapperQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsItemWrapperQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type PostsNewForm4QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsNewForm4Query = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersEdit
    ) | null } | null };

type PostsNewForm3QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsNewForm3Query = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsEditMutationFragment
    ) | null } | null };

type PostsNewForm2QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsNewForm2Query = { __typename?: 'Query', localgroup: { __typename?: 'SingleLocalgroupOutput', result: (
      { __typename?: 'Localgroup' }
      & localGroupsIsOnline
    ) | null } | null };

type PostsNewForm1QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
}>;


type PostsNewForm1Query = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsEditQueryFragment
    ) | null } | null };

type PostsNewFormQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsNewFormQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsPage
    ) | null } | null };

type flipSplashArtImageMutationVariables = Exact<{
  reviewWinnerArtId: Scalars['String']['input'];
}>;


type flipSplashArtImageMutation = { __typename?: 'Mutation', flipSplashArtImage: boolean | null };

type PostBodyQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostBodyQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostSideComments
    ) | null } | null };

type AcceptCoauthorRequestMutationVariables = Exact<{
  postId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  accept: InputMaybe<Scalars['Boolean']['input']>;
}>;


type AcceptCoauthorRequestMutation = { __typename?: 'Mutation', acceptCoauthorRequest: (
    { __typename?: 'Post' }
    & PostsDetails
  ) | null };

type PostsPageWrapper1QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
  batchKey: InputMaybe<Scalars['String']['input']>;
}>;


type PostsPageWrapper1Query = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsWithNavigationAndRevision
    ) | null } | null };

type PostsPageWrapperQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
  batchKey: InputMaybe<Scalars['String']['input']>;
}>;


type PostsPageWrapperQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsWithNavigation
    ) | null } | null };

type PostsRevisionsListQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsRevisionsListQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsRevisionsList
    ) | null } | null };

type RegisterRSVPMutationVariables = Exact<{
  postId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  private: InputMaybe<Scalars['Boolean']['input']>;
  response: InputMaybe<Scalars['String']['input']>;
}>;


type RegisterRSVPMutation = { __typename?: 'Mutation', RSVPToEvent: (
    { __typename?: 'Post' }
    & PostsDetails
  ) | null };

type CancelRSVPToEventMutationVariables = Exact<{
  postId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
}>;


type CancelRSVPToEventMutation = { __typename?: 'Mutation', CancelRSVPToEvent: (
    { __typename?: 'Post' }
    & PostsDetails
  ) | null };

type LWPostsPreviewTooltip1QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  dialogueMessageId: InputMaybe<Scalars['String']['input']>;
}>;


type LWPostsPreviewTooltip1Query = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostWithDialogueMessage
    ) | null } | null };

type LWPostsPreviewTooltipQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  hash: InputMaybe<Scalars['String']['input']>;
}>;


type LWPostsPreviewTooltipQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & HighlightWithHash
    ) | null } | null };

type PostsPreviewTooltipSingle4QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsPreviewTooltipSingle4Query = { __typename?: 'Query', tagRel: { __typename?: 'SingleTagRelOutput', result: (
      { __typename?: 'TagRel' }
      & TagRelFragment
    ) | null } | null };

type PostsPreviewTooltipSingle3QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsPreviewTooltipSingle3Query = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsList
    ) | null } | null };

type PostsPreviewTooltipSingleQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsPreviewTooltipSingleQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type WelcomePostItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type WelcomePostItemQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null } | null };

type observeRecommendationMutationVariables = Exact<{
  postId: Scalars['String']['input'];
}>;


type observeRecommendationMutation = { __typename?: 'Mutation', observeRecommendation: boolean | null };

type clickRecommendationMutationVariables = Exact<{
  postId: Scalars['String']['input'];
}>;


type clickRecommendationMutation = { __typename?: 'Mutation', clickRecommendation: boolean | null };

type ContinueReadingQueryQueryVariables = Exact<{ [key: string]: never; }>;


type ContinueReadingQueryQuery = { __typename?: 'Query', ContinueReading: Array<{ __typename?: 'RecommendResumeSequence', numRead: number | null, numTotal: number | null, lastReadTime: string | null, sequence: (
      { __typename?: 'Sequence' }
      & SequenceContinueReadingFragment
    ) | null, collection: (
      { __typename?: 'Collection' }
      & CollectionContinueReadingFragment
    ) | null, nextPost: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) }> | null };

type dismissRecommendationMutationVariables = Exact<{
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type dismissRecommendationMutation = { __typename?: 'Mutation', dismissRecommendation: boolean | null };

type RecommendationsQueryQueryVariables = Exact<{
  count: InputMaybe<Scalars['Int']['input']>;
  algorithm: InputMaybe<Scalars['JSON']['input']>;
}>;


type RecommendationsQueryQuery = { __typename?: 'Query', Recommendations: Array<(
    { __typename?: 'Post' }
    & PostsListWithVotesAndSequence
  )> | null };

type BestOfLessWrongAdminQueryVariables = Exact<{ [key: string]: never; }>;


type BestOfLessWrongAdminQuery = { __typename?: 'Query', GetAllReviewWinners: Array<(
    { __typename?: 'Post' }
    & PostsTopItemInfo
  )> };

type FrontpageBestOfLWWidgetQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type FrontpageBestOfLWWidgetQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null } | null };

type GenerateCoverImagesForPostMutationVariables = Exact<{
  postId: Scalars['String']['input'];
  prompt: InputMaybe<Scalars['String']['input']>;
}>;


type GenerateCoverImagesForPostMutation = { __typename?: 'Mutation', generateCoverImagesForPost: Array<{ __typename?: 'ReviewWinnerArt', _id: string } | null> | null };

type PostNominatedNotificationQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostNominatedNotificationQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type getPostsUserCommentedOnQueryVariables = Exact<{
  limit: InputMaybe<Scalars['Int']['input']>;
  filter: InputMaybe<PostReviewFilter>;
  sort: InputMaybe<PostReviewSort>;
}>;


type getPostsUserCommentedOnQuery = { __typename?: 'Query', PostsUserCommentedOn: { __typename?: 'UserReadHistoryResult', posts: Array<(
      { __typename?: 'Post' }
      & PostsListWithVotes
    )> | null } | null };

type GivingSeasonHeartsQueryQueryVariables = Exact<{
  electionName: Scalars['String']['input'];
}>;


type GivingSeasonHeartsQueryQuery = { __typename?: 'Query', GivingSeasonHearts: Array<{ __typename?: 'GivingSeasonHeart', userId: string, displayName: string, x: number, y: number, theta: number }> };

type AddGivingSeasonHeartMutationVariables = Exact<{
  electionName: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
  theta: Scalars['Float']['input'];
}>;


type AddGivingSeasonHeartMutation = { __typename?: 'Mutation', AddGivingSeasonHeart: Array<{ __typename?: 'GivingSeasonHeart', userId: string, displayName: string, x: number, y: number, theta: number }> };

type RemoveGivingSeasonHeartMutationVariables = Exact<{
  electionName: Scalars['String']['input'];
}>;


type RemoveGivingSeasonHeartMutation = { __typename?: 'Mutation', RemoveGivingSeasonHeart: Array<{ __typename?: 'GivingSeasonHeart', userId: string, displayName: string, x: number, y: number, theta: number }> };

type ReviewVotingExpandedPostQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ReviewVotingExpandedPostQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type submitReviewVoteMutationVariables = Exact<{
  postId: InputMaybe<Scalars['String']['input']>;
  qualitativeScore: InputMaybe<Scalars['Int']['input']>;
  quadraticChange: InputMaybe<Scalars['Int']['input']>;
  newQuadraticScore: InputMaybe<Scalars['Int']['input']>;
  comment: InputMaybe<Scalars['String']['input']>;
  year: InputMaybe<Scalars['String']['input']>;
  dummy: InputMaybe<Scalars['Boolean']['input']>;
}>;


type submitReviewVoteMutation = { __typename?: 'Mutation', submitReviewVote: (
    { __typename?: 'Post' }
    & PostsReviewVotingList
  ) | null };

type RotatingReviewWinnerSpotlightDisplayQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type RotatingReviewWinnerSpotlightDisplayQuery = { __typename?: 'Query', spotlight: { __typename?: 'SingleSpotlightOutput', result: (
      { __typename?: 'Spotlight' }
      & SpotlightDisplay
    ) | null } | null };

type RotatingReviewWinnerSpotlightQueryVariables = Exact<{ [key: string]: never; }>;


type RotatingReviewWinnerSpotlightQuery = { __typename?: 'Query', GetAllReviewWinners: Array<(
    { __typename?: 'Post' }
    & PostForReviewWinnerItem
  )> };

type RevisionsDiffQueryVariables = Exact<{
  collectionName: Scalars['String']['input'];
  fieldName: Scalars['String']['input'];
  id: Scalars['String']['input'];
  beforeRev: InputMaybe<Scalars['String']['input']>;
  afterRev: Scalars['String']['input'];
  trim: InputMaybe<Scalars['Boolean']['input']>;
}>;


type RevisionsDiffQuery = { __typename?: 'Query', RevisionsDiff: string | null };

type PostsRevisionSelectQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsRevisionSelectQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsDetails
    ) | null } | null };

type HomepageCommunityMapQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type HomepageCommunityMapQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type launchPetrovMissileMutationVariables = Exact<{
  launchCode: InputMaybe<Scalars['String']['input']>;
}>;


type launchPetrovMissileMutation = { __typename?: 'Mutation', PetrovDayLaunchMissile: { __typename?: 'PetrovDayLaunchMissileData', launchCode: string | null } | null };

type petrovDayLaunchResolversQueryVariables = Exact<{ [key: string]: never; }>;


type petrovDayLaunchResolversQuery = { __typename?: 'Query', PetrovDayCheckIfIncoming: { __typename?: 'PetrovDayCheckIfIncomingData', launched: boolean | null, createdAt: string | null } | null };

type petrov2024checkIfNukedQueryVariables = Exact<{ [key: string]: never; }>;


type petrov2024checkIfNukedQuery = { __typename?: 'Query', petrov2024checkIfNuked: boolean | null };

type petrovDay2024ResolversQueryVariables = Exact<{ [key: string]: never; }>;


type petrovDay2024ResolversQuery = { __typename?: 'Query', PetrovDay2024CheckNumberOfIncoming: { __typename?: 'PetrovDay2024CheckNumberOfIncomingData', count: number | null } | null };

type BooksItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type BooksItemQuery = { __typename?: 'Query', book: { __typename?: 'SingleBookOutput', result: (
      { __typename?: 'Book' }
      & BookEdit
    ) | null } | null };

type ChaptersItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ChaptersItemQuery = { __typename?: 'Query', chapter: { __typename?: 'SingleChapterOutput', result: (
      { __typename?: 'Chapter' }
      & ChaptersEdit
    ) | null } | null };

type CollectionsPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CollectionsPageQuery = { __typename?: 'Query', collection: { __typename?: 'SingleCollectionOutput', result: (
      { __typename?: 'Collection' }
      & CollectionsPageFragment
    ) | null } | null };

type CollectionsEditQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type CollectionsEditQuery = { __typename?: 'Query', collection: { __typename?: 'SingleCollectionOutput', result: (
      { __typename?: 'Collection' }
      & CollectionsEditFragment
    ) | null } | null };

type SequencesPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SequencesPageQuery = { __typename?: 'Query', sequence: { __typename?: 'SingleSequenceOutput', result: (
      { __typename?: 'Sequence' }
      & SequencesPageFragment
    ) | null } | null };

type SequencesEditQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SequencesEditQuery = { __typename?: 'Query', sequence: { __typename?: 'SingleSequenceOutput', result: (
      { __typename?: 'Sequence' }
      & SequencesEdit
    ) | null } | null };

type GetAllReviewWinnersQueryVariables = Exact<{ [key: string]: never; }>;


type GetAllReviewWinnersQuery = { __typename?: 'Query', GetAllReviewWinners: Array<(
    { __typename?: 'Post' }
    & PostsTopItemInfo
  )> };

type updateContinueReadingMutationVariables = Exact<{
  sequenceId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
}>;


type updateContinueReadingMutation = { __typename?: 'Mutation', updateContinueReading: boolean | null };

type ProfileShortformQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ProfileShortformQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null } | null };

type SpotlightItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SpotlightItemQuery = { __typename?: 'Query', spotlight: { __typename?: 'SingleSpotlightOutput', result: (
      { __typename?: 'Spotlight' }
      & SpotlightEditQueryFragment
    ) | null } | null };

type ModerationAltAccountsQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type ModerationAltAccountsQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UserAltAccountsFragment
    ) | null } | null };

type ModeratorIPAddressInfoQueryVariables = Exact<{
  ipAddress: Scalars['String']['input'];
}>;


type ModeratorIPAddressInfoQuery = { __typename?: 'Query', moderatorViewIPAddress: { __typename?: 'ModeratorIPAddressInfo', ip: string, userIds: Array<string> } | null };

type NewCommentModerationWarningQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NewCommentModerationWarningQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsList
    ) | null } | null };

type NewPostModerationWarningQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NewPostModerationWarningQuery = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsList
    ) | null } | null };

type SunshineNewUsersProfileInfoQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SunshineNewUsersProfileInfoQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & SunshineUsersList
    ) | null } | null };

type SurveyEditPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SurveyEditPageQuery = { __typename?: 'Query', survey: { __typename?: 'SingleSurveyOutput', result: (
      { __typename?: 'Survey' }
      & SurveyMinimumInfo
    ) | null } | null };

type editSurveyMutationVariables = Exact<{
  surveyId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  questions: Array<SurveyQuestionInfo> | SurveyQuestionInfo;
}>;


type editSurveyMutation = { __typename?: 'Mutation', editSurvey: (
    { __typename?: 'Survey' }
    & SurveyMinimumInfo
  ) | null };

type SurveyScheduleEditPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SurveyScheduleEditPageQuery = { __typename?: 'Query', surveySchedule: { __typename?: 'SingleSurveyScheduleOutput', result: (
      { __typename?: 'SurveySchedule' }
      & SurveyScheduleEdit
    ) | null } | null };

type addPostsToTagMutationVariables = Exact<{
  tagId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type addPostsToTagMutation = { __typename?: 'Mutation', addOrUpvoteTag: (
    { __typename?: 'TagRel' }
    & TagRelCreationFragment
  ) | null };

type AllPostsPageTagRevisionItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type AllPostsPageTagRevisionItemQuery = { __typename?: 'Query', revision: { __typename?: 'SingleRevisionOutput', result: (
      { __typename?: 'Revision' }
      & RevisionHistoryEntry
    ) | null } | null };

type TagsQueryQueryVariables = Exact<{
  slugs: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


type TagsQueryQuery = { __typename?: 'Query', tags: { __typename?: 'MultiTagOutput', results: Array<(
      { __typename?: 'Tag' }
      & ConceptItemFragment
    ) | null> | null } | null };

type EAAllTagsPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EAAllTagsPageQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagEditFragment
    ) | null } | null };

type EATagPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EATagPageQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagEditFragment
    ) | null } | null };

type FilterModeQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type FilterModeQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagPreviewFragment
    ) | null } | null };

type addOrUpvoteTagMutationVariables = Exact<{
  tagId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
}>;


type addOrUpvoteTagMutation = { __typename?: 'Mutation', addOrUpvoteTag: (
    { __typename?: 'TagRel' }
    & TagRelMinimumFragment
  ) | null };

type LWTagPageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type LWTagPageQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagEditFragment
    ) | null } | null };

type getRandomTagQueryVariables = Exact<{ [key: string]: never; }>;


type getRandomTagQuery = { __typename?: 'Query', RandomTag: { __typename?: 'Tag', slug: string } };

type reorderSummariesMutationVariables = Exact<{
  parentDocumentId: Scalars['String']['input'];
  parentDocumentCollectionName: Scalars['String']['input'];
  summaryIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


type reorderSummariesMutation = { __typename?: 'Mutation', reorderSummaries: boolean | null };

type TagContributorsListQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagContributorsListQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagFullContributorsList
    ) | null } | null };

type getTagUpdatesQueryVariables = Exact<{
  before: Scalars['Date']['input'];
  after: Scalars['Date']['input'];
}>;


type getTagUpdatesQuery = { __typename?: 'Query', TagUpdatesInTimeBlock: Array<{ __typename?: 'TagUpdates', revisionIds: Array<string> | null, commentCount: number | null, commentIds: Array<string> | null, lastRevisedAt: string | null, lastCommentedAt: string | null, added: number | null, removed: number | null, tag: (
      { __typename?: 'Tag' }
      & TagHistoryFragment
    ), users: Array<(
      { __typename?: 'User' }
      & UsersMinimumInfo
    )> | null, documentDeletions: Array<{ __typename?: 'DocumentDeletion', userId: string | null, documentId: string, netChange: string, type: string | null, createdAt: string, docFields: { __typename?: 'MultiDocument', _id: string, slug: string, tabTitle: string, tabSubtitle: string | null } | null }> | null }> | null };

type TagFlagItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagFlagItemQuery = { __typename?: 'Query', tagFlag: { __typename?: 'SingleTagFlagOutput', result: (
      { __typename?: 'TagFlag' }
      & TagFlagFragment
    ) | null } | null };

type TagMergePageQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagMergePageQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagFragment
    ) | null } | null };

type mergeTagsMutationVariables = Exact<{
  sourceTagId: Scalars['String']['input'];
  targetTagId: Scalars['String']['input'];
  transferSubtags: Scalars['Boolean']['input'];
  redirectSource: Scalars['Boolean']['input'];
}>;


type mergeTagsMutation = { __typename?: 'Mutation', mergeTags: boolean | null };

type promoteLensToMainMutationVariables = Exact<{
  lensId: Scalars['String']['input'];
}>;


type promoteLensToMainMutation = { __typename?: 'Mutation', promoteLensToMain: boolean | null };

type TagSearchHitQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagSearchHitQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagPreviewFragment
    ) | null } | null };

type TaggingDashboardQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TaggingDashboardQuery = { __typename?: 'Query', tagFlag: { __typename?: 'SingleTagFlagOutput', result: (
      { __typename?: 'TagFlag' }
      & TagFlagEditFragment
    ) | null } | null };

type TagsDetailsItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type TagsDetailsItemQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagEditFragment
    ) | null } | null };

type GetTagsByCoreTagIdQueryVariables = Exact<{
  coreTagId: InputMaybe<Scalars['String']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  searchTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


type GetTagsByCoreTagIdQuery = { __typename?: 'Query', TagsByCoreTagId: { __typename?: 'TagWithTotalCount', totalCount: number, tags: Array<(
      { __typename?: 'Tag' }
      & ConceptItemFragment
    )> } };

type SidebarSubtagsBoxQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SidebarSubtagsBoxQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagSubtagFragment
    ) | null } | null };

type UserUpdateSubforumMembershipMutationVariables = Exact<{
  tagId: Scalars['String']['input'];
  member: Scalars['Boolean']['input'];
}>;


type UserUpdateSubforumMembershipMutation = { __typename?: 'Mutation', UserUpdateSubforumMembership: (
    { __typename?: 'User' }
    & UsersCurrent
  ) | null };

type SubforumWikiTabQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SubforumWikiTabQuery = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagEditFragment
    ) | null } | null };

type LocalgroupPageTitleQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type LocalgroupPageTitleQuery = { __typename?: 'Query', localgroup: { __typename?: 'SingleLocalgroupOutput', result: (
      { __typename?: 'Localgroup' }
      & localGroupsBase
    ) | null } | null };

type PostsPageHeaderTitleQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type PostsPageHeaderTitleQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsBase
    ) | null } | null };

type SequencesPageTitleQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type SequencesPageTitleQuery = { __typename?: 'Query', sequence: { __typename?: 'SingleSequenceOutput', result: (
      { __typename?: 'Sequence' }
      & SequencesPageTitleFragment
    ) | null } | null };

type UltraFeedCommentsDialogQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type UltraFeedCommentsDialogQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsDetails
    ) | null } | null };

type UltraFeedPostDialogQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type UltraFeedPostDialogQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & UltraFeedPostFragment
    ) | null } | null };

type LocalPostQueryQueryVariables = Exact<{
  documentId: Scalars['String']['input'];
}>;


type LocalPostQueryQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & UltraFeedPostFragment
    ) | null } | null };

type ForeignPostQueryQueryVariables = Exact<{
  documentId: Scalars['String']['input'];
}>;


type ForeignPostQueryQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsPage
    ) | null } | null };

type UltraFeedThreadItemQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type UltraFeedThreadItemQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null } | null };

type connectCrossposterMutationVariables = Exact<{
  token: InputMaybe<Scalars['String']['input']>;
}>;


type connectCrossposterMutation = { __typename?: 'Mutation', connectCrossposter: string | null };

type EditProfileFormQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EditProfileFormQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersProfileEdit
    ) | null } | null };

type sendEventTriggeredDMMutationVariables = Exact<{
  eventType: Scalars['String']['input'];
}>;


type sendEventTriggeredDMMutation = { __typename?: 'Mutation', sendEventTriggeredDM: boolean };

type KarmaChangeNotifierQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type KarmaChangeNotifierQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UserKarmaChanges
    ) | null } | null };

type loginMutationVariables = Exact<{
  username: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
}>;


type loginMutation = { __typename?: 'Mutation', login: { __typename?: 'LoginReturnData', token: string | null } | null };

type signupMutationVariables = Exact<{
  email: InputMaybe<Scalars['String']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  subscribeToCurated: InputMaybe<Scalars['Boolean']['input']>;
  reCaptchaToken: InputMaybe<Scalars['String']['input']>;
  abTestKey: InputMaybe<Scalars['String']['input']>;
}>;


type signupMutation = { __typename?: 'Mutation', signup: { __typename?: 'LoginReturnData', token: string | null } | null };

type resetPasswordMutationVariables = Exact<{
  email: InputMaybe<Scalars['String']['input']>;
}>;


type resetPasswordMutation = { __typename?: 'Mutation', resetPassword: string | null };

type UsersNameWrapperQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type UsersNameWrapperQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null };

type emailstestsQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
}>;


type emailstestsQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsRevision
    ) | null } | null };

type AdvisorRequestsMinimumInfo = { __typename?: 'AdvisorRequest', _id: string, userId: string | null, createdAt: string, interestedInMetaculus: boolean | null, jobAds: any | null };

type BansAdminPageFragment = { __typename?: 'Ban', _id: string, createdAt: string, expirationDate: string | null, userId: string, reason: string | null, comment: string, ip: string | null, properties: any | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type BookmarksWithDocumentFragment = (
  { __typename?: 'Bookmark', post: (
    { __typename?: 'Post' }
    & PostsListWithVotes
  ) | null }
  & BookmarksDefaultFragment
);

type BookmarksFeedItemFragment = (
  { __typename?: 'Bookmark', post: (
    { __typename?: 'Post' }
    & PostsListWithVotes
  ) | null, comment: (
    { __typename?: 'Comment' }
    & UltraFeedComment
  ) | null }
  & BookmarksDefaultFragment
);

type BookPageFragment = { __typename?: 'Book', _id: string, createdAt: string, title: string | null, number: number | null, subtitle: string | null, tocTitle: string | null, sequenceIds: Array<string>, postIds: Array<string>, collectionId: string, displaySequencesAsGrid: boolean | null, hideProgressBar: boolean | null, showChapters: boolean | null, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, sequences: Array<(
    { __typename?: 'Sequence' }
    & SequencesPageWithChaptersFragment
  )>, posts: Array<(
    { __typename?: 'Post' }
    & PostsListWithVotes
  )> };

type BookEdit = (
  { __typename?: 'Book', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & BookPageFragment
);

type ChaptersFragment = { __typename?: 'Chapter', _id: string, createdAt: string, title: string | null, subtitle: string | null, number: number | null, sequenceId: string | null, postIds: Array<string>, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, posts: Array<(
    { __typename?: 'Post' }
    & PostsListWithVotes
  )> };

type ChaptersEdit = (
  { __typename?: 'Chapter', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & ChaptersFragment
);

type CkEditorUserSessionInfo = { __typename?: 'CkEditorUserSession', _id: string, userId: string | null, documentId: string | null, endedAt: string | null, endedBy: string | null };

type ModeratorClientIDInfo = { __typename?: 'ClientId', _id: string, clientId: string | null, createdAt: string | null, firstSeenReferrer: string | null, firstSeenLandingPage: string | null, users: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )> | null };

type CollectionContinueReadingFragment = { __typename?: 'Collection', _id: string, title: string, slug: string, gridImageId: string | null };

type CollectionsPageFragment = { __typename?: 'Collection', _id: string, createdAt: string, slug: string, userId: string, title: string, firstPageLink: string, gridImageId: string | null, hideStartReadingButton: boolean | null, noindex: boolean, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, books: Array<(
    { __typename?: 'Book' }
    & BookPageFragment
  )> };

type CollectionsEditFragment = (
  { __typename?: 'Collection', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & CollectionsPageFragment
);

type CollectionsBestOfFragment = { __typename?: 'Collection', _id: string, createdAt: string, slug: string, userId: string, title: string, gridImageId: string | null, noindex: boolean, postsCount: number, readPostsCount: number, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null };

type CommentModeratorActionDisplay = { __typename?: 'CommentModeratorAction', _id: string, commentId: string | null, type: string | null, active: boolean | null, createdAt: string, endedAt: string | null, comment: (
    { __typename?: 'Comment' }
    & CommentsListWithModerationMetadata
  ) | null };

type CommentsList = { __typename?: 'Comment', _id: string, postId: string | null, tagId: string | null, relevantTagIds: Array<string>, tagCommentType: TagCommentType, parentCommentId: string | null, topLevelCommentId: string | null, descendentCount: number, title: string | null, postedAt: string, lastEditedAt: string | null, repliesBlockedUntil: string | null, userId: string | null, deleted: boolean, deletedPublic: boolean, deletedByUserId: string | null, deletedReason: string | null, hideAuthor: boolean, authorIsUnreviewed: boolean, currentUserVote: string | null, currentUserExtendedVote: any | null, baseScore: number | null, extendedScore: any | null, score: number, voteCount: number, emojiReactors: any | null, af: boolean, afDate: string | null, moveToAlignmentUserId: string | null, afBaseScore: number | null, afExtendedScore: any | null, suggestForAlignmentUserIds: Array<string>, reviewForAlignmentUserId: string | null, needsReview: boolean | null, answer: boolean, parentAnswerId: string | null, retracted: boolean, postVersion: string | null, reviewedByUserId: string | null, shortform: boolean | null, shortformFrontpage: boolean, lastSubthreadActivity: string | null, moderatorHat: boolean, hideModeratorHat: boolean | null, nominatedForReview: string | null, reviewingForReview: string | null, promoted: boolean | null, directChildrenCount: number, votingSystem: string, isPinnedOnProfile: boolean, debateResponse: boolean | null, rejected: boolean, rejectedReason: string | null, modGPTRecommendation: string | null, originalDialogueId: string | null, forumEventId: string | null, forumEventMetadata: any | null, tag: { __typename?: 'Tag', _id: string, slug: string } | null, relevantTags: Array<(
    { __typename?: 'Tag' }
    & TagPreviewFragment
  )>, contents: { __typename?: 'Revision', _id: string, html: string | null, plaintextMainText: string, wordCount: number } | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, promotedByUser: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type CommentsListWithTopLevelComment = (
  { __typename?: 'Comment', topLevelComment: (
    { __typename?: 'Comment' }
    & CommentsList
  ) | null }
  & CommentsList
);

type UltraFeedComment = (
  { __typename?: 'Comment', post: (
    { __typename?: 'Post', votingSystem: string | null }
    & PostsMinimumInfo
  ) | null }
  & CommentsList
);

type ShortformComments = (
  { __typename?: 'Comment', post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ) | null, relevantTags: Array<(
    { __typename?: 'Tag' }
    & TagPreviewFragment
  )> }
  & CommentsList
);

type CommentWithRepliesFragment = (
  { __typename?: 'Comment', lastSubthreadActivity: string | null, latestChildren: Array<(
    { __typename?: 'Comment' }
    & CommentsList
  )>, tag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsBase
  ) | null }
  & CommentsList
);

type CommentEdit = (
  { __typename?: 'Comment', relevantTagIds: Array<string>, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & CommentsList
);

type DeletedCommentsMetaData = { __typename?: 'Comment', _id: string, deleted: boolean, deletedDate: string | null, deletedReason: string | null, deletedPublic: boolean, deletedByUser: { __typename?: 'User', _id: string, displayName: string } | null };

type DeletedCommentsModerationLog = (
  { __typename?: 'Comment', user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, post: { __typename?: 'Post', title: string, slug: string, _id: string } | null }
  & DeletedCommentsMetaData
);

type CommentsListWithParentMetadata = (
  { __typename?: 'Comment', post: (
    { __typename?: 'Post', isRead: boolean | null }
    & PostsMinimumInfo
  ) | null, tag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null }
  & CommentsList
);

type StickySubforumCommentFragment = (
  { __typename?: 'Comment', tag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null }
  & CommentWithRepliesFragment
);

type WithVoteComment = { __typename: 'Comment', _id: string, currentUserVote: string | null, currentUserExtendedVote: any | null, baseScore: number | null, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, voteCount: number };

type CommentsListWithModerationMetadata = (
  { __typename?: 'Comment', allVotes: Array<{ __typename?: 'Vote', voteType: VoteType }> | null }
  & CommentWithRepliesFragment
);

type CommentsListWithModGPTAnalysis = (
  { __typename?: 'Comment', modGPTAnalysis: string | null, post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ) | null }
  & CommentsList
);

type CommentsForAutocomplete = { __typename?: 'Comment', _id: string, postId: string | null, baseScore: number | null, extendedScore: any | null, createdAt: string | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, contents: { __typename?: 'Revision', markdown: string | null } | null, post: (
    { __typename?: 'Post' }
    & PostsForAutocomplete
  ) | null };

type CommentsForAutocompleteWithParents = (
  { __typename?: 'Comment', parentComment: (
    { __typename?: 'Comment', parentComment: (
      { __typename?: 'Comment', parentComment: (
        { __typename?: 'Comment', parentComment: (
          { __typename?: 'Comment', parentComment: (
            { __typename?: 'Comment', parentComment: (
              { __typename?: 'Comment', parentComment: (
                { __typename?: 'Comment', parentComment: (
                  { __typename?: 'Comment', parentComment: (
                    { __typename?: 'Comment', parentComment: (
                      { __typename?: 'Comment' }
                      & CommentsForAutocomplete
                    ) | null }
                    & CommentsForAutocomplete
                  ) | null }
                  & CommentsForAutocomplete
                ) | null }
                & CommentsForAutocomplete
              ) | null }
              & CommentsForAutocomplete
            ) | null }
            & CommentsForAutocomplete
          ) | null }
          & CommentsForAutocomplete
        ) | null }
        & CommentsForAutocomplete
      ) | null }
      & CommentsForAutocomplete
    ) | null }
    & CommentsForAutocomplete
  ) | null }
  & CommentsForAutocomplete
);

type SuggestAlignmentComment = (
  { __typename?: 'Comment', suggestForAlignmentUserIds: Array<string>, post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ) | null, suggestForAlignmentUsers: Array<{ __typename?: 'User', _id: string, displayName: string }> }
  & CommentsList
);

type ConversationsMinimumInfo = { __typename?: 'Conversation', _id: string, createdAt: string | null, latestActivity: string | null, title: string | null, participantIds: Array<string> | null, archivedByIds: Array<string>, messageCount: number, moderator: boolean | null };

type ConversationsList = (
  { __typename?: 'Conversation', participants: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )> | null, latestMessage: (
    { __typename?: 'Message' }
    & messageListFragment
  ) | null }
  & ConversationsMinimumInfo
);

type ConversationsListWithReadStatus = (
  { __typename?: 'Conversation', hasUnreadMessages: boolean | null }
  & ConversationsList
);

type CurationNoticesFragment = { __typename?: 'CurationNotice', _id: string, createdAt: string, userId: string, commentId: string | null, postId: string, deleted: boolean, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ), comment: (
    { __typename?: 'Comment' }
    & CommentsList
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ), contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) };

type DialogueCheckInfo = { __typename?: 'DialogueCheck', _id: string, userId: string | null, targetUserId: string | null, checked: boolean | null, checkedAt: string | null, hideInRecommendations: boolean | null, matchPreference: (
    { __typename?: 'DialogueMatchPreference' }
    & DialogueMatchPreferenceInfo
  ) | null, reciprocalMatchPreference: (
    { __typename?: 'DialogueMatchPreference' }
    & DialogueMatchPreferenceInfo
  ) | null };

type DialogueMatchPreferenceInfo = { __typename?: 'DialogueMatchPreference', _id: string, dialogueCheckId: string | null, topicNotes: string | null, topicPreferences: Array<any> | null, syncPreference: string | null, asyncPreference: string | null, formatNotes: string | null, generatedDialogueId: string | null, deleted: boolean };

type DigestPostsMinimumInfo = { __typename?: 'DigestPost', _id: string, digestId: string, postId: string, emailDigestStatus: string | null, onsiteDigestStatus: string | null };

type DigestsMinimumInfo = { __typename?: 'Digest', _id: string, num: number, startDate: string, endDate: string | null, publishedDate: string | null, onsiteImageId: string | null, onsitePrimaryColor: string | null };

type ElectionCandidateBasicInfo = { __typename?: 'ElectionCandidate', _id: string, electionName: string, name: string, logoSrc: string, href: string, fundraiserLink: string | null, gwwcLink: string | null, gwwcId: string | null, description: string, tagId: string, postCount: number, baseScore: number, score: number, extendedScore: any | null, voteCount: number, currentUserVote: string | null, currentUserExtendedVote: any | null, tag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null };

type ElectionCandidateSimple = { __typename?: 'ElectionCandidate', _id: string, name: string, logoSrc: string, href: string, fundraiserLink: string | null, description: string };

type WithVoteElectionCandidate = { __typename: 'ElectionCandidate', _id: string, score: number, baseScore: number, extendedScore: any | null, afBaseScore: number | null, voteCount: number, currentUserVote: string | null, currentUserExtendedVote: any | null };

type ElectionVoteInfo = { __typename?: 'ElectionVote', _id: string, electionName: string | null, userId: string | null, compareState: any | null, vote: any | null, submittedAt: string | null, submissionComments: any | null, userExplanation: string | null, userOtherComments: string | null };

type ElectionVoteRecentDiscussion = { __typename?: 'ElectionVote', _id: string, electionName: string | null, submittedAt: string | null };

type ElicitQuestionFragment = { __typename?: 'ElicitQuestion', _id: string, title: string, notes: string | null, resolution: string | null, resolvesBy: string | null };

type FeaturedResourcesFragment = { __typename?: 'FeaturedResource', _id: string, title: string, body: string | null, ctaText: string, ctaUrl: string, expiresAt: string };

type FieldChangeFragment = { __typename?: 'FieldChange', _id: string, createdAt: string, userId: string | null, changeGroup: string | null, documentId: string | null, fieldName: string | null, oldValue: any | null, newValue: any | null };

type ForumEventsMinimumInfo = { __typename?: 'ForumEvent', _id: string, title: string, startDate: string, endDate: string | null, darkColor: string, lightColor: string, bannerTextColor: string, contrastColor: string | null, tagId: string | null, postId: string | null, bannerImageId: string | null, eventFormat: ForumEventFormat, customComponent: ForumEventCustomComponent, commentPrompt: string | null, isGlobal: boolean, pollAgreeWording: string | null, pollDisagreeWording: string | null, maxStickersPerUser: number };

type ForumEventsDisplay = (
  { __typename?: 'ForumEvent', publicData: any | null, voteCount: number, post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ) | null, tag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, frontpageDescription: { __typename?: 'Revision', _id: string, html: string | null } | null, frontpageDescriptionMobile: { __typename?: 'Revision', _id: string, html: string | null } | null, postPageDescription: { __typename?: 'Revision', _id: string, html: string | null } | null, pollQuestion: { __typename?: 'Revision', _id: string, html: string | null, plaintextMainText: string } | null }
  & ForumEventsMinimumInfo
);

type ForumEventsEdit = (
  { __typename?: 'ForumEvent', frontpageDescription: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, frontpageDescriptionMobile: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, postPageDescription: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, pollQuestion: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & ForumEventsMinimumInfo
);

type GardenCodeFragment = { __typename?: 'GardenCode', _id: string, code: string, title: string, userId: string, deleted: boolean, slug: string, startTime: string | null, endTime: string, fbLink: string | null, type: string, afOnly: boolean, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null };

type GardenCodeEditFragment = { __typename?: 'GardenCode', _id: string, code: string, title: string, userId: string, deleted: boolean, slug: string, startTime: string | null, endTime: string, fbLink: string | null, type: string, afOnly: boolean, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null };

type GoogleServiceAccountSessionInfo = { __typename?: 'GoogleServiceAccountSession', _id: string, email: string | null };

type GoogleServiceAccountSessionAdminInfo = { __typename?: 'GoogleServiceAccountSession', _id: string, email: string | null, estimatedExpiry: string | null };

type JargonTerms = { __typename?: 'JargonTerm', _id: string, postId: string, term: string, humansAndOrAIEdited: string | null, approved: boolean, deleted: boolean, altTerms: Array<string>, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null };

type JargonTermsPost = { __typename?: 'JargonTerm', _id: string, term: string, humansAndOrAIEdited: string | null, approved: boolean, deleted: boolean, altTerms: Array<string>, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null };

type JargonTermsWithPostInfo = (
  { __typename?: 'JargonTerm', post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ) | null }
  & JargonTerms
);

type LlmConversationsFragment = { __typename?: 'LlmConversation', _id: string, userId: string | null, title: string | null, createdAt: string, lastUpdatedAt: string | null, deleted: boolean | null };

type LlmConversationsViewingPageFragment = (
  { __typename?: 'LlmConversation', totalCharacterCount: number | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null }
  & LlmConversationsFragment
);

type LlmConversationsWithMessagesFragment = (
  { __typename?: 'LlmConversation', messages: Array<(
    { __typename?: 'LlmMessage' }
    & LlmMessagesFragment
  )> | null }
  & LlmConversationsFragment
);

type LlmMessagesFragment = { __typename?: 'LlmMessage', _id: string, userId: string | null, conversationId: string | null, role: string | null, content: string | null, createdAt: string };

type localGroupsBase = { __typename?: 'Localgroup', _id: string, createdAt: string, organizerIds: Array<string>, lastActivity: string, name: string, nameInAnotherLanguage: string | null, isOnline: boolean, location: string | null, googleLocation: any | null, mongoLocation: any | null, types: Array<string>, categories: Array<string> | null, contactInfo: string | null, facebookLink: string | null, facebookPageLink: string | null, meetupLink: string | null, slackLink: string | null, website: string | null, bannerImageId: string | null, inactive: boolean, deleted: boolean, organizers: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )> };

type localGroupsHomeFragment = (
  { __typename?: 'Localgroup', contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null }
  & localGroupsBase
);

type localGroupsEdit = (
  { __typename?: 'Localgroup', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & localGroupsBase
);

type localGroupsIsOnline = { __typename?: 'Localgroup', _id: string, name: string, isOnline: boolean };

type newEventFragment = { __typename?: 'LWEvent', _id: string, createdAt: string | null, userId: string | null, name: string | null, important: boolean | null, properties: any | null, intercom: boolean | null };

type lastEventFragment = { __typename?: 'LWEvent', _id: string, createdAt: string | null, documentId: string | null, userId: string | null, name: string | null, important: boolean | null, properties: any | null, intercom: boolean | null };

type lwEventsAdminPageFragment = { __typename?: 'LWEvent', _id: string, createdAt: string | null, userId: string | null, name: string | null, documentId: string | null, important: boolean | null, properties: any | null, intercom: boolean | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type emailHistoryFragment = { __typename?: 'LWEvent', _id: string, createdAt: string | null, userId: string | null, name: string | null, properties: any | null };

type messageListFragment = { __typename?: 'Message', _id: string, createdAt: string | null, conversationId: string | null, user: (
    { __typename?: 'User', profileImageId: string | null }
    & UsersMinimumInfo
  ) | null, contents: { __typename?: 'Revision', html: string | null, plaintextMainText: string } | null };

type ModerationTemplateFragment = { __typename?: 'ModerationTemplate', _id: string, name: string, collectionName: ModerationTemplateType, order: number, deleted: boolean, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null };

type ModeratorActionDisplay = { __typename?: 'ModeratorAction', _id: string, userId: string, type: ModeratorActionType, active: boolean, createdAt: string, endedAt: string | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type MultiDocumentMinimumInfo = { __typename?: 'MultiDocument', _id: string, parentDocumentId: string, collectionName: string, fieldName: string, userId: string, slug: string, oldSlugs: Array<string>, title: string | null, tabTitle: string, tabSubtitle: string | null, preview: string | null, index: number, deleted: boolean, createdAt: string, legacyData: any | null, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, voteCount: number, currentUserVote: string | null, currentUserExtendedVote: any | null };

type MultiDocumentContentDisplay = (
  { __typename?: 'MultiDocument', tableOfContents: any | null, textLastUpdatedAt: string | null, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & MultiDocumentMinimumInfo
);

type MultiDocumentEdit = (
  { __typename?: 'MultiDocument', textLastUpdatedAt: string | null, arbitalLinkedPages: (
    { __typename?: 'ArbitalLinkedPages' }
    & ArbitalLinkedPagesFragment
  ) | null, summaries: Array<(
    { __typename?: 'MultiDocument' }
    & MultiDocumentContentDisplay
  )> }
  & MultiDocumentContentDisplay
);

type MultiDocumentParentDocument = (
  { __typename?: 'MultiDocument', parentTag: (
    { __typename?: 'Tag' }
    & TagHistoryFragment
  ) | null }
  & MultiDocumentEdit
);

type MultiDocumentWithContributors = (
  { __typename?: 'MultiDocument', contributors: { __typename?: 'TagContributorsList', totalCount: number, contributors: Array<{ __typename?: 'TagContributor', currentAttributionCharCount: number | null, user: (
        { __typename?: 'User' }
        & UsersMinimumInfo
      ) | null }> } | null }
  & MultiDocumentEdit
);

type MultiDocumentRevision = (
  { __typename?: 'MultiDocument', tableOfContents: any | null, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & MultiDocumentMinimumInfo
);

type MultiDocumentWithContributorsRevision = (
  { __typename?: 'MultiDocument', textLastUpdatedAt: string | null, contributors: { __typename?: 'TagContributorsList', totalCount: number, contributors: Array<{ __typename?: 'TagContributor', currentAttributionCharCount: number | null, contributionScore: number, user: (
        { __typename?: 'User' }
        & UsersMinimumInfo
      ) | null }> } | null, arbitalLinkedPages: (
    { __typename?: 'ArbitalLinkedPages' }
    & ArbitalLinkedPagesFragment
  ) | null }
  & MultiDocumentRevision
);

type WithVoteMultiDocument = (
  { __typename?: 'MultiDocument' }
  & MultiDocumentMinimumInfo
);

type NotificationsList = { __typename?: 'Notification', _id: string, documentId: string | null, documentType: string | null, deleted: boolean | null, userId: string | null, createdAt: string | null, link: string | null, message: string | null, type: string | null, viewed: boolean | null, extraData: any | null };

type PetrovDayActionInfo = { __typename?: 'PetrovDayAction', _id: string, createdAt: string, userId: string | null, actionType: string, data: any | null };

type PetrovDayLaunchInfo = { __typename?: 'PetrovDayLaunch', _id: string, createdAt: string, launchCode: string, userId: string | null };

type PodcastEpisodeFull = { __typename?: 'PodcastEpisode', _id: string, podcastId: string, title: string, episodeLink: string, externalEpisodeId: string };

type PodcastSelect = { __typename?: 'Podcast', _id: string, title: string };

type PostsMinimumInfo = { __typename?: 'Post', _id: string, slug: string, title: string, draft: boolean | null, shortform: boolean, hideCommentKarma: boolean, af: boolean, userId: string | null, hasCoauthorPermission: boolean, rejected: boolean, debate: boolean, collabEditorDialogue: boolean, currentUserReviewVote: { __typename?: 'ReviewVote', _id: string, qualitativeScore: number, quadraticScore: number } | null, coauthorStatuses: Array<{ __typename?: 'CoauthorStatusOutput', userId: string, confirmed: boolean, requested: boolean }> | null };

type PostsTopItemInfo = (
  { __typename?: 'Post', isRead: boolean | null, finalReviewVoteScoreHighKarma: number, contents: { __typename?: 'Revision', _id: string, htmlHighlight: string, wordCount: number, version: string } | null, customHighlight: { __typename?: 'Revision', _id: string, html: string | null } | null, tags: Array<(
    { __typename?: 'Tag' }
    & TagPreviewFragment
  )>, reviewWinner: (
    { __typename?: 'ReviewWinner' }
    & ReviewWinnerTopPostsPage
  ) | null, spotlight: (
    { __typename?: 'Spotlight' }
    & SpotlightReviewWinner
  ) | null, reviews: Array<(
    { __typename?: 'Comment' }
    & CommentsList
  )> | null }
  & PostsMinimumInfo
  & PostsAuthors
);

type PostsBase = (
  { __typename?: 'Post', url: string | null, postedAt: string, createdAt: string | null, sticky: boolean, metaSticky: boolean, stickyPriority: number, status: number, frontpageDate: string | null, meta: boolean, deletedDraft: boolean, postCategory: PostCategory, tagRelevance: any | null, shareWithUsers: Array<string> | null, sharingSettings: any | null, linkSharingKey: string | null, contents_latest: string | null, commentCount: number, voteCount: number, baseScore: number, extendedScore: any | null, emojiReactors: any | null, unlisted: boolean, score: number, lastVisitedAt: string | null, isFuture: boolean, isRead: boolean | null, lastCommentedAt: string, lastCommentPromotedAt: string | null, canonicalCollectionSlug: string | null, curatedDate: string | null, commentsLocked: boolean | null, commentsLockedToAccountsCreatedAfter: string | null, debate: boolean, question: boolean, hiddenRelatedQuestion: boolean, originalPostRelationSourceId: string | null, userId: string | null, location: string | null, googleLocation: any | null, onlineEvent: boolean, globalEvent: boolean, startTime: string | null, endTime: string | null, localStartTime: string | null, localEndTime: string | null, eventRegistrationLink: string | null, joinEventLink: string | null, facebookLink: string | null, meetupLink: string | null, website: string | null, contactInfo: string | null, isEvent: boolean, eventImageId: string | null, eventType: string | null, types: Array<string> | null, groupId: string | null, reviewedByUserId: string | null, suggestForCuratedUserIds: Array<string> | null, suggestForCuratedUsernames: string | null, reviewForCuratedUserId: string | null, authorIsUnreviewed: boolean, afDate: string | null, suggestForAlignmentUserIds: Array<string>, reviewForAlignmentUserId: string | null, afBaseScore: number | null, afExtendedScore: any | null, afCommentCount: number, afLastCommentedAt: string | null, afSticky: boolean, hideAuthor: boolean, moderationStyle: string | null, ignoreRateLimits: boolean | null, submitToFrontpage: boolean, shortform: boolean, onlyVisibleToLoggedIn: boolean, onlyVisibleToEstablishedAccounts: boolean, reviewCount: number, reviewVoteCount: number, positiveReviewVoteCount: number, manifoldReviewMarketId: string | null, annualReviewMarketProbability: number | null, annualReviewMarketIsResolved: boolean | null, annualReviewMarketYear: number | null, annualReviewMarketUrl: string | null, rsvpCounts: any, podcastEpisodeId: string | null, forceAllowType3Audio: boolean, nominationCount2019: number, reviewCount2019: number, votingSystem: string | null, disableRecommendation: boolean, group: { __typename?: 'Localgroup', _id: string, name: string, organizerIds: Array<string> } | null }
  & PostsMinimumInfo
);

type PostsWithVotes = (
  { __typename?: 'Post', currentUserVote: string | null, currentUserExtendedVote: any | null }
  & PostsBase
);

type PostsListWithVotes = (
  { __typename?: 'Post', currentUserVote: string | null, currentUserExtendedVote: any | null }
  & PostsList
);

type PostsListWithVotesAndSequence = (
  { __typename?: 'Post', canonicalSequence: (
    { __typename?: 'Sequence' }
    & SequencesPageFragment
  ) | null }
  & PostsListWithVotes
);

type UltraFeedPostFragment = (
  { __typename?: 'Post', autoFrontpage: string | null, votingSystem: string | null, contents: { __typename?: 'Revision', _id: string, html: string | null, htmlHighlight: string, wordCount: number, plaintextDescription: string, version: string } | null }
  & PostsDetails
  & PostsListWithVotes
);

type PostsReviewVotingList = (
  { __typename?: 'Post', reviewVoteScoreAllKarma: number, reviewVotesAllKarma: Array<number>, reviewVoteScoreHighKarma: number, reviewVotesHighKarma: Array<number>, reviewVoteScoreAF: number, reviewVotesAF: Array<number> }
  & PostsListWithVotes
);

type PostsModerationGuidelines = (
  { __typename?: 'Post', frontpageDate: string | null, moderationStyle: string | null, user: { __typename?: 'User', _id: string, displayName: string, moderationStyle: string | null } | null, moderationGuidelines: { __typename?: 'Revision', _id: string, html: string | null, originalContents: { __typename?: 'ContentType', type: string, data: any } } | null }
  & PostsMinimumInfo
);

type PostsAuthors = { __typename?: 'Post', user: (
    { __typename?: 'User', profileImageId: string | null, moderationStyle: string | null, bannedUserIds: Array<string> | null, moderatorAssistance: boolean | null, groups: Array<string> | null, banned: string | null, allCommentingDisabled: boolean | null }
    & UsersMinimumInfo
  ) | null, coauthors: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )> | null };

type PostsListBase = (
  { __typename?: 'Post', readTimeMinutes: number, rejectedReason: string | null, feedId: string | null, totalDialogueResponseCount: number, unreadDebateResponseCount: number, dialogTooltipPreview: string | null, disableSidenotes: boolean, customHighlight: { __typename?: 'Revision', _id: string, html: string | null, plaintextDescription: string } | null, lastPromotedComment: { __typename?: 'Comment', _id: string, user: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null, bestAnswer: (
    { __typename?: 'Comment' }
    & CommentsList
  ) | null, tags: Array<(
    { __typename?: 'Tag' }
    & TagBasicInfo
  )>, socialPreviewData: { __typename?: 'SocialPreviewType', _id: string, imageUrl: string } }
  & PostsBase
  & PostsAuthors
);

type PostsList = (
  { __typename?: 'Post', deletedDraft: boolean, contents: { __typename?: 'Revision', _id: string, htmlHighlight: string, plaintextDescription: string, wordCount: number, version: string } | null, fmCrosspost: { __typename?: 'CrosspostOutput', isCrosspost: boolean, hostedHere: boolean | null, foreignPostId: string | null } | null }
  & PostsListBase
);

type SunshineCurationPostsList = (
  { __typename?: 'Post', curationNotices: Array<(
    { __typename?: 'CurationNotice' }
    & CurationNoticesFragment
  )> | null }
  & PostsList
);

type PostsListTag = (
  { __typename?: 'Post', tagRel: (
    { __typename?: 'TagRel' }
    & WithVoteTagRel
  ) | null }
  & PostsList
);

type PostsListTagWithVotes = (
  { __typename?: 'Post', tagRel: (
    { __typename?: 'TagRel' }
    & WithVoteTagRel
  ) | null }
  & PostsListWithVotes
);

type PostsDetails = (
  { __typename?: 'Post', canonicalSource: string | null, noIndex: boolean, viewCount: number | null, tagRelevance: any | null, commentSortOrder: string | null, sideCommentVisibility: string | null, collectionTitle: string | null, canonicalPrevPostSlug: string | null, canonicalNextPostSlug: string | null, canonicalSequenceId: string | null, canonicalBookId: string | null, bannedUserIds: Array<string> | null, moderationStyle: string | null, currentUserVote: string | null, currentUserExtendedVote: any | null, feedLink: string | null, rsvps: Array<any> | null, activateRSVPs: boolean | null, tags: Array<(
    { __typename?: 'Tag' }
    & TagPreviewFragment
  )>, socialPreviewData: { __typename?: 'SocialPreviewType', _id: string, text: string | null, imageUrl: string }, canonicalSequence: { __typename?: 'Sequence', _id: string, title: string } | null, canonicalBook: { __typename?: 'Book', _id: string, title: string | null } | null, canonicalCollection: { __typename?: 'Collection', _id: string, title: string } | null, podcastEpisode: { __typename?: 'PodcastEpisode', _id: string, title: string, episodeLink: string, externalEpisodeId: string, podcast: { __typename?: 'Podcast', _id: string, title: string, applePodcastLink: string | null, spotifyPodcastLink: string | null } } | null, feed: (
    { __typename?: 'RSSFeed' }
    & RSSFeedMinimumInfo
  ) | null, sourcePostRelations: Array<{ __typename?: 'PostRelation', _id: string, sourcePostId: string, order: number | null, sourcePost: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null }>, targetPostRelations: Array<{ __typename?: 'PostRelation', _id: string, sourcePostId: string, targetPostId: string, order: number | null, targetPost: (
      { __typename?: 'Post' }
      & PostsListWithVotes
    ) | null }>, fmCrosspost: { __typename?: 'CrosspostOutput', isCrosspost: boolean, hostedHere: boolean | null, foreignPostId: string | null } | null, glossary: Array<(
    { __typename?: 'JargonTerm' }
    & JargonTermsPost
  )> }
  & PostsListBase
);

type PostsExpandedHighlight = { __typename?: 'Post', _id: string, contents: { __typename?: 'Revision', _id: string, html: string | null, wordCount: number } | null };

type PostsPlaintextDescription = { __typename?: 'Post', _id: string, contents: { __typename?: 'Revision', _id: string, plaintextDescription: string } | null };

type PostsRevision = (
  { __typename?: 'Post', version: string | null, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, revisions: Array<(
    { __typename?: 'Revision' }
    & RevisionMetadata
  )> | null }
  & PostsDetails
);

type PostsRevisionEdit = (
  { __typename?: 'Post', version: string | null, contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, revisions: Array<(
    { __typename?: 'Revision' }
    & RevisionMetadata
  )> | null }
  & PostsDetails
);

type PostsWithNavigationAndRevision = (
  { __typename?: 'Post', tableOfContentsRevision: any | null, customHighlight: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, reviewWinner: (
    { __typename?: 'ReviewWinner' }
    & ReviewWinnerAll
  ) | null }
  & PostsRevision
  & PostSequenceNavigation
);

type PostsWithNavigation = (
  { __typename?: 'Post', tableOfContents: any | null, reviewWinner: (
    { __typename?: 'ReviewWinner' }
    & ReviewWinnerAll
  ) | null }
  & PostsPage
  & PostSequenceNavigation
);

type PostSequenceNavigation = { __typename?: 'Post', sequence: (
    { __typename?: 'Sequence' }
    & SequencesPageFragment
  ) | null, prevPost: (
    { __typename?: 'Post', sequence: { __typename?: 'Sequence', _id: string } | null }
    & PostsListWithVotes
  ) | null, nextPost: (
    { __typename?: 'Post', sequence: { __typename?: 'Sequence', _id: string } | null }
    & PostsListWithVotes
  ) | null };

type PostsPage = (
  { __typename?: 'Post', version: string | null, myEditorAccess: string, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, customHighlight: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null }
  & PostsDetails
);

type PostsEdit = (
  { __typename?: 'Post', myEditorAccess: string, version: string | null, readTimeMinutesOverride: number | null, hideFromRecentDiscussions: boolean, hideFromPopularComments: boolean | null, tableOfContents: any | null, subforumTagId: string | null, socialPreviewImageId: string | null, generateDraftJargon: boolean | null, coauthorStatuses: Array<{ __typename?: 'CoauthorStatusOutput', userId: string, confirmed: boolean, requested: boolean }> | null, fmCrosspost: { __typename?: 'CrosspostOutput', isCrosspost: boolean, hostedHere: boolean | null, foreignPostId: string | null } | null, moderationGuidelines: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, customHighlight: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, socialPreview: { __typename?: 'SocialPreviewOutput', imageId: string, text: string | null } | null, socialPreviewData: { __typename?: 'SocialPreviewType', _id: string, imageId: string | null, text: string | null }, user: (
    { __typename?: 'User', moderationStyle: string | null, bannedUserIds: Array<string> | null, moderatorAssistance: boolean | null }
    & UsersMinimumInfo
  ) | null, usersSharedWith: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )> | null, coauthors: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )> | null }
  & PostsDetails
  & PostSideComments
);

type PostsEditQueryFragment = (
  { __typename?: 'Post', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & PostsEdit
);

type PostsEditMutationFragment = (
  { __typename?: 'Post', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & PostsEdit
);

type PostsRevisionsList = { __typename?: 'Post', _id: string, revisions: Array<(
    { __typename?: 'Revision' }
    & RevisionMetadata
  )> | null };

type PostsRecentDiscussion = (
  { __typename?: 'Post', recentComments: Array<(
    { __typename?: 'Comment' }
    & CommentsList
  )> | null }
  & PostsListWithVotes
);

type ShortformRecentDiscussion = (
  { __typename?: 'Post', recentComments: Array<(
    { __typename?: 'Comment' }
    & CommentsListWithTopLevelComment
  )> | null }
  & PostsListWithVotes
);

type UsersBannedFromPostsModerationLog = { __typename?: 'Post', title: string, slug: string, _id: string, bannedUserIds: Array<string> | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type SunshinePostsList = (
  { __typename?: 'Post', currentUserVote: string | null, currentUserExtendedVote: any | null, rejectedReason: string | null, autoFrontpage: string | null, fmCrosspost: { __typename?: 'CrosspostOutput', isCrosspost: boolean, hostedHere: boolean | null, foreignPostId: string | null } | null, contents: { __typename?: 'Revision', _id: string, html: string | null, htmlHighlight: string, wordCount: number, version: string, automatedContentEvaluations: { __typename?: 'AutomatedContentEvaluation', _id: string, score: number, aiChoice: string, aiReasoning: string, aiCoT: string, sentenceScores: Array<{ __typename?: 'SentenceScore', sentence: string, score: number }> } | null } | null, moderationGuidelines: { __typename?: 'Revision', _id: string, html: string | null } | null, user: (
    { __typename?: 'User', profileImageId: string | null, moderationStyle: string | null, bannedUserIds: Array<string> | null, moderatorAssistance: boolean | null, needsReview: boolean | null, biography: (
      { __typename?: 'Revision' }
      & RevisionDisplay
    ) | null, moderationGuidelines: { __typename?: 'Revision', _id: string, html: string | null } | null, moderatorActions: Array<(
      { __typename?: 'ModeratorAction' }
      & ModeratorActionDisplay
    )> | null }
    & UsersMinimumInfo
  ) | null }
  & PostsListBase
);

type WithVotePost = { __typename: 'Post', _id: string, currentUserVote: string | null, currentUserExtendedVote: any | null, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, voteCount: number };

type HighlightWithHash = { __typename?: 'Post', _id: string, contents: { __typename?: 'Revision', _id: string, htmlHighlightStartingAtHash: string } | null };

type PostWithDialogueMessage = { __typename?: 'Post', _id: string, dialogueMessageContents: string | null };

type PostSideComments = { __typename?: 'Post', _id: string, sideComments: any | null, sideCommentsCache: (
    { __typename?: 'SideCommentCache' }
    & SideCommentCacheMinimumInfo
  ) | null };

type PostWithGeneratedSummary = { __typename?: 'Post', _id: string, languageModelSummary: string | null };

type PostsBestOfList = (
  { __typename?: 'Post', firstVideoAttribsForPreview: any | null, podcastEpisode: { __typename?: 'PodcastEpisode', _id: string, title: string, episodeLink: string, externalEpisodeId: string, podcast: { __typename?: 'Podcast', _id: string, title: string, applePodcastLink: string | null, spotifyPodcastLink: string | null } } | null, socialPreviewData: { __typename?: 'SocialPreviewType', _id: string, text: string | null, imageUrl: string } }
  & PostsListWithVotes
);

type PostsRSSFeed = (
  { __typename?: 'Post', scoreExceeded2Date: string | null, scoreExceeded30Date: string | null, scoreExceeded45Date: string | null, scoreExceeded75Date: string | null, scoreExceeded125Date: string | null, scoreExceeded200Date: string | null, metaDate: string | null }
  & PostsPage
);

type PostsOriginalContents = { __typename?: 'Post', _id: string, contents: { __typename?: 'Revision', _id: string, originalContents: { __typename?: 'ContentType', type: string, data: any } } | null };

type PostsHTML = { __typename?: 'Post', _id: string, contents: (
    { __typename?: 'Revision' }
    & RevisionHTML
  ) | null };

type PostsForAutocomplete = { __typename?: 'Post', _id: string, title: string, userId: string | null, baseScore: number, extendedScore: any | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, contents: { __typename?: 'Revision', markdown: string | null } | null };

type PostForReviewWinnerItem = { __typename?: 'Post', _id: string, spotlight: { __typename?: 'Spotlight', _id: string } | null, reviewWinner: { __typename?: 'ReviewWinner', _id: string, category: string } | null };

type PostsTwitterAdmin = (
  { __typename?: 'Post', user: (
    { __typename?: 'User' }
    & UsersSocialMediaInfo
  ) | null, coauthors: Array<(
    { __typename?: 'User' }
    & UsersSocialMediaInfo
  )> | null }
  & PostsListWithVotes
);

type SuggestAlignmentPost = (
  { __typename?: 'Post', suggestForAlignmentUsers: Array<{ __typename?: 'User', _id: string, displayName: string }> }
  & PostsList
);

type UnclaimedReportsList = { __typename?: 'Report', _id: string, userId: string, commentId: string | null, postId: string | null, closedAt: string | null, createdAt: string, claimedUserId: string | null, link: string, description: string | null, reportedAsSpam: boolean | null, markedAsSpam: boolean | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, comment: (
    { __typename?: 'Comment', post: (
      { __typename?: 'Post' }
      & PostsMinimumInfo
    ) | null, tag: (
      { __typename?: 'Tag' }
      & TagBasicInfo
    ) | null }
    & CommentsList
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsList
  ) | null, reportedUser: (
    { __typename?: 'User' }
    & SunshineUsersList
  ) | null, claimedUser: { __typename?: 'User', _id: string, displayName: string, username: string | null, slug: string } | null };

type reviewVoteFragment = { __typename?: 'ReviewVote', _id: string, createdAt: string, userId: string, postId: string, qualitativeScore: number, quadraticScore: number, comment: string | null, year: string, dummy: boolean, reactions: Array<string> | null };

type reviewVoteWithUserAndPost = (
  { __typename?: 'ReviewVote', user: (
    { __typename?: 'User', email: string | null, emails: Array<any> | null }
    & UsersMinimumInfo
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsMinimumInfo
  ) | null }
  & reviewVoteFragment
);

type reviewAdminDashboard = { __typename?: 'ReviewVote', _id: string, createdAt: string, userId: string, user: { __typename?: 'User', _id: string, displayName: string, karma: number } | null };

type ReviewWinnerArtImages = { __typename?: 'ReviewWinnerArt', _id: string, postId: string, splashArtImagePrompt: string, splashArtImageUrl: string, activeSplashArtCoordinates: (
    { __typename?: 'SplashArtCoordinate' }
    & SplashArtCoordinatesEdit
  ) | null };

type ReviewWinnerEditDisplay = { __typename?: 'ReviewWinner', _id: string, postId: string, reviewYear: number, curatedOrder: number | null, reviewRanking: number };

type ReviewWinnerTopPostsDisplay = { __typename?: 'ReviewWinner', _id: string, postId: string, reviewYear: number, curatedOrder: number | null, reviewRanking: number, post: (
    { __typename?: 'Post' }
    & PostsTopItemInfo
  ) | null };

type ReviewWinnerAll = { __typename?: 'ReviewWinner', _id: string, category: string, curatedOrder: number | null, postId: string, reviewYear: number, reviewRanking: number, competitorCount: number | null, reviewWinnerArt: (
    { __typename?: 'ReviewWinnerArt' }
    & ReviewWinnerArtImages
  ) | null };

type ReviewWinnerTopPostsPage = { __typename?: 'ReviewWinner', _id: string, category: string, curatedOrder: number | null, reviewYear: number, reviewRanking: number, reviewWinnerArt: { __typename?: 'ReviewWinnerArt', splashArtImageUrl: string, activeSplashArtCoordinates: (
      { __typename?: 'SplashArtCoordinate' }
      & SplashArtCoordinatesEdit
    ) | null } | null };

type ReviewWinnerAnnouncement = { __typename?: 'ReviewWinner', _id: string, category: string, curatedOrder: number | null, reviewYear: number, reviewRanking: number, competitorCount: number | null, postId: string, post: { __typename?: 'Post', _id: string, title: string, slug: string } | null };

type RevisionDisplay = { __typename?: 'Revision', _id: string, version: string, updateType: string | null, editedAt: string, userId: string | null, html: string | null, commitMessage: string | null, wordCount: number, htmlHighlight: string, plaintextDescription: string };

type RevisionHTML = { __typename?: 'Revision', _id: string, html: string | null };

type RevisionEdit = (
  { __typename?: 'Revision', markdown: string | null, ckEditorMarkup: string | null, originalContents: { __typename?: 'ContentType', type: string, data: any } }
  & RevisionDisplay
);

type RevisionMetadata = { __typename?: 'Revision', _id: string, version: string, editedAt: string, commitMessage: string | null, userId: string | null, score: number, baseScore: number, extendedScore: any | null, voteCount: number, currentUserVote: string | null, currentUserExtendedVote: any | null };

type RevisionMetadataWithChangeMetrics = (
  { __typename?: 'Revision', changeMetrics: any, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null }
  & RevisionMetadata
);

type RevisionHistoryEntry = (
  { __typename?: 'Revision', documentId: string | null, collectionName: string | null, changeMetrics: any, legacyData: any | null, skipAttributions: boolean, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null }
  & RevisionMetadata
);

type RevisionHistorySummaryEdit = (
  { __typename?: 'Revision', summary: (
    { __typename?: 'MultiDocument', parentTag: { __typename?: 'Tag', _id: string, name: string } | null, parentLens: { __typename?: 'MultiDocument', _id: string, title: string | null, tabTitle: string, tabSubtitle: string | null } | null }
    & MultiDocumentMinimumInfo
  ) | null }
  & RevisionHistoryEntry
);

type RevisionTagFragment = (
  { __typename?: 'Revision', tag: (
    { __typename?: 'Tag' }
    & TagHistoryFragment
  ) | null, lens: (
    { __typename?: 'MultiDocument' }
    & MultiDocumentParentDocument
  ) | null }
  & RevisionHistoryEntry
);

type RecentDiscussionRevisionTagFragment = (
  { __typename?: 'Revision', tag: (
    { __typename?: 'Tag' }
    & TagRecentDiscussion
  ) | null }
  & RevisionHistoryEntry
);

type WithVoteRevision = { __typename: 'Revision', _id: string, currentUserVote: string | null, currentUserExtendedVote: any | null, baseScore: number, extendedScore: any | null, score: number, voteCount: number };

type RSSFeedMinimumInfo = { __typename?: 'RSSFeed', _id: string, userId: string, createdAt: string, ownedByUser: boolean, displayFullContent: boolean, nickname: string, url: string, importAsDraft: boolean, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type newRSSFeedFragment = { __typename?: 'RSSFeed', _id: string, userId: string, createdAt: string, ownedByUser: boolean, displayFullContent: boolean, nickname: string, url: string, status: string | null, importAsDraft: boolean };

type RSSFeedMutationFragment = { __typename?: 'RSSFeed', _id: string, userId: string, ownedByUser: boolean, displayFullContent: boolean, nickname: string, url: string, importAsDraft: boolean };

type SequencesPageTitleFragment = { __typename?: 'Sequence', _id: string, title: string, canonicalCollectionSlug: string | null, canonicalCollection: { __typename?: 'Collection', _id: string, title: string } | null };

type SequencesPageFragment = (
  { __typename?: 'Sequence', createdAt: string, userId: string, gridImageId: string | null, bannerImageId: string | null, canonicalCollectionSlug: string | null, draft: boolean, isDeleted: boolean, hidden: boolean, hideFromAuthorPage: boolean, noindex: boolean, curatedOrder: number | null, userProfileOrder: number | null, af: boolean, postsCount: number, readPostsCount: number, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, contents: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null }
  & SequencesPageTitleFragment
);

type SequenceContinueReadingFragment = { __typename?: 'Sequence', _id: string, title: string, gridImageId: string | null, canonicalCollectionSlug: string | null };

type SequencesPageWithChaptersFragment = (
  { __typename?: 'Sequence', chapters: Array<(
    { __typename?: 'Chapter' }
    & ChaptersFragment
  )> }
  & SequencesPageFragment
);

type SequencesEdit = (
  { __typename?: 'Sequence', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & SequencesPageFragment
);

type SideCommentCacheMinimumInfo = { __typename?: 'SideCommentCache', _id: string, postId: string | null, annotatedHtml: string | null, commentsByBlock: any | null, version: number | null, createdAt: string };

type SplashArtCoordinates = { __typename?: 'SplashArtCoordinate', _id: string, reviewWinnerArtId: string | null, leftXPct: number, leftYPct: number, leftHeightPct: number, leftWidthPct: number, leftFlipped: boolean, middleXPct: number, middleYPct: number, middleHeightPct: number, middleWidthPct: number, middleFlipped: boolean, rightXPct: number, rightYPct: number, rightHeightPct: number, rightWidthPct: number, rightFlipped: boolean };

type SplashArtCoordinatesEdit = (
  { __typename?: 'SplashArtCoordinate', createdAt: string }
  & SplashArtCoordinates
);

type SpotlightMinimumInfo = { __typename?: 'Spotlight', _id: string, documentId: string, documentType: SpotlightDocumentType, spotlightImageId: string | null, spotlightDarkImageId: string | null, spotlightSplashImageUrl: string | null, draft: boolean, deletedDraft: boolean, position: number, lastPromotedAt: string, customTitle: string | null, customSubtitle: string | null, subtitleUrl: string | null, headerTitle: string | null, headerTitleLeftColor: string | null, headerTitleRightColor: string | null, duration: number, showAuthor: boolean, imageFade: boolean, imageFadeColor: string | null };

type SpotlightReviewWinner = (
  { __typename?: 'Spotlight', description: { __typename?: 'Revision', html: string | null } | null, sequenceChapters: Array<(
    { __typename?: 'Chapter' }
    & ChaptersFragment
  )> | null }
  & SpotlightMinimumInfo
);

type SpotlightHeaderEventSubtitle = (
  { __typename?: 'Spotlight', post: { __typename?: 'Post', _id: string, slug: string } | null, sequence: { __typename?: 'Sequence', _id: string } | null, tag: { __typename?: 'Tag', _id: string, slug: string } | null }
  & SpotlightMinimumInfo
);

type SpotlightDisplay = (
  { __typename?: 'Spotlight', post: (
    { __typename?: 'Post', user: { __typename?: 'User', _id: string, displayName: string, slug: string } | null, reviews: Array<(
      { __typename?: 'Comment' }
      & CommentsList
    )> | null }
    & PostsMinimumInfo
  ) | null, sequence: { __typename?: 'Sequence', _id: string, title: string, user: { __typename?: 'User', _id: string, displayName: string, slug: string } | null } | null, tag: { __typename?: 'Tag', _id: string, name: string, slug: string, user: { __typename?: 'User', _id: string, displayName: string, slug: string } | null } | null, sequenceChapters: Array<(
    { __typename?: 'Chapter' }
    & ChaptersFragment
  )> | null, description: { __typename?: 'Revision', html: string | null } | null }
  & SpotlightMinimumInfo
);

type SpotlightEditQueryFragment = (
  { __typename?: 'Spotlight', description: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & SpotlightMinimumInfo
);

type SubscriptionState = { __typename?: 'Subscription', _id: string, userId: string | null, createdAt: string, state: string | null, documentId: string | null, collectionName: string | null, deleted: boolean | null, type: string | null };

type MembersOfGroupFragment = { __typename?: 'Subscription', user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type SurveyQuestionMinimumInfo = { __typename?: 'SurveyQuestion', _id: string, question: string, format: SurveyQuestionFormat, order: number };

type SurveyResponseMinimumInfo = { __typename?: 'SurveyResponse', _id: string, surveyId: string | null, surveyScheduleId: string | null, userId: string | null, clientId: string | null, response: any | null };

type SurveyScheduleMinimumInfo = { __typename?: 'SurveySchedule', _id: string, survey: (
    { __typename?: 'Survey' }
    & SurveyMinimumInfo
  ) | null };

type SurveyScheduleEdit = (
  { __typename?: 'SurveySchedule', surveyId: string, name: string | null, impressionsLimit: number | null, maxVisitorPercentage: number | null, minKarma: number | null, maxKarma: number | null, target: SurveyScheduleTarget | null, startDate: string | null, endDate: string | null, deactivated: boolean | null, createdAt: string }
  & SurveyScheduleMinimumInfo
);

type SurveyMinimumInfo = { __typename?: 'Survey', _id: string, name: string, createdAt: string, questions: Array<(
    { __typename?: 'SurveyQuestion' }
    & SurveyQuestionMinimumInfo
  )> };

type TagFlagFragment = { __typename?: 'TagFlag', _id: string, createdAt: string, name: string, slug: string, order: number | null, deleted: boolean, contents: { __typename?: 'Revision', html: string | null, htmlHighlight: string, plaintextDescription: string } | null };

type TagFlagEditFragment = (
  { __typename?: 'TagFlag', contents: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & TagFlagFragment
);

type TagRelBasicInfo = { __typename?: 'TagRel', _id: string, score: number, baseScore: number, extendedScore: any | null, afBaseScore: number | null, voteCount: number, tagId: string, postId: string, autoApplied: boolean };

type TagRelFragment = (
  { __typename?: 'TagRel', currentUserVote: string | null, currentUserExtendedVote: any | null, currentUserCanVote: boolean, tag: (
    { __typename?: 'Tag' }
    & TagPreviewFragment
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsList
  ) | null }
  & TagRelBasicInfo
);

type TagRelHistoryFragment = (
  { __typename?: 'TagRel', createdAt: string, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsList
  ) | null }
  & TagRelBasicInfo
);

type TagRelCreationFragment = (
  { __typename?: 'TagRel', currentUserVote: string | null, currentUserExtendedVote: any | null, tag: (
    { __typename?: 'Tag' }
    & TagPreviewFragment
  ) | null, post: (
    { __typename?: 'Post', tagRelevance: any | null, tagRel: (
      { __typename?: 'TagRel' }
      & WithVoteTagRel
    ) | null }
    & PostsList
  ) | null }
  & TagRelBasicInfo
);

type TagRelMinimumFragment = (
  { __typename?: 'TagRel', currentUserVote: string | null, currentUserExtendedVote: any | null, currentUserCanVote: boolean, tag: (
    { __typename?: 'Tag' }
    & TagPreviewFragment
  ) | null }
  & TagRelBasicInfo
);

type WithVoteTagRel = { __typename: 'TagRel', _id: string, score: number, baseScore: number, extendedScore: any | null, afBaseScore: number | null, voteCount: number, currentUserVote: string | null, currentUserExtendedVote: any | null };

type TagBasicInfo = { __typename?: 'Tag', _id: string, userId: string | null, name: string, shortName: string | null, slug: string, core: boolean, postCount: number, adminOnly: boolean, canEditUserIds: Array<string> | null, suggestedAsFilter: boolean, needsReview: boolean, descriptionTruncationCount: number, createdAt: string, wikiOnly: boolean, deleted: boolean, isSubforum: boolean, noindex: boolean, isArbitalImport: boolean | null, isPlaceholderPage: boolean, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, voteCount: number, currentUserVote: string | null, currentUserExtendedVote: any | null };

type TagDetailsFragment = (
  { __typename?: 'Tag', subtitle: string | null, oldSlugs: Array<string>, isRead: boolean | null, defaultOrder: number, reviewedByUserId: string | null, wikiGrade: number, subforumModeratorIds: Array<string>, bannerImageId: string | null, squareImageId: string | null, lesswrongWikiImportSlug: string | null, lesswrongWikiImportRevision: string | null, subforumModerators: Array<(
    { __typename?: 'User' }
    & UsersMinimumInfo
  )>, moderationGuidelines: { __typename?: 'Revision', _id: string, html: string | null } | null, sequence: (
    { __typename?: 'Sequence' }
    & SequencesPageFragment
  ) | null }
  & TagBasicInfo
);

type TagFragment = (
  { __typename?: 'Tag', canVoteOnRels: Array<TagRelVoteGroup> | null, parentTag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, subTags: Array<(
    { __typename?: 'Tag' }
    & TagBasicInfo
  )>, description: { __typename?: 'Revision', _id: string, html: string | null, htmlHighlight: string, plaintextDescription: string, version: string, editedAt: string } | null }
  & TagDetailsFragment
);

type TagHistoryFragment = (
  { __typename?: 'Tag', textLastUpdatedAt: string | null, tableOfContents: any | null, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, lensesIncludingDeleted: Array<(
    { __typename?: 'MultiDocument' }
    & MultiDocumentContentDisplay
  )> }
  & TagFragment
);

type TagCreationHistoryFragment = (
  { __typename?: 'Tag', user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null, description: { __typename?: 'Revision', html: string | null } | null }
  & TagFragment
);

type TagRevisionFragment = (
  { __typename?: 'Tag', isRead: boolean | null, parentTag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, subTags: Array<(
    { __typename?: 'Tag' }
    & TagBasicInfo
  )>, description: { __typename?: 'Revision', _id: string, version: string, html: string | null, htmlHighlight: string, plaintextDescription: string, editedAt: string, user: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null }
  & TagDetailsFragment
);

type TagPreviewFragment = (
  { __typename?: 'Tag', isRead: boolean | null, canVoteOnRels: Array<TagRelVoteGroup> | null, isArbitalImport: boolean | null, parentTag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, subTags: Array<(
    { __typename?: 'Tag' }
    & TagBasicInfo
  )>, description: { __typename?: 'Revision', _id: string, htmlHighlight: string } | null }
  & TagBasicInfo
);

type TagSectionPreviewFragment = (
  { __typename?: 'Tag', isRead: boolean | null, canVoteOnRels: Array<TagRelVoteGroup> | null, parentTag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, subTags: Array<(
    { __typename?: 'Tag' }
    & TagBasicInfo
  )>, description: { __typename?: 'Revision', _id: string, htmlHighlightStartingAtHash: string } | null }
  & TagBasicInfo
);

type TagSubforumFragment = (
  { __typename?: 'Tag', subforumModeratorIds: Array<string>, tableOfContents: any | null, subforumWelcomeText: { __typename?: 'Revision', _id: string, html: string | null } | null }
  & TagPreviewFragment
);

type TagSubtagFragment = { __typename?: 'Tag', _id: string, subforumModeratorIds: Array<string>, subTags: Array<(
    { __typename?: 'Tag' }
    & TagPreviewFragment
  )> };

type TagSubforumSidebarFragment = (
  { __typename?: 'Tag' }
  & TagBasicInfo
);

type TagDetailedPreviewFragment = (
  { __typename?: 'Tag', description: { __typename?: 'Revision', _id: string, htmlHighlight: string } | null }
  & TagDetailsFragment
);

type TagWithFlagsFragment = (
  { __typename?: 'Tag', tagFlagsIds: Array<string>, tagFlags: Array<(
    { __typename?: 'TagFlag' }
    & TagFlagFragment
  )> }
  & TagFragment
);

type TagWithFlagsAndRevisionFragment = (
  { __typename?: 'Tag', tagFlagsIds: Array<string>, tagFlags: Array<(
    { __typename?: 'TagFlag' }
    & TagFlagFragment
  )> }
  & TagRevisionFragment
);

type ArbitalLinkedPagesFragment = { __typename?: 'ArbitalLinkedPages', faster: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, slower: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, moreTechnical: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, lessTechnical: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, requirements: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, teaches: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, parents: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }>, children: Array<{ __typename?: 'ArbitalLinkedPage', _id: string, name: string, slug: string }> };

type TagPageArbitalContentFragment = { __typename?: 'Tag', lenses: Array<(
    { __typename?: 'MultiDocument' }
    & MultiDocumentWithContributors
  )>, arbitalLinkedPages: (
    { __typename?: 'ArbitalLinkedPages' }
    & ArbitalLinkedPagesFragment
  ) | null };

type TagPageFragment = (
  { __typename?: 'Tag', tableOfContents: any | null, postsDefaultSortOrder: string | null, canVoteOnRels: Array<TagRelVoteGroup> | null, forceAllowType3Audio: boolean, textLastUpdatedAt: string | null, subforumIntroPost: (
    { __typename?: 'Post' }
    & PostsListWithVotes
  ) | null, subforumWelcomeText: { __typename?: 'Revision', _id: string, html: string | null } | null, contributors: { __typename?: 'TagContributorsList', totalCount: number, contributors: Array<{ __typename?: 'TagContributor', contributionScore: number, currentAttributionCharCount: number | null, numCommits: number, voteCount: number, user: (
        { __typename?: 'User' }
        & UsersMinimumInfo
      ) | null }> } }
  & TagWithFlagsFragment
);

type TagPageWithArbitalContentFragment = (
  { __typename?: 'Tag' }
  & TagPageFragment
  & TagPageArbitalContentFragment
);

type AllTagsPageFragment = (
  { __typename?: 'Tag', tableOfContents: any | null }
  & TagWithFlagsFragment
);

type TagPageWithRevisionFragment = (
  { __typename?: 'Tag', tableOfContents: any | null, textLastUpdatedAt: string | null, postsDefaultSortOrder: string | null, canVoteOnRels: Array<TagRelVoteGroup> | null, forceAllowType3Audio: boolean, subforumIntroPost: (
    { __typename?: 'Post' }
    & PostsListWithVotes
  ) | null, subforumWelcomeText: { __typename?: 'Revision', _id: string, html: string | null } | null, contributors: { __typename?: 'TagContributorsList', totalCount: number, contributors: Array<{ __typename?: 'TagContributor', contributionScore: number, currentAttributionCharCount: number | null, numCommits: number, voteCount: number, user: (
        { __typename?: 'User' }
        & UsersMinimumInfo
      ) | null }> } }
  & TagWithFlagsAndRevisionFragment
);

type TagPageRevisionWithArbitalContentFragment = (
  { __typename?: 'Tag' }
  & TagPageWithRevisionFragment
  & TagPageArbitalContentFragment
);

type TagFullContributorsList = { __typename?: 'Tag', contributors: { __typename?: 'TagContributorsList', totalCount: number, contributors: Array<{ __typename?: 'TagContributor', contributionScore: number, currentAttributionCharCount: number | null, numCommits: number, voteCount: number, user: (
        { __typename?: 'User' }
        & UsersMinimumInfo
      ) | null }> } };

type TagEditFragment = (
  { __typename?: 'Tag', isPostType: boolean, parentTagId: string | null, subforumIntroPostId: string | null, tagFlagsIds: Array<string>, postsDefaultSortOrder: string | null, introSequenceId: string | null, canVoteOnRels: Array<TagRelVoteGroup> | null, autoTagModel: string | null, autoTagPrompt: string | null, parentTag: (
    { __typename?: 'Tag' }
    & TagBasicInfo
  ) | null, description: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, subforumWelcomeText: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, moderationGuidelines: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & TagDetailsFragment
);

type TagRecentDiscussion = (
  { __typename?: 'Tag', lastVisitedAt: string | null, recentComments: Array<(
    { __typename?: 'Comment' }
    & CommentsList
  )> }
  & TagFragment
);

type SunshineTagFragment = (
  { __typename?: 'Tag', user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null }
  & TagFragment
);

type UserOnboardingTag = { __typename?: 'Tag', _id: string, name: string, slug: string, bannerImageId: string | null, squareImageId: string | null };

type TagName = { __typename?: 'Tag', _id: string, name: string, slug: string };

type ExplorePageTagFragment = (
  { __typename?: 'Tag', legacyData: any | null, contributors: { __typename?: 'TagContributorsList', totalCount: number, contributors: Array<{ __typename?: 'TagContributor', contributionScore: number, currentAttributionCharCount: number | null, numCommits: number, voteCount: number, user: (
        { __typename?: 'User' }
        & UsersMinimumInfo
      ) | null }> } }
  & TagFragment
);

type ConceptItemFragment = { __typename?: 'Tag', _id: string, core: boolean, name: string, slug: string, oldSlugs: Array<string>, postCount: number, baseScore: number, wikiOnly: boolean, isArbitalImport: boolean | null, coreTagId: string | null, maxScore: number | null, description: { __typename?: 'Revision', _id: string, wordCount: number } | null, usersWhoLiked: Array<{ __typename?: 'UserLikingTag', _id: string, displayName: string }> };

type TagPageWithArbitalContentAndLensRevisionFragment = (
  { __typename?: 'Tag', arbitalLinkedPages: (
    { __typename?: 'ArbitalLinkedPages' }
    & ArbitalLinkedPagesFragment
  ) | null, lenses: Array<(
    { __typename?: 'MultiDocument' }
    & MultiDocumentWithContributorsRevision
  )> }
  & TagPageFragment
);

type WithVoteTag = (
  { __typename?: 'Tag' }
  & TagBasicInfo
);

type TypingIndicatorInfo = { __typename?: 'TypingIndicator', _id: string, userId: string | null, documentId: string | null, lastUpdated: string | null };

type UserEAGDetailsMinimumInfo = { __typename?: 'UserEAGDetail', _id: string, userId: string | null, createdAt: string, lastUpdated: string | null, careerStage: Array<string> | null, countryOrRegion: string | null, nearestCity: string | null, willingnessToRelocate: any | null, experiencedIn: Array<string> | null, interestedIn: Array<string> | null };

type UserJobAdsMinimumInfo = { __typename?: 'UserJobAd', _id: string, userId: string | null, createdAt: string, lastUpdated: string | null, jobName: string | null, adState: string | null, reminderSetAt: string | null };

type UserMostValuablePostInfo = { __typename?: 'UserMostValuablePost', _id: string, userId: string | null, postId: string | null, deleted: boolean | null };

type UserRateLimitDisplay = { __typename?: 'UserRateLimit', _id: string, userId: string, type: UserRateLimitType, actionsPerInterval: number, intervalUnit: UserRateLimitIntervalUnit, intervalLength: number, createdAt: string, endedAt: string, user: (
    { __typename?: 'User' }
    & UsersMinimumInfo
  ) | null };

type UserTagRelDetails = { __typename?: 'UserTagRel', _id: string, userId: string, tagId: string, subforumShowUnreadInSidebar: boolean | null, subforumEmailNotifications: boolean | null, subforumHideIntroPost: boolean | null };

type UsersMinimumInfo = { __typename?: 'User', _id: string, slug: string, createdAt: string, username: string | null, displayName: string, profileImageId: string | null, previousDisplayName: string | null, fullName: string | null, karma: number, afKarma: number, deleted: boolean, isAdmin: boolean, htmlBio: string, jobTitle: string | null, organization: string | null, postCount: number, commentCount: number, sequenceCount: number, afPostCount: number, afCommentCount: number, spamRiskScore: number, tagRevisionCount: number, reviewedByUserId: string | null };

type UsersProfile = (
  { __typename?: 'User', oldSlugs: Array<string>, groups: Array<string> | null, jobTitle: string | null, organization: string | null, careerStage: Array<string> | null, profileTagIds: Array<string>, organizerOfGroupIds: Array<string>, programParticipation: Array<string> | null, website: string | null, linkedinProfileURL: string | null, facebookProfileURL: string | null, blueskyProfileURL: string | null, twitterProfileURL: string | null, githubProfileURL: string | null, frontpagePostCount: number, afSequenceCount: number, afSequenceDraftCount: number, sequenceDraftCount: number, moderationStyle: string | null, bannedUserIds: Array<string> | null, location: string | null, googleLocation: any | null, mapLocation: any | null, mapLocationSet: boolean | null, mapMarkerText: string | null, htmlMapMarkerText: string | null, mongoLocation: any | null, shortformFeedId: string | null, viewUnreviewedComments: boolean | null, auto_subscribe_to_my_posts: boolean, auto_subscribe_to_my_comments: boolean, autoSubscribeAsOrganizer: boolean, petrovPressedButtonDate: string | null, petrovOptOut: boolean, sortDraftsBy: string | null, email: string | null, emails: Array<any> | null, banned: string | null, noindex: boolean, paymentEmail: string | null, paymentInfo: string | null, goodHeartTokens: number | null, postingDisabled: boolean | null, allCommentingDisabled: boolean | null, commentingOnOtherUsersDisabled: boolean | null, conversationsDisabled: boolean | null, biography: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, howOthersCanHelpMe: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, howICanHelpOthers: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null, profileTags: Array<(
    { __typename?: 'Tag' }
    & TagPreviewFragment
  )>, organizerOfGroups: Array<(
    { __typename?: 'Localgroup' }
    & localGroupsBase
  )>, moderationGuidelines: (
    { __typename?: 'Revision' }
    & RevisionDisplay
  ) | null }
  & UsersMinimumInfo
  & SharedUserBooleans
);

type UsersCurrent = (
  { __typename?: 'User', beta: boolean | null, email: string | null, services: any | null, acceptedTos: boolean | null, pageUrl: string | null, banned: string | null, isReviewed: boolean | null, nullifyVotes: boolean | null, hideIntercom: boolean, hideNavigationSidebar: boolean | null, hideCommunitySection: boolean, hidePostsRecommendations: boolean, currentFrontpageFilter: string | null, frontpageSelectedTab: string | null, frontpageFilterSettings: any | null, hideFrontpageFilterSettingsDesktop: boolean | null, allPostsTimeframe: string | null, allPostsSorting: string | null, allPostsFilter: string | null, allPostsShowLowKarma: boolean | null, allPostsIncludeEvents: boolean | null, allPostsHideCommunity: boolean | null, allPostsOpenSettings: boolean | null, draftsListSorting: string | null, draftsListShowArchived: boolean | null, draftsListShowShared: boolean | null, lastNotificationsCheck: string | null, bannedUserIds: Array<string> | null, bannedPersonalUserIds: Array<string> | null, moderationStyle: string | null, noKibitz: boolean | null, showHideKarmaOption: boolean | null, markDownPostEditor: boolean, hideElicitPredictions: boolean | null, hideAFNonMemberInitialWarning: boolean | null, commentSorting: string | null, location: string | null, googleLocation: any | null, mongoLocation: any | null, mapLocation: any | null, mapLocationSet: boolean | null, mapMarkerText: string | null, htmlMapMarkerText: string | null, nearbyEventsNotifications: boolean, nearbyEventsNotificationsLocation: any | null, nearbyEventsNotificationsRadius: number | null, nearbyPeopleNotificationThreshold: number | null, hideFrontpageMap: boolean | null, emailSubscribedToCurated: boolean | null, subscribedToDigest: boolean | null, subscribedToNewsletter: boolean | null, unsubscribeFromAll: boolean | null, emails: Array<any> | null, whenConfirmationEmailSent: string | null, hideSubscribePoke: boolean | null, hideMeetupsPoke: boolean | null, hideHomeRHS: boolean | null, noCollapseCommentsFrontpage: boolean, noCollapseCommentsPosts: boolean, noSingleLineComments: boolean, showCommunityInRecentDiscussion: boolean, karmaChangeNotifierSettings: any | null, karmaChangeLastOpened: string | null, shortformFeedId: string | null, viewUnreviewedComments: boolean | null, recommendationSettings: any | null, theme: any | null, auto_subscribe_to_my_posts: boolean, auto_subscribe_to_my_comments: boolean, autoSubscribeAsOrganizer: boolean, noExpandUnreadCommentsReview: boolean, reviewVotesQuadratic: boolean | null, reviewVotesQuadratic2019: boolean | null, reviewVotesQuadratic2020: boolean | null, hideTaggingProgressBar: boolean | null, hideFrontpageBookAd: boolean | null, hideFrontpageBook2019Ad: boolean | null, abTestKey: string | null, abTestOverrides: any | null, sortDraftsBy: string | null, reactPaletteStyle: ReactPaletteStyle | null, petrovPressedButtonDate: string | null, petrovLaunchCodeDate: string | null, petrovOptOut: boolean, lastUsedTimezone: string | null, acknowledgedNewUserGuidelines: boolean | null, notificationSubforumUnread: any | null, subforumPreferredLayout: SubforumPreferredLayout | null, hideJobAdUntil: string | null, criticismTipsDismissed: boolean | null, allowDatadogSessionReplay: boolean, hideFrontpageBook2020Ad: boolean | null, hideDialogueFacilitation: boolean | null, optedInToDialogueFacilitation: boolean | null, revealChecksToAdmins: boolean | null, notificationNewDialogueChecks: any | null, notificationYourTurnMatchForm: any | null, showDialoguesList: boolean | null, showMyDialogues: boolean | null, showMatches: boolean | null, showRecommendedPartners: boolean | null, hideActiveDialogueUsers: boolean | null, hideSunshineSidebar: boolean | null, optedOutOfSurveys: boolean | null, postGlossariesPinned: boolean | null, generateJargonForDrafts: boolean | null, generateJargonForPublishedPosts: boolean | null, expandedFrontpageSections: { __typename?: 'ExpandedFrontpageSectionsSettingsOutput', community: boolean | null, recommendations: boolean | null, quickTakes: boolean | null, quickTakesCommunity: boolean | null, popularComments: boolean | null } | null, bookmarkedPostsMetadata: Array<{ __typename?: 'PostMetadataOutput', postId: string }> | null, hiddenPostsMetadata: Array<{ __typename?: 'PostMetadataOutput', postId: string }> | null }
  & UsersProfile
  & SharedUserBooleans
);

type UsersCurrentCommentRateLimit = { __typename?: 'User', _id: string, rateLimitNextAbleToComment: any | null };

type UsersCurrentPostRateLimit = { __typename?: 'User', _id: string, rateLimitNextAbleToPost: any | null };

type UserBookmarkedPosts = { __typename?: 'User', _id: string, bookmarkedPosts: Array<(
    { __typename?: 'Post' }
    & PostsList
  )> | null };

type UserKarmaChanges = { __typename?: 'User', _id: string, karmaChanges: { __typename?: 'KarmaChanges', totalChange: number, updateFrequency: string, startDate: string | null, endDate: string | null, nextBatchDate: string | null, posts: Array<{ __typename?: 'PostKarmaChange', _id: string, scoreChange: number, postId: string, title: string | null, slug: string, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, comments: Array<{ __typename?: 'CommentKarmaChange', _id: string, scoreChange: number, commentId: string | null, description: string | null, postId: string | null, postTitle: string | null, postSlug: string | null, tagSlug: string | null, tagName: string | null, tagCommentType: TagCommentType | null, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, tagRevisions: Array<{ __typename?: 'RevisionsKarmaChange', _id: string, scoreChange: number, tagId: string | null, tagSlug: string | null, tagName: string | null, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, todaysKarmaChanges: { __typename?: 'KarmaChangesSimple', posts: Array<{ __typename?: 'PostKarmaChange', _id: string, scoreChange: number, postId: string, title: string | null, slug: string, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, comments: Array<{ __typename?: 'CommentKarmaChange', _id: string, scoreChange: number, commentId: string | null, description: string | null, postId: string | null, postTitle: string | null, postSlug: string | null, tagSlug: string | null, tagName: string | null, tagCommentType: TagCommentType | null, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, tagRevisions: Array<{ __typename?: 'RevisionsKarmaChange', _id: string, scoreChange: number, tagId: string | null, tagSlug: string | null, tagName: string | null, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }> } | null, thisWeeksKarmaChanges: { __typename?: 'KarmaChangesSimple', posts: Array<{ __typename?: 'PostKarmaChange', _id: string, scoreChange: number, postId: string, title: string | null, slug: string, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, comments: Array<{ __typename?: 'CommentKarmaChange', _id: string, scoreChange: number, commentId: string | null, description: string | null, postId: string | null, postTitle: string | null, postSlug: string | null, tagSlug: string | null, tagName: string | null, tagCommentType: TagCommentType | null, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }>, tagRevisions: Array<{ __typename?: 'RevisionsKarmaChange', _id: string, scoreChange: number, tagId: string | null, tagSlug: string | null, tagName: string | null, eaAddedReacts: any | null, collectionName: string, addedReacts: Array<{ __typename?: 'ReactionChange', reactionType: string, userId: string | null }> | null }> } | null } | null };

type UsersBannedFromUsersModerationLog = { __typename?: 'User', _id: string, slug: string, displayName: string, bannedUserIds: Array<string> | null, bannedPersonalUserIds: Array<string> | null };

type SunshineUsersList = (
  { __typename?: 'User', karma: number, htmlBio: string, website: string | null, createdAt: string, email: string | null, emails: Array<any> | null, commentCount: number, maxCommentCount: number, postCount: number, maxPostCount: number, voteCount: number | null, smallUpvoteCount: number | null, bigUpvoteCount: number | null, smallDownvoteCount: number | null, bigDownvoteCount: number | null, banned: string | null, reviewedByUserId: string | null, reviewedAt: string | null, signUpReCaptchaRating: number | null, mapLocation: any | null, needsReview: boolean | null, sunshineNotes: string | null, sunshineFlagged: boolean | null, postingDisabled: boolean | null, allCommentingDisabled: boolean | null, commentingOnOtherUsersDisabled: boolean | null, conversationsDisabled: boolean | null, snoozedUntilContentCount: number | null, nullifyVotes: boolean | null, deleteContent: boolean | null, usersContactedBeforeReview: Array<string> | null, altAccountsDetected: boolean | null, voteReceivedCount: number | null, smallUpvoteReceivedCount: number | null, bigUpvoteReceivedCount: number | null, smallDownvoteReceivedCount: number | null, bigDownvoteReceivedCount: number | null, recentKarmaInfo: any | null, lastNotificationsCheck: string | null, moderatorActions: Array<(
    { __typename?: 'ModeratorAction' }
    & ModeratorActionDisplay
  )> | null, associatedClientIds: Array<{ __typename?: 'ClientId', clientId: string | null, firstSeenReferrer: string | null, firstSeenLandingPage: string | null, userIds: Array<string> | null }> | null }
  & UsersMinimumInfo
);

type UserAltAccountsFragment = (
  { __typename?: 'User', IPs: Array<string> | null }
  & SunshineUsersList
);

type SharedUserBooleans = { __typename?: 'User', taggingDashboardCollapsed: boolean | null, usernameUnset: boolean | null };

type UsersMapEntry = { __typename?: 'User', _id: string, displayName: string, username: string | null, fullName: string | null, slug: string, mapLocationSet: boolean | null, htmlMapMarkerText: string | null, mapLocationLatLng: { __typename?: 'LatLng', lat: number, lng: number } | null };

type UsersEdit = (
  { __typename?: 'User', markDownPostEditor: boolean, hideElicitPredictions: boolean | null, hideAFNonMemberInitialWarning: boolean | null, hideIntercom: boolean, commentSorting: string | null, currentFrontpageFilter: string | null, noCollapseCommentsPosts: boolean, noCollapseCommentsFrontpage: boolean, noSingleLineComments: boolean, hideCommunitySection: boolean, showCommunityInRecentDiscussion: boolean, hidePostsRecommendations: boolean, beta: boolean | null, theme: any | null, email: string | null, whenConfirmationEmailSent: string | null, emailSubscribedToCurated: boolean | null, subscribedToDigest: boolean | null, subscribedToNewsletter: boolean | null, unsubscribeFromAll: boolean | null, hasAuth0Id: boolean | null, moderatorAssistance: boolean | null, collapseModerationGuidelines: boolean | null, bannedUserIds: Array<string> | null, bannedPersonalUserIds: Array<string> | null, noKibitz: boolean | null, showHideKarmaOption: boolean | null, nullifyVotes: boolean | null, deleteContent: boolean | null, banned: string | null, username: string | null, displayName: string, fullName: string | null, mongoLocation: any | null, googleLocation: any | null, location: string | null, mapLocation: any | null, hideFromPeopleDirectory: boolean, allowDatadogSessionReplay: boolean, reviewedByUserId: string | null, reviewForAlignmentForumUserId: string | null, groups: Array<string> | null, afApplicationText: string | null, afSubmittedApplication: boolean | null, karmaChangeLastOpened: string | null, karmaChangeNotifierSettings: any | null, notificationShortformContent: any | null, notificationCommentsOnSubscribedPost: any | null, notificationRepliesToMyComments: any | null, notificationRepliesToSubscribedComments: any | null, notificationSubscribedUserPost: any | null, notificationSubscribedUserComment: any | null, notificationSubscribedTagPost: any | null, notificationSubscribedSequencePost: any | null, notificationPostsInGroups: any | null, notificationPrivateMessage: any | null, notificationSharedWithMe: any | null, notificationAlignmentSubmissionApproved: any | null, notificationEventInRadius: any | null, notificationRSVPs: any | null, notificationCommentsOnDraft: any | null, notificationPostsNominatedReview: any | null, notificationGroupAdministration: any | null, notificationSubforumUnread: any | null, notificationNewMention: any | null, notificationNewDialogueChecks: any | null, notificationYourTurnMatchForm: any | null, notificationDialogueMessages: any | null, notificationPublishedDialogueMessages: any | null, hideFrontpageMap: boolean | null, hideTaggingProgressBar: boolean | null, hideFrontpageBookAd: boolean | null, hideFrontpageBook2020Ad: boolean | null, deleted: boolean, permanentDeletionRequestedAt: string | null, twitterProfileURLAdmin: string | null, biography: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, moderationGuidelines: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null }
  & UsersCurrent
);

type UsersAdmin = { __typename?: 'User', _id: string, username: string | null, createdAt: string, isAdmin: boolean, displayName: string, email: string | null, slug: string, groups: Array<string> | null, services: any | null, karma: number };

type UsersWithReviewInfo = (
  { __typename?: 'User', reviewVoteCount: number | null, email: string | null }
  & UsersMinimumInfo
);

type UsersProfileEdit = { __typename?: 'User', _id: string, slug: string, displayName: string, jobTitle: string | null, organization: string | null, careerStage: Array<string> | null, profileImageId: string | null, profileTagIds: Array<string>, organizerOfGroupIds: Array<string>, programParticipation: Array<string> | null, mapLocation: any | null, website: string | null, linkedinProfileURL: string | null, facebookProfileURL: string | null, blueskyProfileURL: string | null, twitterProfileURL: string | null, githubProfileURL: string | null, biography: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, howOthersCanHelpMe: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, howICanHelpOthers: (
    { __typename?: 'Revision' }
    & RevisionEdit
  ) | null, organizerOfGroups: Array<(
    { __typename?: 'Localgroup' }
    & localGroupsBase
  )> };

type UsersCrosspostInfo = { __typename?: 'User', _id: string, username: string | null, slug: string, fmCrosspostUserId: string | null };

type UsersOptedInToDialogueFacilitation = { __typename?: 'User', _id: string, displayName: string };

type UserOnboardingAuthor = { __typename?: 'User', _id: string, displayName: string, profileImageId: string | null, karma: number, jobTitle: string | null, organization: string | null };

type UsersSocialMediaInfo = (
  { __typename?: 'User', twitterProfileURLAdmin: string | null }
  & UsersProfile
);

type SuggestAlignmentUser = (
  { __typename?: 'User', afKarma: number, afPostCount: number, afCommentCount: number, reviewForAlignmentForumUserId: string | null, groups: Array<string> | null, afApplicationText: string | null, afSubmittedApplication: boolean | null }
  & UsersMinimumInfo
);

type TagRelVotes = { __typename?: 'Vote', _id: string, userId: string | null, voteType: VoteType, power: number | null, documentId: string, votedAt: string | null, isUnvote: boolean, tagRel: (
    { __typename?: 'TagRel' }
    & WithVoteTagRel
  ) | null };

type TagVotingActivity = (
  { __typename?: 'Vote', tagRel: (
    { __typename?: 'TagRel' }
    & TagRelFragment
  ) | null }
  & TagRelVotes
);

type UserVotes = { __typename?: 'Vote', _id: string, userId: string | null, voteType: VoteType, power: number | null, cancelled: boolean, documentId: string, votedAt: string | null, isUnvote: boolean, collectionName: string };

type UserVotesWithDocument = (
  { __typename?: 'Vote', comment: (
    { __typename?: 'Comment' }
    & CommentsListWithParentMetadata
  ) | null, post: (
    { __typename?: 'Post' }
    & PostsListWithVotes
  ) | null }
  & UserVotes
);

type getCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


type getCurrentUserQuery = { __typename?: 'Query', currentUser: (
    { __typename?: 'User' }
    & UsersCurrent
  ) | null };

type AdvisorRequestsDefaultFragment = { __typename?: 'AdvisorRequest', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, interestedInMetaculus: boolean | null, jobAds: any | null };

type ArbitalCachesDefaultFragment = { __typename?: 'ArbitalCaches', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type ArbitalTagContentRelsDefaultFragment = { __typename?: 'ArbitalTagContentRel', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, parentDocumentId: string, childDocumentId: string, parentCollectionName: string, childCollectionName: string, type: string, level: number, isStrong: boolean };

type AutomatedContentEvaluationsDefaultFragment = { __typename?: 'AutomatedContentEvaluation', _id: string, createdAt: string, revisionId: string, score: number, aiChoice: string, aiReasoning: string, aiCoT: string };

type BansDefaultFragment = { __typename?: 'Ban', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, expirationDate: string | null, userId: string, ip: string | null, reason: string | null, comment: string, properties: any | null };

type BookmarksDefaultFragment = { __typename?: 'Bookmark', _id: string, createdAt: string, documentId: string, collectionName: string, userId: string, lastUpdated: string, active: boolean };

type BooksDefaultFragment = { __typename?: 'Book', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, postedAt: string | null, title: string | null, subtitle: string | null, tocTitle: string | null, collectionId: string, number: number | null, postIds: Array<string>, sequenceIds: Array<string>, displaySequencesAsGrid: boolean | null, hideProgressBar: boolean | null, showChapters: boolean | null };

type ChaptersDefaultFragment = { __typename?: 'Chapter', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, title: string | null, subtitle: string | null, number: number | null, sequenceId: string | null, postIds: Array<string> };

type CkEditorUserSessionsDefaultFragment = { __typename?: 'CkEditorUserSession', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, documentId: string | null, userId: string | null, endedAt: string | null, endedBy: string | null };

type ClientIdsDefaultFragment = { __typename?: 'ClientId', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, clientId: string | null, firstSeenReferrer: string | null, firstSeenLandingPage: string | null, userIds: Array<string> | null, invalidated: boolean | null, lastSeenAt: string | null, timesSeen: number | null };

type CollectionsDefaultFragment = { __typename?: 'Collection', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, userId: string, title: string, slug: string, gridImageId: string | null, firstPageLink: string, hideStartReadingButton: boolean | null, noindex: boolean };

type CommentModeratorActionsDefaultFragment = { __typename?: 'CommentModeratorAction', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, commentId: string | null, type: string | null, endedAt: string | null };

type CommentsDefaultFragment = { __typename?: 'Comment', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, contents_latest: string | null, pingbacks: any | null, parentCommentId: string | null, topLevelCommentId: string | null, postedAt: string, lastEditedAt: string | null, author: string | null, postId: string | null, tagId: string | null, forumEventId: string | null, forumEventMetadata: any | null, tagCommentType: TagCommentType, subforumStickyPriority: number | null, userId: string | null, userIP: string | null, userAgent: string | null, referrer: string | null, authorIsUnreviewed: boolean, answer: boolean, parentAnswerId: string | null, directChildrenCount: number, descendentCount: number, shortform: boolean | null, shortformFrontpage: boolean, nominatedForReview: string | null, reviewingForReview: string | null, lastSubthreadActivity: string | null, postVersion: string | null, promoted: boolean | null, promotedByUserId: string | null, promotedAt: string | null, hideKarma: boolean | null, legacy: boolean, legacyId: string | null, legacyPoll: boolean, legacyParentId: string | null, retracted: boolean, deleted: boolean, deletedPublic: boolean, deletedReason: string | null, deletedDate: string | null, deletedByUserId: string | null, spam: boolean, repliesBlockedUntil: string | null, needsReview: boolean | null, reviewedByUserId: string | null, hideAuthor: boolean, moderatorHat: boolean, hideModeratorHat: boolean | null, isPinnedOnProfile: boolean, title: string | null, relevantTagIds: Array<string>, debateResponse: boolean | null, rejected: boolean, modGPTAnalysis: string | null, modGPTRecommendation: string | null, rejectedReason: string | null, rejectedByUserId: string | null, af: boolean, suggestForAlignmentUserIds: Array<string>, reviewForAlignmentUserId: string | null, afDate: string | null, moveToAlignmentUserId: string | null, agentFoundationsId: string | null, originalDialogueId: string | null, voteCount: number, baseScore: number | null, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type ConversationsDefaultFragment = { __typename?: 'Conversation', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, title: string | null, participantIds: Array<string> | null, latestActivity: string | null, af: boolean | null, messageCount: number, moderator: boolean | null, archivedByIds: Array<string> };

type CronHistoriesDefaultFragment = { __typename?: 'CronHistory', _id: string | null, intendedAt: string | null, name: string | null, startedAt: string | null, finishedAt: string | null, result: any | null };

type CurationEmailsDefaultFragment = { __typename?: 'CurationEmail', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, postId: string | null };

type CurationNoticesDefaultFragment = { __typename?: 'CurationNotice', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, userId: string, commentId: string | null, postId: string, deleted: boolean };

type DatabaseMetadataDefaultFragment = { __typename?: 'DatabaseMetadata', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type DebouncerEventsDefaultFragment = { __typename?: 'DebouncerEvents', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type DialogueChecksDefaultFragment = { __typename?: 'DialogueCheck', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, targetUserId: string | null, checked: boolean | null, checkedAt: string | null, hideInRecommendations: boolean | null };

type DialogueMatchPreferencesDefaultFragment = { __typename?: 'DialogueMatchPreference', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, dialogueCheckId: string | null, topicPreferences: Array<any> | null, topicNotes: string | null, syncPreference: string | null, asyncPreference: string | null, formatNotes: string | null, calendlyLink: string | null, generatedDialogueId: string | null, deleted: boolean };

type DigestPostsDefaultFragment = { __typename?: 'DigestPost', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, digestId: string, postId: string, emailDigestStatus: string | null, onsiteDigestStatus: string | null };

type DigestsDefaultFragment = { __typename?: 'Digest', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, num: number, startDate: string, endDate: string | null, publishedDate: string | null, onsiteImageId: string | null, onsitePrimaryColor: string | null };

type ElectionCandidatesDefaultFragment = { __typename?: 'ElectionCandidate', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, electionName: string, name: string, logoSrc: string, href: string, fundraiserLink: string | null, gwwcLink: string | null, gwwcId: string | null, description: string, userId: string, postCount: number, tagId: string, isElectionFundraiser: boolean, amountRaised: number | null, targetAmount: number | null, voteCount: number, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type ElectionVotesDefaultFragment = { __typename?: 'ElectionVote', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, electionName: string | null, userId: string | null, compareState: any | null, vote: any | null, submittedAt: string | null, submissionComments: any | null, userExplanation: string | null, userOtherComments: string | null };

type ElicitQuestionPredictionsDefaultFragment = { __typename?: 'ElicitQuestionPrediction', _id: string, prediction: number | null, createdAt: string, notes: string | null, userId: string | null, sourceUrl: string | null, sourceId: string | null, binaryQuestionId: string, isDeleted: boolean };

type ElicitQuestionsDefaultFragment = { __typename?: 'ElicitQuestion', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, title: string, notes: string | null, resolution: string | null, resolvesBy: string | null };

type EmailTokensDefaultFragment = { __typename?: 'EmailTokens', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type FeaturedResourcesDefaultFragment = { __typename?: 'FeaturedResource', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, title: string, body: string | null, ctaText: string, ctaUrl: string, expiresAt: string };

type FieldChangesDefaultFragment = { __typename?: 'FieldChange', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, changeGroup: string | null, documentId: string | null, fieldName: string | null, oldValue: any | null, newValue: any | null };

type ForumEventsDefaultFragment = { __typename?: 'ForumEvent', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, frontpageDescription_latest: string | null, frontpageDescriptionMobile_latest: string | null, postPageDescription_latest: string | null, title: string, startDate: string, endDate: string | null, darkColor: string, lightColor: string, bannerTextColor: string, contrastColor: string | null, tagId: string | null, postId: string | null, bannerImageId: string | null, includesPoll: boolean, isGlobal: boolean, eventFormat: ForumEventFormat, pollQuestion_latest: string | null, pollAgreeWording: string | null, pollDisagreeWording: string | null, maxStickersPerUser: number, customComponent: ForumEventCustomComponent, commentPrompt: string | null, publicData: any | null };

type GardenCodesDefaultFragment = { __typename?: 'GardenCode', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, pingbacks: any | null, slug: string, code: string, title: string, userId: string, startTime: string | null, endTime: string, fbLink: string | null, type: string, hidden: boolean, deleted: boolean, afOnly: boolean };

type GoogleServiceAccountSessionsDefaultFragment = { __typename?: 'GoogleServiceAccountSession', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, email: string | null, estimatedExpiry: string | null, active: boolean | null, revoked: boolean | null };

type ImagesDefaultFragment = { __typename?: 'Images', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type JargonTermsDefaultFragment = { __typename?: 'JargonTerm', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, postId: string, term: string, approved: boolean, deleted: boolean, altTerms: Array<string> };

type LWEventsDefaultFragment = { __typename?: 'LWEvent', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, userId: string | null, name: string | null, documentId: string | null, important: boolean | null, properties: any | null, intercom: boolean | null };

type LegacyDataDefaultFragment = { __typename?: 'LegacyData', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type LlmConversationsDefaultFragment = { __typename?: 'LlmConversation', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, title: string | null, model: string | null, systemPrompt: string | null, deleted: boolean | null };

type LlmMessagesDefaultFragment = { __typename?: 'LlmMessage', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, conversationId: string | null, role: string | null, content: string | null };

type LocalgroupsDefaultFragment = { __typename?: 'Localgroup', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, name: string, nameInAnotherLanguage: string | null, organizerIds: Array<string>, lastActivity: string, types: Array<string>, categories: Array<string> | null, isOnline: boolean, mongoLocation: any | null, googleLocation: any | null, location: string | null, contactInfo: string | null, facebookLink: string | null, facebookPageLink: string | null, meetupLink: string | null, slackLink: string | null, website: string | null, bannerImageId: string | null, inactive: boolean, deleted: boolean };

type ManifoldProbabilitiesCachesDefaultFragment = { __typename?: 'ManifoldProbabilitiesCache', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, marketId: string, probability: number, isResolved: boolean, year: number, lastUpdated: string, url: string | null };

type MessagesDefaultFragment = { __typename?: 'Message', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, contents_latest: string | null, userId: string | null, conversationId: string | null, noEmail: boolean | null };

type MigrationsDefaultFragment = { __typename?: 'Migration', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type ModerationTemplatesDefaultFragment = { __typename?: 'ModerationTemplate', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, name: string, collectionName: ModerationTemplateType, order: number, deleted: boolean };

type ModeratorActionsDefaultFragment = { __typename?: 'ModeratorAction', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string, type: ModeratorActionType, endedAt: string | null };

type MultiDocumentsDefaultFragment = { __typename?: 'MultiDocument', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, pingbacks: any | null, slug: string, oldSlugs: Array<string>, title: string | null, preview: string | null, tabTitle: string, tabSubtitle: string | null, userId: string, parentDocumentId: string, collectionName: string, fieldName: string, index: number, contributionStats: any | null, htmlWithContributorAnnotations: string | null, deleted: boolean, voteCount: number, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type NotificationsDefaultFragment = { __typename?: 'Notification', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, userId: string | null, documentId: string | null, documentType: string | null, extraData: any | null, link: string | null, title: string | null, message: string | null, type: string | null, deleted: boolean | null, viewed: boolean | null, emailed: boolean | null, waitingForBatch: boolean | null };

type PageCacheDefaultFragment = { __typename?: 'PageCacheEntry', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type PetrovDayActionsDefaultFragment = { __typename?: 'PetrovDayAction', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, actionType: string, data: any | null, userId: string | null };

type PetrovDayLaunchsDefaultFragment = { __typename?: 'PetrovDayLaunch', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, launchCode: string, hashedLaunchCode: string | null, userId: string | null };

type PodcastEpisodesDefaultFragment = { __typename?: 'PodcastEpisode', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, podcastId: string, title: string, episodeLink: string, externalEpisodeId: string };

type PodcastsDefaultFragment = { __typename?: 'Podcast', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, title: string, applePodcastLink: string | null, spotifyPodcastLink: string | null };

type PostRecommendationsDefaultFragment = { __typename?: 'PostRecommendation', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, clientId: string | null, postId: string | null, strategyName: string | null, strategySettings: any | null, recommendationCount: number | null, lastRecommendedAt: string | null, clickedAt: string | null };

type PostRelationsDefaultFragment = { __typename?: 'PostRelation', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, type: string, sourcePostId: string, targetPostId: string, order: number | null };

type PostsDefaultFragment = { __typename?: 'Post', _id: string, schemaVersion: number, createdAt: string | null, legacyData: any | null, contents_latest: string | null, pingbacks: any | null, moderationGuidelines_latest: string | null, customHighlight_latest: string | null, slug: string, postedAt: string, modifiedAt: string | null, url: string | null, postCategory: PostCategory, title: string, viewCount: number | null, lastCommentedAt: string, clickCount: number | null, deletedDraft: boolean, status: number, isFuture: boolean, sticky: boolean, stickyPriority: number, userIP: string | null, userAgent: string | null, referrer: string | null, author: string | null, userId: string | null, question: boolean, authorIsUnreviewed: boolean, readTimeMinutesOverride: number | null, submitToFrontpage: boolean, hiddenRelatedQuestion: boolean, originalPostRelationSourceId: string | null, shortform: boolean, canonicalSource: string | null, nominationCount2018: number, nominationCount2019: number, reviewCount2018: number, reviewCount2019: number, reviewCount: number, reviewVoteCount: number, positiveReviewVoteCount: number, manifoldReviewMarketId: string | null, reviewVoteScoreAF: number, reviewVotesAF: Array<number>, reviewVoteScoreHighKarma: number, reviewVotesHighKarma: Array<number>, reviewVoteScoreAllKarma: number, reviewVotesAllKarma: Array<number>, finalReviewVoteScoreHighKarma: number, finalReviewVotesHighKarma: Array<number>, finalReviewVoteScoreAllKarma: number, finalReviewVotesAllKarma: Array<number>, finalReviewVoteScoreAF: number, finalReviewVotesAF: Array<number>, lastCommentPromotedAt: string | null, tagRelevance: any | null, noIndex: boolean, rsvps: Array<any> | null, activateRSVPs: boolean | null, nextDayReminderSent: boolean, onlyVisibleToLoggedIn: boolean, onlyVisibleToEstablishedAccounts: boolean, hideFromRecentDiscussions: boolean, votingSystem: string | null, podcastEpisodeId: string | null, forceAllowType3Audio: boolean, legacy: boolean, legacyId: string | null, legacySpam: boolean, feedId: string | null, feedLink: string | null, curatedDate: string | null, metaDate: string | null, suggestForCuratedUserIds: Array<string> | null, frontpageDate: string | null, autoFrontpage: string | null, collectionTitle: string | null, hasCoauthorPermission: boolean, socialPreviewImageId: string | null, socialPreviewImageAutoUrl: string | null, canonicalSequenceId: string | null, canonicalCollectionSlug: string | null, canonicalBookId: string | null, canonicalNextPostSlug: string | null, canonicalPrevPostSlug: string | null, unlisted: boolean, disableRecommendation: boolean, defaultRecommendation: boolean, hideFromPopularComments: boolean | null, draft: boolean | null, wasEverUndrafted: boolean | null, meta: boolean, hideFrontpageComments: boolean, maxBaseScore: number, scoreExceeded2Date: string | null, scoreExceeded30Date: string | null, scoreExceeded45Date: string | null, scoreExceeded75Date: string | null, scoreExceeded125Date: string | null, scoreExceeded200Date: string | null, bannedUserIds: Array<string> | null, commentsLocked: boolean | null, commentsLockedToAccountsCreatedAfter: string | null, organizerIds: Array<string> | null, groupId: string | null, eventType: string | null, isEvent: boolean, reviewedByUserId: string | null, reviewForCuratedUserId: string | null, startTime: string | null, localStartTime: string | null, endTime: string | null, localEndTime: string | null, eventRegistrationLink: string | null, joinEventLink: string | null, onlineEvent: boolean, globalEvent: boolean, mongoLocation: any | null, googleLocation: any | null, location: string | null, contactInfo: string | null, facebookLink: string | null, meetupLink: string | null, website: string | null, eventImageId: string | null, types: Array<string> | null, metaSticky: boolean, sharingSettings: any | null, shareWithUsers: Array<string> | null, linkSharingKey: string | null, linkSharingKeyUsedBy: Array<string> | null, commentSortOrder: string | null, hideAuthor: boolean, sideCommentVisibility: string | null, disableSidenotes: boolean, moderationStyle: string | null, ignoreRateLimits: boolean | null, hideCommentKarma: boolean, commentCount: number, topLevelCommentCount: number, debate: boolean, collabEditorDialogue: boolean, mostRecentPublishedDialogueResponseDate: string | null, rejected: boolean, rejectedReason: string | null, rejectedByUserId: string | null, subforumTagId: string | null, af: boolean, afDate: string | null, afCommentCount: number, afLastCommentedAt: string | null, afSticky: boolean, suggestForAlignmentUserIds: Array<string>, reviewForAlignmentUserId: string | null, agentFoundationsId: string | null, swrCachingEnabled: boolean | null, generateDraftJargon: boolean | null, voteCount: number, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type RSSFeedsDefaultFragment = { __typename?: 'RSSFeed', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string, ownedByUser: boolean, displayFullContent: boolean, nickname: string, url: string, status: string | null, rawFeed: any, setCanonicalUrl: boolean, importAsDraft: boolean };

type ReadStatusesDefaultFragment = { __typename?: 'ReadStatus', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type RecommendationsCachesDefaultFragment = { __typename?: 'RecommendationsCache', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, postId: string | null, source: string | null, scenario: string | null, attributionId: string | null, ttlMs: number | null };

type ReportsDefaultFragment = { __typename?: 'Report', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string, reportedUserId: string | null, commentId: string | null, postId: string | null, link: string, claimedUserId: string | null, description: string | null, closedAt: string | null, markedAsSpam: boolean | null, reportedAsSpam: boolean | null };

type ReviewVotesDefaultFragment = { __typename?: 'ReviewVote', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string, postId: string, qualitativeScore: number, quadraticScore: number, comment: string | null, year: string, dummy: boolean, reactions: Array<string> | null };

type ReviewWinnerArtsDefaultFragment = { __typename?: 'ReviewWinnerArt', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, postId: string, splashArtImagePrompt: string, splashArtImageUrl: string };

type ReviewWinnersDefaultFragment = { __typename?: 'ReviewWinner', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, postId: string, reviewYear: number, category: string, curatedOrder: number | null, reviewRanking: number, isAI: boolean | null };

type RevisionsDefaultFragment = { __typename?: 'Revision', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, documentId: string | null, collectionName: string | null, fieldName: string | null, editedAt: string, updateType: string | null, version: string, commitMessage: string | null, userId: string | null, draft: boolean | null, html: string | null, wordCount: number, changeMetrics: any, googleDocMetadata: any | null, skipAttributions: boolean, voteCount: number, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type SequencesDefaultFragment = { __typename?: 'Sequence', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, lastUpdated: string, userId: string, title: string, bannerImageId: string | null, gridImageId: string | null, hideFromAuthorPage: boolean, draft: boolean, isDeleted: boolean, curatedOrder: number | null, userProfileOrder: number | null, canonicalCollectionSlug: string | null, hidden: boolean, noindex: boolean, af: boolean };

type SessionsDefaultFragment = { __typename?: 'Session', _id: string | null, session: any | null, expires: string | null, lastModified: string | null };

type SideCommentCachesDefaultFragment = { __typename?: 'SideCommentCache', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type SplashArtCoordinatesDefaultFragment = { __typename?: 'SplashArtCoordinate', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, reviewWinnerArtId: string | null, leftXPct: number, leftYPct: number, leftHeightPct: number, leftWidthPct: number, leftFlipped: boolean, middleXPct: number, middleYPct: number, middleHeightPct: number, middleWidthPct: number, middleFlipped: boolean, rightXPct: number, rightYPct: number, rightHeightPct: number, rightWidthPct: number, rightFlipped: boolean };

type SpotlightsDefaultFragment = { __typename?: 'Spotlight', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, description_latest: string | null, documentId: string, documentType: SpotlightDocumentType, position: number, duration: number, customTitle: string | null, customSubtitle: string | null, subtitleUrl: string | null, headerTitle: string | null, headerTitleLeftColor: string | null, headerTitleRightColor: string | null, lastPromotedAt: string, spotlightSplashImageUrl: string | null, draft: boolean, deletedDraft: boolean, showAuthor: boolean, imageFade: boolean, imageFadeColor: string | null, spotlightImageId: string | null, spotlightDarkImageId: string | null };

type SubscriptionsDefaultFragment = { __typename?: 'Subscription', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, state: string | null, documentId: string | null, collectionName: string | null, deleted: boolean | null, type: string | null };

type SurveyQuestionsDefaultFragment = { __typename?: 'SurveyQuestion', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, surveyId: string, question: string, format: SurveyQuestionFormat, order: number };

type SurveyResponsesDefaultFragment = { __typename?: 'SurveyResponse', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, surveyId: string | null, surveyScheduleId: string | null, userId: string | null, clientId: string | null, response: any | null };

type SurveySchedulesDefaultFragment = { __typename?: 'SurveySchedule', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, surveyId: string, name: string | null, impressionsLimit: number | null, maxVisitorPercentage: number | null, minKarma: number | null, maxKarma: number | null, target: SurveyScheduleTarget | null, startDate: string | null, endDate: string | null, deactivated: boolean | null, clientIds: Array<string> | null };

type SurveysDefaultFragment = { __typename?: 'Survey', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, name: string };

type TagFlagsDefaultFragment = { __typename?: 'TagFlag', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, contents_latest: string | null, slug: string, name: string, deleted: boolean, order: number | null };

type TagRelsDefaultFragment = { __typename?: 'TagRel', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, tagId: string, postId: string, deleted: boolean, userId: string | null, backfilled: boolean, voteCount: number, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type TagsDefaultFragment = { __typename?: 'Tag', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, description_latest: string | null, pingbacks: any | null, subforumWelcomeText_latest: string | null, moderationGuidelines_latest: string | null, slug: string, oldSlugs: Array<string>, name: string, shortName: string | null, subtitle: string | null, core: boolean, isPostType: boolean, suggestedAsFilter: boolean, defaultOrder: number, descriptionTruncationCount: number, postCount: number, userId: string | null, adminOnly: boolean, canEditUserIds: Array<string> | null, charsAdded: number | null, charsRemoved: number | null, deleted: boolean, lastCommentedAt: string | null, lastSubforumCommentAt: string | null, needsReview: boolean, reviewedByUserId: string | null, wikiGrade: number, wikiOnly: boolean, bannerImageId: string | null, squareImageId: string | null, tagFlagsIds: Array<string>, lesswrongWikiImportRevision: string | null, lesswrongWikiImportSlug: string | null, lesswrongWikiImportCompleted: boolean | null, htmlWithContributorAnnotations: string | null, contributionStats: any | null, introSequenceId: string | null, postsDefaultSortOrder: string | null, canVoteOnRels: Array<TagRelVoteGroup> | null, isSubforum: boolean, subforumModeratorIds: Array<string>, subforumIntroPostId: string | null, parentTagId: string | null, subTagIds: Array<string>, autoTagModel: string | null, autoTagPrompt: string | null, noindex: boolean, isPlaceholderPage: boolean, coreTagId: string | null, forceAllowType3Audio: boolean, voteCount: number, baseScore: number, extendedScore: any | null, score: number, afBaseScore: number | null, afExtendedScore: any | null, afVoteCount: number | null };

type TweetsDefaultFragment = { __typename?: 'Tweet', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type TypingIndicatorsDefaultFragment = { __typename?: 'TypingIndicator', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, documentId: string | null, lastUpdated: string | null };

type UltraFeedEventsDefaultFragment = { __typename?: 'UltraFeedEvent', _id: string, createdAt: string, documentId: string | null, collectionName: string | null, eventType: string | null, userId: string | null, event: any | null, feedItemId: string | null };

type UserActivitiesDefaultFragment = { __typename?: 'UserActivity', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null };

type UserEAGDetailsDefaultFragment = { __typename?: 'UserEAGDetail', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, careerStage: Array<string> | null, countryOrRegion: string | null, nearestCity: string | null, willingnessToRelocate: any | null, experiencedIn: Array<string> | null, interestedIn: Array<string> | null, lastUpdated: string | null };

type UserJobAdsDefaultFragment = { __typename?: 'UserJobAd', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, jobName: string | null, adState: string | null, reminderSetAt: string | null, lastUpdated: string | null };

type UserMostValuablePostsDefaultFragment = { __typename?: 'UserMostValuablePost', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string | null, postId: string | null, deleted: boolean | null };

type UserRateLimitsDefaultFragment = { __typename?: 'UserRateLimit', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, userId: string, type: UserRateLimitType, intervalUnit: UserRateLimitIntervalUnit, intervalLength: number, actionsPerInterval: number, endedAt: string };

type UserTagRelsDefaultFragment = { __typename?: 'UserTagRel', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, tagId: string, userId: string, subforumShowUnreadInSidebar: boolean | null, subforumEmailNotifications: boolean | null, subforumHideIntroPost: boolean | null };

type UsersDefaultFragment = { __typename?: 'User', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, moderationGuidelines_latest: string | null, howOthersCanHelpMe_latest: string | null, howICanHelpOthers_latest: string | null, slug: string, oldSlugs: Array<string>, biography_latest: string | null, username: string | null, emails: Array<any> | null, isAdmin: boolean, profile: any | null, services: any | null, displayName: string, previousDisplayName: string | null, email: string | null, noindex: boolean, groups: Array<string> | null, lwWikiImport: boolean | null, theme: any | null, lastUsedTimezone: string | null, whenConfirmationEmailSent: string | null, legacy: boolean | null, commentSorting: string | null, sortDraftsBy: string | null, reactPaletteStyle: ReactPaletteStyle | null, noKibitz: boolean | null, showHideKarmaOption: boolean | null, showPostAuthorCard: boolean | null, hideIntercom: boolean, markDownPostEditor: boolean, hideElicitPredictions: boolean | null, hideAFNonMemberInitialWarning: boolean | null, noSingleLineComments: boolean, noCollapseCommentsPosts: boolean, noCollapseCommentsFrontpage: boolean, hideCommunitySection: boolean, showCommunityInRecentDiscussion: boolean, hidePostsRecommendations: boolean, petrovOptOut: boolean, optedOutOfSurveys: boolean | null, postGlossariesPinned: boolean | null, generateJargonForDrafts: boolean | null, generateJargonForPublishedPosts: boolean | null, acceptedTos: boolean | null, hideNavigationSidebar: boolean | null, currentFrontpageFilter: string | null, frontpageSelectedTab: string | null, frontpageFilterSettings: any | null, hideFrontpageFilterSettingsDesktop: boolean | null, allPostsTimeframe: string | null, allPostsFilter: string | null, allPostsSorting: string | null, allPostsShowLowKarma: boolean | null, allPostsIncludeEvents: boolean | null, allPostsHideCommunity: boolean | null, allPostsOpenSettings: boolean | null, draftsListSorting: string | null, draftsListShowArchived: boolean | null, draftsListShowShared: boolean | null, lastNotificationsCheck: string | null, karma: number, goodHeartTokens: number | null, moderationStyle: string | null, moderatorAssistance: boolean | null, collapseModerationGuidelines: boolean | null, bannedUserIds: Array<string> | null, bannedPersonalUserIds: Array<string> | null, legacyId: string | null, deleted: boolean, permanentDeletionRequestedAt: string | null, voteBanned: boolean | null, nullifyVotes: boolean | null, deleteContent: boolean | null, banned: string | null, auto_subscribe_to_my_posts: boolean, auto_subscribe_to_my_comments: boolean, autoSubscribeAsOrganizer: boolean, notificationCommentsOnSubscribedPost: any | null, notificationShortformContent: any | null, notificationRepliesToMyComments: any | null, notificationRepliesToSubscribedComments: any | null, notificationSubscribedUserPost: any | null, notificationSubscribedUserComment: any | null, notificationPostsInGroups: any | null, notificationSubscribedTagPost: any | null, notificationSubscribedSequencePost: any | null, notificationPrivateMessage: any | null, notificationSharedWithMe: any | null, notificationAlignmentSubmissionApproved: any | null, notificationEventInRadius: any | null, notificationKarmaPowersGained: any | null, notificationRSVPs: any | null, notificationGroupAdministration: any | null, notificationCommentsOnDraft: any | null, notificationPostsNominatedReview: any | null, notificationSubforumUnread: any | null, notificationNewMention: any | null, notificationDialogueMessages: any | null, notificationPublishedDialogueMessages: any | null, notificationAddedAsCoauthor: any | null, notificationDebateCommentsOnSubscribedPost: any | null, notificationDebateReplies: any | null, notificationDialogueMatch: any | null, notificationNewDialogueChecks: any | null, notificationYourTurnMatchForm: any | null, hideDialogueFacilitation: boolean | null, revealChecksToAdmins: boolean | null, optedInToDialogueFacilitation: boolean | null, showDialoguesList: boolean | null, showMyDialogues: boolean | null, showMatches: boolean | null, showRecommendedPartners: boolean | null, hideActiveDialogueUsers: boolean | null, karmaChangeNotifierSettings: any | null, karmaChangeLastOpened: string | null, karmaChangeBatchStart: string | null, emailSubscribedToCurated: boolean | null, subscribedToDigest: boolean | null, subscribedToNewsletter: boolean | null, unsubscribeFromAll: boolean | null, hideSubscribePoke: boolean | null, hideMeetupsPoke: boolean | null, hideHomeRHS: boolean | null, frontpagePostCount: number, sequenceCount: number, sequenceDraftCount: number, mongoLocation: any | null, googleLocation: any | null, location: string | null, mapLocation: any | null, mapLocationSet: boolean | null, mapMarkerText: string | null, htmlMapMarkerText: string | null, nearbyEventsNotifications: boolean, nearbyEventsNotificationsLocation: any | null, nearbyEventsNotificationsMongoLocation: any | null, nearbyEventsNotificationsRadius: number | null, nearbyPeopleNotificationThreshold: number | null, hideFrontpageMap: boolean | null, hideTaggingProgressBar: boolean | null, hideFrontpageBookAd: boolean | null, hideFrontpageBook2019Ad: boolean | null, hideFrontpageBook2020Ad: boolean | null, sunshineNotes: string | null, sunshineFlagged: boolean | null, needsReview: boolean | null, sunshineSnoozed: boolean | null, snoozedUntilContentCount: number | null, reviewedByUserId: string | null, reviewedAt: string | null, afKarma: number, voteCount: number | null, smallUpvoteCount: number | null, smallDownvoteCount: number | null, bigUpvoteCount: number | null, bigDownvoteCount: number | null, voteReceivedCount: number | null, smallUpvoteReceivedCount: number | null, smallDownvoteReceivedCount: number | null, bigUpvoteReceivedCount: number | null, bigDownvoteReceivedCount: number | null, usersContactedBeforeReview: Array<string> | null, fullName: string | null, shortformFeedId: string | null, viewUnreviewedComments: boolean | null, beta: boolean | null, reviewVotesQuadratic: boolean | null, reviewVotesQuadratic2019: boolean | null, reviewVotesQuadratic2020: boolean | null, petrovPressedButtonDate: string | null, petrovLaunchCodeDate: string | null, defaultToCKEditor: boolean | null, signUpReCaptchaRating: number | null, noExpandUnreadCommentsReview: boolean, postCount: number, maxPostCount: number, commentCount: number, maxCommentCount: number, tagRevisionCount: number, abTestKey: string | null, abTestOverrides: any | null, walledGardenInvite: boolean | null, hideWalledGardenUI: boolean | null, walledGardenPortalOnboarded: boolean | null, taggingDashboardCollapsed: boolean | null, usernameUnset: boolean | null, paymentEmail: string | null, paymentInfo: string | null, profileUpdatedAt: string, profileImageId: string | null, jobTitle: string | null, organization: string | null, careerStage: Array<string> | null, website: string | null, fmCrosspostUserId: string | null, linkedinProfileURL: string | null, facebookProfileURL: string | null, blueskyProfileURL: string | null, twitterProfileURL: string | null, twitterProfileURLAdmin: string | null, githubProfileURL: string | null, profileTagIds: Array<string>, organizerOfGroupIds: Array<string>, programParticipation: Array<string> | null, postingDisabled: boolean | null, allCommentingDisabled: boolean | null, commentingOnOtherUsersDisabled: boolean | null, conversationsDisabled: boolean | null, acknowledgedNewUserGuidelines: boolean | null, subforumPreferredLayout: SubforumPreferredLayout | null, hideJobAdUntil: string | null, criticismTipsDismissed: boolean | null, hideFromPeopleDirectory: boolean, allowDatadogSessionReplay: boolean, afPostCount: number, afCommentCount: number, afSequenceCount: number, afSequenceDraftCount: number, reviewForAlignmentForumUserId: string | null, afApplicationText: string | null, afSubmittedApplication: boolean | null, hideSunshineSidebar: boolean | null, inactiveSurveyEmailSentAt: string | null, userSurveyEmailSentAt: string | null, recommendationSettings: any | null };

type VotesDefaultFragment = { __typename?: 'Vote', _id: string, schemaVersion: number, createdAt: string, legacyData: any | null, documentId: string, collectionName: string, userId: string | null, authorIds: Array<string> | null, voteType: VoteType, extendedVoteType: any | null, power: number | null, afPower: number | null, cancelled: boolean, isUnvote: boolean, votedAt: string | null, documentIsAf: boolean, silenceNotification: boolean };

type Lightcone2024FundraiserStripeAmountsQueryVariables = Exact<{ [key: string]: never; }>;


type Lightcone2024FundraiserStripeAmountsQuery = { __typename?: 'Query', Lightcone2024FundraiserStripeAmounts: Array<number> | null };

type SubscribedPostAndCommentsFeed = { __typename?: 'SubscribedPostAndComments', _id: string, expandCommentIds: Array<string> | null, postIsFromSubscribedUser: boolean, post: (
    { __typename?: 'Post' }
    & PostsList
  ), comments: Array<(
    { __typename?: 'Comment' }
    & CommentsList
  )> | null };

type FeedPostFragment = { __typename?: 'FeedPost', _id: string, postMetaInfo: any | null, post: (
    { __typename?: 'Post' }
    & PostsListWithVotes
  ) };

type FeedCommentThreadFragment = { __typename?: 'FeedCommentThread', _id: string, commentMetaInfos: any | null, comments: Array<(
    { __typename?: 'Comment' }
    & UltraFeedComment
  )> };

type FeedSpotlightFragment = { __typename?: 'FeedSpotlightItem', _id: string, spotlight: (
    { __typename?: 'Spotlight' }
    & SpotlightDisplay
  ) | null };

type EmailComment2QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EmailComment2Query = { __typename?: 'Query', comment: { __typename?: 'SingleCommentOutput', result: (
      { __typename?: 'Comment' }
      & CommentsListWithParentMetadata
    ) | null } | null };

type EmailComment1QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EmailComment1Query = { __typename?: 'Query', tag: { __typename?: 'SingleTagOutput', result: (
      { __typename?: 'Tag' }
      & TagPreviewFragment
    ) | null } | null };

type EmailCommentQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EmailCommentQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsList
    ) | null } | null };

type EmailUsernameByIDQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EmailUsernameByIDQuery = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null };

type EventUpdatedEmailQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type EventUpdatedEmailQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsBase
    ) | null } | null };

type NewDialogueMessagesEmail1QueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
}>;


type NewDialogueMessagesEmail1Query = { __typename?: 'Query', user: { __typename?: 'SingleUserOutput', result: (
      { __typename?: 'User' }
      & UsersMinimumInfo
    ) | null } | null };

type NewDialogueMessagesEmailQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
}>;


type NewDialogueMessagesEmailQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsRevision
    ) | null } | null };

type PostNominatedEmailQueryVariables = Exact<{
  documentId: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
}>;


type PostNominatedEmailQuery = { __typename?: 'Query', post: { __typename?: 'SinglePostOutput', result: (
      { __typename?: 'Post' }
      & PostsRevision
    ) | null } | null };
