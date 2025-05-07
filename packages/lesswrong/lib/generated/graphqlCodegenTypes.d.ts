export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ContentTypeData: { input: any; output: any; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AdvisorRequest = {
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

export type AdvisorRequestOutput = {
  __typename?: 'AdvisorRequestOutput';
  data?: Maybe<AdvisorRequest>;
};

export type AllTagsActivityFeedEntryType = {
  __typename?: 'AllTagsActivityFeedEntryType';
  tagCreated?: Maybe<Tag>;
  tagDiscussionComment?: Maybe<Comment>;
  tagRevision?: Maybe<Revision>;
  type: Scalars['String']['output'];
};

export type AllTagsActivityFeedQueryResults = {
  __typename?: 'AllTagsActivityFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<AllTagsActivityFeedEntryType>>;
};

export type AnalyticsSeriesValue = {
  __typename?: 'AnalyticsSeriesValue';
  comments?: Maybe<Scalars['Int']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
  karma?: Maybe<Scalars['Int']['output']>;
  reads?: Maybe<Scalars['Int']['output']>;
  views?: Maybe<Scalars['Int']['output']>;
};

export type ArbitalCaches = {
  __typename?: 'ArbitalCaches';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type ArbitalLinkedPage = {
  __typename?: 'ArbitalLinkedPage';
  _id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type ArbitalLinkedPages = {
  __typename?: 'ArbitalLinkedPages';
  children?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  faster?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  lessTechnical?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  moreTechnical?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  parents?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  requirements?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  slower?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  teaches?: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
};

export type ArbitalPageData = {
  __typename?: 'ArbitalPageData';
  html?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type ArbitalTagContentRel = {
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

export type ArbitalTagContentRelOutput = {
  __typename?: 'ArbitalTagContentRelOutput';
  data?: Maybe<ArbitalTagContentRel>;
};

export type AutosaveContentType = {
  type?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['ContentTypeData']['input']>;
};

export type Ban = {
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

export type BanOutput = {
  __typename?: 'BanOutput';
  data?: Maybe<Ban>;
};

export type Book = {
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


export type BookContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type BookOutput = {
  __typename?: 'BookOutput';
  data?: Maybe<Book>;
};

export type Chapter = {
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


export type ChapterContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type ChapterOutput = {
  __typename?: 'ChapterOutput';
  data?: Maybe<Chapter>;
};

export type CkEditorUserSession = {
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

export type ClientId = {
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

export type CoauthorStatus = {
  __typename?: 'CoauthorStatus';
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  requested?: Maybe<Scalars['Boolean']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type Collection = {
  __typename?: 'Collection';
  _id: Scalars['String']['output'];
  books?: Maybe<Array<Maybe<Book>>>;
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


export type CollectionContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type CollectionOutput = {
  __typename?: 'CollectionOutput';
  data?: Maybe<Collection>;
};

export type CombinedKarmaVals = {
  __typename?: 'CombinedKarmaVals';
  commentKarma: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
  postKarma: Scalars['Int']['output'];
};

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['String']['output'];
  af: Scalars['Boolean']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afDate?: Maybe<Scalars['Date']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
  agentFoundationsId?: Maybe<Scalars['String']['output']>;
  allVotes?: Maybe<Array<Maybe<Vote>>>;
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
  latestChildren?: Maybe<Array<Maybe<Comment>>>;
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


export type CommentContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type CommentCountTag = {
  __typename?: 'CommentCountTag';
  comment_count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type CommentKarmaChange = {
  __typename?: 'CommentKarmaChange';
  _id?: Maybe<Scalars['String']['output']>;
  addedReacts?: Maybe<Array<ReactionChange>>;
  commentId?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  eaAddedReacts?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  postSlug?: Maybe<Scalars['String']['output']>;
  postTitle?: Maybe<Scalars['String']['output']>;
  scoreChange?: Maybe<Scalars['Int']['output']>;
  tagCommentType?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  tagSlug?: Maybe<Scalars['String']['output']>;
};

export type CommentModeratorAction = {
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

export type CommentModeratorActionOutput = {
  __typename?: 'CommentModeratorActionOutput';
  data?: Maybe<CommentModeratorAction>;
};

export type CommentOutput = {
  __typename?: 'CommentOutput';
  data?: Maybe<Comment>;
};

export type CommentsWithReactsResult = {
  __typename?: 'CommentsWithReactsResult';
  results: Array<Comment>;
};

export type ContentType = {
  __typename?: 'ContentType';
  data?: Maybe<Scalars['ContentTypeData']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type Conversation = {
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

export type ConversationOutput = {
  __typename?: 'ConversationOutput';
  data?: Maybe<Conversation>;
};

export type CreateAdvisorRequestDataInput = {
  interestedInMetaculus?: InputMaybe<Scalars['Boolean']['input']>;
  jobAds?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateAdvisorRequestInput = {
  data: CreateAdvisorRequestDataInput;
};

export type CreateArbitalTagContentRelDataInput = {
  childCollectionName: Scalars['String']['input'];
  childDocumentId: Scalars['String']['input'];
  isStrong: Scalars['Boolean']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  level: Scalars['Float']['input'];
  parentCollectionName: Scalars['String']['input'];
  parentDocumentId: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateArbitalTagContentRelInput = {
  data: CreateArbitalTagContentRelDataInput;
};

export type CreateBanDataInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  expirationDate: Scalars['Date']['input'];
  ip?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  properties?: InputMaybe<Scalars['JSON']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateBanInput = {
  data: CreateBanDataInput;
};

export type CreateBookDataInput = {
  collectionId: Scalars['String']['input'];
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type CreateBookInput = {
  data: CreateBookDataInput;
};

export type CreateChapterDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  number?: InputMaybe<Scalars['Float']['input']>;
  postIds: Array<Scalars['String']['input']>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateChapterInput = {
  data: CreateChapterDataInput;
};

export type CreateCollectionDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  createdAt: Scalars['Date']['input'];
  firstPageLink?: InputMaybe<Scalars['String']['input']>;
  gridImageId?: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateCollectionInput = {
  data: CreateCollectionDataInput;
};

export type CreateCommentDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  afDate?: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId?: InputMaybe<Scalars['String']['input']>;
  answer?: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type CreateCommentInput = {
  data: CreateCommentDataInput;
};

export type CreateCommentModeratorActionDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
};

export type CreateCommentModeratorActionInput = {
  data: CreateCommentModeratorActionDataInput;
};

export type CreateConversationDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds?: InputMaybe<Array<Scalars['String']['input']>>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderator?: InputMaybe<Scalars['Boolean']['input']>;
  participantIds?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateConversationInput = {
  data: CreateConversationDataInput;
};

export type CreateCurationNoticeDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateCurationNoticeInput = {
  data: CreateCurationNoticeDataInput;
};

export type CreateDialogueMatchPreferenceDataInput = {
  asyncPreference: Scalars['String']['input'];
  calendlyLink?: InputMaybe<Scalars['String']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  dialogueCheckId: Scalars['String']['input'];
  formatNotes: Scalars['String']['input'];
  generatedDialogueId?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  syncPreference: Scalars['String']['input'];
  topicNotes: Scalars['String']['input'];
  topicPreferences: Array<Scalars['JSON']['input']>;
};

export type CreateDialogueMatchPreferenceInput = {
  data: CreateDialogueMatchPreferenceDataInput;
};

export type CreateDigestDataInput = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  num: Scalars['Float']['input'];
  onsiteImageId?: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  publishedDate?: InputMaybe<Scalars['Date']['input']>;
  startDate: Scalars['Date']['input'];
};

export type CreateDigestInput = {
  data: CreateDigestDataInput;
};

export type CreateDigestPostDataInput = {
  digestId: Scalars['String']['input'];
  emailDigestStatus?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  onsiteDigestStatus?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};

export type CreateDigestPostInput = {
  data: CreateDigestPostDataInput;
};

export type CreateElectionCandidateDataInput = {
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

export type CreateElectionCandidateInput = {
  data: CreateElectionCandidateDataInput;
};

export type CreateElectionVoteDataInput = {
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

export type CreateElectionVoteInput = {
  data: CreateElectionVoteDataInput;
};

export type CreateElicitQuestionDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  resolution?: InputMaybe<Scalars['String']['input']>;
  resolvesBy?: InputMaybe<Scalars['Date']['input']>;
  title: Scalars['String']['input'];
};

export type CreateElicitQuestionInput = {
  data: CreateElicitQuestionDataInput;
};

export type CreateForumEventDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  bannerTextColor: Scalars['String']['input'];
  commentPrompt?: InputMaybe<Scalars['String']['input']>;
  contrastColor?: InputMaybe<Scalars['String']['input']>;
  customComponent?: InputMaybe<Scalars['String']['input']>;
  darkColor: Scalars['String']['input'];
  endDate: Scalars['Date']['input'];
  eventFormat?: InputMaybe<Scalars['String']['input']>;
  frontpageDescription?: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescriptionMobile?: InputMaybe<Scalars['JSON']['input']>;
  includesPoll?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  lightColor: Scalars['String']['input'];
  maxStickersPerUser?: InputMaybe<Scalars['Float']['input']>;
  pollAgreeWording?: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording?: InputMaybe<Scalars['String']['input']>;
  pollQuestion?: InputMaybe<Scalars['JSON']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  postPageDescription?: InputMaybe<Scalars['JSON']['input']>;
  publicData?: InputMaybe<Scalars['JSON']['input']>;
  startDate: Scalars['Date']['input'];
  tagId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateForumEventInput = {
  data: CreateForumEventDataInput;
};

export type CreateGardenCodeDataInput = {
  afOnly?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  fbLink?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['Date']['input']>;
  title: Scalars['String']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
};

export type CreateGardenCodeInput = {
  data: CreateGardenCodeDataInput;
};

export type CreateGoogleServiceAccountSessionDataInput = {
  active: Scalars['Boolean']['input'];
  email: Scalars['String']['input'];
  estimatedExpiry: Scalars['Date']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  refreshToken: Scalars['String']['input'];
  revoked: Scalars['Boolean']['input'];
};

export type CreateGoogleServiceAccountSessionInput = {
  data: CreateGoogleServiceAccountSessionDataInput;
};

export type CreateJargonTermDataInput = {
  altTerms: Array<Scalars['String']['input']>;
  approved?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  term: Scalars['String']['input'];
};

export type CreateJargonTermInput = {
  data: CreateJargonTermDataInput;
};

export type CreateLwEventDataInput = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  important?: InputMaybe<Scalars['Boolean']['input']>;
  intercom?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  properties?: InputMaybe<Scalars['JSON']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateLwEventInput = {
  data: CreateLwEventDataInput;
};

export type CreateLocalgroupDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type CreateLocalgroupInput = {
  data: CreateLocalgroupDataInput;
};

export type CreateMessageDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  conversationId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noEmail?: InputMaybe<Scalars['Boolean']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateMessageInput = {
  data: CreateMessageDataInput;
};

export type CreateModerationTemplateDataInput = {
  collectionName: Scalars['String']['input'];
  contents?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateModerationTemplateInput = {
  data: CreateModerationTemplateDataInput;
};

export type CreateModeratorActionDataInput = {
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateModeratorActionInput = {
  data: CreateModeratorActionDataInput;
};

export type CreateMultiDocumentDataInput = {
  collectionName: Scalars['String']['input'];
  contents?: InputMaybe<Scalars['JSON']['input']>;
  fieldName: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  parentDocumentId: Scalars['String']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
  tabSubtitle?: InputMaybe<Scalars['String']['input']>;
  tabTitle: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateMultiDocumentInput = {
  data: CreateMultiDocumentDataInput;
};

export type CreateNotificationDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  viewed?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateNotificationInput = {
  data: CreateNotificationDataInput;
};

export type CreatePetrovDayActionDataInput = {
  actionType: Scalars['String']['input'];
  data?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type CreatePetrovDayActionInput = {
  data: CreatePetrovDayActionDataInput;
};

export type CreatePodcastEpisodeDataInput = {
  episodeLink: Scalars['String']['input'];
  externalEpisodeId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  podcastId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreatePodcastEpisodeInput = {
  data: CreatePodcastEpisodeDataInput;
};

export type CreatePostDataInput = {
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
  coauthorStatuses?: InputMaybe<Array<Scalars['JSON']['input']>>;
  collabEditorDialogue?: InputMaybe<Scalars['Boolean']['input']>;
  collectionTitle?: InputMaybe<Scalars['String']['input']>;
  commentSortOrder?: InputMaybe<Scalars['String']['input']>;
  commentsLocked?: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter?: InputMaybe<Scalars['Date']['input']>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  curatedDate?: InputMaybe<Scalars['Date']['input']>;
  customHighlight?: InputMaybe<Scalars['JSON']['input']>;
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
  fmCrosspost?: InputMaybe<Scalars['JSON']['input']>;
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
  moderationGuidelines?: InputMaybe<Scalars['JSON']['input']>;
  moderationStyle?: InputMaybe<Scalars['String']['input']>;
  nextDayReminderSent?: InputMaybe<Scalars['Boolean']['input']>;
  noIndex?: InputMaybe<Scalars['Boolean']['input']>;
  onlineEvent?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn?: InputMaybe<Scalars['Boolean']['input']>;
  organizerIds?: InputMaybe<Array<Scalars['String']['input']>>;
  originalPostRelationSourceId?: InputMaybe<Scalars['String']['input']>;
  podcastEpisodeId?: InputMaybe<Scalars['String']['input']>;
  postCategory?: InputMaybe<Scalars['String']['input']>;
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
  socialPreview?: InputMaybe<Scalars['JSON']['input']>;
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

export type CreatePostEmbeddingDataInput = {
  embeddings?: InputMaybe<Array<Scalars['Float']['input']>>;
  lastGeneratedAt: Scalars['Date']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  model: Scalars['String']['input'];
  postHash: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};

export type CreatePostEmbeddingInput = {
  data: CreatePostEmbeddingDataInput;
};

export type CreatePostInput = {
  data: CreatePostDataInput;
};

export type CreatePostViewTimeDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreatePostViewTimeInput = {
  data: CreatePostViewTimeDataInput;
};

export type CreatePostViewsDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreatePostViewsInput = {
  data: CreatePostViewsDataInput;
};

export type CreateRssFeedDataInput = {
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

export type CreateRssFeedInput = {
  data: CreateRssFeedDataInput;
};

export type CreateReportDataInput = {
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

export type CreateReportInput = {
  data: CreateReportDataInput;
};

export type CreateSequenceDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type CreateSequenceInput = {
  data: CreateSequenceDataInput;
};

export type CreateSplashArtCoordinateDataInput = {
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

export type CreateSplashArtCoordinateInput = {
  data: CreateSplashArtCoordinateDataInput;
};

export type CreateSpotlightDataInput = {
  customSubtitle?: InputMaybe<Scalars['String']['input']>;
  customTitle?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  documentId: Scalars['String']['input'];
  documentType: Scalars['String']['input'];
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

export type CreateSpotlightInput = {
  data: CreateSpotlightDataInput;
};

export type CreateSubscriptionDataInput = {
  collectionName: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  state: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateSubscriptionInput = {
  data: CreateSubscriptionDataInput;
};

export type CreateSurveyDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
};

export type CreateSurveyInput = {
  data: CreateSurveyDataInput;
};

export type CreateSurveyQuestionDataInput = {
  format: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  order: Scalars['Float']['input'];
  question: Scalars['String']['input'];
  surveyId: Scalars['String']['input'];
};

export type CreateSurveyQuestionInput = {
  data: CreateSurveyQuestionDataInput;
};

export type CreateSurveyResponseDataInput = {
  clientId: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  response: Scalars['JSON']['input'];
  surveyId: Scalars['String']['input'];
  surveyScheduleId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateSurveyResponseInput = {
  data: CreateSurveyResponseDataInput;
};

export type CreateSurveyScheduleDataInput = {
  clientIds: Array<Scalars['String']['input']>;
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
  target: Scalars['String']['input'];
};

export type CreateSurveyScheduleInput = {
  data: CreateSurveyScheduleDataInput;
};

export type CreateTagDataInput = {
  adminOnly?: InputMaybe<Scalars['Boolean']['input']>;
  autoTagModel?: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt?: InputMaybe<Scalars['String']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canEditUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  canVoteOnRels?: InputMaybe<Array<Scalars['String']['input']>>;
  core?: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId?: InputMaybe<Scalars['String']['input']>;
  defaultOrder?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  descriptionTruncationCount?: InputMaybe<Scalars['Float']['input']>;
  forceAllowType3Audio?: InputMaybe<Scalars['Boolean']['input']>;
  introSequenceId?: InputMaybe<Scalars['String']['input']>;
  isPostType?: InputMaybe<Scalars['Boolean']['input']>;
  isSubforum?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines?: InputMaybe<Scalars['JSON']['input']>;
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
  subforumWelcomeText?: InputMaybe<Scalars['JSON']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  suggestedAsFilter?: InputMaybe<Scalars['Boolean']['input']>;
  tagFlagsIds?: InputMaybe<Array<Scalars['String']['input']>>;
  wikiGrade?: InputMaybe<Scalars['Int']['input']>;
  wikiOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateTagFlagDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Float']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTagFlagInput = {
  data: CreateTagFlagDataInput;
};

export type CreateTagInput = {
  data: CreateTagDataInput;
};

export type CreateTagRelDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateTagRelInput = {
  data: CreateTagRelDataInput;
};

export type CreateUltraFeedEventDataInput = {
  collectionName: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  event?: InputMaybe<Scalars['JSON']['input']>;
  eventType: Scalars['String']['input'];
  feedItemId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateUltraFeedEventInput = {
  data: CreateUltraFeedEventDataInput;
};

export type CreateUserDataInput = {
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
  biography?: InputMaybe<Scalars['JSON']['input']>;
  blueskyProfileURL?: InputMaybe<Scalars['String']['input']>;
  careerStage?: InputMaybe<Array<Scalars['String']['input']>>;
  collapseModerationGuidelines?: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting?: InputMaybe<Scalars['String']['input']>;
  commentingOnOtherUsersDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  criticismTipsDismissed?: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter?: InputMaybe<Scalars['String']['input']>;
  deleteContent?: InputMaybe<Scalars['Boolean']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  draftsListShowArchived?: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared?: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailSubscribedToCurated?: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections?: InputMaybe<Scalars['JSON']['input']>;
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
  howICanHelpOthers?: InputMaybe<Scalars['JSON']['input']>;
  howOthersCanHelpMe?: InputMaybe<Scalars['JSON']['input']>;
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
  moderationGuidelines?: InputMaybe<Scalars['JSON']['input']>;
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
  subforumPreferredLayout?: InputMaybe<Scalars['String']['input']>;
  subscribedToDigest?: InputMaybe<Scalars['Boolean']['input']>;
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

export type CreateUserEagDetailDataInput = {
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateUserEagDetailInput = {
  data: CreateUserEagDetailDataInput;
};

export type CreateUserInput = {
  data: CreateUserDataInput;
};

export type CreateUserJobAdDataInput = {
  adState: Scalars['String']['input'];
  jobName: Scalars['String']['input'];
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  reminderSetAt?: InputMaybe<Scalars['Date']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateUserJobAdInput = {
  data: CreateUserJobAdDataInput;
};

export type CreateUserMostValuablePostDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateUserMostValuablePostInput = {
  data: CreateUserMostValuablePostDataInput;
};

export type CreateUserRateLimitDataInput = {
  actionsPerInterval: Scalars['Float']['input'];
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  intervalLength: Scalars['Float']['input'];
  intervalUnit: Scalars['String']['input'];
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateUserRateLimitInput = {
  data: CreateUserRateLimitDataInput;
};

export type CreateUserTagRelDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  subforumEmailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost?: InputMaybe<Scalars['Boolean']['input']>;
  subforumShowUnreadInSidebar?: InputMaybe<Scalars['Boolean']['input']>;
  tagId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateUserTagRelInput = {
  data: CreateUserTagRelDataInput;
};

export type CronHistory = {
  __typename?: 'CronHistory';
  _id?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['Date']['output']>;
  intendedAt?: Maybe<Scalars['Date']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  result?: Maybe<Scalars['JSON']['output']>;
  startedAt?: Maybe<Scalars['Date']['output']>;
};

export type CrossedKarmaThresholdResult = {
  __typename?: 'CrossedKarmaThresholdResult';
  results: Array<Post>;
};

export type CuratedAndPopularThisWeekResult = {
  __typename?: 'CuratedAndPopularThisWeekResult';
  results: Array<Post>;
};

export type CurationEmail = {
  __typename?: 'CurationEmail';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type CurationNotice = {
  __typename?: 'CurationNotice';
  _id: Scalars['String']['output'];
  comment?: Maybe<Comment>;
  commentId?: Maybe<Scalars['String']['output']>;
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  post?: Maybe<Post>;
  postId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};


export type CurationNoticeContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type CurationNoticeOutput = {
  __typename?: 'CurationNoticeOutput';
  data?: Maybe<CurationNotice>;
};

export type DatabaseMetadata = {
  __typename?: 'DatabaseMetadata';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type DebouncerEvents = {
  __typename?: 'DebouncerEvents';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type DialogueCheck = {
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

export type DialogueMatchPreference = {
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

export type DialogueMatchPreferenceOutput = {
  __typename?: 'DialogueMatchPreferenceOutput';
  data?: Maybe<DialogueMatchPreference>;
};

export type Digest = {
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

export type DigestHighlightsResult = {
  __typename?: 'DigestHighlightsResult';
  results: Array<Post>;
};

export type DigestOutput = {
  __typename?: 'DigestOutput';
  data?: Maybe<Digest>;
};

export type DigestPlannerPost = {
  __typename?: 'DigestPlannerPost';
  digestPost?: Maybe<DigestPost>;
  post?: Maybe<Post>;
  rating?: Maybe<Scalars['Int']['output']>;
};

export type DigestPost = {
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

export type DigestPostOutput = {
  __typename?: 'DigestPostOutput';
  data?: Maybe<DigestPost>;
};

export type DigestPostsThisWeekResult = {
  __typename?: 'DigestPostsThisWeekResult';
  results: Array<Post>;
};

export type DocumentDeletion = {
  __typename?: 'DocumentDeletion';
  createdAt: Scalars['Date']['output'];
  docFields?: Maybe<MultiDocument>;
  documentId: Scalars['String']['output'];
  netChange: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type ElectionCandidate = {
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

export type ElectionCandidateOutput = {
  __typename?: 'ElectionCandidateOutput';
  data?: Maybe<ElectionCandidate>;
};

export type ElectionVote = {
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

export type ElectionVoteOutput = {
  __typename?: 'ElectionVoteOutput';
  data?: Maybe<ElectionVote>;
};

export type ElicitBlockData = {
  __typename?: 'ElicitBlockData';
  _id?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  predictions?: Maybe<Array<Maybe<ElicitPrediction>>>;
  resolution?: Maybe<Scalars['Boolean']['output']>;
  resolvesBy?: Maybe<Scalars['Date']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type ElicitPrediction = {
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

export type ElicitQuestion = {
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

export type ElicitQuestionOutput = {
  __typename?: 'ElicitQuestionOutput';
  data?: Maybe<ElicitQuestion>;
};

export type ElicitQuestionPrediction = {
  __typename?: 'ElicitQuestionPrediction';
  _id: Scalars['String']['output'];
  binaryQuestionId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  creator: Scalars['JSON']['output'];
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

export type ElicitUser = {
  __typename?: 'ElicitUser';
  _id?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  isQuestionCreator?: Maybe<Scalars['Boolean']['output']>;
  lwUser?: Maybe<User>;
  sourceUserId?: Maybe<Scalars['String']['output']>;
};

export type EmailPreview = {
  __typename?: 'EmailPreview';
  html?: Maybe<Scalars['String']['output']>;
  subject?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  to?: Maybe<Scalars['String']['output']>;
};

export type EmailTokens = {
  __typename?: 'EmailTokens';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type ExternalPost = {
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

export type ExternalPostImportData = {
  __typename?: 'ExternalPostImportData';
  alreadyExists?: Maybe<Scalars['Boolean']['output']>;
  post?: Maybe<ExternalPost>;
};

export type FeaturedResource = {
  __typename?: 'FeaturedResource';
  _id: Scalars['String']['output'];
  body?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  ctaText: Scalars['String']['output'];
  ctaUrl: Scalars['String']['output'];
  expiresAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

export type FeedCommentThread = {
  __typename?: 'FeedCommentThread';
  _id: Scalars['String']['output'];
  commentMetaInfos?: Maybe<Scalars['JSON']['output']>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  post?: Maybe<Post>;
};

export type FeedPost = {
  __typename?: 'FeedPost';
  _id: Scalars['String']['output'];
  post?: Maybe<Post>;
  postMetaInfo?: Maybe<Scalars['JSON']['output']>;
};

export type FeedSpotlightItem = {
  __typename?: 'FeedSpotlightItem';
  _id: Scalars['String']['output'];
  spotlight?: Maybe<Spotlight>;
};

export type FieldChange = {
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

export type ForumEvent = {
  __typename?: 'ForumEvent';
  _id: Scalars['String']['output'];
  bannerImageId?: Maybe<Scalars['String']['output']>;
  bannerTextColor: Scalars['String']['output'];
  commentPrompt?: Maybe<Scalars['String']['output']>;
  contrastColor?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  customComponent?: Maybe<Scalars['String']['output']>;
  darkColor: Scalars['String']['output'];
  endDate: Scalars['Date']['output'];
  eventFormat: Scalars['String']['output'];
  frontpageDescription?: Maybe<Revision>;
  frontpageDescriptionMobile?: Maybe<Revision>;
  frontpageDescriptionMobile_latest?: Maybe<Scalars['String']['output']>;
  frontpageDescription_latest?: Maybe<Scalars['String']['output']>;
  includesPoll: Scalars['Boolean']['output'];
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


export type ForumEventFrontpageDescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventFrontpageDescriptionMobileArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventPollQuestionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventPostPageDescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type ForumEventOutput = {
  __typename?: 'ForumEventOutput';
  data?: Maybe<ForumEvent>;
};

export type GardenCode = {
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


export type GardenCodeContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type GardenCodeOutput = {
  __typename?: 'GardenCodeOutput';
  data?: Maybe<GardenCode>;
};

export type GivingSeasonHeart = {
  __typename?: 'GivingSeasonHeart';
  displayName: Scalars['String']['output'];
  theta: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type GoogleServiceAccountSession = {
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

export type GoogleServiceAccountSessionOutput = {
  __typename?: 'GoogleServiceAccountSessionOutput';
  data?: Maybe<GoogleServiceAccountSession>;
};

export type GoogleVertexPostsResult = {
  __typename?: 'GoogleVertexPostsResult';
  results: Array<VertexRecommendedPost>;
};

export type Images = {
  __typename?: 'Images';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type JargonTerm = {
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


export type JargonTermContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type JargonTermOutput = {
  __typename?: 'JargonTermOutput';
  data?: Maybe<JargonTerm>;
};

export type KarmaChanges = {
  __typename?: 'KarmaChanges';
  comments?: Maybe<Array<Maybe<CommentKarmaChange>>>;
  endDate?: Maybe<Scalars['Date']['output']>;
  nextBatchDate?: Maybe<Scalars['Date']['output']>;
  posts?: Maybe<Array<Maybe<PostKarmaChange>>>;
  startDate?: Maybe<Scalars['Date']['output']>;
  tagRevisions?: Maybe<Array<Maybe<RevisionsKarmaChange>>>;
  thisWeeksKarmaChanges?: Maybe<KarmaChangesSimple>;
  todaysKarmaChanges?: Maybe<KarmaChangesSimple>;
  totalChange?: Maybe<Scalars['Int']['output']>;
  updateFrequency?: Maybe<Scalars['String']['output']>;
};

export type KarmaChangesSimple = {
  __typename?: 'KarmaChangesSimple';
  comments?: Maybe<Array<Maybe<CommentKarmaChange>>>;
  posts?: Maybe<Array<Maybe<PostKarmaChange>>>;
  tagRevisions?: Maybe<Array<Maybe<RevisionsKarmaChange>>>;
};

export type LwEvent = {
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

export type LwEventOutput = {
  __typename?: 'LWEventOutput';
  data?: Maybe<LwEvent>;
};

export type LatLng = {
  __typename?: 'LatLng';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type LegacyData = {
  __typename?: 'LegacyData';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type LlmConversation = {
  __typename?: 'LlmConversation';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  lastUpdatedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  messages?: Maybe<Array<Maybe<LlmMessage>>>;
  model?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  systemPrompt?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  totalCharacterCount?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type LlmConversationOutput = {
  __typename?: 'LlmConversationOutput';
  data?: Maybe<LlmConversation>;
};

export type LlmMessage = {
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

export type Localgroup = {
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
  lastActivity?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  meetupLink?: Maybe<Scalars['String']['output']>;
  mongoLocation?: Maybe<Scalars['JSON']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  nameInAnotherLanguage?: Maybe<Scalars['String']['output']>;
  organizerIds: Array<Scalars['String']['output']>;
  organizers: Array<User>;
  schemaVersion: Scalars['Float']['output'];
  slackLink?: Maybe<Scalars['String']['output']>;
  types: Array<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};


export type LocalgroupContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type LocalgroupOutput = {
  __typename?: 'LocalgroupOutput';
  data?: Maybe<Localgroup>;
};

export type LoginReturnData = {
  __typename?: 'LoginReturnData';
  token?: Maybe<Scalars['String']['output']>;
};

export type ManifoldProbabilitiesCache = {
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

export type Message = {
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


export type MessageContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type MessageOutput = {
  __typename?: 'MessageOutput';
  data?: Maybe<Message>;
};

export type Migration = {
  __typename?: 'Migration';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type MigrationRun = {
  __typename?: 'MigrationRun';
  finished?: Maybe<Scalars['Date']['output']>;
  name: Scalars['String']['output'];
  started: Scalars['Date']['output'];
  succeeded?: Maybe<Scalars['Boolean']['output']>;
};

export type MigrationStatus = {
  __typename?: 'MigrationStatus';
  dateWritten?: Maybe<Scalars['String']['output']>;
  lastRun?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  runs?: Maybe<Array<MigrationRun>>;
};

export type MigrationsDashboardData = {
  __typename?: 'MigrationsDashboardData';
  migrations?: Maybe<Array<MigrationStatus>>;
};

export type ModerationTemplate = {
  __typename?: 'ModerationTemplate';
  _id: Scalars['String']['output'];
  collectionName: Scalars['String']['output'];
  contents?: Maybe<Revision>;
  contents_latest?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  order: Scalars['Float']['output'];
  schemaVersion: Scalars['Float']['output'];
};


export type ModerationTemplateContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type ModerationTemplateOutput = {
  __typename?: 'ModerationTemplateOutput';
  data?: Maybe<ModerationTemplate>;
};

export type ModeratorAction = {
  __typename?: 'ModeratorAction';
  _id: Scalars['String']['output'];
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['Date']['output'];
  endedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  type: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type ModeratorActionOutput = {
  __typename?: 'ModeratorActionOutput';
  data?: Maybe<ModeratorAction>;
};

export type ModeratorIpAddressInfo = {
  __typename?: 'ModeratorIPAddressInfo';
  ip: Scalars['String']['output'];
  userIds: Array<Scalars['String']['output']>;
};

export type MostReadAuthor = {
  __typename?: 'MostReadAuthor';
  _id?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  engagementPercentile?: Maybe<Scalars['Float']['output']>;
  profileImageId?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
};

export type MostReadTopic = {
  __typename?: 'MostReadTopic';
  count?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  shortName?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
};

export type MostReceivedReact = {
  __typename?: 'MostReceivedReact';
  count?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type MultiAdvisorRequestInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiAdvisorRequestOutput = {
  __typename?: 'MultiAdvisorRequestOutput';
  results?: Maybe<Array<Maybe<AdvisorRequest>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiArbitalTagContentRelInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiArbitalTagContentRelOutput = {
  __typename?: 'MultiArbitalTagContentRelOutput';
  results?: Maybe<Array<Maybe<ArbitalTagContentRel>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiBanInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiBanOutput = {
  __typename?: 'MultiBanOutput';
  results?: Maybe<Array<Maybe<Ban>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiBookInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiBookOutput = {
  __typename?: 'MultiBookOutput';
  results?: Maybe<Array<Maybe<Book>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiChapterInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiChapterOutput = {
  __typename?: 'MultiChapterOutput';
  results?: Maybe<Array<Maybe<Chapter>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiCkEditorUserSessionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiCkEditorUserSessionOutput = {
  __typename?: 'MultiCkEditorUserSessionOutput';
  results?: Maybe<Array<Maybe<CkEditorUserSession>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiClientIdInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiClientIdOutput = {
  __typename?: 'MultiClientIdOutput';
  results?: Maybe<Array<Maybe<ClientId>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiCollectionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiCollectionOutput = {
  __typename?: 'MultiCollectionOutput';
  results?: Maybe<Array<Maybe<Collection>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiCommentInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiCommentModeratorActionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiCommentModeratorActionOutput = {
  __typename?: 'MultiCommentModeratorActionOutput';
  results?: Maybe<Array<Maybe<CommentModeratorAction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiCommentOutput = {
  __typename?: 'MultiCommentOutput';
  results?: Maybe<Array<Maybe<Comment>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiConversationInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiConversationOutput = {
  __typename?: 'MultiConversationOutput';
  results?: Maybe<Array<Maybe<Conversation>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiCurationNoticeInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiCurationNoticeOutput = {
  __typename?: 'MultiCurationNoticeOutput';
  results?: Maybe<Array<Maybe<CurationNotice>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiDialogueCheckInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiDialogueCheckOutput = {
  __typename?: 'MultiDialogueCheckOutput';
  results?: Maybe<Array<Maybe<DialogueCheck>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiDialogueMatchPreferenceInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiDialogueMatchPreferenceOutput = {
  __typename?: 'MultiDialogueMatchPreferenceOutput';
  results?: Maybe<Array<Maybe<DialogueMatchPreference>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiDigestInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiDigestOutput = {
  __typename?: 'MultiDigestOutput';
  results?: Maybe<Array<Maybe<Digest>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiDigestPostInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiDigestPostOutput = {
  __typename?: 'MultiDigestPostOutput';
  results?: Maybe<Array<Maybe<DigestPost>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiDocument = {
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


export type MultiDocumentContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type MultiDocumentContributorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


export type MultiDocumentTableOfContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type MultiDocumentOutput = {
  __typename?: 'MultiDocumentOutput';
  data?: Maybe<MultiDocument>;
};

export type MultiElectionCandidateInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiElectionCandidateOutput = {
  __typename?: 'MultiElectionCandidateOutput';
  results?: Maybe<Array<Maybe<ElectionCandidate>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiElectionVoteInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiElectionVoteOutput = {
  __typename?: 'MultiElectionVoteOutput';
  results?: Maybe<Array<Maybe<ElectionVote>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiElicitQuestionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiElicitQuestionOutput = {
  __typename?: 'MultiElicitQuestionOutput';
  results?: Maybe<Array<Maybe<ElicitQuestion>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiElicitQuestionPredictionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiElicitQuestionPredictionOutput = {
  __typename?: 'MultiElicitQuestionPredictionOutput';
  results?: Maybe<Array<Maybe<ElicitQuestionPrediction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiFeaturedResourceInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiFeaturedResourceOutput = {
  __typename?: 'MultiFeaturedResourceOutput';
  results?: Maybe<Array<Maybe<FeaturedResource>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiForumEventInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiForumEventOutput = {
  __typename?: 'MultiForumEventOutput';
  results?: Maybe<Array<Maybe<ForumEvent>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiGardenCodeInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiGardenCodeOutput = {
  __typename?: 'MultiGardenCodeOutput';
  results?: Maybe<Array<Maybe<GardenCode>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiGoogleServiceAccountSessionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiGoogleServiceAccountSessionOutput = {
  __typename?: 'MultiGoogleServiceAccountSessionOutput';
  results?: Maybe<Array<Maybe<GoogleServiceAccountSession>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiJargonTermInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiJargonTermOutput = {
  __typename?: 'MultiJargonTermOutput';
  results?: Maybe<Array<Maybe<JargonTerm>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiLwEventInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiLwEventOutput = {
  __typename?: 'MultiLWEventOutput';
  results?: Maybe<Array<Maybe<LwEvent>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiLlmConversationInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiLlmConversationOutput = {
  __typename?: 'MultiLlmConversationOutput';
  results?: Maybe<Array<Maybe<LlmConversation>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiLocalgroupInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiLocalgroupOutput = {
  __typename?: 'MultiLocalgroupOutput';
  results?: Maybe<Array<Maybe<Localgroup>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiMessageInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiMessageOutput = {
  __typename?: 'MultiMessageOutput';
  results?: Maybe<Array<Maybe<Message>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiModerationTemplateInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiModerationTemplateOutput = {
  __typename?: 'MultiModerationTemplateOutput';
  results?: Maybe<Array<Maybe<ModerationTemplate>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiModeratorActionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiModeratorActionOutput = {
  __typename?: 'MultiModeratorActionOutput';
  results?: Maybe<Array<Maybe<ModeratorAction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiMultiDocumentInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiMultiDocumentOutput = {
  __typename?: 'MultiMultiDocumentOutput';
  results?: Maybe<Array<Maybe<MultiDocument>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiNotificationInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiNotificationOutput = {
  __typename?: 'MultiNotificationOutput';
  results?: Maybe<Array<Maybe<Notification>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPetrovDayActionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPetrovDayActionOutput = {
  __typename?: 'MultiPetrovDayActionOutput';
  results?: Maybe<Array<Maybe<PetrovDayAction>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPodcastEpisodeInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPodcastEpisodeOutput = {
  __typename?: 'MultiPodcastEpisodeOutput';
  results?: Maybe<Array<Maybe<PodcastEpisode>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPodcastInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPodcastOutput = {
  __typename?: 'MultiPodcastOutput';
  results?: Maybe<Array<Maybe<Podcast>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPostAnalyticsResult = {
  __typename?: 'MultiPostAnalyticsResult';
  posts?: Maybe<Array<Maybe<PostAnalytics2Result>>>;
  totalCount: Scalars['Int']['output'];
};

export type MultiPostEmbeddingInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPostEmbeddingOutput = {
  __typename?: 'MultiPostEmbeddingOutput';
  results?: Maybe<Array<Maybe<PostEmbedding>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPostInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPostOutput = {
  __typename?: 'MultiPostOutput';
  results?: Maybe<Array<Maybe<Post>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPostRelationInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPostRelationOutput = {
  __typename?: 'MultiPostRelationOutput';
  results?: Maybe<Array<Maybe<PostRelation>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPostViewTimeInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPostViewTimeOutput = {
  __typename?: 'MultiPostViewTimeOutput';
  results?: Maybe<Array<Maybe<PostViewTime>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiPostViewsInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiPostViewsOutput = {
  __typename?: 'MultiPostViewsOutput';
  results?: Maybe<Array<Maybe<PostViews>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiRssFeedInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiRssFeedOutput = {
  __typename?: 'MultiRSSFeedOutput';
  results?: Maybe<Array<Maybe<RssFeed>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiReportInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiReportOutput = {
  __typename?: 'MultiReportOutput';
  results?: Maybe<Array<Maybe<Report>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiReviewVoteInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiReviewVoteOutput = {
  __typename?: 'MultiReviewVoteOutput';
  results?: Maybe<Array<Maybe<ReviewVote>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiReviewWinnerArtInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiReviewWinnerArtOutput = {
  __typename?: 'MultiReviewWinnerArtOutput';
  results?: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiReviewWinnerInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiReviewWinnerOutput = {
  __typename?: 'MultiReviewWinnerOutput';
  results?: Maybe<Array<Maybe<ReviewWinner>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiRevisionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiRevisionOutput = {
  __typename?: 'MultiRevisionOutput';
  results?: Maybe<Array<Maybe<Revision>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSequenceInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSequenceOutput = {
  __typename?: 'MultiSequenceOutput';
  results?: Maybe<Array<Maybe<Sequence>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSplashArtCoordinateInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSplashArtCoordinateOutput = {
  __typename?: 'MultiSplashArtCoordinateOutput';
  results?: Maybe<Array<Maybe<SplashArtCoordinate>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSpotlightInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSpotlightOutput = {
  __typename?: 'MultiSpotlightOutput';
  results?: Maybe<Array<Maybe<Spotlight>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSubscriptionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSubscriptionOutput = {
  __typename?: 'MultiSubscriptionOutput';
  results?: Maybe<Array<Maybe<Subscription>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSurveyOutput = {
  __typename?: 'MultiSurveyOutput';
  results?: Maybe<Array<Maybe<Survey>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyQuestionInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSurveyQuestionOutput = {
  __typename?: 'MultiSurveyQuestionOutput';
  results?: Maybe<Array<Maybe<SurveyQuestion>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyResponseInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSurveyResponseOutput = {
  __typename?: 'MultiSurveyResponseOutput';
  results?: Maybe<Array<Maybe<SurveyResponse>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyScheduleInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiSurveyScheduleOutput = {
  __typename?: 'MultiSurveyScheduleOutput';
  results?: Maybe<Array<Maybe<SurveySchedule>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiTagFlagInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiTagFlagOutput = {
  __typename?: 'MultiTagFlagOutput';
  results?: Maybe<Array<Maybe<TagFlag>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiTagInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiTagOutput = {
  __typename?: 'MultiTagOutput';
  results?: Maybe<Array<Maybe<Tag>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiTagRelInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiTagRelOutput = {
  __typename?: 'MultiTagRelOutput';
  results?: Maybe<Array<Maybe<TagRel>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiTypingIndicatorInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiTypingIndicatorOutput = {
  __typename?: 'MultiTypingIndicatorOutput';
  results?: Maybe<Array<Maybe<TypingIndicator>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiUserEagDetailInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiUserEagDetailOutput = {
  __typename?: 'MultiUserEAGDetailOutput';
  results?: Maybe<Array<Maybe<UserEagDetail>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiUserInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiUserJobAdInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiUserJobAdOutput = {
  __typename?: 'MultiUserJobAdOutput';
  results?: Maybe<Array<Maybe<UserJobAd>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiUserMostValuablePostInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiUserMostValuablePostOutput = {
  __typename?: 'MultiUserMostValuablePostOutput';
  results?: Maybe<Array<Maybe<UserMostValuablePost>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiUserOutput = {
  __typename?: 'MultiUserOutput';
  results?: Maybe<Array<Maybe<User>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiUserRateLimitInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiUserRateLimitOutput = {
  __typename?: 'MultiUserRateLimitOutput';
  results?: Maybe<Array<Maybe<UserRateLimit>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiUserTagRelInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiUserTagRelOutput = {
  __typename?: 'MultiUserTagRelOutput';
  results?: Maybe<Array<Maybe<UserTagRel>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MultiVoteInput = {
  enableTotal?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  terms?: InputMaybe<Scalars['JSON']['input']>;
};

export type MultiVoteOutput = {
  __typename?: 'MultiVoteOutput';
  results?: Maybe<Array<Maybe<Vote>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type Mutation = {
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
  createArbitalTagContentRel?: Maybe<ArbitalTagContentRelOutput>;
  createBan?: Maybe<BanOutput>;
  createBook?: Maybe<BookOutput>;
  createChapter?: Maybe<ChapterOutput>;
  createCollection?: Maybe<CollectionOutput>;
  createComment?: Maybe<CommentOutput>;
  createCommentModeratorAction?: Maybe<CommentModeratorActionOutput>;
  createConversation?: Maybe<ConversationOutput>;
  createCurationNotice?: Maybe<CurationNoticeOutput>;
  createDialogueMatchPreference?: Maybe<DialogueMatchPreferenceOutput>;
  createDigest?: Maybe<DigestOutput>;
  createDigestPost?: Maybe<DigestPostOutput>;
  createElectionCandidate?: Maybe<ElectionCandidateOutput>;
  createElectionVote?: Maybe<ElectionVoteOutput>;
  createElicitQuestion?: Maybe<ElicitQuestionOutput>;
  createForumEvent?: Maybe<ForumEventOutput>;
  createGardenCode?: Maybe<GardenCodeOutput>;
  createGoogleServiceAccountSession?: Maybe<GoogleServiceAccountSessionOutput>;
  createJargonTerm?: Maybe<JargonTermOutput>;
  createLWEvent?: Maybe<LwEventOutput>;
  createLocalgroup?: Maybe<LocalgroupOutput>;
  createMessage?: Maybe<MessageOutput>;
  createModerationTemplate?: Maybe<ModerationTemplateOutput>;
  createModeratorAction?: Maybe<ModeratorActionOutput>;
  createMultiDocument?: Maybe<MultiDocumentOutput>;
  createNotification?: Maybe<NotificationOutput>;
  createPetrovDayAction?: Maybe<PetrovDayActionOutput>;
  createPodcastEpisode?: Maybe<PodcastEpisodeOutput>;
  createPost?: Maybe<PostOutput>;
  createPostEmbedding?: Maybe<PostEmbeddingOutput>;
  createPostViewTime?: Maybe<PostViewTimeOutput>;
  createPostViews?: Maybe<PostViewsOutput>;
  createRSSFeed?: Maybe<RssFeedOutput>;
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
  createTagRel?: Maybe<TagRelOutput>;
  createUltraFeedEvent?: Maybe<UltraFeedEventOutput>;
  createUser?: Maybe<UserOutput>;
  createUserEAGDetail?: Maybe<UserEagDetailOutput>;
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
  setIsBookmarked: User;
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
  unlinkCrossposter?: Maybe<Scalars['String']['output']>;
  unlockPost?: Maybe<Post>;
  unlockThread: Scalars['Boolean']['output'];
  updateAdvisorRequest?: Maybe<AdvisorRequestOutput>;
  updateArbitalTagContentRel?: Maybe<ArbitalTagContentRelOutput>;
  updateBan?: Maybe<BanOutput>;
  updateBook?: Maybe<BookOutput>;
  updateChapter?: Maybe<ChapterOutput>;
  updateCollection?: Maybe<CollectionOutput>;
  updateComment?: Maybe<CommentOutput>;
  updateCommentModeratorAction?: Maybe<CommentModeratorActionOutput>;
  updateContinueReading?: Maybe<Scalars['Boolean']['output']>;
  updateConversation?: Maybe<ConversationOutput>;
  updateCurationNotice?: Maybe<CurationNoticeOutput>;
  updateDialogueMatchPreference?: Maybe<DialogueMatchPreferenceOutput>;
  updateDigest?: Maybe<DigestOutput>;
  updateDigestPost?: Maybe<DigestPostOutput>;
  updateElectionCandidate?: Maybe<ElectionCandidateOutput>;
  updateElectionVote?: Maybe<ElectionVoteOutput>;
  updateElicitQuestion?: Maybe<ElicitQuestionOutput>;
  updateForumEvent?: Maybe<ForumEventOutput>;
  updateGardenCode?: Maybe<GardenCodeOutput>;
  updateGoogleServiceAccountSession?: Maybe<GoogleServiceAccountSessionOutput>;
  updateJargonTerm?: Maybe<JargonTermOutput>;
  updateLWEvent?: Maybe<LwEventOutput>;
  updateLlmConversation?: Maybe<LlmConversationOutput>;
  updateLocalgroup?: Maybe<LocalgroupOutput>;
  updateMessage?: Maybe<MessageOutput>;
  updateModerationTemplate?: Maybe<ModerationTemplateOutput>;
  updateModeratorAction?: Maybe<ModeratorActionOutput>;
  updateMultiDocument?: Maybe<MultiDocumentOutput>;
  updateNotification?: Maybe<NotificationOutput>;
  updatePodcastEpisode?: Maybe<PodcastEpisodeOutput>;
  updatePost?: Maybe<PostOutput>;
  updatePostEmbedding?: Maybe<PostEmbeddingOutput>;
  updatePostViewTime?: Maybe<PostViewTimeOutput>;
  updatePostViews?: Maybe<PostViewsOutput>;
  updateRSSFeed?: Maybe<RssFeedOutput>;
  updateReport?: Maybe<ReportOutput>;
  updateRevision?: Maybe<RevisionOutput>;
  updateSequence?: Maybe<SequenceOutput>;
  updateSplashArtCoordinate?: Maybe<SplashArtCoordinateOutput>;
  updateSpotlight?: Maybe<SpotlightOutput>;
  updateSurvey?: Maybe<SurveyOutput>;
  updateSurveyQuestion?: Maybe<SurveyQuestionOutput>;
  updateSurveyResponse?: Maybe<SurveyResponseOutput>;
  updateSurveySchedule?: Maybe<SurveyScheduleOutput>;
  updateTag?: Maybe<TagOutput>;
  updateTagFlag?: Maybe<TagFlagOutput>;
  updateTagRel?: Maybe<TagRelOutput>;
  updateUser?: Maybe<UserOutput>;
  updateUserEAGDetail?: Maybe<UserEagDetailOutput>;
  updateUserJobAd?: Maybe<UserJobAdOutput>;
  updateUserMostValuablePost?: Maybe<UserMostValuablePostOutput>;
  updateUserRateLimit?: Maybe<UserRateLimitOutput>;
  updateUserTagRel?: Maybe<UserTagRelOutput>;
  upsertUserTypingIndicator?: Maybe<TypingIndicator>;
  useEmailToken?: Maybe<Scalars['JSON']['output']>;
};


export type MutationAddForumEventVoteArgs = {
  delta?: InputMaybe<Scalars['Float']['input']>;
  forumEventId: Scalars['String']['input'];
  postIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  x: Scalars['Float']['input'];
};


export type MutationAddGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
  theta: Scalars['Float']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};


export type MutationCancelRsvpToEventArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationImportGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationMakeElicitPredictionArgs = {
  prediction?: InputMaybe<Scalars['Int']['input']>;
  questionId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationNewUserCompleteProfileArgs = {
  acceptedTos?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  subscribeToDigest: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};


export type MutationPetrovDayLaunchMissileArgs = {
  launchCode?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRsvpToEventArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  private?: InputMaybe<Scalars['Boolean']['input']>;
  response?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveForumEventStickerArgs = {
  forumEventId: Scalars['String']['input'];
  stickerId: Scalars['String']['input'];
};


export type MutationRemoveForumEventVoteArgs = {
  forumEventId: Scalars['String']['input'];
};


export type MutationRemoveGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
};


export type MutationUpdateSearchSynonymsArgs = {
  synonyms: Array<Scalars['String']['input']>;
};


export type MutationUserExpandFrontpageSectionArgs = {
  expanded: Scalars['Boolean']['input'];
  section: Scalars['String']['input'];
};


export type MutationUserUpdateSubforumMembershipArgs = {
  member: Scalars['Boolean']['input'];
  tagId: Scalars['String']['input'];
};


export type MutationAcceptCoauthorRequestArgs = {
  accept?: InputMaybe<Scalars['Boolean']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddOrUpvoteTagArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddTagsArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
  tagIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationAlignmentCommentArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAlignmentPostArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAnalyticsEventArgs = {
  events?: InputMaybe<Array<Scalars['JSON']['input']>>;
  now?: InputMaybe<Scalars['Date']['input']>;
};


export type MutationAutosaveRevisionArgs = {
  contents: AutosaveContentType;
  postId: Scalars['String']['input'];
};


export type MutationClickRecommendationArgs = {
  postId: Scalars['String']['input'];
};


export type MutationConnectCrossposterArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateAdvisorRequestArgs = {
  data: CreateAdvisorRequestDataInput;
};


export type MutationCreateArbitalTagContentRelArgs = {
  data: CreateArbitalTagContentRelDataInput;
};


export type MutationCreateBanArgs = {
  data: CreateBanDataInput;
};


export type MutationCreateBookArgs = {
  data: CreateBookDataInput;
};


export type MutationCreateChapterArgs = {
  data: CreateChapterDataInput;
};


export type MutationCreateCollectionArgs = {
  data: CreateCollectionDataInput;
};


export type MutationCreateCommentArgs = {
  data: CreateCommentDataInput;
};


export type MutationCreateCommentModeratorActionArgs = {
  data: CreateCommentModeratorActionDataInput;
};


export type MutationCreateConversationArgs = {
  data: CreateConversationDataInput;
};


export type MutationCreateCurationNoticeArgs = {
  data: CreateCurationNoticeDataInput;
};


export type MutationCreateDialogueMatchPreferenceArgs = {
  data: CreateDialogueMatchPreferenceDataInput;
};


export type MutationCreateDigestArgs = {
  data: CreateDigestDataInput;
};


export type MutationCreateDigestPostArgs = {
  data: CreateDigestPostDataInput;
};


export type MutationCreateElectionCandidateArgs = {
  data: CreateElectionCandidateDataInput;
};


export type MutationCreateElectionVoteArgs = {
  data: CreateElectionVoteDataInput;
};


export type MutationCreateElicitQuestionArgs = {
  data: CreateElicitQuestionDataInput;
};


export type MutationCreateForumEventArgs = {
  data: CreateForumEventDataInput;
};


export type MutationCreateGardenCodeArgs = {
  data: CreateGardenCodeDataInput;
};


export type MutationCreateGoogleServiceAccountSessionArgs = {
  data: CreateGoogleServiceAccountSessionDataInput;
};


export type MutationCreateJargonTermArgs = {
  data: CreateJargonTermDataInput;
};


export type MutationCreateLwEventArgs = {
  data: CreateLwEventDataInput;
};


export type MutationCreateLocalgroupArgs = {
  data: CreateLocalgroupDataInput;
};


export type MutationCreateMessageArgs = {
  data: CreateMessageDataInput;
};


export type MutationCreateModerationTemplateArgs = {
  data: CreateModerationTemplateDataInput;
};


export type MutationCreateModeratorActionArgs = {
  data: CreateModeratorActionDataInput;
};


export type MutationCreateMultiDocumentArgs = {
  data: CreateMultiDocumentDataInput;
};


export type MutationCreateNotificationArgs = {
  data: CreateNotificationDataInput;
};


export type MutationCreatePetrovDayActionArgs = {
  data: CreatePetrovDayActionDataInput;
};


export type MutationCreatePodcastEpisodeArgs = {
  data: CreatePodcastEpisodeDataInput;
};


export type MutationCreatePostArgs = {
  data: CreatePostDataInput;
};


export type MutationCreatePostEmbeddingArgs = {
  data: CreatePostEmbeddingDataInput;
};


export type MutationCreatePostViewTimeArgs = {
  data: CreatePostViewTimeDataInput;
};


export type MutationCreatePostViewsArgs = {
  data: CreatePostViewsDataInput;
};


export type MutationCreateRssFeedArgs = {
  data: CreateRssFeedDataInput;
};


export type MutationCreateReportArgs = {
  data: CreateReportDataInput;
};


export type MutationCreateSequenceArgs = {
  data: CreateSequenceDataInput;
};


export type MutationCreateSplashArtCoordinateArgs = {
  data: CreateSplashArtCoordinateDataInput;
};


export type MutationCreateSpotlightArgs = {
  data: CreateSpotlightDataInput;
};


export type MutationCreateSubscriptionArgs = {
  data: CreateSubscriptionDataInput;
};


export type MutationCreateSurveyArgs = {
  data: CreateSurveyDataInput;
};


export type MutationCreateSurveyQuestionArgs = {
  data: CreateSurveyQuestionDataInput;
};


export type MutationCreateSurveyResponseArgs = {
  data: CreateSurveyResponseDataInput;
};


export type MutationCreateSurveyScheduleArgs = {
  data: CreateSurveyScheduleDataInput;
};


export type MutationCreateTagArgs = {
  data: CreateTagDataInput;
};


export type MutationCreateTagFlagArgs = {
  data: CreateTagFlagDataInput;
};


export type MutationCreateTagRelArgs = {
  data: CreateTagRelDataInput;
};


export type MutationCreateUltraFeedEventArgs = {
  data: CreateUltraFeedEventDataInput;
};


export type MutationCreateUserArgs = {
  data: CreateUserDataInput;
};


export type MutationCreateUserEagDetailArgs = {
  data: CreateUserEagDetailDataInput;
};


export type MutationCreateUserJobAdArgs = {
  data: CreateUserJobAdDataInput;
};


export type MutationCreateUserMostValuablePostArgs = {
  data: CreateUserMostValuablePostDataInput;
};


export type MutationCreateUserRateLimitArgs = {
  data: CreateUserRateLimitDataInput;
};


export type MutationCreateUserTagRelArgs = {
  data: CreateUserTagRelDataInput;
};


export type MutationDismissRecommendationArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditSurveyArgs = {
  name: Scalars['String']['input'];
  questions: Array<SurveyQuestionInfo>;
  surveyId: Scalars['String']['input'];
};


export type MutationFlipSplashArtImageArgs = {
  reviewWinnerArtId: Scalars['String']['input'];
};


export type MutationGenerateCoverImagesForPostArgs = {
  postId: Scalars['String']['input'];
  prompt?: InputMaybe<Scalars['String']['input']>;
};


export type MutationGetNewJargonTermsArgs = {
  exampleAltTerm?: InputMaybe<Scalars['String']['input']>;
  exampleDefinition?: InputMaybe<Scalars['String']['input']>;
  examplePost?: InputMaybe<Scalars['String']['input']>;
  exampleTerm?: InputMaybe<Scalars['String']['input']>;
  glossaryPrompt?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


export type MutationImportUrlAsDraftPostArgs = {
  url: Scalars['String']['input'];
};


export type MutationIncreasePostViewCountArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationInitiateConversationArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  moderator?: InputMaybe<Scalars['Boolean']['input']>;
  participantIds: Array<Scalars['String']['input']>;
};


export type MutationLockThreadArgs = {
  commentId: Scalars['String']['input'];
  until?: InputMaybe<Scalars['String']['input']>;
};


export type MutationLoginArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationMarkAsReadOrUnreadArgs = {
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationMarkConversationReadArgs = {
  conversationId: Scalars['String']['input'];
};


export type MutationMarkPostCommentsReadArgs = {
  postId: Scalars['String']['input'];
};


export type MutationMergeTagsArgs = {
  redirectSource: Scalars['Boolean']['input'];
  sourceTagId: Scalars['String']['input'];
  targetTagId: Scalars['String']['input'];
  transferSubtags: Scalars['Boolean']['input'];
};


export type MutationModerateCommentArgs = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  deletedPublic?: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationObserveRecommendationArgs = {
  postId: Scalars['String']['input'];
};


export type MutationPerformVoteCommentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteElectionCandidateArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteMultiDocumentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVotePostArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteRevisionArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteTagArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteTagRelArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPromoteLensToMainArgs = {
  lensId: Scalars['String']['input'];
};


export type MutationPublishAndDeDuplicateSpotlightArgs = {
  spotlightId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationReorderSummariesArgs = {
  parentDocumentCollectionName: Scalars['String']['input'];
  parentDocumentId: Scalars['String']['input'];
  summaryIds: Array<Scalars['String']['input']>;
};


export type MutationResetPasswordArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
};


export type MutationResyncRssFeedArgs = {
  feedId: Scalars['String']['input'];
};


export type MutationRevertPostToRevisionArgs = {
  postId: Scalars['String']['input'];
  revisionId: Scalars['String']['input'];
};


export type MutationRevertTagToRevisionArgs = {
  revertToRevisionId: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
};


export type MutationSendEventTriggeredDmArgs = {
  eventType: Scalars['String']['input'];
};


export type MutationSendNewDialogueMessageNotificationArgs = {
  dialogueHtml: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type MutationSendVertexMediaCompleteEventArgs = {
  attributionId?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


export type MutationSendVertexViewItemEventArgs = {
  attributionId?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


export type MutationSetIsBookmarkedArgs = {
  isBookmarked: Scalars['Boolean']['input'];
  postId: Scalars['String']['input'];
};


export type MutationSetIsHiddenArgs = {
  isHidden: Scalars['Boolean']['input'];
  postId: Scalars['String']['input'];
};


export type MutationSetVoteCommentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteElectionCandidateArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteMultiDocumentArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVotePostArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteRevisionArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteTagArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteTagRelArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  extendedVote?: InputMaybe<Scalars['JSON']['input']>;
  voteType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSignupArgs = {
  abTestKey?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  reCaptchaToken?: InputMaybe<Scalars['String']['input']>;
  subscribeToCurated?: InputMaybe<Scalars['Boolean']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitReviewVoteArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  dummy?: InputMaybe<Scalars['Boolean']['input']>;
  newQuadraticScore?: InputMaybe<Scalars['Int']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  quadraticChange?: InputMaybe<Scalars['Int']['input']>;
  qualitativeScore?: InputMaybe<Scalars['Int']['input']>;
  reactions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  year?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUnlockPostArgs = {
  linkSharingKey: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type MutationUnlockThreadArgs = {
  commentId: Scalars['String']['input'];
};


export type MutationUpdateAdvisorRequestArgs = {
  data: UpdateAdvisorRequestDataInput;
  selector: SelectorInput;
};


export type MutationUpdateArbitalTagContentRelArgs = {
  data: UpdateArbitalTagContentRelDataInput;
  selector: SelectorInput;
};


export type MutationUpdateBanArgs = {
  data: UpdateBanDataInput;
  selector: SelectorInput;
};


export type MutationUpdateBookArgs = {
  data: UpdateBookDataInput;
  selector: SelectorInput;
};


export type MutationUpdateChapterArgs = {
  data: UpdateChapterDataInput;
  selector: SelectorInput;
};


export type MutationUpdateCollectionArgs = {
  data: UpdateCollectionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateCommentArgs = {
  data: UpdateCommentDataInput;
  selector: SelectorInput;
};


export type MutationUpdateCommentModeratorActionArgs = {
  data: UpdateCommentModeratorActionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateContinueReadingArgs = {
  postId: Scalars['String']['input'];
  sequenceId: Scalars['String']['input'];
};


export type MutationUpdateConversationArgs = {
  data: UpdateConversationDataInput;
  selector: SelectorInput;
};


export type MutationUpdateCurationNoticeArgs = {
  data: UpdateCurationNoticeDataInput;
  selector: SelectorInput;
};


export type MutationUpdateDialogueMatchPreferenceArgs = {
  data: UpdateDialogueMatchPreferenceDataInput;
  selector: SelectorInput;
};


export type MutationUpdateDigestArgs = {
  data: UpdateDigestDataInput;
  selector: SelectorInput;
};


export type MutationUpdateDigestPostArgs = {
  data: UpdateDigestPostDataInput;
  selector: SelectorInput;
};


export type MutationUpdateElectionCandidateArgs = {
  data: UpdateElectionCandidateDataInput;
  selector: SelectorInput;
};


export type MutationUpdateElectionVoteArgs = {
  data: UpdateElectionVoteDataInput;
  selector: SelectorInput;
};


export type MutationUpdateElicitQuestionArgs = {
  data: UpdateElicitQuestionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateForumEventArgs = {
  data: UpdateForumEventDataInput;
  selector: SelectorInput;
};


export type MutationUpdateGardenCodeArgs = {
  data: UpdateGardenCodeDataInput;
  selector: SelectorInput;
};


export type MutationUpdateGoogleServiceAccountSessionArgs = {
  data: UpdateGoogleServiceAccountSessionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateJargonTermArgs = {
  data: UpdateJargonTermDataInput;
  selector: SelectorInput;
};


export type MutationUpdateLwEventArgs = {
  data: UpdateLwEventDataInput;
  selector: SelectorInput;
};


export type MutationUpdateLlmConversationArgs = {
  data: UpdateLlmConversationDataInput;
  selector: SelectorInput;
};


export type MutationUpdateLocalgroupArgs = {
  data: UpdateLocalgroupDataInput;
  selector: SelectorInput;
};


export type MutationUpdateMessageArgs = {
  data: UpdateMessageDataInput;
  selector: SelectorInput;
};


export type MutationUpdateModerationTemplateArgs = {
  data: UpdateModerationTemplateDataInput;
  selector: SelectorInput;
};


export type MutationUpdateModeratorActionArgs = {
  data: UpdateModeratorActionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateMultiDocumentArgs = {
  data: UpdateMultiDocumentDataInput;
  selector: SelectorInput;
};


export type MutationUpdateNotificationArgs = {
  data: UpdateNotificationDataInput;
  selector: SelectorInput;
};


export type MutationUpdatePodcastEpisodeArgs = {
  data: UpdatePodcastEpisodeDataInput;
  selector: SelectorInput;
};


export type MutationUpdatePostArgs = {
  data: UpdatePostDataInput;
  selector: SelectorInput;
};


export type MutationUpdatePostEmbeddingArgs = {
  data: UpdatePostEmbeddingDataInput;
  selector: SelectorInput;
};


export type MutationUpdatePostViewTimeArgs = {
  data: UpdatePostViewTimeDataInput;
  selector: SelectorInput;
};


export type MutationUpdatePostViewsArgs = {
  data: UpdatePostViewsDataInput;
  selector: SelectorInput;
};


export type MutationUpdateRssFeedArgs = {
  data: UpdateRssFeedDataInput;
  selector: SelectorInput;
};


export type MutationUpdateReportArgs = {
  data: UpdateReportDataInput;
  selector: SelectorInput;
};


export type MutationUpdateRevisionArgs = {
  data: UpdateRevisionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSequenceArgs = {
  data: UpdateSequenceDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSplashArtCoordinateArgs = {
  data: UpdateSplashArtCoordinateDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSpotlightArgs = {
  data: UpdateSpotlightDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSurveyArgs = {
  data: UpdateSurveyDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSurveyQuestionArgs = {
  data: UpdateSurveyQuestionDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSurveyResponseArgs = {
  data: UpdateSurveyResponseDataInput;
  selector: SelectorInput;
};


export type MutationUpdateSurveyScheduleArgs = {
  data: UpdateSurveyScheduleDataInput;
  selector: SelectorInput;
};


export type MutationUpdateTagArgs = {
  data: UpdateTagDataInput;
  selector: SelectorInput;
};


export type MutationUpdateTagFlagArgs = {
  data: UpdateTagFlagDataInput;
  selector: SelectorInput;
};


export type MutationUpdateTagRelArgs = {
  data: UpdateTagRelDataInput;
  selector: SelectorInput;
};


export type MutationUpdateUserArgs = {
  data: UpdateUserDataInput;
  selector: SelectorInput;
};


export type MutationUpdateUserEagDetailArgs = {
  data: UpdateUserEagDetailDataInput;
  selector: SelectorInput;
};


export type MutationUpdateUserJobAdArgs = {
  data: UpdateUserJobAdDataInput;
  selector: SelectorInput;
};


export type MutationUpdateUserMostValuablePostArgs = {
  data: UpdateUserMostValuablePostDataInput;
  selector: SelectorInput;
};


export type MutationUpdateUserRateLimitArgs = {
  data: UpdateUserRateLimitDataInput;
  selector: SelectorInput;
};


export type MutationUpdateUserTagRelArgs = {
  data: UpdateUserTagRelDataInput;
  selector: SelectorInput;
};


export type MutationUpsertUserTypingIndicatorArgs = {
  documentId: Scalars['String']['input'];
};


export type MutationUseEmailTokenArgs = {
  args?: InputMaybe<Scalars['JSON']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

export type MyDialoguesResult = {
  __typename?: 'MyDialoguesResult';
  results: Array<Post>;
};

export type NewUserCompletedProfile = {
  __typename?: 'NewUserCompletedProfile';
  displayName?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  subscribedToDigest?: Maybe<Scalars['Boolean']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  usernameUnset?: Maybe<Scalars['Boolean']['output']>;
};

export type Notification = {
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

export type NotificationCounts = {
  __typename?: 'NotificationCounts';
  checkedAt: Scalars['Date']['output'];
  faviconBadgeNumber: Scalars['Int']['output'];
  unreadNotifications: Scalars['Int']['output'];
  unreadPrivateMessages: Scalars['Int']['output'];
};

export type NotificationDisplaysResult = {
  __typename?: 'NotificationDisplaysResult';
  results: Array<Scalars['JSON']['output']>;
};

export type NotificationOutput = {
  __typename?: 'NotificationOutput';
  data?: Maybe<Notification>;
};

export type PageCacheEntry = {
  __typename?: 'PageCacheEntry';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type PetrovDay2024CheckNumberOfIncomingData = {
  __typename?: 'PetrovDay2024CheckNumberOfIncomingData';
  count?: Maybe<Scalars['Int']['output']>;
};

export type PetrovDayAction = {
  __typename?: 'PetrovDayAction';
  _id: Scalars['String']['output'];
  actionType: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type PetrovDayActionOutput = {
  __typename?: 'PetrovDayActionOutput';
  data?: Maybe<PetrovDayAction>;
};

export type PetrovDayCheckIfIncomingData = {
  __typename?: 'PetrovDayCheckIfIncomingData';
  createdAt?: Maybe<Scalars['Date']['output']>;
  launched?: Maybe<Scalars['Boolean']['output']>;
};

export type PetrovDayLaunch = {
  __typename?: 'PetrovDayLaunch';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  hashedLaunchCode?: Maybe<Scalars['String']['output']>;
  launchCode: Scalars['String']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type PetrovDayLaunchMissileData = {
  __typename?: 'PetrovDayLaunchMissileData';
  createdAt?: Maybe<Scalars['Date']['output']>;
  launchCode?: Maybe<Scalars['String']['output']>;
};

export type Podcast = {
  __typename?: 'Podcast';
  _id: Scalars['String']['output'];
  applePodcastLink?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  spotifyPodcastLink?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type PodcastEpisode = {
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

export type PodcastEpisodeOutput = {
  __typename?: 'PodcastEpisodeOutput';
  data?: Maybe<PodcastEpisode>;
};

export type PopularCommentsResult = {
  __typename?: 'PopularCommentsResult';
  results: Array<Comment>;
};

export type Post = {
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
  coauthorStatuses?: Maybe<Array<Scalars['JSON']['output']>>;
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
  curationNotices?: Maybe<Array<Maybe<CurationNotice>>>;
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
  feed?: Maybe<RssFeed>;
  feedId?: Maybe<Scalars['String']['output']>;
  feedLink?: Maybe<Scalars['String']['output']>;
  finalReviewVoteScoreAF: Scalars['Float']['output'];
  finalReviewVoteScoreAllKarma: Scalars['Float']['output'];
  finalReviewVoteScoreHighKarma: Scalars['Float']['output'];
  finalReviewVotesAF: Array<Scalars['Float']['output']>;
  finalReviewVotesAllKarma: Array<Scalars['Float']['output']>;
  finalReviewVotesHighKarma: Array<Scalars['Float']['output']>;
  firstVideoAttribsForPreview?: Maybe<Scalars['JSON']['output']>;
  fmCrosspost?: Maybe<Scalars['JSON']['output']>;
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
  lastCommentedAt?: Maybe<Scalars['Date']['output']>;
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
  postCategory: Scalars['String']['output'];
  postedAt: Scalars['Date']['output'];
  postedAtFormatted?: Maybe<Scalars['String']['output']>;
  prevPost?: Maybe<Post>;
  question: Scalars['Boolean']['output'];
  readTimeMinutes: Scalars['Int']['output'];
  readTimeMinutesOverride?: Maybe<Scalars['Float']['output']>;
  recentComments?: Maybe<Array<Maybe<Comment>>>;
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
  reviews?: Maybe<Array<Maybe<Comment>>>;
  revisions?: Maybe<Array<Maybe<Revision>>>;
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
  socialPreview?: Maybe<Scalars['JSON']['output']>;
  socialPreviewData?: Maybe<SocialPreviewType>;
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
  tags?: Maybe<Array<Maybe<Tag>>>;
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


export type PostContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type PostCustomHighlightArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type PostDialogueMessageContentsArgs = {
  dialogueMessageId?: InputMaybe<Scalars['String']['input']>;
};


export type PostModerationGuidelinesArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type PostNextPostArgs = {
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};


export type PostPrevPostArgs = {
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};


export type PostRecentCommentsArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  commentsLimit?: InputMaybe<Scalars['Int']['input']>;
  maxAgeHours?: InputMaybe<Scalars['Int']['input']>;
};


export type PostRevisionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type PostSequenceArgs = {
  prevOrNext?: InputMaybe<Scalars['String']['input']>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
};


export type PostTableOfContentsRevisionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type PostTagRelArgs = {
  tagId?: InputMaybe<Scalars['String']['input']>;
};

export type PostAnalytics2Result = {
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

export type PostAnalyticsResult = {
  __typename?: 'PostAnalyticsResult';
  allViews?: Maybe<Scalars['Int']['output']>;
  medianReadingTime?: Maybe<Scalars['Int']['output']>;
  uniqueClientViews?: Maybe<Scalars['Int']['output']>;
  uniqueClientViews5Min?: Maybe<Scalars['Int']['output']>;
  uniqueClientViews10Sec?: Maybe<Scalars['Int']['output']>;
  uniqueClientViewsSeries?: Maybe<Array<Maybe<UniqueClientViewsSeries>>>;
};

export type PostEmbedding = {
  __typename?: 'PostEmbedding';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  embeddings?: Maybe<Array<Scalars['Float']['output']>>;
  lastGeneratedAt?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  post?: Maybe<Post>;
  postHash?: Maybe<Scalars['String']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type PostEmbeddingOutput = {
  __typename?: 'PostEmbeddingOutput';
  data?: Maybe<PostEmbedding>;
};

export type PostKarmaChange = {
  __typename?: 'PostKarmaChange';
  _id?: Maybe<Scalars['String']['output']>;
  addedReacts?: Maybe<Array<ReactionChange>>;
  eaAddedReacts?: Maybe<Scalars['JSON']['output']>;
  postId?: Maybe<Scalars['String']['output']>;
  scoreChange?: Maybe<Scalars['Int']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type PostOutput = {
  __typename?: 'PostOutput';
  data?: Maybe<Post>;
};

export type PostRecommendation = {
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

export type PostRelation = {
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

export type PostReviewFilter = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  minKarma?: InputMaybe<Scalars['Int']['input']>;
  showEvents?: InputMaybe<Scalars['Boolean']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

export type PostReviewSort = {
  karma?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PostViewTime = {
  __typename?: 'PostViewTime';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type PostViewTimeOutput = {
  __typename?: 'PostViewTimeOutput';
  data?: Maybe<PostViewTime>;
};

export type PostViews = {
  __typename?: 'PostViews';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type PostViewsOutput = {
  __typename?: 'PostViewsOutput';
  data?: Maybe<PostViews>;
};

export type PostWithApprovedJargon = {
  __typename?: 'PostWithApprovedJargon';
  jargonTerms?: Maybe<Array<JargonTerm>>;
  post: Post;
};

export type PostsBySubscribedAuthorsResult = {
  __typename?: 'PostsBySubscribedAuthorsResult';
  results: Array<Post>;
};

export type PostsUserCommentedOnResult = {
  __typename?: 'PostsUserCommentedOnResult';
  posts?: Maybe<Array<Post>>;
};

export type PostsWithActiveDiscussionResult = {
  __typename?: 'PostsWithActiveDiscussionResult';
  results: Array<Post>;
};

export type PostsWithApprovedJargonResult = {
  __typename?: 'PostsWithApprovedJargonResult';
  results: Array<PostWithApprovedJargon>;
};

export type Query = {
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
  DigestPlannerData?: Maybe<Array<Maybe<DigestPlannerPost>>>;
  DigestPosts?: Maybe<Array<Maybe<Post>>>;
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
  UserReadsPerCoreTag?: Maybe<Array<Maybe<UserCoreTagReads>>>;
  UserWrappedDataByYear?: Maybe<WrappedDataByYear>;
  UsersReadPostsOfTargetUser?: Maybe<Array<Post>>;
  advisorRequest?: Maybe<SingleAdvisorRequestOutput>;
  advisorRequests?: Maybe<MultiAdvisorRequestOutput>;
  arbitalTagContentRel?: Maybe<SingleArbitalTagContentRelOutput>;
  arbitalTagContentRels?: Maybe<MultiArbitalTagContentRelOutput>;
  ban?: Maybe<SingleBanOutput>;
  bans?: Maybe<MultiBanOutput>;
  book?: Maybe<SingleBookOutput>;
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
  lWEvent?: Maybe<SingleLwEventOutput>;
  lWEvents?: Maybe<MultiLwEventOutput>;
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
  moderatorViewIPAddress?: Maybe<ModeratorIpAddressInfo>;
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
  postEmbedding?: Maybe<SinglePostEmbeddingOutput>;
  postEmbeddings?: Maybe<MultiPostEmbeddingOutput>;
  postRelation?: Maybe<SinglePostRelationOutput>;
  postRelations?: Maybe<MultiPostRelationOutput>;
  postViewTime?: Maybe<SinglePostViewTimeOutput>;
  postViewTimes?: Maybe<MultiPostViewTimeOutput>;
  postViews?: Maybe<SinglePostViewsOutput>;
  postViewses?: Maybe<MultiPostViewsOutput>;
  posts?: Maybe<MultiPostOutput>;
  rSSFeed?: Maybe<SingleRssFeedOutput>;
  rSSFeeds?: Maybe<MultiRssFeedOutput>;
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
  unreadNotificationCounts: NotificationCounts;
  user?: Maybe<SingleUserOutput>;
  userEAGDetail?: Maybe<SingleUserEagDetailOutput>;
  userEAGDetails?: Maybe<MultiUserEagDetailOutput>;
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


export type QueryAllTagsActivityFeedArgs = {
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAnalyticsSeriesArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  postIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryArbitalPageDataArgs = {
  pageAlias?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCanAccessGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
};


export type QueryCommentsWithReactsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCrossedKarmaThresholdArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCuratedAndPopularThisWeekArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestHighlightsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestPlannerDataArgs = {
  digestId?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type QueryDigestPostsArgs = {
  num?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestPostsThisWeekArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryElicitBlockDataArgs = {
  questionId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEmailPreviewArgs = {
  notificationIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetRandomUserArgs = {
  userIsAuthor: Scalars['String']['input'];
};


export type QueryGetUserBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryGivingSeasonHeartsArgs = {
  electionName: Scalars['String']['input'];
};


export type QueryGoogleVertexPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryIsDisplayNameTakenArgs = {
  displayName: Scalars['String']['input'];
};


export type QueryMultiPostAnalyticsArgs = {
  desc?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  postIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyDialoguesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryNotificationDisplaysArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPopularCommentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostAnalyticsArgs = {
  postId: Scalars['String']['input'];
};


export type QueryPostIsCriticismArgs = {
  args?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryPostsBySubscribedAuthorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsUserCommentedOnArgs = {
  filter?: InputMaybe<PostReviewFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PostReviewSort>;
};


export type QueryPostsWithActiveDiscussionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsWithApprovedJargonArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentDiscussionFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentlyActiveDialoguesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecombeeHybridPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryRecombeeLatestPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryRecommendationsArgs = {
  algorithm?: InputMaybe<Scalars['JSON']['input']>;
  count?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRevisionsDiffArgs = {
  afterRev: Scalars['String']['input'];
  beforeRev?: InputMaybe<Scalars['String']['input']>;
  collectionName: Scalars['String']['input'];
  fieldName: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  trim?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryRssPostChangesArgs = {
  postId: Scalars['String']['input'];
};


export type QuerySubforumMagicFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumNewFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumOldFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumRecentCommentsFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumTopFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubscribedFeedArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySuggestedFeedSubscriptionUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTagHistoryFeedArgs = {
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  options?: InputMaybe<Scalars['JSON']['input']>;
  tagId: Scalars['String']['input'];
};


export type QueryTagPreviewArgs = {
  hash?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};


export type QueryTagUpdatesByUserArgs = {
  limit: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  userId: Scalars['String']['input'];
};


export type QueryTagUpdatesInTimeBlockArgs = {
  after: Scalars['Date']['input'];
  before: Scalars['Date']['input'];
};


export type QueryTagsByCoreTagIdArgs = {
  coreTagId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  searchTagIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUltraFeedArgs = {
  cutoff?: InputMaybe<Scalars['Date']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryUserReadHistoryArgs = {
  filter?: InputMaybe<PostReviewFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PostReviewSort>;
};


export type QueryUserReadsPerCoreTagArgs = {
  userId: Scalars['String']['input'];
};


export type QueryUserWrappedDataByYearArgs = {
  userId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


export type QueryUsersReadPostsOfTargetUserArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  targetUserId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type QueryAdvisorRequestArgs = {
  input?: InputMaybe<SingleAdvisorRequestInput>;
};


export type QueryAdvisorRequestsArgs = {
  input?: InputMaybe<MultiAdvisorRequestInput>;
};


export type QueryArbitalTagContentRelArgs = {
  input?: InputMaybe<SingleArbitalTagContentRelInput>;
};


export type QueryArbitalTagContentRelsArgs = {
  input?: InputMaybe<MultiArbitalTagContentRelInput>;
};


export type QueryBanArgs = {
  input?: InputMaybe<SingleBanInput>;
};


export type QueryBansArgs = {
  input?: InputMaybe<MultiBanInput>;
};


export type QueryBookArgs = {
  input?: InputMaybe<SingleBookInput>;
};


export type QueryBooksArgs = {
  input?: InputMaybe<MultiBookInput>;
};


export type QueryChapterArgs = {
  input?: InputMaybe<SingleChapterInput>;
};


export type QueryChaptersArgs = {
  input?: InputMaybe<MultiChapterInput>;
};


export type QueryCkEditorUserSessionArgs = {
  input?: InputMaybe<SingleCkEditorUserSessionInput>;
};


export type QueryCkEditorUserSessionsArgs = {
  input?: InputMaybe<MultiCkEditorUserSessionInput>;
};


export type QueryClientIdArgs = {
  input?: InputMaybe<SingleClientIdInput>;
};


export type QueryClientIdsArgs = {
  input?: InputMaybe<MultiClientIdInput>;
};


export type QueryCollectionArgs = {
  input?: InputMaybe<SingleCollectionInput>;
};


export type QueryCollectionsArgs = {
  input?: InputMaybe<MultiCollectionInput>;
};


export type QueryCommentArgs = {
  input?: InputMaybe<SingleCommentInput>;
};


export type QueryCommentModeratorActionArgs = {
  input?: InputMaybe<SingleCommentModeratorActionInput>;
};


export type QueryCommentModeratorActionsArgs = {
  input?: InputMaybe<MultiCommentModeratorActionInput>;
};


export type QueryCommentsArgs = {
  input?: InputMaybe<MultiCommentInput>;
};


export type QueryConversationArgs = {
  input?: InputMaybe<SingleConversationInput>;
};


export type QueryConversationsArgs = {
  input?: InputMaybe<MultiConversationInput>;
};


export type QueryConvertDocumentArgs = {
  document?: InputMaybe<Scalars['JSON']['input']>;
  targetFormat?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCurationNoticeArgs = {
  input?: InputMaybe<SingleCurationNoticeInput>;
};


export type QueryCurationNoticesArgs = {
  input?: InputMaybe<MultiCurationNoticeInput>;
};


export type QueryDialogueCheckArgs = {
  input?: InputMaybe<SingleDialogueCheckInput>;
};


export type QueryDialogueChecksArgs = {
  input?: InputMaybe<MultiDialogueCheckInput>;
};


export type QueryDialogueMatchPreferenceArgs = {
  input?: InputMaybe<SingleDialogueMatchPreferenceInput>;
};


export type QueryDialogueMatchPreferencesArgs = {
  input?: InputMaybe<MultiDialogueMatchPreferenceInput>;
};


export type QueryDigestArgs = {
  input?: InputMaybe<SingleDigestInput>;
};


export type QueryDigestPostArgs = {
  input?: InputMaybe<SingleDigestPostInput>;
};


export type QueryDigestPostsArgs = {
  input?: InputMaybe<MultiDigestPostInput>;
};


export type QueryDigestsArgs = {
  input?: InputMaybe<MultiDigestInput>;
};


export type QueryElectionCandidateArgs = {
  input?: InputMaybe<SingleElectionCandidateInput>;
};


export type QueryElectionCandidatesArgs = {
  input?: InputMaybe<MultiElectionCandidateInput>;
};


export type QueryElectionVoteArgs = {
  input?: InputMaybe<SingleElectionVoteInput>;
};


export type QueryElectionVotesArgs = {
  input?: InputMaybe<MultiElectionVoteInput>;
};


export type QueryElicitQuestionArgs = {
  input?: InputMaybe<SingleElicitQuestionInput>;
};


export type QueryElicitQuestionPredictionArgs = {
  input?: InputMaybe<SingleElicitQuestionPredictionInput>;
};


export type QueryElicitQuestionPredictionsArgs = {
  input?: InputMaybe<MultiElicitQuestionPredictionInput>;
};


export type QueryElicitQuestionsArgs = {
  input?: InputMaybe<MultiElicitQuestionInput>;
};


export type QueryFeaturedResourceArgs = {
  input?: InputMaybe<SingleFeaturedResourceInput>;
};


export type QueryFeaturedResourcesArgs = {
  input?: InputMaybe<MultiFeaturedResourceInput>;
};


export type QueryForumEventArgs = {
  input?: InputMaybe<SingleForumEventInput>;
};


export type QueryForumEventsArgs = {
  input?: InputMaybe<MultiForumEventInput>;
};


export type QueryGardenCodeArgs = {
  input?: InputMaybe<SingleGardenCodeInput>;
};


export type QueryGardenCodesArgs = {
  input?: InputMaybe<MultiGardenCodeInput>;
};


export type QueryGetCrosspostArgs = {
  args?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryGetLinkSharedPostArgs = {
  linkSharingKey: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type QueryGoogleServiceAccountSessionArgs = {
  input?: InputMaybe<SingleGoogleServiceAccountSessionInput>;
};


export type QueryGoogleServiceAccountSessionsArgs = {
  input?: InputMaybe<MultiGoogleServiceAccountSessionInput>;
};


export type QueryJargonTermArgs = {
  input?: InputMaybe<SingleJargonTermInput>;
};


export type QueryJargonTermsArgs = {
  input?: InputMaybe<MultiJargonTermInput>;
};


export type QueryLwEventArgs = {
  input?: InputMaybe<SingleLwEventInput>;
};


export type QueryLwEventsArgs = {
  input?: InputMaybe<MultiLwEventInput>;
};


export type QueryLatestDialogueMessagesArgs = {
  dialogueId: Scalars['String']['input'];
  numMessages: Scalars['Int']['input'];
};


export type QueryLatestGoogleDocMetadataArgs = {
  postId: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLlmConversationArgs = {
  input?: InputMaybe<SingleLlmConversationInput>;
};


export type QueryLlmConversationsArgs = {
  input?: InputMaybe<MultiLlmConversationInput>;
};


export type QueryLocalgroupArgs = {
  input?: InputMaybe<SingleLocalgroupInput>;
};


export type QueryLocalgroupsArgs = {
  input?: InputMaybe<MultiLocalgroupInput>;
};


export type QueryMessageArgs = {
  input?: InputMaybe<SingleMessageInput>;
};


export type QueryMessagesArgs = {
  input?: InputMaybe<MultiMessageInput>;
};


export type QueryModerationTemplateArgs = {
  input?: InputMaybe<SingleModerationTemplateInput>;
};


export type QueryModerationTemplatesArgs = {
  input?: InputMaybe<MultiModerationTemplateInput>;
};


export type QueryModeratorActionArgs = {
  input?: InputMaybe<SingleModeratorActionInput>;
};


export type QueryModeratorActionsArgs = {
  input?: InputMaybe<MultiModeratorActionInput>;
};


export type QueryModeratorViewIpAddressArgs = {
  ipAddress: Scalars['String']['input'];
};


export type QueryMultiDocumentArgs = {
  input?: InputMaybe<SingleMultiDocumentInput>;
};


export type QueryMultiDocumentsArgs = {
  input?: InputMaybe<MultiMultiDocumentInput>;
};


export type QueryNotificationArgs = {
  input?: InputMaybe<SingleNotificationInput>;
};


export type QueryNotificationsArgs = {
  input?: InputMaybe<MultiNotificationInput>;
};


export type QueryPetrovDayActionArgs = {
  input?: InputMaybe<SinglePetrovDayActionInput>;
};


export type QueryPetrovDayActionsArgs = {
  input?: InputMaybe<MultiPetrovDayActionInput>;
};


export type QueryPodcastArgs = {
  input?: InputMaybe<SinglePodcastInput>;
};


export type QueryPodcastEpisodeArgs = {
  input?: InputMaybe<SinglePodcastEpisodeInput>;
};


export type QueryPodcastEpisodesArgs = {
  input?: InputMaybe<MultiPodcastEpisodeInput>;
};


export type QueryPodcastsArgs = {
  input?: InputMaybe<MultiPodcastInput>;
};


export type QueryPostArgs = {
  input?: InputMaybe<SinglePostInput>;
};


export type QueryPostEmbeddingArgs = {
  input?: InputMaybe<SinglePostEmbeddingInput>;
};


export type QueryPostEmbeddingsArgs = {
  input?: InputMaybe<MultiPostEmbeddingInput>;
};


export type QueryPostRelationArgs = {
  input?: InputMaybe<SinglePostRelationInput>;
};


export type QueryPostRelationsArgs = {
  input?: InputMaybe<MultiPostRelationInput>;
};


export type QueryPostViewTimeArgs = {
  input?: InputMaybe<SinglePostViewTimeInput>;
};


export type QueryPostViewTimesArgs = {
  input?: InputMaybe<MultiPostViewTimeInput>;
};


export type QueryPostViewsArgs = {
  input?: InputMaybe<SinglePostViewsInput>;
};


export type QueryPostViewsesArgs = {
  input?: InputMaybe<MultiPostViewsInput>;
};


export type QueryPostsArgs = {
  input?: InputMaybe<MultiPostInput>;
};


export type QueryRSsFeedArgs = {
  input?: InputMaybe<SingleRssFeedInput>;
};


export type QueryRSsFeedsArgs = {
  input?: InputMaybe<MultiRssFeedInput>;
};


export type QueryReportArgs = {
  input?: InputMaybe<SingleReportInput>;
};


export type QueryReportsArgs = {
  input?: InputMaybe<MultiReportInput>;
};


export type QueryReviewVoteArgs = {
  input?: InputMaybe<SingleReviewVoteInput>;
};


export type QueryReviewVotesArgs = {
  input?: InputMaybe<MultiReviewVoteInput>;
};


export type QueryReviewWinnerArgs = {
  input?: InputMaybe<SingleReviewWinnerInput>;
};


export type QueryReviewWinnerArtArgs = {
  input?: InputMaybe<SingleReviewWinnerArtInput>;
};


export type QueryReviewWinnerArtsArgs = {
  input?: InputMaybe<MultiReviewWinnerArtInput>;
};


export type QueryReviewWinnersArgs = {
  input?: InputMaybe<MultiReviewWinnerInput>;
};


export type QueryRevisionArgs = {
  input?: InputMaybe<SingleRevisionInput>;
};


export type QueryRevisionsArgs = {
  input?: InputMaybe<MultiRevisionInput>;
};


export type QuerySequenceArgs = {
  input?: InputMaybe<SingleSequenceInput>;
};


export type QuerySequencesArgs = {
  input?: InputMaybe<MultiSequenceInput>;
};


export type QuerySplashArtCoordinateArgs = {
  input?: InputMaybe<SingleSplashArtCoordinateInput>;
};


export type QuerySplashArtCoordinatesArgs = {
  input?: InputMaybe<MultiSplashArtCoordinateInput>;
};


export type QuerySpotlightArgs = {
  input?: InputMaybe<SingleSpotlightInput>;
};


export type QuerySpotlightsArgs = {
  input?: InputMaybe<MultiSpotlightInput>;
};


export type QuerySubscriptionArgs = {
  input?: InputMaybe<SingleSubscriptionInput>;
};


export type QuerySubscriptionsArgs = {
  input?: InputMaybe<MultiSubscriptionInput>;
};


export type QuerySurveyArgs = {
  input?: InputMaybe<SingleSurveyInput>;
};


export type QuerySurveyQuestionArgs = {
  input?: InputMaybe<SingleSurveyQuestionInput>;
};


export type QuerySurveyQuestionsArgs = {
  input?: InputMaybe<MultiSurveyQuestionInput>;
};


export type QuerySurveyResponseArgs = {
  input?: InputMaybe<SingleSurveyResponseInput>;
};


export type QuerySurveyResponsesArgs = {
  input?: InputMaybe<MultiSurveyResponseInput>;
};


export type QuerySurveyScheduleArgs = {
  input?: InputMaybe<SingleSurveyScheduleInput>;
};


export type QuerySurveySchedulesArgs = {
  input?: InputMaybe<MultiSurveyScheduleInput>;
};


export type QuerySurveysArgs = {
  input?: InputMaybe<MultiSurveyInput>;
};


export type QueryTagArgs = {
  input?: InputMaybe<SingleTagInput>;
};


export type QueryTagFlagArgs = {
  input?: InputMaybe<SingleTagFlagInput>;
};


export type QueryTagFlagsArgs = {
  input?: InputMaybe<MultiTagFlagInput>;
};


export type QueryTagRelArgs = {
  input?: InputMaybe<SingleTagRelInput>;
};


export type QueryTagRelsArgs = {
  input?: InputMaybe<MultiTagRelInput>;
};


export type QueryTagsArgs = {
  input?: InputMaybe<MultiTagInput>;
};


export type QueryTypingIndicatorArgs = {
  input?: InputMaybe<SingleTypingIndicatorInput>;
};


export type QueryTypingIndicatorsArgs = {
  input?: InputMaybe<MultiTypingIndicatorInput>;
};


export type QueryUserArgs = {
  input?: InputMaybe<SingleUserInput>;
};


export type QueryUserEagDetailArgs = {
  input?: InputMaybe<SingleUserEagDetailInput>;
};


export type QueryUserEagDetailsArgs = {
  input?: InputMaybe<MultiUserEagDetailInput>;
};


export type QueryUserJobAdArgs = {
  input?: InputMaybe<SingleUserJobAdInput>;
};


export type QueryUserJobAdsArgs = {
  input?: InputMaybe<MultiUserJobAdInput>;
};


export type QueryUserMostValuablePostArgs = {
  input?: InputMaybe<SingleUserMostValuablePostInput>;
};


export type QueryUserMostValuablePostsArgs = {
  input?: InputMaybe<MultiUserMostValuablePostInput>;
};


export type QueryUserRateLimitArgs = {
  input?: InputMaybe<SingleUserRateLimitInput>;
};


export type QueryUserRateLimitsArgs = {
  input?: InputMaybe<MultiUserRateLimitInput>;
};


export type QueryUserTagRelArgs = {
  input?: InputMaybe<SingleUserTagRelInput>;
};


export type QueryUserTagRelsArgs = {
  input?: InputMaybe<MultiUserTagRelInput>;
};


export type QueryUsersArgs = {
  input?: InputMaybe<MultiUserInput>;
};


export type QueryVoteArgs = {
  input?: InputMaybe<SingleVoteInput>;
};


export type QueryVotesArgs = {
  input?: InputMaybe<MultiVoteInput>;
};

export type RssFeed = {
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

export type RssFeedOutput = {
  __typename?: 'RSSFeedOutput';
  data?: Maybe<RssFeed>;
};

export type ReactionChange = {
  __typename?: 'ReactionChange';
  reactionType: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type ReadStatus = {
  __typename?: 'ReadStatus';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type RecentDiscussionFeedEntryType = {
  __typename?: 'RecentDiscussionFeedEntryType';
  postCommented?: Maybe<Post>;
  shortformCommented?: Maybe<Post>;
  tagDiscussed?: Maybe<Tag>;
  tagRevised?: Maybe<Revision>;
  type: Scalars['String']['output'];
};

export type RecentDiscussionFeedQueryResults = {
  __typename?: 'RecentDiscussionFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<RecentDiscussionFeedEntryType>>;
  sessionId?: Maybe<Scalars['String']['output']>;
};

export type RecentlyActiveDialoguesResult = {
  __typename?: 'RecentlyActiveDialoguesResult';
  results: Array<Post>;
};

export type RecombeeHybridPostsResult = {
  __typename?: 'RecombeeHybridPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

export type RecombeeLatestPostsResult = {
  __typename?: 'RecombeeLatestPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

export type RecombeeRecommendedPost = {
  __typename?: 'RecombeeRecommendedPost';
  curated?: Maybe<Scalars['Boolean']['output']>;
  generatedAt?: Maybe<Scalars['Date']['output']>;
  post: Post;
  recommId?: Maybe<Scalars['String']['output']>;
  scenario?: Maybe<Scalars['String']['output']>;
  stickied?: Maybe<Scalars['Boolean']['output']>;
};

export type RecommendResumeSequence = {
  __typename?: 'RecommendResumeSequence';
  collection?: Maybe<Collection>;
  lastReadTime?: Maybe<Scalars['Date']['output']>;
  nextPost: Post;
  numRead?: Maybe<Scalars['Int']['output']>;
  numTotal?: Maybe<Scalars['Int']['output']>;
  sequence?: Maybe<Sequence>;
};

export type RecommendationsCache = {
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

export type Report = {
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

export type ReportOutput = {
  __typename?: 'ReportOutput';
  data?: Maybe<Report>;
};

export type ReviewVote = {
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

export type ReviewWinner = {
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

export type ReviewWinnerArt = {
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

export type Revision = {
  __typename?: 'Revision';
  _id: Scalars['String']['output'];
  afBaseScore?: Maybe<Scalars['Float']['output']>;
  afExtendedScore?: Maybe<Scalars['JSON']['output']>;
  afVoteCount?: Maybe<Scalars['Float']['output']>;
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
  draftJS?: Maybe<Scalars['JSON']['output']>;
  editedAt?: Maybe<Scalars['Date']['output']>;
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
  originalContents?: Maybe<ContentType>;
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


export type RevisionHtmlHighlightStartingAtHashArgs = {
  hash?: InputMaybe<Scalars['String']['input']>;
};

export type RevisionOutput = {
  __typename?: 'RevisionOutput';
  data?: Maybe<Revision>;
};

export type RevisionsKarmaChange = {
  __typename?: 'RevisionsKarmaChange';
  _id?: Maybe<Scalars['String']['output']>;
  addedReacts?: Maybe<Array<ReactionChange>>;
  eaAddedReacts?: Maybe<Scalars['JSON']['output']>;
  scoreChange?: Maybe<Scalars['Int']['output']>;
  tagId?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  tagSlug?: Maybe<Scalars['String']['output']>;
};

export type RssPostChangeInfo = {
  __typename?: 'RssPostChangeInfo';
  htmlDiff: Scalars['String']['output'];
  isChanged: Scalars['Boolean']['output'];
  newHtml: Scalars['String']['output'];
};

export type SelectorInput = {
  _id?: InputMaybe<Scalars['String']['input']>;
  documentId?: InputMaybe<Scalars['String']['input']>;
};

export type Sequence = {
  __typename?: 'Sequence';
  _id: Scalars['String']['output'];
  af: Scalars['Boolean']['output'];
  bannerImageId?: Maybe<Scalars['String']['output']>;
  canonicalCollection?: Maybe<Collection>;
  canonicalCollectionSlug?: Maybe<Scalars['String']['output']>;
  chapters?: Maybe<Array<Maybe<Chapter>>>;
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


export type SequenceContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type SequenceOutput = {
  __typename?: 'SequenceOutput';
  data?: Maybe<Sequence>;
};

export type Session = {
  __typename?: 'Session';
  _id?: Maybe<Scalars['String']['output']>;
  expires?: Maybe<Scalars['Date']['output']>;
  lastModified?: Maybe<Scalars['Date']['output']>;
  session?: Maybe<Scalars['JSON']['output']>;
};

export type SideCommentCache = {
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

export type SingleAdvisorRequestInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleAdvisorRequestOutput = {
  __typename?: 'SingleAdvisorRequestOutput';
  result?: Maybe<AdvisorRequest>;
};

export type SingleArbitalTagContentRelInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleArbitalTagContentRelOutput = {
  __typename?: 'SingleArbitalTagContentRelOutput';
  result?: Maybe<ArbitalTagContentRel>;
};

export type SingleBanInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleBanOutput = {
  __typename?: 'SingleBanOutput';
  result?: Maybe<Ban>;
};

export type SingleBookInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleBookOutput = {
  __typename?: 'SingleBookOutput';
  result?: Maybe<Book>;
};

export type SingleChapterInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleChapterOutput = {
  __typename?: 'SingleChapterOutput';
  result?: Maybe<Chapter>;
};

export type SingleCkEditorUserSessionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleCkEditorUserSessionOutput = {
  __typename?: 'SingleCkEditorUserSessionOutput';
  result?: Maybe<CkEditorUserSession>;
};

export type SingleClientIdInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleClientIdOutput = {
  __typename?: 'SingleClientIdOutput';
  result?: Maybe<ClientId>;
};

export type SingleCollectionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleCollectionOutput = {
  __typename?: 'SingleCollectionOutput';
  result?: Maybe<Collection>;
};

export type SingleCommentInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleCommentModeratorActionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleCommentModeratorActionOutput = {
  __typename?: 'SingleCommentModeratorActionOutput';
  result?: Maybe<CommentModeratorAction>;
};

export type SingleCommentOutput = {
  __typename?: 'SingleCommentOutput';
  result?: Maybe<Comment>;
};

export type SingleConversationInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleConversationOutput = {
  __typename?: 'SingleConversationOutput';
  result?: Maybe<Conversation>;
};

export type SingleCurationNoticeInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleCurationNoticeOutput = {
  __typename?: 'SingleCurationNoticeOutput';
  result?: Maybe<CurationNotice>;
};

export type SingleDialogueCheckInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleDialogueCheckOutput = {
  __typename?: 'SingleDialogueCheckOutput';
  result?: Maybe<DialogueCheck>;
};

export type SingleDialogueMatchPreferenceInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleDialogueMatchPreferenceOutput = {
  __typename?: 'SingleDialogueMatchPreferenceOutput';
  result?: Maybe<DialogueMatchPreference>;
};

export type SingleDigestInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleDigestOutput = {
  __typename?: 'SingleDigestOutput';
  result?: Maybe<Digest>;
};

export type SingleDigestPostInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleDigestPostOutput = {
  __typename?: 'SingleDigestPostOutput';
  result?: Maybe<DigestPost>;
};

export type SingleElectionCandidateInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleElectionCandidateOutput = {
  __typename?: 'SingleElectionCandidateOutput';
  result?: Maybe<ElectionCandidate>;
};

export type SingleElectionVoteInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleElectionVoteOutput = {
  __typename?: 'SingleElectionVoteOutput';
  result?: Maybe<ElectionVote>;
};

export type SingleElicitQuestionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleElicitQuestionOutput = {
  __typename?: 'SingleElicitQuestionOutput';
  result?: Maybe<ElicitQuestion>;
};

export type SingleElicitQuestionPredictionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleElicitQuestionPredictionOutput = {
  __typename?: 'SingleElicitQuestionPredictionOutput';
  result?: Maybe<ElicitQuestionPrediction>;
};

export type SingleFeaturedResourceInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleFeaturedResourceOutput = {
  __typename?: 'SingleFeaturedResourceOutput';
  result?: Maybe<FeaturedResource>;
};

export type SingleForumEventInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleForumEventOutput = {
  __typename?: 'SingleForumEventOutput';
  result?: Maybe<ForumEvent>;
};

export type SingleGardenCodeInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleGardenCodeOutput = {
  __typename?: 'SingleGardenCodeOutput';
  result?: Maybe<GardenCode>;
};

export type SingleGoogleServiceAccountSessionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleGoogleServiceAccountSessionOutput = {
  __typename?: 'SingleGoogleServiceAccountSessionOutput';
  result?: Maybe<GoogleServiceAccountSession>;
};

export type SingleJargonTermInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleJargonTermOutput = {
  __typename?: 'SingleJargonTermOutput';
  result?: Maybe<JargonTerm>;
};

export type SingleLwEventInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleLwEventOutput = {
  __typename?: 'SingleLWEventOutput';
  result?: Maybe<LwEvent>;
};

export type SingleLlmConversationInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleLlmConversationOutput = {
  __typename?: 'SingleLlmConversationOutput';
  result?: Maybe<LlmConversation>;
};

export type SingleLocalgroupInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleLocalgroupOutput = {
  __typename?: 'SingleLocalgroupOutput';
  result?: Maybe<Localgroup>;
};

export type SingleMessageInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleMessageOutput = {
  __typename?: 'SingleMessageOutput';
  result?: Maybe<Message>;
};

export type SingleModerationTemplateInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleModerationTemplateOutput = {
  __typename?: 'SingleModerationTemplateOutput';
  result?: Maybe<ModerationTemplate>;
};

export type SingleModeratorActionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleModeratorActionOutput = {
  __typename?: 'SingleModeratorActionOutput';
  result?: Maybe<ModeratorAction>;
};

export type SingleMultiDocumentInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleMultiDocumentOutput = {
  __typename?: 'SingleMultiDocumentOutput';
  result?: Maybe<MultiDocument>;
};

export type SingleNotificationInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleNotificationOutput = {
  __typename?: 'SingleNotificationOutput';
  result?: Maybe<Notification>;
};

export type SinglePetrovDayActionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePetrovDayActionOutput = {
  __typename?: 'SinglePetrovDayActionOutput';
  result?: Maybe<PetrovDayAction>;
};

export type SinglePodcastEpisodeInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePodcastEpisodeOutput = {
  __typename?: 'SinglePodcastEpisodeOutput';
  result?: Maybe<PodcastEpisode>;
};

export type SinglePodcastInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePodcastOutput = {
  __typename?: 'SinglePodcastOutput';
  result?: Maybe<Podcast>;
};

export type SinglePostEmbeddingInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePostEmbeddingOutput = {
  __typename?: 'SinglePostEmbeddingOutput';
  result?: Maybe<PostEmbedding>;
};

export type SinglePostInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePostOutput = {
  __typename?: 'SinglePostOutput';
  result?: Maybe<Post>;
};

export type SinglePostRelationInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePostRelationOutput = {
  __typename?: 'SinglePostRelationOutput';
  result?: Maybe<PostRelation>;
};

export type SinglePostViewTimeInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePostViewTimeOutput = {
  __typename?: 'SinglePostViewTimeOutput';
  result?: Maybe<PostViewTime>;
};

export type SinglePostViewsInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SinglePostViewsOutput = {
  __typename?: 'SinglePostViewsOutput';
  result?: Maybe<PostViews>;
};

export type SingleRssFeedInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleRssFeedOutput = {
  __typename?: 'SingleRSSFeedOutput';
  result?: Maybe<RssFeed>;
};

export type SingleReportInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleReportOutput = {
  __typename?: 'SingleReportOutput';
  result?: Maybe<Report>;
};

export type SingleReviewVoteInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleReviewVoteOutput = {
  __typename?: 'SingleReviewVoteOutput';
  result?: Maybe<ReviewVote>;
};

export type SingleReviewWinnerArtInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleReviewWinnerArtOutput = {
  __typename?: 'SingleReviewWinnerArtOutput';
  result?: Maybe<ReviewWinnerArt>;
};

export type SingleReviewWinnerInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleReviewWinnerOutput = {
  __typename?: 'SingleReviewWinnerOutput';
  result?: Maybe<ReviewWinner>;
};

export type SingleRevisionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleRevisionOutput = {
  __typename?: 'SingleRevisionOutput';
  result?: Maybe<Revision>;
};

export type SingleSequenceInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSequenceOutput = {
  __typename?: 'SingleSequenceOutput';
  result?: Maybe<Sequence>;
};

export type SingleSplashArtCoordinateInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSplashArtCoordinateOutput = {
  __typename?: 'SingleSplashArtCoordinateOutput';
  result?: Maybe<SplashArtCoordinate>;
};

export type SingleSpotlightInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSpotlightOutput = {
  __typename?: 'SingleSpotlightOutput';
  result?: Maybe<Spotlight>;
};

export type SingleSubscriptionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSubscriptionOutput = {
  __typename?: 'SingleSubscriptionOutput';
  result?: Maybe<Subscription>;
};

export type SingleSurveyInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSurveyOutput = {
  __typename?: 'SingleSurveyOutput';
  result?: Maybe<Survey>;
};

export type SingleSurveyQuestionInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSurveyQuestionOutput = {
  __typename?: 'SingleSurveyQuestionOutput';
  result?: Maybe<SurveyQuestion>;
};

export type SingleSurveyResponseInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSurveyResponseOutput = {
  __typename?: 'SingleSurveyResponseOutput';
  result?: Maybe<SurveyResponse>;
};

export type SingleSurveyScheduleInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleSurveyScheduleOutput = {
  __typename?: 'SingleSurveyScheduleOutput';
  result?: Maybe<SurveySchedule>;
};

export type SingleTagFlagInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleTagFlagOutput = {
  __typename?: 'SingleTagFlagOutput';
  result?: Maybe<TagFlag>;
};

export type SingleTagInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleTagOutput = {
  __typename?: 'SingleTagOutput';
  result?: Maybe<Tag>;
};

export type SingleTagRelInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleTagRelOutput = {
  __typename?: 'SingleTagRelOutput';
  result?: Maybe<TagRel>;
};

export type SingleTypingIndicatorInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleTypingIndicatorOutput = {
  __typename?: 'SingleTypingIndicatorOutput';
  result?: Maybe<TypingIndicator>;
};

export type SingleUserEagDetailInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleUserEagDetailOutput = {
  __typename?: 'SingleUserEAGDetailOutput';
  result?: Maybe<UserEagDetail>;
};

export type SingleUserInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleUserJobAdInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleUserJobAdOutput = {
  __typename?: 'SingleUserJobAdOutput';
  result?: Maybe<UserJobAd>;
};

export type SingleUserMostValuablePostInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleUserMostValuablePostOutput = {
  __typename?: 'SingleUserMostValuablePostOutput';
  result?: Maybe<UserMostValuablePost>;
};

export type SingleUserOutput = {
  __typename?: 'SingleUserOutput';
  result?: Maybe<User>;
};

export type SingleUserRateLimitInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleUserRateLimitOutput = {
  __typename?: 'SingleUserRateLimitOutput';
  result?: Maybe<UserRateLimit>;
};

export type SingleUserTagRelInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleUserTagRelOutput = {
  __typename?: 'SingleUserTagRelOutput';
  result?: Maybe<UserTagRel>;
};

export type SingleVoteInput = {
  allowNull?: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs?: InputMaybe<Scalars['JSON']['input']>;
  selector?: InputMaybe<SelectorInput>;
};

export type SingleVoteOutput = {
  __typename?: 'SingleVoteOutput';
  result?: Maybe<Vote>;
};

export type Site = {
  __typename?: 'Site';
  logoUrl?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type SocialPreviewType = {
  __typename?: 'SocialPreviewType';
  _id?: Maybe<Scalars['String']['output']>;
  imageId?: Maybe<Scalars['String']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
};

export type SplashArtCoordinate = {
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

export type SplashArtCoordinateOutput = {
  __typename?: 'SplashArtCoordinateOutput';
  data?: Maybe<SplashArtCoordinate>;
};

export type Spotlight = {
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
  documentType: Scalars['String']['output'];
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
  sequenceChapters?: Maybe<Array<Maybe<Chapter>>>;
  showAuthor: Scalars['Boolean']['output'];
  spotlightDarkImageId?: Maybe<Scalars['String']['output']>;
  spotlightImageId?: Maybe<Scalars['String']['output']>;
  spotlightSplashImageUrl?: Maybe<Scalars['String']['output']>;
  subtitleUrl?: Maybe<Scalars['String']['output']>;
  tag?: Maybe<Tag>;
};


export type SpotlightDescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type SpotlightOutput = {
  __typename?: 'SpotlightOutput';
  data?: Maybe<Spotlight>;
};

export type SubforumMagicFeedEntryType = {
  __typename?: 'SubforumMagicFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumMagicFeedQueryResults = {
  __typename?: 'SubforumMagicFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumMagicFeedEntryType>>;
};

export type SubforumNewFeedEntryType = {
  __typename?: 'SubforumNewFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumNewFeedQueryResults = {
  __typename?: 'SubforumNewFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumNewFeedEntryType>>;
};

export type SubforumOldFeedEntryType = {
  __typename?: 'SubforumOldFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumOldFeedQueryResults = {
  __typename?: 'SubforumOldFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumOldFeedEntryType>>;
};

export type SubforumRecentCommentsFeedEntryType = {
  __typename?: 'SubforumRecentCommentsFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumRecentCommentsFeedQueryResults = {
  __typename?: 'SubforumRecentCommentsFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumRecentCommentsFeedEntryType>>;
};

export type SubforumTopFeedEntryType = {
  __typename?: 'SubforumTopFeedEntryType';
  tagSubforumComments?: Maybe<Comment>;
  tagSubforumPosts?: Maybe<Post>;
  tagSubforumStickyComments?: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumTopFeedQueryResults = {
  __typename?: 'SubforumTopFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubforumTopFeedEntryType>>;
};

export type SubscribedFeedEntryType = {
  __typename?: 'SubscribedFeedEntryType';
  postCommented?: Maybe<SubscribedPostAndComments>;
  type: Scalars['String']['output'];
};

export type SubscribedFeedQueryResults = {
  __typename?: 'SubscribedFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<SubscribedFeedEntryType>>;
};

export type SubscribedPostAndComments = {
  __typename?: 'SubscribedPostAndComments';
  _id: Scalars['String']['output'];
  comments?: Maybe<Array<Comment>>;
  expandCommentIds?: Maybe<Array<Scalars['String']['output']>>;
  post: Post;
  postIsFromSubscribedUser: Scalars['Boolean']['output'];
};

export type Subscription = {
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

export type SubscriptionOutput = {
  __typename?: 'SubscriptionOutput';
  data?: Maybe<Subscription>;
};

export type SuggestedFeedSubscriptionUsersResult = {
  __typename?: 'SuggestedFeedSubscriptionUsersResult';
  results: Array<User>;
};

export type Survey = {
  __typename?: 'Survey';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  questions: Array<SurveyQuestion>;
  schemaVersion: Scalars['Float']['output'];
};

export type SurveyOutput = {
  __typename?: 'SurveyOutput';
  data?: Maybe<Survey>;
};

export type SurveyQuestion = {
  __typename?: 'SurveyQuestion';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  format: Scalars['String']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  order: Scalars['Float']['output'];
  question: Scalars['String']['output'];
  schemaVersion: Scalars['Float']['output'];
  survey: Survey;
  surveyId: Scalars['String']['output'];
};

export type SurveyQuestionInfo = {
  _id?: InputMaybe<Scalars['String']['input']>;
  format: Scalars['String']['input'];
  question: Scalars['String']['input'];
};

export type SurveyQuestionOutput = {
  __typename?: 'SurveyQuestionOutput';
  data?: Maybe<SurveyQuestion>;
};

export type SurveyResponse = {
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

export type SurveyResponseOutput = {
  __typename?: 'SurveyResponseOutput';
  data?: Maybe<SurveyResponse>;
};

export type SurveySchedule = {
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
  survey: Survey;
  surveyId: Scalars['String']['output'];
  target?: Maybe<Scalars['String']['output']>;
};

export type SurveyScheduleOutput = {
  __typename?: 'SurveyScheduleOutput';
  data?: Maybe<SurveySchedule>;
};

export type Tag = {
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
  canVoteOnRels?: Maybe<Array<Scalars['String']['output']>>;
  charsAdded?: Maybe<Scalars['Float']['output']>;
  charsRemoved?: Maybe<Scalars['Float']['output']>;
  contributionStats?: Maybe<Scalars['JSON']['output']>;
  contributors?: Maybe<TagContributorsList>;
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
  recentComments?: Maybe<Array<Maybe<Comment>>>;
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


export type TagContributorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


export type TagDescriptionArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type TagLensesArgs = {
  lensSlug?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


export type TagLensesIncludingDeletedArgs = {
  lensSlug?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


export type TagModerationGuidelinesArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type TagRecentCommentsArgs = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  maxAgeHours?: InputMaybe<Scalars['Int']['input']>;
  tagCommentType?: InputMaybe<Scalars['String']['input']>;
  tagCommentsLimit?: InputMaybe<Scalars['Int']['input']>;
};


export type TagSubforumWelcomeTextArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type TagTableOfContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type TagCommentType =
  | 'DISCUSSION'
  | 'SUBFORUM';

export type TagContributor = {
  __typename?: 'TagContributor';
  contributionScore: Scalars['Int']['output'];
  currentAttributionCharCount?: Maybe<Scalars['Int']['output']>;
  numCommits: Scalars['Int']['output'];
  user?: Maybe<User>;
  voteCount: Scalars['Int']['output'];
};

export type TagContributorsList = {
  __typename?: 'TagContributorsList';
  contributors?: Maybe<Array<TagContributor>>;
  totalCount: Scalars['Int']['output'];
};

export type TagFlag = {
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


export type TagFlagContentsArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};

export type TagFlagOutput = {
  __typename?: 'TagFlagOutput';
  data?: Maybe<TagFlag>;
};

export type TagHistoryFeedEntryType = {
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

export type TagHistoryFeedQueryResults = {
  __typename?: 'TagHistoryFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<TagHistoryFeedEntryType>>;
};

export type TagOutput = {
  __typename?: 'TagOutput';
  data?: Maybe<Tag>;
};

export type TagPreviewWithSummaries = {
  __typename?: 'TagPreviewWithSummaries';
  lens?: Maybe<MultiDocument>;
  summaries: Array<MultiDocument>;
  tag: Tag;
};

export type TagReadLikelihoodRatio = {
  __typename?: 'TagReadLikelihoodRatio';
  readLikelihoodRatio?: Maybe<Scalars['Float']['output']>;
  tagId?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  tagShortName?: Maybe<Scalars['String']['output']>;
  userReadCount?: Maybe<Scalars['Int']['output']>;
};

export type TagRel = {
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

export type TagRelOutput = {
  __typename?: 'TagRelOutput';
  data?: Maybe<TagRel>;
};

export type TagUpdates = {
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

export type TagWithTotalCount = {
  __typename?: 'TagWithTotalCount';
  tags: Array<Tag>;
  totalCount: Scalars['Int']['output'];
};

export type TopComment = {
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

export type TopCommentContents = {
  __typename?: 'TopCommentContents';
  html?: Maybe<Scalars['String']['output']>;
};

export type TopCommentedTagUser = {
  __typename?: 'TopCommentedTagUser';
  _id: Scalars['ID']['output'];
  displayName: Scalars['String']['output'];
  tag_comment_counts: Array<CommentCountTag>;
  total_power: Scalars['Float']['output'];
  username: Scalars['String']['output'];
};

export type Tweet = {
  __typename?: 'Tweet';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type TypingIndicator = {
  __typename?: 'TypingIndicator';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  documentId?: Maybe<Scalars['String']['output']>;
  lastUpdated?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type UltraFeedEntryType = {
  __typename?: 'UltraFeedEntryType';
  feedCommentThread?: Maybe<FeedCommentThread>;
  feedPost?: Maybe<FeedPost>;
  feedSpotlight?: Maybe<FeedSpotlightItem>;
  type: Scalars['String']['output'];
};

export type UltraFeedEvent = {
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

export type UltraFeedEventOutput = {
  __typename?: 'UltraFeedEventOutput';
  data?: Maybe<UltraFeedEvent>;
};

export type UltraFeedQueryResults = {
  __typename?: 'UltraFeedQueryResults';
  cutoff?: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results?: Maybe<Array<UltraFeedEntryType>>;
  sessionId?: Maybe<Scalars['String']['output']>;
};

export type UniqueClientViewsSeries = {
  __typename?: 'UniqueClientViewsSeries';
  date?: Maybe<Scalars['Date']['output']>;
  uniqueClientViews?: Maybe<Scalars['Int']['output']>;
};

export type UpdateAdvisorRequestDataInput = {
  interestedInMetaculus?: InputMaybe<Scalars['Boolean']['input']>;
  jobAds?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdvisorRequestInput = {
  data: UpdateAdvisorRequestDataInput;
  selector: SelectorInput;
};

export type UpdateArbitalTagContentRelDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateArbitalTagContentRelInput = {
  data: UpdateArbitalTagContentRelDataInput;
  selector: SelectorInput;
};

export type UpdateBanDataInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  expirationDate?: InputMaybe<Scalars['Date']['input']>;
  ip?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  properties?: InputMaybe<Scalars['JSON']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBanInput = {
  data: UpdateBanDataInput;
  selector: SelectorInput;
};

export type UpdateBookDataInput = {
  collectionId?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type UpdateBookInput = {
  data: UpdateBookDataInput;
  selector: SelectorInput;
};

export type UpdateChapterDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  number?: InputMaybe<Scalars['Float']['input']>;
  postIds?: InputMaybe<Array<Scalars['String']['input']>>;
  sequenceId?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChapterInput = {
  data: UpdateChapterDataInput;
  selector: SelectorInput;
};

export type UpdateCollectionDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  createdAt?: InputMaybe<Scalars['Date']['input']>;
  firstPageLink?: InputMaybe<Scalars['String']['input']>;
  gridImageId?: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  noindex?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCollectionInput = {
  data: UpdateCollectionDataInput;
  selector: SelectorInput;
};

export type UpdateCommentDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  afDate?: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId?: InputMaybe<Scalars['String']['input']>;
  answer?: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type UpdateCommentInput = {
  data: UpdateCommentDataInput;
  selector: SelectorInput;
};

export type UpdateCommentModeratorActionDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCommentModeratorActionInput = {
  data: UpdateCommentModeratorActionDataInput;
  selector: SelectorInput;
};

export type UpdateConversationDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds?: InputMaybe<Array<Scalars['String']['input']>>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderator?: InputMaybe<Scalars['Boolean']['input']>;
  participantIds?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConversationInput = {
  data: UpdateConversationDataInput;
  selector: SelectorInput;
};

export type UpdateCurationNoticeDataInput = {
  commentId?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateCurationNoticeInput = {
  data: UpdateCurationNoticeDataInput;
  selector: SelectorInput;
};

export type UpdateDialogueMatchPreferenceDataInput = {
  asyncPreference?: InputMaybe<Scalars['String']['input']>;
  calendlyLink?: InputMaybe<Scalars['String']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  dialogueCheckId?: InputMaybe<Scalars['String']['input']>;
  formatNotes?: InputMaybe<Scalars['String']['input']>;
  generatedDialogueId?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  syncPreference?: InputMaybe<Scalars['String']['input']>;
  topicNotes?: InputMaybe<Scalars['String']['input']>;
  topicPreferences?: InputMaybe<Array<Scalars['JSON']['input']>>;
};

export type UpdateDialogueMatchPreferenceInput = {
  data: UpdateDialogueMatchPreferenceDataInput;
  selector: SelectorInput;
};

export type UpdateDigestDataInput = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  num?: InputMaybe<Scalars['Float']['input']>;
  onsiteImageId?: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  publishedDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateDigestInput = {
  data: UpdateDigestDataInput;
  selector: SelectorInput;
};

export type UpdateDigestPostDataInput = {
  digestId?: InputMaybe<Scalars['String']['input']>;
  emailDigestStatus?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  onsiteDigestStatus?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDigestPostInput = {
  data: UpdateDigestPostDataInput;
  selector: SelectorInput;
};

export type UpdateElectionCandidateDataInput = {
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

export type UpdateElectionCandidateInput = {
  data: UpdateElectionCandidateDataInput;
  selector: SelectorInput;
};

export type UpdateElectionVoteDataInput = {
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

export type UpdateElectionVoteInput = {
  data: UpdateElectionVoteDataInput;
  selector: SelectorInput;
};

export type UpdateElicitQuestionDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  resolution?: InputMaybe<Scalars['String']['input']>;
  resolvesBy?: InputMaybe<Scalars['Date']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateElicitQuestionInput = {
  data: UpdateElicitQuestionDataInput;
  selector: SelectorInput;
};

export type UpdateForumEventDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  bannerTextColor?: InputMaybe<Scalars['String']['input']>;
  commentPrompt?: InputMaybe<Scalars['String']['input']>;
  contrastColor?: InputMaybe<Scalars['String']['input']>;
  customComponent?: InputMaybe<Scalars['String']['input']>;
  darkColor?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  eventFormat?: InputMaybe<Scalars['String']['input']>;
  frontpageDescription?: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescriptionMobile?: InputMaybe<Scalars['JSON']['input']>;
  includesPoll?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  lightColor?: InputMaybe<Scalars['String']['input']>;
  maxStickersPerUser?: InputMaybe<Scalars['Float']['input']>;
  pollAgreeWording?: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording?: InputMaybe<Scalars['String']['input']>;
  pollQuestion?: InputMaybe<Scalars['JSON']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  postPageDescription?: InputMaybe<Scalars['JSON']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateForumEventInput = {
  data: UpdateForumEventDataInput;
  selector: SelectorInput;
};

export type UpdateGardenCodeDataInput = {
  afOnly?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  endTime?: InputMaybe<Scalars['Date']['input']>;
  fbLink?: InputMaybe<Scalars['String']['input']>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['Date']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGardenCodeInput = {
  data: UpdateGardenCodeDataInput;
  selector: SelectorInput;
};

export type UpdateGoogleServiceAccountSessionDataInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  estimatedExpiry?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  revoked?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateGoogleServiceAccountSessionInput = {
  data: UpdateGoogleServiceAccountSessionDataInput;
  selector: SelectorInput;
};

export type UpdateJargonTermDataInput = {
  altTerms?: InputMaybe<Array<Scalars['String']['input']>>;
  approved?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  term?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateJargonTermInput = {
  data: UpdateJargonTermDataInput;
  selector: SelectorInput;
};

export type UpdateLwEventDataInput = {
  important?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateLwEventInput = {
  data: UpdateLwEventDataInput;
  selector: SelectorInput;
};

export type UpdateLlmConversationDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLlmConversationInput = {
  data: UpdateLlmConversationDataInput;
  selector: SelectorInput;
};

export type UpdateLocalgroupDataInput = {
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type UpdateLocalgroupInput = {
  data: UpdateLocalgroupDataInput;
  selector: SelectorInput;
};

export type UpdateMessageDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateMessageInput = {
  data: UpdateMessageDataInput;
  selector: SelectorInput;
};

export type UpdateModerationTemplateDataInput = {
  collectionName?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateModerationTemplateInput = {
  data: UpdateModerationTemplateDataInput;
  selector: SelectorInput;
};

export type UpdateModeratorActionDataInput = {
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateModeratorActionInput = {
  data: UpdateModeratorActionDataInput;
  selector: SelectorInput;
};

export type UpdateMultiDocumentDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  tabSubtitle?: InputMaybe<Scalars['String']['input']>;
  tabTitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMultiDocumentInput = {
  data: UpdateMultiDocumentDataInput;
  selector: SelectorInput;
};

export type UpdateNotificationDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  viewed?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateNotificationInput = {
  data: UpdateNotificationDataInput;
  selector: SelectorInput;
};

export type UpdatePodcastEpisodeDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePodcastEpisodeInput = {
  data: UpdatePodcastEpisodeDataInput;
  selector: SelectorInput;
};

export type UpdatePostDataInput = {
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
  coauthorStatuses?: InputMaybe<Array<Scalars['JSON']['input']>>;
  collabEditorDialogue?: InputMaybe<Scalars['Boolean']['input']>;
  collectionTitle?: InputMaybe<Scalars['String']['input']>;
  commentSortOrder?: InputMaybe<Scalars['String']['input']>;
  commentsLocked?: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter?: InputMaybe<Scalars['Date']['input']>;
  contactInfo?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
  curatedDate?: InputMaybe<Scalars['Date']['input']>;
  customHighlight?: InputMaybe<Scalars['JSON']['input']>;
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
  fmCrosspost?: InputMaybe<Scalars['JSON']['input']>;
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
  moderationGuidelines?: InputMaybe<Scalars['JSON']['input']>;
  moderationStyle?: InputMaybe<Scalars['String']['input']>;
  nextDayReminderSent?: InputMaybe<Scalars['Boolean']['input']>;
  noIndex?: InputMaybe<Scalars['Boolean']['input']>;
  onlineEvent?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts?: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn?: InputMaybe<Scalars['Boolean']['input']>;
  organizerIds?: InputMaybe<Array<Scalars['String']['input']>>;
  podcastEpisodeId?: InputMaybe<Scalars['String']['input']>;
  postCategory?: InputMaybe<Scalars['String']['input']>;
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
  socialPreview?: InputMaybe<Scalars['JSON']['input']>;
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

export type UpdatePostEmbeddingDataInput = {
  embeddings?: InputMaybe<Array<Scalars['Float']['input']>>;
  lastGeneratedAt?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  postHash?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePostEmbeddingInput = {
  data: UpdatePostEmbeddingDataInput;
  selector: SelectorInput;
};

export type UpdatePostInput = {
  data: UpdatePostDataInput;
  selector: SelectorInput;
};

export type UpdatePostViewTimeDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePostViewTimeInput = {
  data: UpdatePostViewTimeDataInput;
  selector: SelectorInput;
};

export type UpdatePostViewsDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePostViewsInput = {
  data: UpdatePostViewsDataInput;
  selector: SelectorInput;
};

export type UpdateRssFeedDataInput = {
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

export type UpdateRssFeedInput = {
  data: UpdateRssFeedDataInput;
  selector: SelectorInput;
};

export type UpdateReportDataInput = {
  claimedUserId?: InputMaybe<Scalars['String']['input']>;
  closedAt?: InputMaybe<Scalars['Date']['input']>;
  createdAt?: InputMaybe<Scalars['Date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  markedAsSpam?: InputMaybe<Scalars['Boolean']['input']>;
  reportedAsSpam?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateReportInput = {
  data: UpdateReportDataInput;
  selector: SelectorInput;
};

export type UpdateRevisionDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  skipAttributions?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateRevisionInput = {
  data: UpdateRevisionDataInput;
  selector: SelectorInput;
};

export type UpdateSequenceDataInput = {
  af?: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug?: InputMaybe<Scalars['String']['input']>;
  contents?: InputMaybe<Scalars['JSON']['input']>;
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

export type UpdateSequenceInput = {
  data: UpdateSequenceDataInput;
  selector: SelectorInput;
};

export type UpdateSplashArtCoordinateDataInput = {
  leftFlipped?: InputMaybe<Scalars['Boolean']['input']>;
  leftHeightPct?: InputMaybe<Scalars['Float']['input']>;
  leftWidthPct?: InputMaybe<Scalars['Float']['input']>;
  leftXPct?: InputMaybe<Scalars['Float']['input']>;
  leftYPct?: InputMaybe<Scalars['Float']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  middleFlipped?: InputMaybe<Scalars['Boolean']['input']>;
  middleHeightPct?: InputMaybe<Scalars['Float']['input']>;
  middleWidthPct?: InputMaybe<Scalars['Float']['input']>;
  middleXPct?: InputMaybe<Scalars['Float']['input']>;
  middleYPct?: InputMaybe<Scalars['Float']['input']>;
  reviewWinnerArtId?: InputMaybe<Scalars['String']['input']>;
  rightFlipped?: InputMaybe<Scalars['Boolean']['input']>;
  rightHeightPct?: InputMaybe<Scalars['Float']['input']>;
  rightWidthPct?: InputMaybe<Scalars['Float']['input']>;
  rightXPct?: InputMaybe<Scalars['Float']['input']>;
  rightYPct?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateSplashArtCoordinateInput = {
  data: UpdateSplashArtCoordinateDataInput;
  selector: SelectorInput;
};

export type UpdateSpotlightDataInput = {
  customSubtitle?: InputMaybe<Scalars['String']['input']>;
  customTitle?: InputMaybe<Scalars['String']['input']>;
  deletedDraft?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  documentId?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<Scalars['String']['input']>;
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

export type UpdateSpotlightInput = {
  data: UpdateSpotlightDataInput;
  selector: SelectorInput;
};

export type UpdateSurveyDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyInput = {
  data: UpdateSurveyDataInput;
  selector: SelectorInput;
};

export type UpdateSurveyQuestionDataInput = {
  format?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
  question?: InputMaybe<Scalars['String']['input']>;
  surveyId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyQuestionInput = {
  data: UpdateSurveyQuestionDataInput;
  selector: SelectorInput;
};

export type UpdateSurveyResponseDataInput = {
  clientId?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  response?: InputMaybe<Scalars['JSON']['input']>;
  surveyId?: InputMaybe<Scalars['String']['input']>;
  surveyScheduleId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyResponseInput = {
  data: UpdateSurveyResponseDataInput;
  selector: SelectorInput;
};

export type UpdateSurveyScheduleDataInput = {
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
  target?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyScheduleInput = {
  data: UpdateSurveyScheduleDataInput;
  selector: SelectorInput;
};

export type UpdateTagDataInput = {
  adminOnly?: InputMaybe<Scalars['Boolean']['input']>;
  autoTagModel?: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt?: InputMaybe<Scalars['String']['input']>;
  bannerImageId?: InputMaybe<Scalars['String']['input']>;
  canEditUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  canVoteOnRels?: InputMaybe<Array<Scalars['String']['input']>>;
  core?: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId?: InputMaybe<Scalars['String']['input']>;
  defaultOrder?: InputMaybe<Scalars['Float']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  descriptionTruncationCount?: InputMaybe<Scalars['Float']['input']>;
  forceAllowType3Audio?: InputMaybe<Scalars['Boolean']['input']>;
  introSequenceId?: InputMaybe<Scalars['String']['input']>;
  isPlaceholderPage?: InputMaybe<Scalars['Boolean']['input']>;
  isPostType?: InputMaybe<Scalars['Boolean']['input']>;
  isSubforum?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines?: InputMaybe<Scalars['JSON']['input']>;
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
  subforumWelcomeText?: InputMaybe<Scalars['JSON']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  suggestedAsFilter?: InputMaybe<Scalars['Boolean']['input']>;
  tagFlagsIds?: InputMaybe<Array<Scalars['String']['input']>>;
  wikiGrade?: InputMaybe<Scalars['Int']['input']>;
  wikiOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateTagFlagDataInput = {
  contents?: InputMaybe<Scalars['JSON']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Float']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTagFlagInput = {
  data: UpdateTagFlagDataInput;
  selector: SelectorInput;
};

export type UpdateTagInput = {
  data: UpdateTagDataInput;
  selector: SelectorInput;
};

export type UpdateTagRelDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateTagRelInput = {
  data: UpdateTagRelDataInput;
  selector: SelectorInput;
};

export type UpdateUserDataInput = {
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
  biography?: InputMaybe<Scalars['JSON']['input']>;
  blueskyProfileURL?: InputMaybe<Scalars['String']['input']>;
  bookmarkedPostsMetadata?: InputMaybe<Array<Scalars['JSON']['input']>>;
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
  expandedFrontpageSections?: InputMaybe<Scalars['JSON']['input']>;
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
  hiddenPostsMetadata?: InputMaybe<Array<Scalars['JSON']['input']>>;
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
  howICanHelpOthers?: InputMaybe<Scalars['JSON']['input']>;
  howOthersCanHelpMe?: InputMaybe<Scalars['JSON']['input']>;
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
  moderationGuidelines?: InputMaybe<Scalars['JSON']['input']>;
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
  partiallyReadSequences?: InputMaybe<Array<Scalars['JSON']['input']>>;
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
  reactPaletteStyle?: InputMaybe<Scalars['String']['input']>;
  recommendationSettings?: InputMaybe<Scalars['JSON']['input']>;
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
  subforumPreferredLayout?: InputMaybe<Scalars['String']['input']>;
  subscribedToDigest?: InputMaybe<Scalars['Boolean']['input']>;
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

export type UpdateUserEagDetailDataInput = {
  careerStage?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  countryOrRegion?: InputMaybe<Scalars['String']['input']>;
  experiencedIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  interestedIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  nearestCity?: InputMaybe<Scalars['String']['input']>;
  willingnessToRelocate?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateUserEagDetailInput = {
  data: UpdateUserEagDetailDataInput;
  selector: SelectorInput;
};

export type UpdateUserInput = {
  data: UpdateUserDataInput;
  selector: SelectorInput;
};

export type UpdateUserJobAdDataInput = {
  adState?: InputMaybe<Scalars['String']['input']>;
  lastUpdated?: InputMaybe<Scalars['Date']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  reminderSetAt?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserJobAdInput = {
  data: UpdateUserJobAdDataInput;
  selector: SelectorInput;
};

export type UpdateUserMostValuablePostDataInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserMostValuablePostInput = {
  data: UpdateUserMostValuablePostDataInput;
  selector: SelectorInput;
};

export type UpdateUserRateLimitDataInput = {
  actionsPerInterval?: InputMaybe<Scalars['Float']['input']>;
  endedAt?: InputMaybe<Scalars['Date']['input']>;
  intervalLength?: InputMaybe<Scalars['Float']['input']>;
  intervalUnit?: InputMaybe<Scalars['String']['input']>;
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserRateLimitInput = {
  data: UpdateUserRateLimitDataInput;
  selector: SelectorInput;
};

export type UpdateUserTagRelDataInput = {
  legacyData?: InputMaybe<Scalars['JSON']['input']>;
  subforumEmailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost?: InputMaybe<Scalars['Boolean']['input']>;
  subforumShowUnreadInSidebar?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserTagRelInput = {
  data: UpdateUserTagRelDataInput;
  selector: SelectorInput;
};

export type UpvotedUser = {
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

export type User = {
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
  bookmarkedPostsMetadata?: Maybe<Array<Scalars['JSON']['output']>>;
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
  expandedFrontpageSections?: Maybe<Scalars['JSON']['output']>;
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
  hiddenPostsMetadata?: Maybe<Array<Scalars['JSON']['output']>>;
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
  moderatorActions?: Maybe<Array<Maybe<ModeratorAction>>>;
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
  partiallyReadSequences?: Maybe<Array<Scalars['JSON']['output']>>;
  paymentEmail?: Maybe<Scalars['String']['output']>;
  paymentInfo?: Maybe<Scalars['String']['output']>;
  permanentDeletionRequestedAt?: Maybe<Scalars['Date']['output']>;
  petrovLaunchCodeDate?: Maybe<Scalars['Date']['output']>;
  petrovOptOut: Scalars['Boolean']['output'];
  petrovPressedButtonDate?: Maybe<Scalars['Date']['output']>;
  postCount: Scalars['Float']['output'];
  postGlossariesPinned?: Maybe<Scalars['Boolean']['output']>;
  postingDisabled?: Maybe<Scalars['Boolean']['output']>;
  posts?: Maybe<Array<Maybe<Post>>>;
  previousDisplayName?: Maybe<Scalars['String']['output']>;
  profileImageId?: Maybe<Scalars['String']['output']>;
  profileTagIds: Array<Scalars['String']['output']>;
  profileTags: Array<Tag>;
  profileUpdatedAt: Scalars['Date']['output'];
  programParticipation?: Maybe<Array<Scalars['String']['output']>>;
  rateLimitNextAbleToComment?: Maybe<Scalars['JSON']['output']>;
  rateLimitNextAbleToPost?: Maybe<Scalars['JSON']['output']>;
  reactPaletteStyle?: Maybe<Scalars['String']['output']>;
  recentKarmaInfo?: Maybe<Scalars['JSON']['output']>;
  recommendationSettings?: Maybe<Scalars['JSON']['output']>;
  reenableDraftJs?: Maybe<Scalars['Boolean']['output']>;
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
  subforumPreferredLayout?: Maybe<Scalars['String']['output']>;
  subscribedToDigest?: Maybe<Scalars['Boolean']['output']>;
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


export type UserBiographyArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type UserHowICanHelpOthersArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type UserHowOthersCanHelpMeArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type UserKarmaChangesArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type UserModerationGuidelinesArgs = {
  version?: InputMaybe<Scalars['String']['input']>;
};


export type UserPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type UserRateLimitNextAbleToCommentArgs = {
  postId?: InputMaybe<Scalars['String']['input']>;
};


export type UserRateLimitNextAbleToPostArgs = {
  eventForm?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserActivity = {
  __typename?: 'UserActivity';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
};

export type UserCoreTagReads = {
  __typename?: 'UserCoreTagReads';
  tagId?: Maybe<Scalars['String']['output']>;
  userReadCount?: Maybe<Scalars['Int']['output']>;
};

export type UserDialogueUsefulData = {
  __typename?: 'UserDialogueUsefulData';
  activeDialogueMatchSeekers?: Maybe<Array<Maybe<User>>>;
  dialogueUsers?: Maybe<Array<Maybe<User>>>;
  topUsers?: Maybe<Array<Maybe<UpvotedUser>>>;
};

export type UserEagDetail = {
  __typename?: 'UserEAGDetail';
  _id: Scalars['String']['output'];
  careerStage?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  countryOrRegion?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  experiencedIn?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  interestedIn?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  lastUpdated?: Maybe<Scalars['Date']['output']>;
  legacyData?: Maybe<Scalars['JSON']['output']>;
  nearestCity?: Maybe<Scalars['String']['output']>;
  schemaVersion: Scalars['Float']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
  willingnessToRelocate?: Maybe<Scalars['JSON']['output']>;
};

export type UserEagDetailOutput = {
  __typename?: 'UserEAGDetailOutput';
  data?: Maybe<UserEagDetail>;
};

export type UserJobAd = {
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

export type UserJobAdOutput = {
  __typename?: 'UserJobAdOutput';
  data?: Maybe<UserJobAd>;
};

export type UserLikingTag = {
  __typename?: 'UserLikingTag';
  _id: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
};

export type UserMostValuablePost = {
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

export type UserMostValuablePostOutput = {
  __typename?: 'UserMostValuablePostOutput';
  data?: Maybe<UserMostValuablePost>;
};

export type UserOutput = {
  __typename?: 'UserOutput';
  data?: Maybe<User>;
};

export type UserRateLimit = {
  __typename?: 'UserRateLimit';
  _id: Scalars['String']['output'];
  actionsPerInterval: Scalars['Float']['output'];
  createdAt: Scalars['Date']['output'];
  endedAt?: Maybe<Scalars['Date']['output']>;
  intervalLength: Scalars['Float']['output'];
  intervalUnit: Scalars['String']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  type: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type UserRateLimitOutput = {
  __typename?: 'UserRateLimitOutput';
  data?: Maybe<UserRateLimit>;
};

export type UserReadHistoryResult = {
  __typename?: 'UserReadHistoryResult';
  posts?: Maybe<Array<Post>>;
};

export type UserTagRel = {
  __typename?: 'UserTagRel';
  _id: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  legacyData?: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Scalars['Float']['output'];
  subforumEmailNotifications?: Maybe<Scalars['Boolean']['output']>;
  subforumHideIntroPost?: Maybe<Scalars['Boolean']['output']>;
  subforumShowUnreadInSidebar?: Maybe<Scalars['Boolean']['output']>;
  tag?: Maybe<Tag>;
  tagId?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type UserTagRelOutput = {
  __typename?: 'UserTagRelOutput';
  data?: Maybe<UserTagRel>;
};

export type VertexRecommendedPost = {
  __typename?: 'VertexRecommendedPost';
  attributionId?: Maybe<Scalars['String']['output']>;
  post: Post;
};

export type Vote = {
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
  voteType: Scalars['String']['output'];
  votedAt?: Maybe<Scalars['Date']['output']>;
};

export type VoteResultComment = {
  __typename?: 'VoteResultComment';
  document: Comment;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultElectionCandidate = {
  __typename?: 'VoteResultElectionCandidate';
  document: ElectionCandidate;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultMultiDocument = {
  __typename?: 'VoteResultMultiDocument';
  document: MultiDocument;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultPost = {
  __typename?: 'VoteResultPost';
  document: Post;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultRevision = {
  __typename?: 'VoteResultRevision';
  document: Revision;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultTag = {
  __typename?: 'VoteResultTag';
  document: Tag;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultTagRel = {
  __typename?: 'VoteResultTagRel';
  document: TagRel;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type WrappedDataByYear = {
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
